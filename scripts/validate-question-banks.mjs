import { readFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const directory = new URL('../src/data/questions/', import.meta.url);
const files = (await readdir(directory)).filter((file) => file.endsWith('.json')).sort();
const errors = [];
const ids = new Set();
let total = 0;
let todoCount = 0;
const categories = new Map();

for (const file of files) {
  const questions = JSON.parse(await readFile(new URL(file, directory), 'utf8'));
  if (!Array.isArray(questions)) { errors.push(`${file}: root must be an array`); continue; }
  const category = questions[0]?.category ?? file.replace('.json', '');
  categories.set(category, questions.length);
  if (questions.length < 30) errors.push(`${file}: only ${questions.length} questions; expected at least 30`);
  for (const level of [1, 2, 3]) {
    if (!questions.some((question) => question.difficulty === level)) errors.push(`${file}: missing difficulty ${level}`);
  }
  for (const question of questions) {
    total += 1;
    if (typeof question.todo === 'string' && question.todo.startsWith('TODO:')) todoCount += 1;
    if (question.type === 'true-false' && (!Array.isArray(question.choices) || !['ถูก', 'ผิด'].includes(question.answer) || !['ถูก', 'ผิด'].every((choice) => question.choices.includes(choice)))) errors.push(`${question.id}: true-false must use both ถูก/ผิด and a valid answer`);
    if (!question.id || ids.has(question.id)) errors.push(`${file}: missing or duplicate id ${question.id}`);
    ids.add(question.id);
    if (!question.question?.trim() || !question.explanation?.trim()) errors.push(`${question.id}: question/explanation must not be empty`);
    if (!Array.isArray(question.choices) || question.choices.length < 2) errors.push(`${question.id}: expected at least two choices`);
    if (![1, 2, 3].includes(question.difficulty)) errors.push(`${question.id}: difficulty must be 1, 2 or 3`);
    if (question.type === 'order') {
      for (const token of question.answer.split('|')) if (!question.choices.includes(token)) errors.push(`${question.id}: missing order token ${token}`);
    } else if (!question.choices.includes(question.answer)) errors.push(`${question.id}: answer not found in choices`);
    if (!['multiple-choice', 'fill-blank', 'true-false', 'matching', 'order'].includes(question.type)) errors.push(`${question.id}: unknown type ${question.type}`);
    if (!Array.isArray(question.tags)) errors.push(`${question.id}: tags must be an array`);
  }
}

if (files.length !== 10) errors.push(`expected 10 JSON banks; found ${files.length}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${total} questions in ${files.length} JSON banks.`);
  for (const [category, count] of categories) console.log(`- ${category}: ${count} questions`);
  console.log('All categories contain difficulty levels 1, 2 and 3.');
  console.log(`Teacher TODO flags: ${todoCount} question(s) require teacher review.`);
}
