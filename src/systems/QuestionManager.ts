import type { Question, QuestionCategory } from '../data/questionTypes';
import { seededRandom } from '../utils/seededRandom';

interface QuestionManagerOptions {
  recentLimit?: number;
  wrongAnswerWeight?: number;
}

export class QuestionManager {
  private readonly questions: Question[];
  private readonly recent: string[] = [];
  private readonly wrongCounts = new Map<string, number>();
  private readonly correctCounts = new Map<string, number>();
  private readonly options: Required<QuestionManagerOptions>;
  private counter = 0;

  constructor(questions: Question[], options: QuestionManagerOptions = {}) {
    this.questions = questions;
    this.options = { recentLimit: options.recentLimit ?? 5, wrongAnswerWeight: options.wrongAnswerWeight ?? 2 };
  }

  next(category?: QuestionCategory, difficulty?: 1 | 2 | 3, seed?: number): Question {
    let candidates = this.questions.filter((question) => (!category || question.category === category) && (!difficulty || question.difficulty === difficulty));
    if (!candidates.length) candidates = this.questions.filter((question) => !category || question.category === category);
    if (!candidates.length) candidates = this.questions;
    if (!candidates.length) throw new Error('Question bank is empty');

    let fresh = candidates.filter((question) => !this.recent.includes(question.id));
    if (!fresh.length) {
      this.recent.length = 0;
      fresh = candidates;
    }

    const random = seededRandom(seed ?? (Date.now() + this.counter * 104729));
    this.counter += 1;
    const weights = fresh.map((question) => 1 + (this.wrongCounts.get(question.id) ?? 0) * this.options.wrongAnswerWeight);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = random() * totalWeight;
    let selected = fresh[fresh.length - 1] as Question;
    for (let index = 0; index < fresh.length; index += 1) {
      roll -= weights[index] ?? 0;
      if (roll <= 0) {
        selected = fresh[index] as Question;
        break;
      }
    }
    this.recent.push(selected.id);
    while (this.recent.length > this.options.recentLimit) this.recent.shift();
    return selected;
  }

  importWrongAnswers(wrongAnswers: Record<string, number>): void {
    for (const [questionId, count] of Object.entries(wrongAnswers)) {
      if (Number.isFinite(count) && count > 0) this.wrongCounts.set(questionId, count);
    }
  }

  recordAnswer(questionId: string, correct: boolean): void {
    const counts = correct ? this.correctCounts : this.wrongCounts;
    counts.set(questionId, (counts.get(questionId) ?? 0) + 1);
  }

  getWeakQuestions(limit = 10): Question[] {
    return [...this.questions]
      .filter((question) => (this.wrongCounts.get(question.id) ?? 0) > 0)
      .sort((left, right) => (this.wrongCounts.get(right.id) ?? 0) - (this.wrongCounts.get(left.id) ?? 0))
      .slice(0, limit);
  }

  getStats(): { correct: number; incorrect: number; byQuestion: Record<string, { correct: number; incorrect: number }> } {
    const ids = new Set([...this.correctCounts.keys(), ...this.wrongCounts.keys()]);
    const byQuestion: Record<string, { correct: number; incorrect: number }> = {};
    for (const id of ids) byQuestion[id] = { correct: this.correctCounts.get(id) ?? 0, incorrect: this.wrongCounts.get(id) ?? 0 };
    return {
      correct: [...this.correctCounts.values()].reduce((sum, value) => sum + value, 0),
      incorrect: [...this.wrongCounts.values()].reduce((sum, value) => sum + value, 0),
      byQuestion,
    };
  }
}

export function isAnswerCorrect(question: Question, answer: string): boolean {
  if (question.type === 'order') {
    return answer.replace(/\s+/g, '') === question.answer.replace(/\s+/g, '');
  }
  return answer.trim() === question.answer.trim();
}
