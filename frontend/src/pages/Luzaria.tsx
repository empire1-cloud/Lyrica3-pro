import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import "./luzaria.css";

type GateStatus = "complete" | "pending" | string;

type LuzariaResponse = {
  artist: {
    artist_id: string;
    name: string;
    pronunciation: string;
    digital_birthdate: string;
    created_by: string;
    version: string;
    artist_status: string;
    origin: {
      home: string;
      statement: string;
      signature_quote: string;
    };
    public_identity: {
      presentation_age: number;
      ethnicity: string;
      eyes: string;
      hair: string;
      color: string;
    };
    music_identity: {
      foundation: string[];
      languages: string[];
      creative_rule: string;
    };
    voice_identity: {
      register: string;
      delivery: string;
      language_behavior: string;
    };
    values: string[];
    identity_lock: Record<string, boolean>;
  };
  identity_digest: string;
  birth_certificate: {
    certificate_type: string;
    artist_id: string;
    digital_birthdate: string;
    created_by: string;
    version: string;
  };
  first_release: {
    release_id: string;
    title: string;
    release_status: string;
    core_genre: string;
    s2_mutation: string;
    dna_tag_preview: string;
    final_dna_tag?: string | null;
    soulprint_hash?: string | null;
    vics_proof_id?: string | null;
    archisynapse_receipt_id?: string | null;
    release_digest?: string;
    release_ready?: boolean;
    epd_vocal_blueprint: {
      vulnerability_level: number;
      phonation: string;
      biometric_artifacts: string[];
    };
    canon_review: {
      mode: string;
      note: string;
      cultural_identity: string;
    };
    cross_platform_proof: {
      suno_payload_sung_as_lyrics: boolean;
      evidence_status: string;
      meaning: string;
    };
    release_gates: Record<string, GateStatus>;
  };
  launch_readiness: {
    launch_ready: boolean;
    gates: Record<string, GateStatus>;
    catalog: {
      total_tracks: number;
      verified_tracks: number;
      receipted_tracks: number;
    };
  };
};

const FALLBACK: LuzariaResponse = {
  artist: {
    artist_id: "LZR-00000001",
    name: "LUZARIA",
    pronunciation: "loo-ZAR-ee-ah",
    digital_birthdate: "2025-05-24",
    created_by: "EMPIRE-1",
    version: "1.0.0",
    artist_status: "pre_release",
    origin: {
      home: "San Gabriel Valley, California",
      statement:
        "LUZARIA was born from truth, cultura, and code. She was created to inspire, heal, and unite through timeless music. She owns her art and protects her people.",
      signature_quote: "I sing the truth. I feel everything. I belong to my soul.",
    },
    public_identity: {
      presentation_age: 21,
      ethnicity: "Light Mexican",
      eyes: "Hazel",
      hair: "Very long dark brown to soft black",
      color: "Toast",
    },
    music_identity: {
      foundation: ["Chicano Soul", "Modern R&B", "Oldies warmth", "Late-night honesty"],
      languages: ["English", "Spanish"],
      creative_rule:
        "Creative eras may evolve, but the artist remains one name, one face, one voice, one personality, one musical foundation, and one story canon.",
    },
    voice_identity: {
      register: "Warm smoky alto",
      delivery: "Emotionally honest, intimate, protective, and grounded",
      language_behavior: "English-first with natural Spanish",
    },
    values: [
      "creator ownership",
      "cultural truth",
      "emotional honesty",
      "protecting creators",
      "transparent lineage",
      "fair compensation",
    ],
    identity_lock: {
      single_identity: true,
      multi_persona_enabled: false,
      voice_identity_locked: true,
      visual_identity_locked: true,
      story_canon_locked: true,
      rights_protected: true,
    },
  },
  identity_digest: "Identity proof loads from the Lyrica API.",
  birth_certificate: {
    certificate_type: "Empire-1 Digital Artist Birth Certificate",
    artist_id: "LZR-00000001",
    digital_birthdate: "2025-05-24",
    created_by: "EMPIRE-1",
    version: "1.0.0",
  },
  first_release: {
    release_id: "LZR-RC-0001",
    title: "Sleep On The Floor",
    release_status: "candidate",
    core_genre: "SGV Sub-genre — Chicano Soul / Trap fusion",
    s2_mutation:
      "Pitched-down 70s soul sample fused with late-pocket, off-grid Trap 808s and live, imperfect hi-hats.",
    dna_tag_preview: "trk_alpha_4e8a1c_empire1",
    release_ready: false,
    epd_vocal_blueprint: {
      vulnerability_level: 0.98,
      phonation:
        "Intimate, close-mic delivery with heavy chest resonance, simulating a voice strained from exhaustion and grief.",
      biometric_artifacts: ["Adaptive inhale", "Vocal fry", "Emotional crack", "Chest resonance"],
    },
    canon_review: {
      mode: "Testimony",
      note:
        "The warm soul bed carries the hug while the vocal carries the bruise.",
      cultural_identity: "honored as grammar, not costume",
    },
    cross_platform_proof: {
      suno_payload_sung_as_lyrics: true,
      evidence_status: "documented",
      meaning:
        "The external system treated instructions, metadata, structure, and lyrics as one undifferentiated block. Lyrica preserves their separate roles.",
    },
    release_gates: {
      identity_alignment: "complete",
      lyrics_locked: "complete",
      creative_intent_locked: "complete",
      drift_guard_review: "complete",
      final_audio_master: "pending",
      final_dna_tag: "pending",
      soulprint_hash: "pending",
      vics_proof: "pending",
      catalog_registration: "pending",
      archisynapse_receipt: "pending",
    },
  },
  launch_readiness: {
    launch_ready: false,
    gates: {
      identity_kernel: "complete",
      digital_birth_certificate: "complete",
      voice_canon: "complete",
      visual_canon: "complete",
      story_canon: "complete",
      first_vics_signed_track: "pending",
      first_archisynapse_receipt: "pending",
      public_catalog: "pending",
    },
    catalog: { total_tracks: 0, verified_tracks: 0, receipted_tracks: 0 },
  },
};

