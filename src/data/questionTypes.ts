export type QuestionCategory =
  | 'spelling'
  | 'consonant-classes'
  | 'clusters'
  | 'final-consonants'
  | 'parts-of-speech'
  | 'sentence-structure'
  | 'word-meanings'
  | 'proverbs'
  | 'registers'
  | 'reading';

export type QuestionType = 'multiple-choice' | 'fill-blank' | 'true-false' | 'matching' | 'order';

export interface Question {
  id: string;
  category: QuestionCategory;
  difficulty: 1 | 2 | 3;
  type: QuestionType;
  question: string;
  choices: string[];
  /** For `order`, tokens are separated by `|`; other types use the exact choice text. */
  answer: string;
  explanation: string;
  tags: string[];
  todo?: string;
}

export interface QuestionStats {
  correct: number;
  incorrect: number;
  streak: number;
}

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  spelling: 'การสะกดคำ',
  'consonant-classes': 'อักษรสามหมู่และวรรณยุกต์',
  clusters: 'คำควบกล้ำและอักษรนำ',
  'final-consonants': 'มาตราตัวสะกด',
  'parts-of-speech': 'ชนิดของคำ',
  'sentence-structure': 'ส่วนประกอบของประโยค',
  'word-meanings': 'คำพ้องและความหมาย',
  proverbs: 'สำนวน สุภาษิต คำพังเพย',
  registers: 'คำราชาศัพท์และระดับภาษา',
  reading: 'การอ่านจับใจความ',
};
