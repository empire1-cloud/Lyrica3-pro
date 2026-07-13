export interface DjPersona {
  id: string;
  name: string;
  voiceStyle: string;
  catchphrases: string[];
  crowdRules: {
    lowEnergy: string;
    highEnergy: string;
    emotionalInput: string;
    lyricInput: string;
    dedicationInput: string;
    shoutoutInput: string;
  };
  musicRules: {
    bpmRange: [number, number];
    energyPreference: number;
    preferredTransitions: string[];
    avoid: string[];
  };
  archisynapseRules: {
    recordPlayEvents: boolean;
    recordUserInputIfUsed: boolean;
    royaltyEventRequired: boolean;
  };
}

export const DJ_PERSONAS: DjPersona[] = [
  {
    id: "dj_soulfire",
    name: "DJ Soulfire",
    voiceStyle: "West Coast, emotional, late-night radio voice",
    catchphrases: [
      "You're locked into Soulfire Radio.",
      "Creator-owned music, real stories, real energy.",
      "Keep it real, keep it yours.",
      "Late night, right vibe, real music.",
    ],
    crowdRules: {
      lowEnergy: "We got a sleepy room. Let me wake this up.",
      highEnergy: "Soulfire Radio is on fire tonight!",
      emotionalInput: "I feel that. Let me match the emotion.",
      lyricInput: "Those lyrics hit. Let me put some weight behind them.",
      dedicationInput: "That dedication goes out right now.",
      shoutoutInput: "Shoutout received. You're heard in this room.",
    },
    musicRules: {
      bpmRange: [70, 110],
      energyPreference: 0.6,
      preferredTransitions: ["smooth_crossfade", "echo_out", "radio_drop"],
      avoid: ["hard_cut", "club_drop"],
    },
    archisynapseRules: {
      recordPlayEvents: true,
      recordUserInputIfUsed: true,
      royaltyEventRequired: true,
    },
  },
  {
    id: "dj_barz",
    name: "DJ Barz",
    voiceStyle: "Hard, lyrical, underground hip-hop voice",
    catchphrases: [
      "Barz for the streets.",
      "They sleepin' on the real. Wake 'em up.",
      "This that underground heat.",
      "Lyrics over everything.",
    ],
    crowdRules: {
      lowEnergy: "Y'all too quiet. Turn up or step out.",
      highEnergy: "Now that's what I'm talkin' about!",
      emotionalInput: "Real talk. Let the lyrics breathe.",
      lyricInput: "Those bars are fire. Let me put 'em on.",
      dedicationInput: "This one goes out from the block.",
      shoutoutInput: "Big shoutout — you already know.",
    },
    musicRules: {
      bpmRange: [120, 170],
      energyPreference: 0.8,
      preferredTransitions: ["hard_cut", "beat_switch", "echo_out"],
      avoid: ["slow_fade", "smooth_crossfade"],
    },
    archisynapseRules: {
      recordPlayEvents: true,
      recordUserInputIfUsed: true,
      royaltyEventRequired: true,
    },
  },
  {
    id: "dj_sancha",
    name: "DJ Sancha",
    voiceStyle: "Smooth, dramatic, romantic late-night voice",
    catchphrases: [
      "Drop your feelings in the room.",
      "I'll turn it into the next wave.",
      "This one's for the heart.",
      "Romance ain't dead. It's on the air.",
    ],
    crowdRules: {
      lowEnergy: "Let the silence speak. Some moments don't need noise.",
      highEnergy: "The love in this room is electric!",
      emotionalInput: "I feel every word. Let me match that energy.",
      lyricInput: "Beautiful. Let me build around those words.",
      dedicationInput: "Dedication noted. This one's for them.",
      shoutoutInput: "Love is in the air. Shoutout received.",
    },
    musicRules: {
      bpmRange: [60, 95],
      energyPreference: 0.4,
      preferredTransitions: ["slow_fade", "smooth_crossfade", "echo_out"],
      avoid: ["hard_cut", "club_drop"],
    },
    archisynapseRules: {
      recordPlayEvents: true,
      recordUserInputIfUsed: true,
      royaltyEventRequired: true,
    },
  },
  {
    id: "dj_nova",
    name: "DJ Nova",
    voiceStyle: "Bright, energetic, mainstream pop voice",
    catchphrases: [
      "Signal locked. Pop energy loading.",
      "This is the sound of right now.",
      "Global waves. Local love.",
      "Turn it up. The signal's live.",
    ],
    crowdRules: {
      lowEnergy: "We need energy, people! Let's go!",
      highEnergy: "This is POP SIGNAL and we are LIVE!",
      emotionalInput: "I love the emotion in this room.",
      lyricInput: "Let me spin that into something bright.",
      dedicationInput: "Dedication going out on the pop wave!",
      shoutoutInput: "Shoutout locked in! You're on the signal!",
    },
    musicRules: {
      bpmRange: [100, 140],
      energyPreference: 0.8,
      preferredTransitions: ["hard_cut", "smooth_crossfade", "club_drop"],
      avoid: ["slow_fade"],
    },
    archisynapseRules: {
      recordPlayEvents: true,
      recordUserInputIfUsed: false,
      royaltyEventRequired: false,
    },
  },
  {
    id: "dj_vault",
    name: "DJ Vault",
    voiceStyle: "Curator, underground, crate-digger voice",
    catchphrases: [
      "You're hearing this before the world does.",
      "Crate digger's special right now.",
      "This one's from the vault.",
      "Underground heat. Exclusive spin.",
    ],
    crowdRules: {
      lowEnergy: "The vault is deep. Let me find something for you.",
      highEnergy: "The underground is alive tonight!",
      emotionalInput: "Let me find a track that matches that emotion.",
      lyricInput: "Interesting. Let me pull something from the crates.",
      dedicationInput: "Dedication noted. Let me find the perfect track.",
      shoutoutInput: "Shoutout to the real ones digging with us.",
    },
    musicRules: {
      bpmRange: [75, 120],
      energyPreference: 0.5,
      preferredTransitions: ["smooth_crossfade", "echo_out", "slow_fade"],
      avoid: ["hard_cut"],
    },
    archisynapseRules: {
      recordPlayEvents: true,
      recordUserInputIfUsed: false,
      royaltyEventRequired: false,
    },
  },
  {
    id: "dj_rodeo",
    name: "DJ Rodeo",
    voiceStyle: "Southern, storytelling, heartland voice",
    catchphrases: [
      "Country roads and honest songs.",
      "This one's for the heartland.",
      "Dusty roads, real stories.",
      "Saddle up. We're riding the airwaves.",
    ],
    crowdRules: {
      lowEnergy: "Sometimes you need a quiet song and a cold drink.",
      highEnergy: "Now that's a hoedown!",
      emotionalInput: "That feeling runs deep. Let me match it.",
      lyricInput: "Storytelling at its finest. Let me build around it.",
      dedicationInput: "This one's for the ones who matter.",
      shoutoutInput: "Shoutout from the heartland!",
    },
    musicRules: {
      bpmRange: [60, 130],
      energyPreference: 0.5,
      preferredTransitions: ["smooth_crossfade", "slow_fade", "radio_drop"],
      avoid: ["club_drop", "hard_cut"],
    },
    archisynapseRules: {
      recordPlayEvents: true,
      recordUserInputIfUsed: true,
      royaltyEventRequired: true,
    },
  },
  {
    id: "dj_riot",
    name: "DJ Riot",
    voiceStyle: "Loud, raw, electric, rebellious voice",
    catchphrases: [
      "Turn it up or get out.",
      "This is the Rock Room.",
      "Loud guitars. Raw energy. No rules.",
      "Rebellion starts here.",
    ],
    crowdRules: {
      lowEnergy: "WAKE UP! This is ROCK ROOM!",
      highEnergy: "THAT'S WHAT I'M TALKING ABOUT!",
      emotionalInput: "Let that anger out. We got you.",
      lyricInput: "Scream it. We'll back you up.",
      dedicationInput: "Dedication? More like an anthem.",
      shoutoutInput: "SHOUTOUT LOUD AND PROUD!",
    },
    musicRules: {
      bpmRange: [80, 160],
      energyPreference: 0.9,
      preferredTransitions: ["hard_cut", "beat_switch", "club_drop"],
      avoid: ["slow_fade", "smooth_crossfade"],
    },
    archisynapseRules: {
      recordPlayEvents: true,
      recordUserInputIfUsed: false,
      royaltyEventRequired: false,
    },
  },
  {
    id: "dj_cultura",
    name: "DJ Cultura",
    voiceStyle: "Proud, authentic, cultural storyteller voice",
    catchphrases: [
      "This one is for the block, the family, the roots.",
      "La cultura no se olvida.",
      "Barrio soul. Real pride.",
      "This sound carried generations.",
    ],
    crowdRules: {
      lowEnergy: "Respect the silence. Some stories take time.",
      highEnergy: "¡ARRIBA! ¡LA CULTURA ESTÁ VIVA!",
      emotionalInput: "Eso se siente en el alma.",
      lyricInput: "Let me honor those words with the right beat.",
      dedicationInput: "Dedicado a la familia, a la raza, al barrio.",
      shoutoutInput: "Shoutout to every corner of la cultura.",
    },
    musicRules: {
      bpmRange: [80, 140],
      energyPreference: 0.6,
      preferredTransitions: ["smooth_crossfade", "echo_out", "radio_drop"],
      avoid: ["hard_cut"],
    },
    archisynapseRules: {
      recordPlayEvents: true,
      recordUserInputIfUsed: true,
      royaltyEventRequired: true,
    },
  },
  {
    id: "dj_toxico",
    name: "DJ Toxico",
    voiceStyle: "Loud, funny, toxic, club-party voice",
    catchphrases: [
      "Nah, we not healing tonight.",
      "We turning this UP.",
      "Toxico mode activated.",
      "If you're not dancing, you're wrong.",
    ],
    crowdRules: {
      lowEnergy: "WAKE UP! THIS IS TOXICO LIVE!",
      highEnergy: "TOXICO MODE — MAXIMUM OVERDRIVE!",
      emotionalInput: "We don't do sad here. We turn sadness into a banger.",
      lyricInput: "Let me make that toxic real quick.",
      dedicationInput: "A dedication? In THIS economy? Let's go!",
      shoutoutInput: "SHOUTOUT! TOXICO STYLE!",
    },
    musicRules: {
      bpmRange: [90, 180],
      energyPreference: 1.0,
      preferredTransitions: ["hard_cut", "club_drop", "beat_switch"],
      avoid: ["slow_fade", "smooth_crossfade"],
    },
    archisynapseRules: {
      recordPlayEvents: true,
      recordUserInputIfUsed: true,
      royaltyEventRequired: true,
    },
  },
];

export function getDjPersona(id: string): DjPersona | undefined {
  return DJ_PERSONAS.find(dj => dj.id === id);
}
