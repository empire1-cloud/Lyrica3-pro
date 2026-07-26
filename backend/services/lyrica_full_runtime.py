"""Lyrica 3 Full Runtime Phase 1.

Coordinates the existing product boundary without collapsing it:
Soulfire blueprint -> Empire-local audio -> measured artifacts -> VICS/Soulprint
proof -> Archisynapse registration handoff.
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
            # Phase 1 local renderer writes a normalized master. The state is explicit;
            # no unexecuted mastering claim is added to the track record.

            await self._transition(job_id, RuntimeJobState.MEASURING)
            artifacts = await asyncio.to_thread(self._measure_render, render)
            if not artifacts.distinct_stem_hashes:
                raise FullRuntimeError("Stem validation failed: stems are not distinct")

            await self._transition(job_id, RuntimeJobState.PROOF_PENDING)
            dna_tag = self._dna_tag(job.creator_id, job.request.title, artifacts.master.sha256)
            soulprint = SoulprintProof(
                status=EvidenceState.RECORDED,
                algorithm="sha256-audio-fingerprint-v1",
                audio_sha256=artifacts.master.sha256,
                watermark_status=EvidenceState.UNAVAILABLE,
                reason="Audio fingerprint recorded; robust watermark verification is not part of Phase 1.",
            )
            vics = self._build_vics_proof(
                dna_tag=dna_tag,
                creator_id=job.creator_id,
                request=job.request,
                master_hash=artifacts.master.sha256,
            )
            archisynapse = await self._register_archisynapse(
                job_id=job_id,
                dna_tag=dna_tag,
                creator_id=job.creator_id,
                request=job.request,
                artifacts=artifacts,
            )
            proof = ProofBundle(
                dna_tag=dna_tag,
                vics=vics,
                soulprint=soulprint,
                archisynapse=archisynapse,
            )

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
            track = RuntimeTrack(
                id=track_id,
                dna_tag=dna_tag,
                creator=job.creator_id,
                title=job.request.title,
                genre=job.request.genre,
                mood=job.request.mood,
                culture=job.request.culture,
                status=RuntimeJobState.COMPLETE,
                duration_sec=artifacts.master.duration_seconds,
                audio_url=artifacts.master.url,
                stems=stem_rows,
                soulfire_blueprint=blueprint,
                artifacts=artifacts,
                proof=proof,
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
                    "soulprint_id": f"soulprint_sha256_{artifacts.master.sha256[:20]}",
                    "soulprint_verified": soulprint.watermark_status == EvidenceState.VERIFIED,
                    "ledger_valid": archisynapse.status in (EvidenceState.RECORDED, EvidenceState.VERIFIED),
                    "royalty_trust": archisynapse.rights_status == EvidenceState.VERIFIED,
                    "vics_signature": vics.signature,
                    "runtime_job_id": job_id,
                }
            )
            await self.tracks.insert_one(track_doc)
            await self.jobs.update_one(
                {"job_id": job_id},
                {
                    "$set": {
                        "state": RuntimeJobState.COMPLETE.value,
                        "result": track.model_dump(mode="json"),
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

    def _build_vics_proof(
        self,
        *,
        dna_tag: str,
        creator_id: str,
        request: TrackCreateV1,
        master_hash: str,
    ) -> VICSProof:
        if request.voice_consent_id:
            return VICSProof(
                status=EvidenceState.PENDING,
                voice_use="CONSENT_REFERENCE_PROVIDED",
                consent_required=True,
                consent_id=request.voice_consent_id,
                key_status="not_checked",
                reason="Phase 1 does not render a voice; consent reference is preserved for the gated voice lane.",
            )

        secret = os.getenv("JWT_SECRET", "")
        insecure = not secret or secret in {
            "dev_secret_change_me",
            "lyrica3_jwt_secret_change_in_prod",
        }
        if insecure:
            return VICSProof(
                status=EvidenceState.RECORDED,
                voice_use="NONE",
                consent_required=False,
                key_status="development_or_missing",
                reason="Provenance payload recorded, but production signing key is not configured.",
            )

        payload = {
            "dna_tag": dna_tag,
            "creator_id": creator_id,
            "master_sha256": master_hash,
            "contributors": [c.model_dump() for c in request.contributors],
            "parent_dna": request.parent_dna,
        }
        try:
            from vics_ledger import sign_track

            signed = sign_track(payload.copy())
            return VICSProof(
                status=EvidenceState.VERIFIED,
                voice_use="NONE",
                consent_required=False,
                signature=signed.get("vics_signature"),
                payload_hash=signed.get("vics_hash"),
                key_status="configured",
            )
        except Exception as exc:
            return VICSProof(
                status=EvidenceState.FAILED,
                voice_use="NONE",
                consent_required=False,
                key_status="configured",
                reason=f"VICS signing failed: {exc.__class__.__name__}",
            )

    async def _register_archisynapse(
        self,
        *,
        job_id: str,
        dna_tag: str,
        creator_id: str,
        request: TrackCreateV1,
        artifacts: ArtifactBundle,
    ) -> ArchisynapseReceipt:
        event_id = f"evt_l3_{hashlib.sha256(job_id.encode()).hexdigest()[:20]}"
        enabled = os.getenv("ARCHISYNAPSE_REGISTER_ENABLED", "false").lower() == "true"
        api_key = os.getenv("ARCHISYNAPSE_API_KEY", "").strip()
        if not enabled or not api_key:
            return ArchisynapseReceipt(
                status=EvidenceState.UNAVAILABLE,
                event_id=event_id,
                rights_status=EvidenceState.PENDING,
                payout_status=EvidenceState.NOT_REQUIRED,
                reason="Archisynapse registration is disabled or no API key is configured.",
                response={
                    "request_contract": {
                        "event_id": event_id,
                        "event_type": "TRACK_REGISTERED",
                        "dna_tag": dna_tag,
                        "creator_id": creator_id,
                    }
                },
            )

        payload = {
            "event_id": event_id,
            "event_type": "TRACK_REGISTERED",
            "dna_tag": dna_tag,
            "creator_id": creator_id,
            "contributors": [c.model_dump() for c in request.contributors],
            "splits": {c.creator_id: c.split for c in request.contributors},
            "artifact_hashes": {
                "master": artifacts.master.sha256,
                **{stem.name: stem.sha256 for stem in artifacts.stems},
            },
            "parent_dna": request.parent_dna,
            "idempotency_key": event_id,
        }
        try:
            from archisynapse_integration import ArchisynapseClient

            client = ArchisynapseClient(api_key=api_key, timeout=8)
            response = await asyncio.to_thread(client.send_webhook, "track.registered", payload)
            receipt_id = None
            if isinstance(response, dict):
                receipt_id = response.get("receipt_id") or response.get("id")
            return ArchisynapseReceipt(
                status=EvidenceState.RECORDED,
                event_id=event_id,
                receipt_id=receipt_id,
                rights_status=EvidenceState.RECORDED,
                payout_status=EvidenceState.NOT_REQUIRED,
                response=response if isinstance(response, dict) else {"raw": str(response)},
                reason=None if receipt_id else "Archisynapse accepted the event but did not return a receipt ID.",
            )
        except Exception as exc:
            return ArchisynapseReceipt(
                status=EvidenceState.FAILED,
                event_id=event_id,
                rights_status=EvidenceState.PENDING,
                payout_status=EvidenceState.NOT_REQUIRED,
                reason=f"Archisynapse registration failed: {exc.__class__.__name__}",
                response={"request_contract": payload},
            )
