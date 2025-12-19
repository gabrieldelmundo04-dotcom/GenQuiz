// @ts-nocheck
/// <reference types="jest" />
import { ensureMCQChoices, generateStructuredQuestions } from '../../lib/qg';

// callHf is spied on in tests where needed; keep module as-is

describe('ensureMCQChoices', () => {
  it('adds choices and includes the answer for mcq without choices', async () => {
    const questions = [{ type: 'mcq', question: 'What is 2+2?', answer: '4' }];
    const out = await ensureMCQChoices(questions);
    expect(out).toHaveLength(1);
    const q = out[0];
    expect(q.type).toBe('mcq');
    expect(Array.isArray(q.choices)).toBe(true);
    expect(q.choices.length).toBeGreaterThanOrEqual(4);
    expect(q.choices).toContain('4');
  });

  it('shuffles and truncates choices to 4 items', async () => {
    const questions = [{ type: 'mcq', question: 'Capital of France?', answer: 'Paris', choices: ['Paris', 'London'] }];
    const out = await ensureMCQChoices(questions);
    expect(out[0].choices.length).toBe(4);
  });
});

describe('generateStructuredQuestions fallback', () => {
  it('parses JSON when model returns array JSON', async () => {
    // Spy on callHf and make it return JSON text
    const mod = await import('../../lib/qg');
    const spy = jest.spyOn(mod as any, 'callHf').mockResolvedValue('[{"type":"short_answer","question":"Q?","answer":"A"}]');
    const res = await generateStructuredQuestions('some text', { mcq: true });
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    spy.mockRestore();
  });

  it('falls back to lines when non-JSON returned', async () => {
    const mod = await import('../../lib/qg');
    const spy = jest.spyOn(mod as any, 'callHf').mockResolvedValue('Line1\nLine2\nLine3');
    const res = await generateStructuredQuestions('some text', { mcq: true });
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].question).toContain('Line1');
    spy.mockRestore();
  });
});
