import spelling from './questions/spelling.json';
import consonantClasses from './questions/consonant-classes.json';
import clusters from './questions/clusters.json';
import finalConsonants from './questions/final-consonants.json';
import partsOfSpeech from './questions/parts-of-speech.json';
import sentenceStructure from './questions/sentence-structure.json';
import wordMeanings from './questions/word-meanings.json';
import proverbs from './questions/proverbs.json';
import registers from './questions/registers.json';
import reading from './questions/reading.json';
import type { Question } from './questionTypes';

export const QUESTION_BANK: Question[] = [
  ...(spelling as Question[]),
  ...(consonantClasses as Question[]),
  ...(clusters as Question[]),
  ...(finalConsonants as Question[]),
  ...(partsOfSpeech as Question[]),
  ...(sentenceStructure as Question[]),
  ...(wordMeanings as Question[]),
  ...(proverbs as Question[]),
  ...(registers as Question[]),
  ...(reading as Question[]),
];
