# OPA / Rego — Soulfire Canon Enforcer
# Universe: U0 (SLA-113 CanonEnforcer)
# Applied to every engine output BEFORE release to downstream universes.
# Versioned in Black Box Registry as: canon/soulfire@1.0.0
#
# To evaluate locally:
#   opa eval -d canon_enforcer.rego -i input.json "data.canon.soulfire.allow"

package canon.soulfire

import future.keywords.if
import future.keywords.in

# ─────────────────────────────────────────────
# Top-level decision
# ─────────────────────────────────────────────

default allow := false

allow if {
    count(violations) == 0
}

# ─────────────────────────────────────────────
# Collect all violations
# ─────────────────────────────────────────────

violations contains msg if {
    not input.track_metadata.vulnerability_level
    msg := "MISSING: track_metadata.vulnerability_level required"
}

violations contains msg if {
    v := input.track_metadata.vulnerability_level
    not (v >= 0.0)
    not (v <= 1.0)
    msg := sprintf("RANGE: vulnerability_level %.3f out of [0.0, 1.0]", [v])
}

violations contains msg if {
    not input.creative_intent_trace
    msg := "MISSING: creative_intent_trace block required"
}

violations contains msg if {
    not input.acoustic_primitives.bpm
    msg := "MISSING: acoustic_primitives.bpm required"
}

violations contains msg if {
    bpm := input.acoustic_primitives.bpm
    not (bpm >= 40)
    msg := sprintf("RANGE: bpm %d below minimum 40", [bpm])
}

violations contains msg if {
    bpm := input.acoustic_primitives.bpm
    not (bpm <= 220)
    msg := sprintf("RANGE: bpm %d above maximum 220", [bpm])
}

violations contains msg if {
    not input.epd_vocal_blueprint
    msg := "MISSING: epd_vocal_blueprint required for vocal renders"
}

violations contains msg if {
    tier := input.track_metadata.render_tier
    not tier in {"DRAFT", "PREVIEW", "FINAL"}
    msg := sprintf("INVALID: render_tier '%s' not in {DRAFT, PREVIEW, FINAL}", [tier])
}

violations contains msg if {
    not input.lyrics_payload.body
    msg := "MISSING: lyrics_payload.body required"
}

violations contains msg if {
    body := input.lyrics_payload.body
    count(body) < 10
    msg := "QUALITY: lyrics_payload.body too short (min 10 chars)"
}

# ─────────────────────────────────────────────
# Royalty split integrity check
# ─────────────────────────────────────────────

violations contains msg if {
    rs := input.track_metadata.royalty_split
    total := rs.artist_pct + rs.platform_pct + rs.model_owners_pct + rs.infrastructure_pct
    abs(total - 1.0) > 0.001
    msg := sprintf("FINANCE: royalty_split sums to %.4f, must equal 1.0", [total])
}

# ─────────────────────────────────────────────
# Identity / brand canon checks
# ─────────────────────────────────────────────

# Soulfire renders must declare a territory
violations contains msg if {
    not input.track_metadata.territory
    msg := "IDENTITY: track_metadata.territory required"
}

# Creator UID must be present — no anonymous renders in production
violations contains msg if {
    tier := input.track_metadata.render_tier
    tier == "FINAL"
    not input.track_metadata.creator_uid
    msg := "IDENTITY: creator_uid required for FINAL tier renders"
}

# ─────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────

abs(x) := x if { x >= 0 }
abs(x) := -x if { x < 0 }
