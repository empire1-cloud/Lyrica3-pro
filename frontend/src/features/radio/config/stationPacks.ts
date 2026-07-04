export interface StationPack {
  id: string;
  name: string;
  genre: string[];
  mood: string[];
  djId: string;
  color: string;
  description: string;
  bpmRange: [number, number];
  defaultBpm: number;
}

export const STATION_PACKS: StationPack[] = [
  {
    id: "soulfire_radio",
    name: "Soulfire Radio",
    genre: ["Chicano Soul", "West Coast", "Melodic Rap", "R&B"],
    mood: ["Emotional", "Late Night", "Honest", "Pain"],
    djId: "dj_soulfire",
    color: "from-fuchsia-500 to-pink-600",
    description: "Creator-owned music, real stories, real energy. West Coast late-night radio.",
    bpmRange: [70, 110],
    defaultBpm: 90,
  },
  {
    id: "rap_district",
    name: "Rap District",
    genre: ["Hip-Hop", "Trap", "Boom Bap", "Drill"],
    mood: ["Hype", "Hard", "Lyrical", "Street"],
    djId: "dj_barz",
    color: "from-fuchsia-500 to-green-600",
    description: "Hard bars, underground heat, and lyricism. The streets run this district.",
    bpmRange: [120, 170],
    defaultBpm: 145,
  },
  {
    id: "rnb_after_dark",
    name: "R&B After Dark",
    genre: ["R&B", "Soul", "Slow Jam", "Neo-Soul"],
    mood: ["Romantic", "Sensual", "Smooth", "Late Night"],
    djId: "dj_sancha",
    color: "from-purple-500 to-pink-600",
    description: "Smooth R&B, slow jams, and late-night dedications. Drop your feelings.",
    bpmRange: [60, 95],
    defaultBpm: 78,
  },
  {
    id: "pop_signal",
    name: "Pop Signal",
    genre: ["Pop", "Dance", "Electropop", "Synth"],
    mood: ["Energetic", "Fun", "Bright", "Catchy"],
    djId: "dj_nova",
    color: "from-cyan-400 to-blue-600",
    description: "Top hits, bright energy, and global pop waves. The signal is locked.",
    bpmRange: [100, 140],
    defaultBpm: 120,
  },
  {
    id: "old_school_vault",
    name: "Old School Vault",
    genre: ["Oldies", "Funk", "Doo-wop", "Soul", "Classic R&B"],
    mood: ["Nostalgic", "Groovy", "Timeless", "Classic"],
    djId: "dj_vault",
    color: "from-fuchsia-500 to-pink-600",
    description: "Classics, crate digger gems, and the sounds that built generations.",
    bpmRange: [75, 120],
    defaultBpm: 95,
  },
  {
    id: "country_roads",
    name: "Country Roads",
    genre: ["Country", "Americana", "Folk", "Bluegrass"],
    mood: ["Storytelling", "Honest", "Rural", "Heartland"],
    djId: "dj_rodeo",
    color: "from-green-600 to-emerald-800",
    description: "Dusty roads, honest stories, and the heart of the heartland.",
    bpmRange: [60, 130],
    defaultBpm: 85,
  },
  {
    id: "rock_room",
    name: "Rock Room",
    genre: ["Rock", "Alternative", "Indie", "Classic Rock"],
    mood: ["Raw", "Electric", "Loud", "Rebellious"],
    djId: "dj_riot",
    color: "to-pink-700 to-black",
    description: "Loud guitars, raw energy, and the spirit of rebellion.",
    bpmRange: [80, 160],
    defaultBpm: 120,
  },
  {
    id: "cultura_waves",
    name: "Cultura Waves",
    genre: ["Regional Mexicano", "Corridos", "Cumbia", "Latin Soul"],
    mood: ["Cultural", "Proud", "Roots", "Authentic"],
    djId: "dj_cultura",
    color: "to-pink-600 to-green-700",
    description: "Heritage, barrio soul, and the sound of la cultura.",
    bpmRange: [80, 140],
    defaultBpm: 110,
  },
  {
    id: "toxico_live",
    name: "Toxico Live",
    genre: ["Reggaeton", "Trap", "Dembow", "Party"],
    mood: ["Party", "Chaotic", "Viral", "Hype"],
    djId: "dj_toxico",
    color: "from-pink-500 to-pink-500",
    description: "We not healing tonight. Club energy, viral moments, chaos mode.",
    bpmRange: [90, 180],
    defaultBpm: 130,
  },
];

export function getStationPack(id: string): StationPack | undefined {
  return STATION_PACKS.find(s => s.id === id);
}
