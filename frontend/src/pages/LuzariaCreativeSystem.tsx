import { useEffect, useMemo, useState } from "react";
import "./luzaria-creative-system.css";


type VoiceSystemResponse = {
  artist_id: string;
  voice_model_id: string;
  vocal_north_star: string;
  voice_model_digest: string;
  voice_model: {
    identity_constraints: {
      register: string;
      delivery: string;
      language_behavior: string;
    };
    performance_modes: Record<string, Record<string, number>>;
  };
  vocal_stack: {
    north_star: string;
    performance_modes: Record<string, { purpose: string; traits: string[] }>;
    freestyle_generation: {
      old_school_elements: string[];
      modernization_rules: string[];
    };
  };
  genre_matrix: {
    genre_matrix: Record<
      string,
      {
        role: string;
        vocal_bias: string;
        identity_boundary?: string;
      }
    >;
  };
  truth_boundary: {
    original_mathematical_synthesis: boolean;
    uses_human_voice_recordings: boolean;
    uses_licensed_seed_voice: boolean;
    celebrity_similarity_targeting: boolean;
    full_lyric_intelligibility: string;
    release_master_approved: boolean;
  };
};

type CreativeReleaseResponse = {
  release_id: string;
  title: string;
  arrangement: {
    production_thesis: string;
    sections: Array<{
      name: string;
      vocal_modes: string[];
      purpose: string;
    }>;
    status: Record<string, string | boolean>;
  };
  wardrobe: {
    era_name: string;
    story: string;
    hero_look: Record<string, string | string[]>;
    cover_art_direction: {
      setting: string;
      pose: string;
      lighting: string;
    };
  };
};

type CreativeState = {
  voice: VoiceSystemResponse;
  release: CreativeReleaseResponse;
};

