
export type FruitType = {
  id: string;
  name: string;
  color: number;
  insideColor: number;
  radius: number;
  score: number;
  isBomb?: boolean;
};

export const FRUIT_TYPES: FruitType[] = [
  { id: 'apple', name: 'Apple', color: 0xd92626, insideColor: 0xffffee, radius: 0.8, score: 1 },
  { id: 'orange', name: 'Orange', color: 0xff8800, insideColor: 0xffa022, radius: 0.9, score: 1 },
  { id: 'lemon', name: 'Lemon', color: 0xffdc00, insideColor: 0xfff0aa, radius: 0.7, score: 1 },
  { id: 'watermelon', name: 'Watermelon', color: 0x117722, insideColor: 0xf22c3e, radius: 1.2, score: 2 },
  { id: 'bomb', name: 'Bomb', color: 0x222222, insideColor: 0x000000, radius: 0.6, score: 0, isBomb: true }
];

export const GRAVITY = -15;
