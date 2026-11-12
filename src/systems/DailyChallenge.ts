import { hashSeed } from '../utils/seededRandom';

export function getBangkokDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function getDailySeed(date = new Date()): number {
  return hashSeed(`thai-word-defense:${getBangkokDateKey(date)}`);
}