const FALLBACK: CreativeState = {
  voice: {
    artist_id: "LZR-00000001",
    voice_model_id: "LZR-VOICE-MATH-V0",
    vocal_north_star: "Velvet Grit",
    voice_model_digest: "Voice fingerprint loads from the Lyrica API.",
    voice_model: {
      identity_constraints: {
        register: "Warm smoky alto with an approved upper extension",
        delivery: "Emotionally honest, intimate, protective, grounded, rhythmically agile",
        language_behavior: "English-first with natural Spanish",
      },
      performance_modes: {
        testimony_grit: {},
        velvet_90s_harmony: {},
        freestyle_electro_lift: {},
        modern_alt_rnb_pocket: {},
        playful_rap_sung_switch: {},
        soul_funk_upper_lift: {},
      },
    },
    vocal_stack: {
      north_star:
        "90s R&B harmony warmth, classic freestyle urgency, intimate modern alt-R&B phrasing, and playful rap-sung confidence — all resolved through Luzaria's own locked mathematical voice.",
      performance_modes: {
        testimony_grit: {
          purpose: "grief, survival, protective gravity",
          traits: ["chest-forward low-mid resonance", "controlled rasp", "restrained emotional cracks"],
        },
        velvet_90s_harmony: {
          purpose: "warmth, longing, sister-harmony depth",
          traits: ["close thirds and sixths", "delayed harmony bloom", "one identity across every layer"],
        },
        freestyle_electro_lift: {
          purpose: "romantic urgency, motion, hook energy",
          traits: ["clean forward onset", "syncopated hook fragments", "quick call-and-response"],
        },
        modern_alt_rnb_pocket: {
          purpose: "private confession and unpredictable emotional phrasing",
          traits: ["speech-like starts", "behind-the-beat entrances", "late melodic resolution"],
        },
        playful_rap_sung_switch: {
          purpose: "confidence, wit, and current-generation personality",
          traits: ["half-rapped melodic cadence", "percussive consonants", "quick return to sung tone"],
        },
      },
      freestyle_generation: {
        old_school_elements: [
          "syncopated electro bass",
          "dry drum-machine kick and clap",
          "bright detuned synth stabs",
          "romantic urgency",
        ],
        modernization_rules: [
          "modern sub-bass",
          "negative space around the lead",
          "alt-R&B broken phrasing",
          "identity-safe rap-sung switch",
        ],
      },
    },
    genre_matrix: {
      genre_matrix: {
        Chicano_Soul: { role: "identity_anchor", vocal_bias: "bruised_subtext" },
        Contemporary_Freestyle: {
          role: "controlled_generational_bridge",
          vocal_bias: "breathy_romantic_urgency_with_playful_call_response",
        },
      },
    },
    truth_boundary: {
      original_mathematical_synthesis: true,
      uses_human_voice_recordings: false,
      uses_licensed_seed_voice: false,
      celebrity_similarity_targeting: false,
      full_lyric_intelligibility: "prototype",
      release_master_approved: false,
    },
  },
  release: {
    release_id: "LZR-RC-0001",
    title: "Sleep On The Floor",
    arrangement: {
      production_thesis:
        "A small-room testimony gains old-school freestyle motion, blooms into lush 90s R&B harmony, and ends with a current-generation rap-sung refusal.",
      sections: [
        { name: "cold_open", vocal_modes: ["modern_alt_rnb_pocket", "testimony_grit"], purpose: "Put the listener inside the room." },
        { name: "declaration_1", vocal_modes: ["soul_funk_upper_lift", "velvet_90s_harmony"], purpose: "Survival becomes power." },
        { name: "bridge", vocal_modes: ["modern_alt_rnb_pocket", "playful_rap_sung_switch"], purpose: "Memory becomes decision." },
        { name: "final_declaration", vocal_modes: ["soul_funk_upper_lift", "velvet_90s_harmony", "freestyle_electro_lift"], purpose: "Make the refusal feel earned." },
      ],
      status: {
        arrangement_locked: true,
        vocal_stack_locked: true,
        instrumental_render: "pending",
        full_lyric_vocal_render: "pending",
        mix_approval: "pending",
        master_approval: "pending",
      },
    },
    wardrobe: {
      era_name: "Testimony Armor",
      story:
        "She is exhausted, grieving, and still standing between danger and her children. The clothes read as protection built from ordinary life.",
      hero_look: {
        outerwear: "Toast-brown cropped leather moto jacket",
        top: "Smoke-black ribbed square-neck bodysuit",
        bottom: "Oxblood-black wide-leg utility trousers",
        footwear: "Black leather square-toe platform boots",
      },
      cover_art_direction: {
        setting: "Small carpeted room at night with amber streetlight",
        pose: "Seated low near the floor, gaze directly into camera",
        lighting: "Amber streetlight against a cool window shadow",
      },
    },
  },
};

