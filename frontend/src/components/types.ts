// Stub types — legacy studio components reference these
export interface MusicAsset {
  id: string;
  name: string;
  url?: string;
  src?: string;
}

export interface VocalAsset {
  id: string;
  name: string;
  url?: string;
  src?: string;
}

export interface SfxAsset {
  id: string;
  name: string;
  url?: string;
  src?: string;
}

export interface AmbientAsset {
  id: string;
  name: string;
  url?: string;
  src?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}