function apiRoot() {
  const configured =
    import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || "";
  return configured.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function prettyGate(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function GateGrid({ gates }: { gates: Record<string, GateStatus> }) {
  return (
    <div className="luzaria-gates">
      {Object.entries(gates).map(([gate, status]) => (
        <div key={gate} className={`luzaria-gate luzaria-gate--${status}`}>
          <span>{prettyGate(gate)}</span>
          <strong>{status.toUpperCase()}</strong>
        </div>
      ))}
    </div>
  );
}

export function Luzaria() {
  const navigate = useNavigate();
  const [data, setData] = useState<LuzariaResponse>(FALLBACK);
  const [source, setSource] = useState<"live" | "fallback">("fallback");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiRoot()}/duo-soul/artist/luzaria`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Luzaria API unavailable");
        return response.json();
      })
      .then((payload: LuzariaResponse) => {
        setData(payload);
        setSource("live");
      })
      .catch(() => {
        if (!controller.signal.aborted) setSource("fallback");
      });
    return () => controller.abort();
  }, []);

  const completedGates = useMemo(
    () => Object.values(data.launch_readiness.gates).filter((value) => value === "complete").length,
    [data.launch_readiness.gates],
  );
  const totalGates = Object.keys(data.launch_readiness.gates).length;
  const completedReleaseGates = Object.values(data.first_release.release_gates).filter(
    (value) => value === "complete",
  ).length;
  const totalReleaseGates = Object.keys(data.first_release.release_gates).length;

  return (
    <main className="luzaria-page">
      <nav className="luzaria-nav" aria-label="Luzaria navigation">
        <button type="button" onClick={() => navigate("/")} className="luzaria-wordmark">
          LYRICA3
        </button>
        <div className="luzaria-nav-actions">
          <span className={`luzaria-source luzaria-source--${source}`}>
            {source === "live" ? "LIVE IDENTITY RECORD" : "CANON PREVIEW"}
          </span>
          <button type="button" onClick={() => navigate("/auth")} className="luzaria-enter">
            Enter Studio
          </button>
        </div>
      </nav>

      <section className="luzaria-hero">
        <div className="luzaria-hero-copy">
          <p className="luzaria-kicker">EMPIRE-1 DIGITAL ARTIST · {data.artist.artist_id}</p>
          <h1>{data.artist.name}</h1>
          <p className="luzaria-pronunciation">{data.artist.pronunciation}</p>
          <p className="luzaria-origin">{data.artist.origin.statement}</p>
          <blockquote>“{data.artist.origin.signature_quote}”</blockquote>
          <div className="luzaria-hero-tags">
            {data.artist.music_identity.foundation.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <aside className="luzaria-certificate" aria-label="Digital birth certificate">
          <p className="luzaria-certificate-label">Digital Birth Certificate</p>
          <h2>{data.birth_certificate.artist_id}</h2>
          <dl>
            <div><dt>Born</dt><dd>{data.birth_certificate.digital_birthdate}</dd></div>
            <div><dt>Created by</dt><dd>{data.birth_certificate.created_by}</dd></div>
            <div><dt>Version</dt><dd>{data.birth_certificate.version}</dd></div>
            <div><dt>Home</dt><dd>{data.artist.origin.home}</dd></div>
            <div><dt>Status</dt><dd>{data.artist.artist_status.replace("_", " ")}</dd></div>
          </dl>
          <p className="luzaria-digest" title={data.identity_digest}>{data.identity_digest}</p>
        </aside>
      </section>

      <section className="luzaria-grid">
        <article className="luzaria-panel">
          <p className="luzaria-section-label">Voice Identity</p>
          <h2>{data.artist.voice_identity.register}</h2>
          <p>{data.artist.voice_identity.delivery}</p>
          <p className="luzaria-muted">{data.artist.voice_identity.language_behavior}</p>
        </article>

        <article className="luzaria-panel">
          <p className="luzaria-section-label">Identity Lock</p>
          <div className="luzaria-locks">
            {Object.entries(data.artist.identity_lock).map(([key, enabled]) => (
              <div key={key} className={enabled || key === "multi_persona_enabled" ? "is-locked" : ""}>
                <span>{prettyGate(key)}</span>
                <strong>{key === "multi_persona_enabled" ? (enabled ? "ON" : "DISABLED") : enabled ? "LOCKED" : "OPEN"}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="luzaria-panel luzaria-panel--wide luzaria-release">
          <div className="luzaria-readiness-head">
            <div>
              <p className="luzaria-section-label">First Release Candidate · {data.first_release.release_id}</p>
              <h2>{data.first_release.title}</h2>
              <p className="luzaria-release-genre">{data.first_release.core_genre}</p>
            </div>
            <div className="luzaria-score">{completedReleaseGates}/{totalReleaseGates}</div>
          </div>

          <div className="luzaria-release-story">
            <div>
              <span>Performance</span>
              <strong>{Math.round(data.first_release.epd_vocal_blueprint.vulnerability_level * 100)}% vulnerability</strong>
              <p>{data.first_release.epd_vocal_blueprint.phonation}</p>
            </div>
            <div>
              <span>Canon mode</span>
              <strong>{data.first_release.canon_review.mode}</strong>
              <p>{data.first_release.canon_review.note}</p>
            </div>
            <div>
              <span>Cross-platform proof</span>
              <strong>Suno sang the payload as lyrics</strong>
              <p>{data.first_release.cross_platform_proof.meaning}</p>
            </div>
          </div>

          <div className="luzaria-release-tags">
            {data.first_release.epd_vocal_blueprint.biometric_artifacts.map((artifact) => (
              <span key={artifact}>{artifact.replace(/[<>_]/g, " ").trim()}</span>
            ))}
          </div>

          <GateGrid gates={data.first_release.release_gates} />
          <p className="luzaria-digest" title={data.first_release.release_digest || data.first_release.dna_tag_preview}>
            {data.first_release.release_digest || `DNA preview · ${data.first_release.dna_tag_preview}`}
          </p>
        </article>

        <article className="luzaria-panel luzaria-panel--wide">
          <div className="luzaria-readiness-head">
            <div>
              <p className="luzaria-section-label">Artist Launch Readiness</p>
              <h2>{data.launch_readiness.launch_ready ? "Ready to release" : "Proof gates still open"}</h2>
            </div>
            <div className="luzaria-score">{completedGates}/{totalGates}</div>
          </div>
          <GateGrid gates={data.launch_readiness.gates} />
          <div className="luzaria-catalog-stats">
            <div><strong>{data.launch_readiness.catalog.total_tracks}</strong><span>Catalog tracks</span></div>
            <div><strong>{data.launch_readiness.catalog.verified_tracks}</strong><span>VICS verified</span></div>
            <div><strong>{data.launch_readiness.catalog.receipted_tracks}</strong><span>Royalty receipts</span></div>
          </div>
        </article>

        <article className="luzaria-panel luzaria-panel--wide luzaria-values">
          <p className="luzaria-section-label">What She Protects</p>
          <div>
            {data.artist.values.map((value) => <span key={value}>{value}</span>)}
          </div>
          <p className="luzaria-rule">{data.artist.music_identity.creative_rule}</p>
        </article>
      </section>
    </main>
  );
}
