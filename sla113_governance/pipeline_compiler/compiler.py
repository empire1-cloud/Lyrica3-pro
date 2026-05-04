"""
Pipeline Compiler — Phase 1
Parses declarative YAML pipeline manifests and compiles them
into ordered DAG execution plans.

Phase 2: emit Argo Workflows / Vertex Pipelines YAML from the DAG.
"""
from __future__ import annotations
import yaml
from dataclasses import dataclass, field
from typing import Any


@dataclass
class PipelineNode:
    universe_id: str          # e.g. "U1"
    engine_id:   str          # e.g. "ArtDirectionEngine"
    version:     str          # resolved from registry
    endpoint:    str          # gRPC or REST
    depends_on:  list[str] = field(default_factory=list)


@dataclass
class CompiledPipeline:
    pipeline_id:  str
    nodes:        list[PipelineNode]
    telemetry:    bool
    retry:        int
    dag:          list[list[PipelineNode]]  # stages (nodes in same stage run parallel)


class PipelineCompiler:
    """
    Reads universe_manifests/universes.yaml to resolve engine endpoints.
    Compiles pipeline route into a DAG with parallel stages where possible.
    """

    def __init__(self, manifests_path: str) -> None:
        with open(manifests_path) as f:
            raw = yaml.safe_load(f)
        # Index: universe_id -> engine_id -> engine config
        self._index: dict[str, dict[str, dict]] = {}
        for u in raw.get("universes", []):
            uid = u["id"]
            self._index[uid] = {}
            for eng in u.get("engines", []):
                self._index[uid][eng["id"]] = {
                    "version":  eng.get("version", "0.0.0"),
                    "endpoint": eng.get("endpoint", ""),
                    "protocol": eng.get("protocol", "gRPC"),
                }

    def compile(self, manifest: dict[str, Any]) -> CompiledPipeline:
        pid    = manifest["pipeline"]["id"]
        route  = manifest["pipeline"]["route"]       # list of "U1.ArtDirectionEngine"
        telem  = manifest["pipeline"].get("telemetry", False)
        retry  = manifest["pipeline"].get("retry", 0)

        nodes: list[PipelineNode] = []
        for step in route:
            uid, eid = step.split(".", 1)
            eng = self._index.get(uid, {}).get(eid, {})
            nodes.append(PipelineNode(
                universe_id=uid,
                engine_id=eid,
                version=eng.get("version", "unknown"),
                endpoint=eng.get("endpoint", f"grpc://{uid.lower()}-{eid.lower()}:50051"),
            ))

        # Phase 1: linear DAG (sequential)
        # Phase 2: dependency analysis for true parallelism
        dag = [[n] for n in nodes]

        return CompiledPipeline(
            pipeline_id=pid,
            nodes=nodes,
            telemetry=telem,
            retry=retry,
            dag=dag,
        )

    def render_summary(self, cp: CompiledPipeline) -> str:
        lines = [f"Pipeline: {cp.pipeline_id}  telemetry={cp.telemetry}  retry={cp.retry}"]
        for stage_i, stage in enumerate(cp.dag):
            for n in stage:
                lines.append(
                    f"  stage[{stage_i}] {n.universe_id}.{n.engine_id}@{n.version}"
                    f"  → {n.endpoint}"
                )
        return "\n".join(lines)
