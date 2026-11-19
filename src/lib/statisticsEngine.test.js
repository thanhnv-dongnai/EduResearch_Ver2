import { describe, it, expect } from 'vitest';
import { runReliabilityAndValidity } from './statisticsEngine';

describe('runReliabilityAndValidity', () => {
  it('computes a Cronbach alpha close to 1 for perfectly correlated items', () => {
    // 10 người trả lời 2 câu hỏi của biến "STR" luôn di chuyển cùng nhau
    const likertQuestions = [
      { code: 'STR1', variable: 'STR', type: 'likert' },
      { code: 'STR2', variable: 'STR', type: 'likert' }
    ];
    const cleanResponses = Array.from({ length: 10 }, (_, i) => {
      const score = (i % 5) + 1;
      return { parsedAnswers: { STR1: score, STR2: score } };
    });

    const result = runReliabilityAndValidity(cleanResponses, likertQuestions, ['STR']);
    // runReliabilityAndValidity returns { alphaResults: [{ variable, name, itemCount, alpha, evaluation }], ... }
    const strAlpha = result.alphaResults?.find(r => r.variable === 'STR')?.alpha;

    expect(strAlpha).toBeGreaterThan(0.95);
  });
});
