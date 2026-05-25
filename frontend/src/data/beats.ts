import { AssetType } from '../types';

export interface Beat {
  id: string;
  name: string;
  producer: string;
  bpm: number;
  genre: string;
  key: string;
  cover: string;
  audioUrl: string;
  badge?: string;
}

export const beatsDB: Record<string, Beat[]> = {
  'Trending': [
    {
      id: 'trap-808-anthem',
      name: 'Trap 808 Anthem',
      producer: 'Sonance AI',
      bpm: 145,
      genre: 'Trap',
      key: 'A Minor',
      cover: 'https://picsum.photos/seed/trap/400/400',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      badge: 'HOT'
    },
    {
      id: 'jersey-drill-party',
      name: 'Jersey Drill Party',
      producer: 'Sonance AI',
      bpm: 140,
      genre: 'Drill',
      key: 'C Major',
      cover: 'https://picsum.photos/seed/drill/400/400',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      badge: 'NEW'
    },
    {
      id: 'rio-drift-phonk',
      name: 'Rio Drift Phonk',
      producer: 'Sonance AI',
      bpm: 130,
      genre: 'Phonk',
      key: 'E Minor',
      cover: 'https://picsum.photos/seed/phonk/400/400',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
    }
  ],
  'Oldies': [
    {
      id: 'philly-love-train',
      name: 'Philly Love Train',
      producer: 'Retro Soul',
      bpm: 118,
      genre: 'Soul',
      key: 'Eb Major',
      cover: 'https://picsum.photos/seed/soul/400/400',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
    },
    {
      id: 'sunday-cruise-ballad',
      name: 'Sunday Cruise Ballad',
      producer: 'Lowrider Soul',
      bpm: 72,
      genre: 'Soul',
      key: 'G Minor',
      cover: 'https://picsum.photos/seed/lowrider/400/400',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      badge: 'CLASSIC'
    }
  ],
  'Hip-Hop': [
    {
      id: '90s-boom-bap',
      name: '90s Boom Bap',
      producer: 'Old School',
      bpm: 90,
      genre: 'Hip-Hop',
      key: 'D Minor',
      cover: 'https://picsum.photos/seed/boombap/400/400',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
    },
    {
      id: 'dre-style-g-funk',
      name: 'Dre-Style G-Funk',
      producer: 'West Coast',
      bpm: 95,
      genre: 'G-Funk',
      key: 'G Minor',
      cover: 'https://picsum.photos/seed/gfunk/400/400',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
    }
  ],
  'Cinematic': [
    {
      id: 'epic-cinematic',
      name: 'Epic Cinematic',
      producer: 'Trailer Score',
      bpm: 120,
      genre: 'Cinematic',
      key: 'A Minor',
      cover: 'https://picsum.photos/seed/cinematic/400/400',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
    }
  ]
};
