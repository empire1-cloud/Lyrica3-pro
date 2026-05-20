export interface FXPack {
  id: string;
  name: string;
  description: string;
  badge: string;
  audioUrl: string;
}

export const FX_PACKS: FXPack[] = [
  {
    id: 'vinyl-crackle',
    name: 'Vinyl Crackle',
    description: 'Authentic 1960s dust and static for that vintage warmth.',
    badge: 'VINTAGE',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 'tape-hiss',
    name: 'Tape Hiss',
    description: 'Analog saturation and subtle pitch wobble from a derelict deck.',
    badge: 'ANALOG',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 'street-ambience',
    name: 'Street Ambience',
    description: 'Distant sirens, chatter, and the low hum of the boulevard.',
    badge: 'URBAN',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 'rain-on-window',
    name: 'Rain on Window',
    description: 'Moody, rhythmic raindrops for that quiet storm atmosphere.',
    badge: 'MOODY',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 'lowrider-hydraulics',
    name: 'Lowrider Hydraulics',
    description: 'The iconic hiss and clank of a 64 Impala hitting the switches.',
    badge: 'CULTURE',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  }
];
