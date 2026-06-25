/**
 * Admin question editor.
 *
 * Allows creating, editing and soft-deleting questions within a topic.
 * Includes a live preview panel showing the question as students see it.
 *
 * @module pages/admin/QuestionEditor
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import client                  from '../../api/client';

const ANSWER_LABELS = ['A', 'B', 'C', 'D'];

const BLANK = {
    id:            null,
    topic_id:      '',
    question_text: '',
    option_a:      '',
    option_b:      '',
    option_c:      '',
    option_d:      '',
    correct_index: '',
    formula_hint:  '',
    formula_note:  '',
    explanation:   '',
    active:        1,
};

export default function QuestionEditor() {
    const [topics,    setTopics]    = useState([]);
    const [questions, setQuestions] = useState([]);
    const [form,      setForm]      = useState(BLANK);
    const [error,     setError]     = useState('');
    const [success,   setSuccess]   = useState('');
    const [showPreview, setPreview] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        client.get('/admin/topics.php')
            .then((r) => setTopics(r.data))
            .catch((err) => { if (err.response?.status === 401) navigate('/admin/login'); });
    }, [navigate]);

    useEffect(() => {
        if (!form.topic_id) { setQuestions([]); return; }
        client.get('/admin/questions.php', { params: { topic_id: form.topic_id } })
            .then((r) => setQuestions(r.data))
            .catch(() => {});
    }, [form.topic_id]);

    function set(field, value) {
        setForm((f) => ({ ...f, [field]: value }));
        setError('');
        setSuccess('');
    }

    function loadQuestion(q) {
        setForm({
            id:            q.id,
            topic_id:      q.topic_id,
            question_text: q.question_text,
            option_a:      q.option_a,
            option_b:      q.option_b,
            option_c:      q.option_c,
            option_d:      q.option_d,
            correct_index: q.correct_index,
            formula_hint:  q.formula_hint  || '',
            formula_note:  q.formula_note  || '',
            explanation:   q.explanation   || '',
            active:        q.active,
        });
    }

    function validate() {
        if (!form.topic_id)      return 'Select a topic';
        if (!form.question_text.trim()) return 'Question text required';
        if (!form.option_a.trim() || !form.option_b.trim() ||
            !form.option_c.trim() || !form.option_d.trim()) return 'All four options required';
        if (form.correct_index === '' || form.correct_index === null) return 'Select the correct answer';
        return null;
    }

    async function save() {
        const err = validate();
        if (err) { setError(err); return; }

        const payload = {
            topic_id:      Number(form.topic_id),
            question_text: form.question_text.trim(),
            option_a:      form.option_a.trim(),
            option_b:      form.option_b.trim(),
            option_c:      form.option_c.trim(),
            option_d:      form.option_d.trim(),
            correct_index: Number(form.correct_index),
            formula_hint:  form.formula_hint.trim(),
            formula_note:  form.formula_note.trim(),
            explanation:   form.explanation.trim(),
            active:        form.active,
        };

        try {
            if (form.id) {
                await client.put(`/admin/questions.php?id=${form.id}`, payload);
            } else {
                await client.post('/admin/questions.php', payload);
            }
            setSuccess('Saved.');
            setForm({ ...BLANK, topic_id: form.topic_id });
            // Refresh list
            client.get('/admin/questions.php', { params: { topic_id: form.topic_id } })
                .then((r) => setQuestions(r.data));
        } catch (e) {
            setError(e.response?.data?.error || 'Save failed');
        }
    }

    async function softDelete() {
        if (!form.id) return;
        if (!confirm('Deactivate this question?')) return;
        try {
            await client.delete(`/admin/questions.php?id=${form.id}`);
            setSuccess('Question deactivated.');
            setForm({ ...BLANK, topic_id: form.topic_id });
            client.get('/admin/questions.php', { params: { topic_id: form.topic_id } })
                .then((r) => setQuestions(r.data));
        } catch (e) {
            setError('Delete failed');
        }
    }

    const opts = [form.option_a, form.option_b, form.option_c, form.option_d];

    return (
        <div className="admin-editor">
            <h1>Question Editor</h1>

            <div className="editor-layout">
                {/* Left: form */}
                <div className="editor-form">
                    <label>Topic
                        <select value={form.topic_id} onChange={(e) => set('topic_id', e.target.value)}>
                            <option value="">-- select topic --</option>
                            {topics.map((t) => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </label>

                    <label>Question text
                        <textarea rows={3} value={form.question_text}
                            onChange={(e) => set('question_text', e.target.value)} />
                    </label>

                    {['a', 'b', 'c', 'd'].map((letter, i) => (
                        <label key={letter}>Option {letter.toUpperCase()}
                            <input type="text" value={form[`option_${letter}`]}
                                onChange={(e) => set(`option_${letter}`, e.target.value)} />
                        </label>
                    ))}

                    <fieldset className="correct-picker">
                        <legend>Correct answer</legend>
                        {ANSWER_LABELS.map((lbl, i) => (
                            <button
                                key={i}
                                type="button"
                                className={`answer-pill ${Number(form.correct_index) === i ? 'selected' : ''}`}
                                onClick={() => set('correct_index', i)}
                            >{lbl}</button>
                        ))}
                    </fieldset>

                    <label>Formula hint (optional)
                        <input type="text" value={form.formula_hint}
                            onChange={(e) => set('formula_hint', e.target.value)} />
                    </label>

                    <label>Formula note (optional)
                        <input type="text" value={form.formula_note}
                            onChange={(e) => set('formula_note', e.target.value)} />
                    </label>

                    <label>Explanation (optional)
                        <textarea rows={2} value={form.explanation}
                            onChange={(e) => set('explanation', e.target.value)} />
                    </label>

                    {error   && <p className="form-error">{error}</p>}
                    {success && <p className="form-success">{success}</p>}

                    <div className="editor-actions">
                        <button type="button" onClick={save}>Save</button>
                        <button type="button" onClick={() => setPreview((p) => !p)}>
                            {showPreview ? 'Hide preview' : 'Preview'}
                        </button>
                        <button type="button" onClick={() => setForm({ ...BLANK, topic_id: form.topic_id })}>New</button>
                        {form.id && (
                            <button type="button" className="danger-btn" onClick={softDelete}>Deactivate</button>
                        )}
                    </div>
                </div>

                {/* Right: preview */}
                {showPreview && (
                    <div className="editor-preview">
                        <h3>Preview</h3>
                        {form.formula_hint && (
                            <div className="formula-box">
                                <strong>Formula: </strong>{form.formula_hint}
                                {form.formula_note && <span> — {form.formula_note}</span>}
                            </div>
                        )}
                        <p className="question-text">{form.question_text || '(Question text)'}</p>
                        {opts.map((opt, i) => (
                            <div key={i} className={`option-btn preview-opt ${Number(form.correct_index) === i ? 'correct' : ''}`}>
                                <span className="option-label">{ANSWER_LABELS[i]}</span>
                                {opt || `(Option ${ANSWER_LABELS[i]})`}
                            </div>
                        ))}
                        {form.explanation && <p className="explanation">{form.explanation}</p>}
                    </div>
                )}
            </div>

            {/* Question list for selected topic */}
            {questions.length > 0 && (
                <section className="question-list">
                    <h2>Questions in this topic ({questions.filter((q) => q.active).length} active)</h2>
                    <table className="admin-table">
                        <thead><tr><th>ID</th><th>Question</th><th>Active</th></tr></thead>
                        <tbody>
                            {questions.map((q) => (
                                <tr key={q.id} className={!q.active ? 'inactive-row' : ''}
                                    onClick={() => loadQuestion(q)} style={{ cursor: 'pointer' }}>
                                    <td>{q.id}</td>
                                    <td>{q.question_text.slice(0, 80)}{q.question_text.length > 80 ? '…' : ''}</td>
                                    <td>{q.active ? 'Yes' : 'No'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}
