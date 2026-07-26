from __future__ import annotations

import os
import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

from contracts.track_runtime_v1 import EvidenceState, RuntimeJobState, TrackCreateV1
from services.lyrica_full_runtime import LyricaFullRuntime
from services.local_stem_renderer import render_local_stems


class FakeCollection:
    def __init__(self):
        self.docs = []

    async def create_index(self, *args, **kwargs):
        return kwargs.get("name", "index")

    async def insert_one(self, doc):
        self.docs.append(deepcopy(doc))
        return object()

    async def find_one(self, query, projection=None):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                result = deepcopy(doc)
                result.pop("_id", None)
                return result
        return None

    async def update_one(self, query, update):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                for key, value in update.get("$set", {}).items():
                    doc[key] = deepcopy(value)
                for key, value in update.get("$push", {}).items():
                    doc.setdefault(key, []).append(deepcopy(value))
                return object()
        return object()


class FakeDB:
    def __init__(self):
        self.track_runtime_jobs = FakeCollection()
        self.tracks = FakeCollection()
        self.track_registration_outbox = FakeCollection()


class FullRuntimeTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.original_env = dict(os.environ)
        os.environ["LYRICA_PROVIDER_MODE"] = "empire_local"
        os.environ.pop("LYRICA_VICS_PROOF_SIGNING_KEY", None)

    def tearDown(self):
        os.environ.clear()
        os.environ.update(self.original_env)

    def request(self) -> TrackCreateV1:
        return TrackCreateV1(
            title="Concrete Bloom",
            prompt="SGV Chicano soul with late-pocket drums",
            lyrics="Wildflowers rise through the boulevard cracks",
            genre="SGV Chicano Soul",
            mood="Porch-Light Grief",
            culture="SGV / El Monte",
            duration_seconds=8,
            bpm=92,
            musical_key="C",
            idempotency_key="test-concrete-bloom-v1",
        )

    async def test_runtime_creates_measured_distinct_artifacts_without_false_verification(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            db = FakeDB()
            runtime = LyricaFullRuntime(db=db, root_dir=root)
            job = await runtime.create_job(self.request(), "manda")
            await runtime.run_job(job.job_id)
            completed = await runtime.get_job(job.job_id)

            self.assertIsNotNone(completed)
            self.assertEqual(completed.state, RuntimeJobState.COMPLETE)
            self.assertIsNotNone(completed.result)
            track = completed.result
            self.assertEqual(track.provider_mode, "empire_local")
            self.assertEqual(len(track.artifacts.stems), 4)
            self.assertTrue(track.artifacts.distinct_stem_hashes)
            self.assertEqual(len({stem.sha256 for stem in track.artifacts.stems}), 4)
            self.assertGreater(track.artifacts.master.bytes, 44)
            self.assertEqual(track.artifacts.master.sample_rate_hz, 44100)
            self.assertTrue(track.dna_tag.startswith("trk_"))
            self.assertEqual(track.proof.soulprint.status, EvidenceState.RECORDED)
            self.assertEqual(track.proof.soulprint.watermark_status, EvidenceState.UNAVAILABLE)
            self.assertEqual(track.proof.vics.status, EvidenceState.UNAVAILABLE)
            self.assertEqual(track.proof.archisynapse.status, EvidenceState.PENDING)
            self.assertEqual(len(db.track_registration_outbox.docs), 1)
            self.assertEqual(db.track_registration_outbox.docs[0]["state"], "pending_dispatch")

            stored = db.tracks.docs[0]
            self.assertFalse(stored["soulprint_verified"])
            self.assertFalse(stored["ledger_valid"])
            self.assertFalse(stored["royalty_trust"])
            for artifact in [track.artifacts.master, *track.artifacts.stems]:
                self.assertTrue(Path(artifact.path).exists())

    async def test_idempotency_returns_same_job(self):
        with tempfile.TemporaryDirectory() as temp:
            runtime = LyricaFullRuntime(db=FakeDB(), root_dir=Path(temp))
            first = await runtime.create_job(self.request(), "manda")
            second = await runtime.create_job(self.request(), "manda")
            self.assertEqual(first.job_id, second.job_id)

    async def test_non_empire_provider_fails_closed(self):
        with tempfile.TemporaryDirectory() as temp:
            db = FakeDB()
            os.environ["LYRICA_PROVIDER_MODE"] = "vertex"
            runtime = LyricaFullRuntime(db=db, root_dir=Path(temp))
            job = await runtime.create_job(self.request(), "manda")
            await runtime.run_job(job.job_id)
            failed = await runtime.get_job(job.job_id)
            self.assertEqual(failed.state, RuntimeJobState.FAILED)
            self.assertIn("empire_local", failed.error["message"])

    def test_renderer_outputs_five_unique_files(self):
        with tempfile.TemporaryDirectory() as temp:
            render = render_local_stems(
                output_dir=temp,
                job_id="job_renderer",
                duration_seconds=8,
                bpm=90,
                musical_key="C",
                genre="SGV Chicano Soul",
                mood="Late-Night Honesty",
                seed_text="renderer-test",
            )
            paths = [Path(render["master"].path), *[Path(item.path) for item in render["stems"]]]
            self.assertEqual(len(paths), 5)
            self.assertTrue(all(path.exists() and path.stat().st_size > 44 for path in paths))
            hashes = {path.read_bytes()[:4096] for path in paths}
            self.assertGreaterEqual(len(hashes), 4)


if __name__ == "__main__":
    unittest.main()
