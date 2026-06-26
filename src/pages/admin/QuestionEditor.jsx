/**
 * Admin question editor.
 *
 * Allows creating, editing and soft-deleting questions within a topic.
 * Includes a live preview panel showing the question as students see it.
 *
 * The four long-text fields (question_text, formula_hint, formula_note,
 * explanation) use TipTap rich-text dialogs so admins can apply bold,
 * super/subscript, lists, etc.
 *
 * @module pages/admin/QuestionEditor
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import client                  from '../../api/client';
import RichTextDialog          from '../../components/RichTextDialog';
import RichHtml                from '../../components/RichHtml';

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

/** Strips HTML tags and entity refs; used for validation and list previews. */
function stripHtml(html) {
    return (html || '').replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

/**
 * Displays the current HTML value for a rich-text field alongside an edit
 * button that opens a RichTextDialog.
 *
 * @param {{ label: string, value: string, onChange: (html: string) => void }} props
 */
function RichField({ label, value, onChange }) {
    const [open, setOpen] = useState(false);
    const hasContent = !!stripHtml(value);

    return (
        <div className="rich-field">
            <div className="rich-field-header">
                <span className="rich-field-label">{label}</span>
                <button
                    type="button"
                    className="btn-edit"
                    onClick={() => setOpen(true)}
                    aria-label={`Edit ${label}`}
                >
                    &#9998;
                </button>
            </div>
            <div
                className={'rich-preview' + (!hasContent ? ' rich-preview--empty' : '')}
                dangerouslySetInnerHTML={{ __html: value || '<span class="rich-placeholder">(empty — click ✏ to edit)</span>' }}
            />
            {open && (
                <RichTextDialog
                    label={label}
                    value={value}
                    onSave={(html) => { onChange(html); setOpen(false); }}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}

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
        if (!form.topic_id)              return 'Select a topic';
        if (!stripHtml(form.question_text)) return 'Question text required';
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
            question_text: form.question_text,
            option_a:      form.option_a.trim(),
            option_b:      form.option_b.trim(),
            option_c:      form.option_c.trim(),
            option_d:      form.option_d.trim(),
            correct_index: Number(form.correct_index),
            formula_hint:  form.formula_hint,
            formula_note:  form.formula_note,
            explanation:   form.explanation,
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

                    <RichField
                        label="Question text"
                        value={form.question_text}
                        onChange={(html) => set('question_text', html)}
                    />

                    {['a', 'b', 'c', 'd'].map((letter) => (
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

                    <RichField
                        label="Formula hint (optional)"
                        value={form.formula_hint}
                        onChange={(html) => set('formula_hint', html)}
                    />

                    <RichField
                        label="Formula note (optional)"
                        value={form.formula_note}
                        onChange={(html) => set('formula_note', html)}
                    />

                    <RichField
                        label="Explanation (optional)"
                        value={form.explanation}
                        onChange={(html) => set('explanation', html)}
                    />

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
                        {stripHtml(form.formula_hint) && (
                            <div className="formula-box">
                                <span className="formula-kicker">Formula</span>
                                <RichHtml html={form.formula_hint} />
                                {stripHtml(form.formula_note) && (
                                    <>
                                        <span className="formula-kicker">Note</span>
                                        <RichHtml html={form.formula_note} />
                                    </>
                                )}
                            </div>
                        )}
                        <RichHtml html={form.question_text || '<em>(Question text)</em>'} className="question-text" />
                        {opts.map((opt, i) => (
                            <div key={i} className={`option-btn preview-opt ${Number(form.correct_index) === i ? 'correct' : ''}`}>
                                <span className="option-label">{ANSWER_LABELS[i]}</span>
                                {opt || `(Option ${ANSWER_LABELS[i]})`}
                            </div>
                        ))}
                        {stripHtml(form.explanation) && <RichHtml html={form.explanation} className="explanation" />}
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
                            {questions.map((q) => {
                                const plain = stripHtml(q.question_text);
                                return (
                                    <tr key={q.id} className={!q.active ? 'inactive-row' : ''}
                                        onClick={() => loadQuestion(q)} style={{ cursor: 'pointer' }}>
                                        <td>{q.id}</td>
                                        <td>{plain.length > 80 ? plain.slice(0, 80) + '…' : plain}</td>
                                        <td>{q.active ? 'Yes' : 'No'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </section>
            )}
        </div>
    );
}
