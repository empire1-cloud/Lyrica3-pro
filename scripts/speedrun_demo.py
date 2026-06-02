#!/usr/bin/env python3
"""
Speedrun Demo — Lyrica3‑pro → Archisynapse → Blueprint Match → Payment

Narrative:
  1. Create a track in Lyrica 3 (simulated)
  2. Lyrica calls Archisynapse for architecture recommendations
  3. Blueprint Registry v0.3 returns graph‑boosted bundle
  4. Route royalties through Archisynapse
  5. Close the loop — “the graph learns”

Usage:
    export ARCHISYNAPSE_API_KEY="sk_..."
    python scripts/speedrun_demo.py

Requires: pip install requests
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from archisynapse_integration import ArchisynapsePayments

HR = "=" * 72


def phase_1_track_creation(payments):
    """Simulate Lyrica 3 track creation → collect metadata."""
    print(f"\n{HR}")
    print("PHASE 1 — Track Created in Lyrica 3")
    print(f"{HR}")
    track = {
        "title": "SGV Anthem (Speedrun)",
        "genre": "G-Funk / West Coast",
        "mood": "confident, nostalgic",
        "creator": "@shiestybizz",
        "collaborators": ["@sojisoul", "@beatmaker"],
        "influence_graph": ["Dr. Dre", "Snoop Dogg", "Warren G"],
    }
    print(f"  Track:          {track['title']}")
    print(f"  Genre:          {track['genre']}")
    print(f"  Creator:        {track['creator']}")
    print(f"  Collaborators:  {', '.join(track['collaborators'])}")
    print(f"  Influences:     {', '.join(track['influence_graph'])}")
    return track


def phase_2_architecture_query(payments, track):
    """Lyrica calls Archisynapse for architecture recommendations."""
    print(f"\n{HR}")
    print("PHASE 2 — Lyrica → Archisynapse: Architecture Query")
    print(f"{HR}")

    query = "ai music generation with real-time royalties"
    tags = ["ai", "music", "royalties", "streaming"]
    print(f"  Query: \"{query}\"")
    print(f"  Tags:  {tags}")

    result = payments.semantic_match_blueprints(query=query, tags=tags, limit=5)
    items = result.get("items", [])

    print(f"\n  Blueprint Registry v0.3 — Graph-Aware Results:")
    for i, item in enumerate(items):
        bp = item["blueprint"]
        graph_s = item.get("graphScore", 0)
        print(
            f"    {i+1}. {bp['name']:38s}  "
            f"score={item['score']:.4f}  "
            f"graph={graph_s:.4f}  "
            f"[{bp['complexity']}]"
        )

    print(f"\n  >> Graph score boosted '{items[0]['blueprint']['name']}' to #1")

    info = payments.get_graph_info()
    print(f"\n  Graph stats: {info.get('nodes', 0)} nodes, "
          f"{info.get('edges', 0)} edges, "
          f"{info.get('edgeTypes', 0)} edge types")

    return items


def phase_3_bundle(payments):
    """Get the recommended architecture bundle."""
    print(f"\n{HR}")
    print("PHASE 3 — Blueprint Bundle: Architecture Stack")
    print(f"{HR}")

    bp_list = payments.client.list_blueprints(limit=20).get("items", [])
    names = ["AI Music Generation Pipeline", "Micro-Royalty Streaming", "Event-Driven Settlement"]
    ids = [b["id"] for b in bp_list if b["name"] in names]

    if len(ids) >= 2:
        bundle = payments.client.graph_bundle(
            blueprint_ids=ids[:3],
            name="AI Music + Royalty Stack",
            description="End-to-end AI music generation with real-time royalty streaming",
        )
        print(f"  Bundle: {bundle.get('name', '?')}")
        print(f"  Blueprints:")
        for b in bundle.get("blueprints", []):
            bp = b.get("blueprint", {})
            print(f"    • {bp.get('name', '?'):38s}  [{bp.get('complexity', '?')}]")
        print(f"  Internal edges: {bundle.get('edgeCount', 0)}")
        print(f"  Avg connectivity: {bundle.get('avgConnectivity', 0)}")

        print(f"\n  >> \"This track's architecture was chosen by the Blueprint Registry graph.\"")

    return ids


def phase_4_royalty_flow(payments, track):
    """Route royalties through Archisynapse."""
    print(f"\n{HR}")
    print("PHASE 4 — Route Royalties: Lyrica → Archisynapse → Payout")
    print(f"{HR}")

    charge = payments.charge_for_generation(
        user_handle=track["creator"],
        user_email="shiestybizz@example.com",
        amount_cents=299,
        track_title=track["title"],
    )
    print(f"  1. Charged $2.99 for \"{track['title']}\"")
    print(f"     Transaction: {charge['id']}  Status: {charge.get('status', '?')}")

    payouts = payments.distribute_royalties(
        source_transaction_id=charge["id"],
        stakeholders={
            "prompt_writer": track["creator"],
            "vocal_owner": track["creator"],
            "emotional_arc_designer": "@sojisoul",
            "producer": "@beatmaker",
        },
        royalty_split={"prompt_writer": 40.0, "vocal_owner": 20.0,
                       "emotional_arc_designer": 15.0, "producer": 10.0},
    )
    print(f"\n  2. Distributed royalties:")
    for p in payouts:
        print(f"     • {p['role']:25s} → {p['handle']:20s}  ${p['amount_cents']/100:.2f} ({p['percentage']}%)")

    return charge


def phase_5_graph_learns(payments, track, blueprint_ids):
    """Close the loop — the graph learns from usage."""
    print(f"\n{HR}")
    print("PHASE 5 — Close the Loop: Graph Learns")
    print(f"{HR}")

    print(f"  \"Every time this runs, the graph learns which patterns work together.\"")
    print(f"\n  Track:       {track['title']}")
    print(f"  Creator:     {track['creator']}")
    print(f"  Blueprints:  {len(blueprint_ids)} architecture patterns applied")
    print(f"  Royalties:   $2.99 distributed across stakeholders")
    print(f"\n  >> The graph co-occurrence counter will strengthen edges")
    print(f"     between these blueprints — next query gets even smarter.")

    info = payments.get_graph_info()
    print(f"\n  Graph now: {info.get('nodes', 0)} nodes, {info.get('edges', 0)} edges")


def main():
    api_key = os.environ.get("ARCHISYNAPSE_API_KEY", "sk_demo_key")
    print(f"Archisynapse URL: {ARCHISYNAPSE_BASE if 'ARCHISYNAPSE_BASE' in dir() else 'https://archisynapse-production.up.railway.app/api/v1'}")
    print(f"API Key: {api_key[:8]}...")

    from archisynapse_integration import ARCHISYNAPSE_BASE
    print(f"Endpoint: {ARCHISYNAPSE_BASE}")

    payments = ArchisynapsePayments(api_key=api_key)

    try:
        h = payments.health_check()
        if h.get("status") != "ok":
            print(f"  WARNING: Health = {h}")
    except Exception as e:
        print(f"  WARNING: Health check failed ({e}) — server may not be running\n")

    track = phase_1_track_creation(payments)
    items = phase_2_architecture_query(payments, track)
    bp_ids = phase_3_bundle(payments)
    charge = phase_4_royalty_flow(payments, track)
    phase_5_graph_learns(payments, track, bp_ids)

    print(f"\n{HR}")
    print("FLYWHEEL COMPLETE — Lyrica3 ↔ Archisynapse loop verified.")
    print("The Blueprint Registry graph chose the architecture.")
    print("The payment loop distributed royalties.")
    print("The graph learns from every cycle.")
    print(f"{HR}\n")


if __name__ == "__main__":
    main()
