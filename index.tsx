// @ts-nocheck
import React, { useState } from 'react';

type Question = { type: string; question: string; answer: string };

export default function Home(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [types, setTypes] = useState<{ [k: string]: boolean }>({ mcq: true, tf: true, enum: true, matching: true });

  async function handleParse(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!file) return alert('Please select a file first');
    setLoading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/parse', { method: 'POST', body: fd });
    const data = await res.json();
    setText(data.text || '');
    setLoading(false);
  }

  async function handleGenerate(): Promise<void> {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, types })
      });
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch (e) {
      console.error(e);
      alert('Generation failed');
    } finally {
      setLoading(false);
    }
  }

  function updateQuestion(index: number, patch: Partial<Question>) {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function exportCSV() {
    const rows = [['type', 'question', 'answer', 'choices']];
    for (const q of questions) {
      rows.push([q.type, q.question.replace(/\n/g, ' '), Array.isArray(q.answer) ? q.answer.join('|') : String(q.answer), q.choices ? q.choices.join('|') : '']);
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'genquiz.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>GenQuiz — Quiz Generator</h1>
      <form onSubmit={handleParse}>
        <input type="file" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] ?? null)} />
        <button type="submit">Upload & Extract</button>
      </form>

      <section style={{ marginTop: 20 }}>
        <h2>Extracted Text</h2>
        <textarea value={text} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)} rows={8} style={{ width: '100%' }} />
      </section>

      <section style={{ marginTop: 12 }}>
        <h3>Question types</h3>
        <label><input type="checkbox" checked={types.mcq} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTypes({ ...types, mcq: e.target.checked })} /> Multiple choice</label>
        <label style={{ marginLeft: 8 }}><input type="checkbox" checked={types.tf} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTypes({ ...types, tf: e.target.checked })} /> True/False</label>
        <label style={{ marginLeft: 8 }}><input type="checkbox" checked={types.enum} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTypes({ ...types, enum: e.target.checked })} /> Enumeration</label>
        <label style={{ marginLeft: 8 }}><input type="checkbox" checked={types.matching} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTypes({ ...types, matching: e.target.checked })} /> Matching</label>
      </section>

      <div style={{ marginTop: 12 }}>
        <button onClick={handleGenerate} disabled={loading}>Generate Questions</button>
      </div>

      <section style={{ marginTop: 20 }}>
        <h2>Generated Questions</h2>
        {loading && <p>Generating…</p>}
        {questions.map((q: Question, i: number) => (
          <div key={i} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{q.type}</strong>
              <button onClick={() => updateQuestion(i, { type: q.type === 'mcq' ? 'short_answer' : 'mcq' })}>Toggle MCQ</button>
            </div>
            <div>
              <textarea value={q.question} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuestion(i, { question: e.target.value })} rows={2} style={{ width: '100%' }} />
            </div>
            <div style={{ marginTop: 6 }}>
              <strong>Answer</strong>
              <input value={Array.isArray(q.answer) ? q.answer.join('|') : String(q.answer)} onChange={(e) => updateQuestion(i, { answer: e.target.value })} style={{ width: '100%' }} />
            </div>
            {q.type === 'mcq' && (
              <div style={{ marginTop: 6 }}>
                <strong>Choices</strong>
                {Array.isArray(q.choices) ? (
                  q.choices.map((c, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                      <input type="radio" name={`correct-${i}`} checked={String(q.answer) === String(c)} onChange={() => updateQuestion(i, { answer: c })} />
                      <input value={c} onChange={(e) => {
                        const newChoices = (q.choices || []).slice();
                        newChoices[idx] = e.target.value;
                        updateQuestion(i, { choices: newChoices });
                      }} style={{ flex: 1 }} />
                      <button onClick={() => {
                        const newChoices = (q.choices || []).slice();
                        newChoices.splice(idx, 1);
                        updateQuestion(i, { choices: newChoices });
                        if (String(q.answer) === String(c)) updateQuestion(i, { answer: newChoices[0] ?? 'TBD' });
                      }}>Remove</button>
                    </div>
                  ))
                ) : (
                  <div>No choices</div>
                )}
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => updateQuestion(i, { choices: [...(q.choices || []), 'New choice'] })}>Add choice</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {questions.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <button onClick={exportCSV}>Export CSV</button>
          </div>
        )}
      </section>
    </main>
  );
}