function apiRoot() {
  const configured =
    import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || "";
  return configured.replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function pretty(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function LuzariaCreativeSystem() {
  const [data, setData] = useState<CreativeState>(FALLBACK);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${apiRoot()}/duo-soul/artist/luzaria/voice-system`, { signal: controller.signal }),
      fetch(`${apiRoot()}/duo-soul/artist/luzaria/releases/first/creative-system`, {
        signal: controller.signal,
      }),
    ])
      .then(async ([voiceResponse, releaseResponse]) => {
        if (!voiceResponse.ok || !releaseResponse.ok) {
          throw new Error("Luzaria creative system unavailable");
        }
        return Promise.all([voiceResponse.json(), releaseResponse.json()]);
      })
      .then(([voice, release]: [VoiceSystemResponse, CreativeReleaseResponse]) => {
        setData({ voice, release });
        setLive(true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLive(false);
      });
    return () => controller.abort();
  }, []);

  const featuredModes = useMemo(
    () =>
      [
        "testimony_grit",
        "velvet_90s_harmony",
        "freestyle_electro_lift",
        "modern_alt_rnb_pocket",
        "playful_rap_sung_switch",
        "soul_funk_upper_lift",
      ].filter((mode) => mode in data.voice.voice_model.performance_modes),
    [data.voice.voice_model.performance_modes],
  );

  const look = data.release.wardrobe.hero_look;

  return (
    <>
      <article className="luzaria-panel luzaria-panel--wide luzaria-creative-voice">
        <div className="luzaria-readiness-head">
          <div>
            <p className="luzaria-section-label">Original Mathematical Voice · {data.voice.voice_model_id}</p>
            <h2>{data.voice.vocal_north_star}</h2>
            <p>{data.voice.vocal_stack.north_star}</p>
          </div>
          <span className={`luzaria-creative-live ${live ? "is-live" : ""}`}>
            {live ? "LIVE CANON" : "CANON PREVIEW"}
          </span>
        </div>

        <div className="luzaria-voice-truth">
          <span>Original math synthesis</span>
          <strong>{data.voice.truth_boundary.original_mathematical_synthesis ? "YES" : "NO"}</strong>
          <span>Borrowed recordings</span>
          <strong>{data.voice.truth_boundary.uses_human_voice_recordings ? "YES" : "NO"}</strong>
          <span>Celebrity targeting</span>
          <strong>{data.voice.truth_boundary.celebrity_similarity_targeting ? "YES" : "NO"}</strong>
          <span>Final lyric master</span>
          <strong>{data.voice.truth_boundary.release_master_approved ? "APPROVED" : "NOT YET"}</strong>
        </div>

        <div className="luzaria-mode-grid">
          {featuredModes.map((mode) => {
            const detail = data.voice.vocal_stack.performance_modes[mode];
            return (
              <div key={mode}>
                <span>{pretty(mode)}</span>
                <strong>{detail?.purpose || "Approved Luzaria expression mode"}</strong>
                {detail?.traits?.slice(0, 3).map((trait) => <small key={trait}>{trait}</small>)}
              </div>
            );
          })}
        </div>

        <p className="luzaria-digest" title={data.voice.voice_model_digest}>
          {data.voice.voice_model_digest}
        </p>
      </article>

      <article className="luzaria-panel luzaria-panel--wide luzaria-generational-bridge">
        <p className="luzaria-section-label">Generational Sound Bridge</p>
        <div className="luzaria-bridge-grid">
          <div>
            <span>Home grammar</span>
            <h3>Chicano Soul</h3>
            <p>Warmth, bruised subtext, late-pocket emotion, and SGV cultural grounding.</p>
          </div>
          <div>
            <span>Old-school motion</span>
            <h3>Contemporary Freestyle</h3>
            <p>Electro bass, dry kick-clap urgency, synth answers, and romantic movement without retro parody.</p>
          </div>
          <div>
            <span>This generation</span>
            <h3>Alt-R&B + Rap-Sung Pocket</h3>
            <p>Whispered confessions, broken melodic lines, negative space, wit, and a fast return to full singing.</p>
          </div>
        </div>
      </article>

      <article className="luzaria-panel luzaria-panel--wide luzaria-arrangement">
        <p className="luzaria-section-label">First Release Arrangement · {data.release.release_id}</p>
        <h2>{data.release.title}</h2>
        <p className="luzaria-arrangement-thesis">{data.release.arrangement.production_thesis}</p>
        <div className="luzaria-section-timeline">
          {data.release.arrangement.sections.map((section) => (
            <div key={section.name}>
              <span>{pretty(section.name)}</span>
              <strong>{section.purpose}</strong>
              <small>{section.vocal_modes.map(pretty).join(" · ")}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="luzaria-panel luzaria-panel--wide luzaria-wardrobe">
        <div>
          <p className="luzaria-section-label">First Era Wardrobe</p>
          <h2>{data.release.wardrobe.era_name}</h2>
          <p>{data.release.wardrobe.story}</p>
        </div>
        <div className="luzaria-look-grid">
          {Object.entries(look).slice(0, 4).map(([key, value]) => (
            <div key={key}>
              <span>{pretty(key)}</span>
              <strong>{Array.isArray(value) ? value.join(" · ") : value}</strong>
            </div>
          ))}
        </div>
        <div className="luzaria-cover-direction">
          <span>Cover setting</span>
          <strong>{data.release.wardrobe.cover_art_direction.setting}</strong>
          <span>Pose</span>
          <strong>{data.release.wardrobe.cover_art_direction.pose}</strong>
          <span>Light</span>
          <strong>{data.release.wardrobe.cover_art_direction.lighting}</strong>
        </div>
      </article>
    </>
  );
}
