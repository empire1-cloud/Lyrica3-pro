"""Lyrica 3 Full Runtime Phase 1 on the current production boundary.

Flow:
Soulfire blueprint -> Empire-local master and four stems -> measured artifacts ->
VICS proof bridge -> durable Archisynapse registration outbox.

This module never fabricates a verified watermark, paid state, or external receipt.
"""
from __future__ import annotations

import asyncio
import hashlib
import math
import os
import uuid
import wave
from pathlib import Path
from typing import Any, Dict, Optional

import numpy as np

from contracts.track_runtime_v1 import (
    ArchisynapseReceipt,
    ArtifactBundle,
    AudioArtifact,
    EvidenceState,
    ProofBundle,
    RuntimeJob,
    RuntimeJobState,
    RuntimeTrack,
    SoulfireBlueprint,
    SoulprintProof,
    TrackCreateV1,
    VICSProof,
    utc_now,
)
from services.local_stem_renderer import RenderedFile, render_local_stems


class FullRuntimeError(RuntimeError):
    pass


class LyricaFullRuntime:
    """Stateful job coordinator backed by Mongo-compatible collections."""

    def __init__(self, *, db: Any, root_dir: Path, logger: Any = None) -> None:
        self.db = db
        self.root_dir = Path(root_dir)
        self.logger = logger
        self.jobs = db.track_runtime_jobs
        self.tracks = db.tracks
        self.registrations = db.track_registration_outbox
        self.output_dir = self.root_dir / "static" / "full_runtime"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.provider_mode = os.getenv("LYRICA_PROVIDER_MODE", "empire_local").strip() or "empire_local"
        self._indexes_ready = False

    async def ensure_indexes(self) -> None:
        if self._indexes_ready:
            return
        await self.jobs.create_index(
            [("creator_id", 1), ("idempotency_key", 1)],
            unique=True,
            name="runtime_creator_idempotency",
        )
        await self.jobs.create_index("job_id", unique=True, name="runtime_job_id")
        await self.registrations.create_index(
            "event_id", unique=True, name="track_registration_event_id"
        )
        self._indexes_ready = True

    async def create_job(self, request: TrackCreateV1, creator_id: str) -> RuntimeJob:
        request.creator_id = creator_id
        if not request.contributors or request.contributors[0].creator_id == "authenticated_creator":
            request.contributors = [
                request.contributors[0].model_copy(update={"creator_id": creator_id})
            ]

        idem = request.idempotency_key or self._request_fingerprint(request, creator_id)
        existing = await self.jobs.find_one(
            {"creator_id": creator_id, "idempotency_key": idem}, {"_id": 0}
        )
        if existing:
            return RuntimeJob.model_validate(existing)

        job_id = f"job_{uuid.uuid4().hex[:16]}"
        now = utc_now()
        job = RuntimeJob(
            job_id=job_id,
            state=RuntimeJobState.REQUESTED,
            creator_id=creator_id,
            request=request,
            idempotency_key=idem,
            history=[{"state": RuntimeJobState.REQUESTED.value, "at": now}],
            created_at=now,
            updated_at=now,
        )
        try:
            await self.jobs.insert_one(job.model_dump(mode="json"))
        except Exception:
            existing = await self.jobs.find_one(
                {"creator_id": creator_id, "idempotency_key": idem}, {"_id": 0}
            )
            if existing:
                return RuntimeJob.model_validate(existing)
            raise
        return job

    async def run_job(self, job_id: str) -> None:
        job_doc = await self.jobs.find_one({"job_id": job_id}, {"_id": 0})
        if not job_doc:
            raise FullRuntimeError(f"Unknown runtime job: {job_id}")
        job = RuntimeJob.model_validate(job_doc)
        if job.state == RuntimeJobState.COMPLETE:
            return

        try:
            await self._transition(job_id, RuntimeJobState.APPROVED)
            blueprint = await asyncio.to_thread(self._build_soulfire_blueprint, job.request)
            await self._transition(job_id, RuntimeJobState.BLUEPRINT_READY)

            if self.provider_mode != "empire_local":
                raise FullRuntimeError(
                    f"Phase 1 only permits LYRICA_PROVIDER_MODE=empire_local; received {self.provider_mode!r}"
                )

            await self._transition(job_id, RuntimeJobState.RENDERING)
            render = await asyncio.to_thread(
                render_local_stems,
                output_dir=str(self.output_dir),
                job_id=job_id,
                duration_seconds=job.request.duration_seconds,
                bpm=job.request.bpm,
                musical_key=job.request.musical_key,
                genre=job.request.genre,
                mood=job.request.mood,
                seed_text=self._request_fingerprint(job.request, job.creator_id),
            )

            await self._transition(job_id, RuntimeJobState.MASTERING)
            # The local renderer writes a normalized master. No LUFS or mastering
            # claim is made unless a later measured mastering pass exists.

            await self._transition(job_id, RuntimeJobState.MEASURING)
            artifacts = await asyncio.to_thread(self._measure_render, render)
            if not artifacts.distinct_stem_hashes:
                raise FullRuntimeError("Stem validation failed: stems are not distinct")

            await self._transition(job_id, RuntimeJobState.PROOF_PENDING)
            dna_tag = self._dna_tag(job.creator_id, job.request.title, artifacts.master.sha256)
            track_id = f"track_{uuid.uuid4().hex[:14]}"
            stem_rows = [
                {
                    "name": stem.name,
                    "src": stem.url,
                    "sha256": stem.sha256,
                    "level": 0.78,
                }
                for stem in artifacts.stems
            ]

            soulprint = SoulprintProof(
                status=EvidenceState.RECORDED,
                algorithm="sha256-audio-fingerprint-v1",
                audio_sha256=artifacts.master.sha256,
                watermark_status=EvidenceState.UNAVAILABLE,
                reason="Actual master bytes were hashed; robust watermark detection is not part of Phase 1.",
            )
            vics = self._initial_vics_state(job.request)
            pending_arch = ArchisynapseReceipt(
                status=EvidenceState.PENDING,
                event_id=self._registration_event_id(job_id),
                rights_status=EvidenceState.PENDING,
                payout_status=EvidenceState.NOT_REQUIRED,
                reason="Track registration has not yet been queued.",
            )
            preliminary_proof = ProofBundle(
                dna_tag=dna_tag,
                vics=vics,
                soulprint=soulprint,
                archisynapse=pending_arch,
            )

            track = RuntimeTrack(
                id=track_id,
                dna_tag=dna_tag,
                creator=job.creator_id,
                title=job.request.title,
                genre=job.request.genre,
                mood=job.request.mood,
                culture=job.request.culture,
                status=RuntimeJobState.PROOF_PENDING,
                duration_sec=artifacts.master.duration_seconds,
                audio_url=artifacts.master.url,
                stems=stem_rows,
                soulfire_blueprint=blueprint,
                artifacts=artifacts,
                proof=preliminary_proof,
                contributors=job.request.contributors,
                parent_dna=job.request.parent_dna,
                provider_mode=self.provider_mode,
            )
            track_doc = track.model_dump(mode="json")
            track_doc.update(
                {
                    "created_at": track.created_at,
                    "duration_sec": track.duration_sec,
                    "audio_url": track.audio_url,
                    "soulprint_id": f"sp_sha256_{artifacts.master.sha256}",
                    "soulprint_verified": False,
                    "ledger_valid": False,
                    "royalty_trust": False,
                    "vics_signature": None,
                    "runtime_job_id": job_id,
                    "proof_status": "pending",
                }
            )
            await self.tracks.insert_one(track_doc)

            vics, soulprint = await self._issue_vics_proof(
                track_id=track_id,
                request=job.request,
                fallback_soulprint=soulprint,
            )
            archisynapse = await self._queue_archisynapse_registration(
                job_id=job_id,
                track_id=track_id,
                dna_tag=dna_tag,
                creator_id=job.creator_id,
                request=job.request,
                artifacts=artifacts,
                vics=vics,
                soulprint=soulprint,
            )
            final_proof = ProofBundle(
                dna_tag=dna_tag,
                vics=vics,
                soulprint=soulprint,
                archisynapse=archisynapse,
            )
            final_track = track.model_copy(
                update={
                    "status": RuntimeJobState.COMPLETE,
                    "proof": final_proof,
                }
            )
            final_doc = final_track.model_dump(mode="json")
            await self.tracks.update_one(
                {"id": track_id},
                {
                    "$set": {
                        **final_doc,
                        "soulprint_id": (
                            vics.payload_hash
                            or f"sp_sha256_{artifacts.master.sha256}"
                        ),
                        # A signed content hash is not a verified watermark.
                        "soulprint_verified": False,
                        "ledger_valid": archisynapse.status == EvidenceState.VERIFIED,
                        "royalty_trust": archisynapse.rights_status == EvidenceState.VERIFIED,
                        "vics_signature": vics.signature,
                        "runtime_job_id": job_id,
                        "proof_status": (
                            "verified" if vics.status == EvidenceState.VERIFIED else "pending"
                        ),
                    }
                },
            )
            await self.jobs.update_one(
                {"job_id": job_id},
                {
                    "$set": {
                        "state": RuntimeJobState.COMPLETE.value,
                        "result": final_track.model_dump(mode="json"),
                        "updated_at": utc_now(),
                        "error": None,
                    },
                    "$push": {
                        "history": {"state": RuntimeJobState.COMPLETE.value, "at": utc_now()}
                    },
                },
            )
        except Exception as exc:
            if self.logger:
                self.logger.exception("Lyrica full runtime job %s failed", job_id)
            await self.jobs.update_one(
                {"job_id": job_id},
                {
                    "$set": {
                        "state": RuntimeJobState.FAILED.value,
                        "error": {
                            "code": exc.__class__.__name__,
                            "message": str(exc)[:500],
                        },
                        "updated_at": utc_now(),
                    },
                    "$push": {
                        "history": {"state": RuntimeJobState.FAILED.value, "at": utc_now()}
                    },
                },
            )

    async def get_job(self, job_id: str) -> Optional[RuntimeJob]:
        doc = await self.jobs.find_one({"job_id": job_id}, {"_id": 0})
        return RuntimeJob.model_validate(doc) if doc else None

    async def get_track(self, dna_tag: str) -> Optional[Dict[str, Any]]:
        return await self.tracks.find_one({"dna_tag": dna_tag}, {"_id": 0})

    async def _transition(self, job_id: str, state: RuntimeJobState) -> None:
        now = utc_now()
        await self.jobs.update_one(
            {"job_id": job_id},
            {
                "$set": {"state": state.value, "updated_at": now},
                "$push": {"history": {"state": state.value, "at": now}},
            },
        )

    @staticmethod
    def _request_fingerprint(request: TrackCreateV1, creator_id: str) -> str:
        payload = request.model_dump_json(exclude={"idempotency_key"})
        return hashlib.sha256(f"{creator_id}|{payload}".encode("utf-8")).hexdigest()

    @staticmethod
    def _dna_tag(creator_id: str, title: str, master_hash: str) -> str:
        digest = hashlib.sha256(f"{creator_id}|{title}|{master_hash}".encode("utf-8")).hexdigest()
        return f"trk_{digest[:24]}"

    @staticmethod
    def _registration_event_id(job_id: str) -> str:
        return f"evt_l3_{hashlib.sha256(job_id.encode()).hexdigest()[:20]}"

    def _build_soulfire_blueprint(self, request: TrackCreateV1) -> SoulfireBlueprint:
        raw: Dict[str, Any] = {}
        source = "empire_local_rules"
        try:
            from vics.orchestrator import run_lyrica_agent_dict

            raw = run_lyrica_agent_dict(
                lyric=request.lyrics or request.prompt,
                genre=request.genre,
                user_goal=request.prompt or request.mood,
            )
            source = "vics.orchestrator:local"
        except Exception as exc:
            raw = {"adapter_note": f"Local VICS orchestrator unavailable: {exc.__class__.__name__}"}

        lower_mood = request.mood.lower()
        intensity = 0.68 if any(x in lower_mood for x in ("grief", "fire", "defiant", "street")) else 0.52
        return SoulfireBlueprint(
            status=EvidenceState.RECORDED,
            source=source,
            title=request.title,
            cultural_context=request.culture,
            emotional_direction={
                "mood": request.mood,
                "intensity": intensity,
                "preserve_imperfections": True,
            },
            rhythm={
                "bpm": request.bpm,
                "key": request.musical_key,
                "late_pocket_ms": 14,
                "feel": "behind-the-beat",
            },
            arrangement={
                "duration_seconds": request.duration_seconds,
                "stems": ["drums", "bass", "harmony", "melody"],
                "genre": request.genre,
            },
            performance={
                "voice_rendered": False,
                "lyrics_preserved": bool(request.lyrics),
                "instruction": "Instrumental Phase 1 render; voice path remains consent-gated.",
            },
            mastering={
                "method": "empire_local_normalized_mix",
                "target_peak": 0.94,
                "claimed_lufs": None,
            },
            raw=raw,
        )

    def _measure_render(self, render: Dict[str, object]) -> ArtifactBundle:
        master = self._measure_file(render["master"])
        stems = [self._measure_file(item) for item in render["stems"]]
        hashes = {item.sha256 for item in stems}
        return ArtifactBundle(
            master=master,
            stems=stems,
            distinct_stem_hashes=len(hashes) == len(stems),
        )

    def _measure_file(self, rendered: RenderedFile) -> AudioArtifact:
        path = Path(rendered.path)
        if not path.exists() or path.stat().st_size <= 44:
            raise FullRuntimeError(f"Rendered artifact missing or empty: {path}")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        with wave.open(str(path), "rb") as handle:
            channels = handle.getnchannels()
            sample_width = handle.getsampwidth()
            sample_rate = handle.getframerate()
            frames_count = handle.getnframes()
            frames = handle.readframes(frames_count)
        if sample_width != 2:
            raise FullRuntimeError(f"Unsupported WAV sample width: {sample_width}")
        samples = np.frombuffer(frames, dtype="<i2").astype(np.float32) / 32768.0
        peak = float(np.max(np.abs(samples))) if samples.size else 0.0
        rms = float(np.sqrt(np.mean(np.square(samples)))) if samples.size else 0.0
        peak_dbfs = 20.0 * math.log10(max(peak, 1e-12))
        rms_dbfs = 20.0 * math.log10(max(rms, 1e-12))
        relative = path.relative_to(self.root_dir / "static")
        url = "/api/static/" + relative.as_posix()
        return AudioArtifact(
            kind=rendered.kind,
            name=rendered.name,
            path=str(path),
            url=url,
            sha256=digest,
            bytes=path.stat().st_size,
            duration_seconds=frames_count / sample_rate,
            sample_rate_hz=sample_rate,
            channels=channels,
            sample_width_bits=sample_width * 8,
            peak_dbfs=round(peak_dbfs, 4),
            rms_dbfs=round(rms_dbfs, 4),
        )

    @staticmethod
    def _initial_vics_state(request: TrackCreateV1) -> VICSProof:
        if request.voice_consent_id:
            return VICSProof(
                status=EvidenceState.PENDING,
                voice_use="CONSENT_REFERENCE_PROVIDED",
                consent_required=True,
                consent_id=request.voice_consent_id,
                key_status="proof_pending",
                reason="Voice is not rendered in Phase 1; consent reference is preserved for the gated voice lane.",
            )
        return VICSProof(
            status=EvidenceState.PENDING,
            voice_use="NONE",
            consent_required=False,
            key_status="proof_pending",
            reason="Track is awaiting the production VICS proof bridge.",
        )

    async def _issue_vics_proof(
        self,
        *,
        track_id: str,
        request: TrackCreateV1,
        fallback_soulprint: SoulprintProof,
    ) -> tuple[VICSProof, SoulprintProof]:
        signing_key = os.getenv("LYRICA_VICS_PROOF_SIGNING_KEY", "").strip()
        if len(signing_key) < 32:
            return (
                VICSProof(
                    status=EvidenceState.UNAVAILABLE,
                    voice_use="CONSENT_REFERENCE_PROVIDED" if request.voice_consent_id else "NONE",
                    consent_required=bool(request.voice_consent_id),
                    consent_id=request.voice_consent_id,
                    key_status="missing_or_short",
                    reason="Production VICS proof signing key is not configured.",
                ),
                fallback_soulprint,
            )
        try:
            from api.vics_bridge import issue_track_proof

            proof = await issue_track_proof(
                db=self.db,
                track_id=track_id,
                root_dir=self.root_dir,
                music_output_dir=self.root_dir / "music_output",
            )
            soulprint_hash = str(proof.get("soulprint_hash") or "")
            raw_audio_hash = soulprint_hash.removeprefix("sp_sha256_")
            soulprint = fallback_soulprint.model_copy(
                update={
                    "status": EvidenceState.VERIFIED,
                    "audio_sha256": raw_audio_hash or fallback_soulprint.audio_sha256,
                    "reason": "Actual audio hash is bound inside a signed VICS proof; watermark detection remains unavailable.",
                }
            )
            return (
                VICSProof(
                    status=EvidenceState.VERIFIED,
                    voice_use="CONSENT_REFERENCE_PROVIDED" if request.voice_consent_id else "NONE",
                    consent_required=bool(request.voice_consent_id),
                    consent_id=request.voice_consent_id,
                    signature=proof.get("signature"),
                    payload_hash=soulprint_hash or None,
                    key_status="configured",
                ),
                soulprint,
            )
        except Exception as exc:
            return (
                VICSProof(
                    status=EvidenceState.FAILED,
                    voice_use="CONSENT_REFERENCE_PROVIDED" if request.voice_consent_id else "NONE",
                    consent_required=bool(request.voice_consent_id),
                    consent_id=request.voice_consent_id,
                    key_status="configured",
                    reason=f"VICS proof issuance failed: {exc.__class__.__name__}",
                ),
                fallback_soulprint,
            )

    async def _queue_archisynapse_registration(
        self,
        *,
        job_id: str,
        track_id: str,
        dna_tag: str,
        creator_id: str,
        request: TrackCreateV1,
        artifacts: ArtifactBundle,
        vics: VICSProof,
        soulprint: SoulprintProof,
    ) -> ArchisynapseReceipt:
        event_id = self._registration_event_id(job_id)
        payload = {
            "schema_version": "1.0",
            "event_id": event_id,
            "event_type": "TRACK_REGISTERED",
            "tenant_id": "lyrica",
            "track_id": track_id,
            "dna_tag": dna_tag,
            "creator_id": creator_id,
            "contributors": [c.model_dump() for c in request.contributors],
            "splits": {c.creator_id: c.split for c in request.contributors},
            "artifact_hashes": {
                "master": artifacts.master.sha256,
                **{stem.name: stem.sha256 for stem in artifacts.stems},
            },
            "soulprint_hash": f"sp_sha256_{soulprint.audio_sha256}",
            "vics_signature": vics.signature,
            "parent_dna": request.parent_dna,
            "idempotency_key": event_id,
            "created_at": utc_now(),
        }
        existing = await self.registrations.find_one({"event_id": event_id}, {"_id": 0})
        if not existing:
            outbox = {
                "event_id": event_id,
                "track_id": track_id,
                "dna_tag": dna_tag,
                "state": "pending_dispatch",
                "payload": payload,
                "receipt": None,
                "attempts": 0,
                "created_at": utc_now(),
                "updated_at": utc_now(),
            }
            try:
                await self.registrations.insert_one(outbox)
                existing = outbox
            except Exception:
                existing = await self.registrations.find_one({"event_id": event_id}, {"_id": 0})
                if not existing:
                    return ArchisynapseReceipt(
                        status=EvidenceState.FAILED,
                        event_id=event_id,
                        rights_status=EvidenceState.PENDING,
                        payout_status=EvidenceState.NOT_REQUIRED,
                        reason="Could not persist the Archisynapse registration request.",
                        response={"request_contract": payload},
                    )
        return ArchisynapseReceipt(
            status=EvidenceState.PENDING,
            event_id=event_id,
            receipt_id=None,
            rights_status=EvidenceState.PENDING,
            payout_status=EvidenceState.NOT_REQUIRED,
            reason="Registration request is durably queued; no Archisynapse receipt has been received.",
            response={
                "outbox_state": existing.get("state", "pending_dispatch"),
                "request_contract": payload,
            },
        )
