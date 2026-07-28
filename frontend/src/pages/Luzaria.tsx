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

        <article className="luzaria-panel luzaria-panel--wide">
          <div className="luzaria-readiness-head">
            <div>
              <p className="luzaria-section-label">Launch Readiness</p>
              <h2>{data.launch_readiness.launch_ready ? "Ready to release" : "Proof gates still open"}</h2>
            </div>
            <div className="luzaria-score">{completedGates}/{totalGates}</div>
          </div>
          <div className="luzaria-gates">
            {Object.entries(data.launch_readiness.gates).map(([gate, status]) => (
              <div key={gate} className={`luzaria-gate luzaria-gate--${status}`}>
                <span>{prettyGate(gate)}</span>
                <strong>{status.toUpperCase()}</strong>
              </div>
            ))}
          </div>
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
