
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  sources?: { uri: string; title: string }[];
}

export enum PetCategory {
  DOG = 'Dog',
  CAT = 'Cat',
  BIRD = 'Bird',
  FISH = 'Fish',
  EXOTIC = 'Exotic'
}

export interface PetProfile {
  name: string;
  type: PetCategory;
  age: string;
}
