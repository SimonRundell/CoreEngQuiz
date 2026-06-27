/**
 * Admin question manager.
 *
 * Two-panel layout: the left panel browses and filters all questions for the
 * selected topic; the right panel is the editor form for the selected question
 * (or a blank form for a new question).
 *
 * @module pages/admin/QuestionManager
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import { useNavigate }         from 'react-router-dom';
import client                  from '../../api/client';
import RichTextDialog          from '../../components/RichTextDialog';
import RichHtml                from '../../components/RichHtml';
import { useConfirm }          from '../../components/ConfirmModal';

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

function stripHtml(html) {
    return (html || '').replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

function RichField({ label, value, onChange }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="rich-field">
            <div className="rich-field-header">
                <span className="rich-field-label">{label}</span>
                <button type="button" className="btn-edit" onClick={() => setOpen(true)} aria-label={`Edit ${label}`}>
                    &#9998;
                </button>
            </div>
            <div
                className={'rich-preview' + (!stripHtml(value) ? ' rich-preview--empty' : '')}
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

export default function QuestionManager() {
    const [topics,      setTopics]    = useState([]);
    const [questions,   setQuestions] = useState([]);
    const [topicId,     setTopicId]   = useState('');
    const [form,        setForm]      = useState(BLANK);
    const [filter,      setFilter]    = useState('active');
    const [showPreview, setPreview]   = useState(false);
    const [error,       setError]     = useState('');
    const [success,     setSuccess]   = useState('');
    const navigate = useNavigate();
    const { confirmModal, confirm } = useConfirm();

    useEffect(() => {
        client.get('/admin/topics.php')
            .then((r) => setTopics(r.data))
            .catch((err) => { if (err.response?.status === 401) navigate('/admin/login'); });
    }, [navigate]);

    useEffect(() => {
        if (!topicId) { setQuestions([]); return; }
        client.get('/admin/questions.php', { params: { topic_id: topicId } })
            .then((r) => setQuestions(r.data))
            .catch(() => {});
    }, [topicId]);

    function set(field, value) {
        setForm((f) => ({ ...f, [field]: value }));
        setError('');
        setSuccess('');
    }

    function startNew() {
        setForm({ ...BLANK, topic_id: topicId });
        setPreview(false);
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
        setPreview(false);
        setError('');
        setSuccess('');
    }

    function reloadList() {
        return client.get('/admin/questions.php', { params: { topic_id: topicId } })
            .then((r) => setQuestions(r.data));
    }

    function validate() {
        if (!form.topic_id)                return 'Select a topic';
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
            setForm({ ...BLANK, topic_id: topicId });
            reloadList();
        } catch (e) {
            setError(e.response?.data?.error || 'Save failed');
        }
    }

    async function deleteQuestion() {
        if (!form.id) return;
        if (!await confirm(`Permanently delete question #${form.id}? This cannot be undone.`, 'Delete')) return;
        try {
            await client.delete(`/admin/questions.php?id=${form.id}`);
            setSuccess('Question deleted.');
            setForm({ ...BLANK, topic_id: topicId });
            reloadList();
        } catch {
            setError('Delete failed');
        }
    }

    async function setActive(active) {
        if (!form.id) return;
        const label = active ? 'reactivate' : 'deactivate';
        const capLabel = label.charAt(0).toUpperCase() + label.slice(1);
        if (!await confirm(`${capLabel} this question?`, capLabel)) return;
        try {
            await client.put(`/admin/questions.php?id=${form.id}`, {
                topic_id:      Number(form.topic_id),
                question_text: form.question_text,
                option_a:      form.option_a,
                option_b:      form.option_b,
                option_c:      form.option_c,
                option_d:      form.option_d,
                correct_index: Number(form.correct_index),
                formula_hint:  form.formula_hint,
                formula_note:  form.formula_note,
                explanation:   form.explanation,
                active,
            });
            setSuccess(active ? 'Question reactivated.' : 'Question deactivated.');
            set('active', active);
            reloadList();
        } catch {
            setError('Update failed');
        }
    }

    const filtered = questions.filter((q) => {
        if (filter === 'active')   return  q.active;
        if (filter === 'inactive') return !q.active;
        return true;
    });

    const activeCount   = questions.filter((q) =>  q.active).length;
    const inactiveCount = questions.filter((q) => !q.active).length;

    const opts = [form.option_a, form.option_b, form.option_c, form.option_d];

    return (
        <div className="qmgr-outer">
            {confirmModal}
            <h1>Question Manager</h1>

            <div className="qmgr-layout">

                {/* ── Left: browser ──────────────────────────────────── */}
                <div className="qmgr-list">
                    <div className="qmgr-list-top">
                        <select
                            className="qmgr-topic-select"
                            value={topicId}
                            onChange={(e) => {
                                setTopicId(e.target.value);
                                setForm({ ...BLANK, topic_id: e.target.value });
                                setError('');
                                setSuccess('');
                            }}
                        >
                            <option value="">— select topic —</option>
                            {topics.map((t) => (
                                <option key={t.id} value={t.id}>{t.code} — {t.title}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="qmgr-new-btn"
                            disabled={!topicId}
                            onClick={startNew}
                        >
                            + New
                        </button>
                    </div>

                    {topicId && (
                        <div className="qmgr-filters">
                            {[
                                ['active',   `Active (${activeCount})`],
                                ['inactive', `Inactive (${inactiveCount})`],
                                ['all',      `All (${questions.length})`],
                            ].map(([val, label]) => (
                                <button
                                    key={val}
                                    type="button"
                                    className={'qmgr-filter-btn' + (filter === val ? ' active' : '')}
                                    onClick={() => setFilter(val)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    )}

                    <ul className="qmgr-questions">
                        {!topicId && (
                            <li className="qmgr-list-placeholder">Select a topic to browse questions.</li>
                        )}
                        {topicId && filtered.length === 0 && (
                            <li className="qmgr-list-placeholder">No {filter !== 'all' ? filter : ''} questions.</li>
                        )}
                        {filtered.map((q) => {
                            const plain = stripHtml(q.question_text);
                            const isSelected = form.id === q.id;
                            return (
                                <li
                                    key={q.id}
                                    className={[
                                        'qmgr-q-item',
                                        isSelected   ? 'is-selected' : '',
                                        !q.active    ? 'is-inactive' : '',
                                    ].filter(Boolean).join(' ')}
                                    onClick={() => loadQuestion(q)}
                                >
                                    <div className="qmgr-q-text">
                                        {plain.length > 110 ? plain.slice(0, 110) + '…' : plain || '(no text)'}
                                    </div>
                                    <div className="qmgr-q-meta">
                                        <span className="qmgr-q-id">#{q.id}</span>
                                        <span className="qmgr-q-correct">
                                            Correct: {ANSWER_LABELS[q.correct_index]}
                                        </span>
                                        {!q.active && <span className="qmgr-q-badge inactive">Inactive</span>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* ── Right: editor ──────────────────────────────────── */}
                <div className="qmgr-editor">
                    {!topicId ? (
                        <div className="qmgr-empty">
                            <p>Select a topic on the left to start editing questions.</p>
                        </div>
                    ) : (
                        <>
                            <div className="qmgr-editor-head">
                                <h2>
                                    {form.id ? `Editing #${form.id}` : 'New Question'}
                                </h2>
                                {form.id && (
                                    <span className={'qmgr-status-badge ' + (form.active ? 'active' : 'inactive')}>
                                        {form.active ? 'Active' : 'Inactive'}
                                    </span>
                                )}
                            </div>

                            <div className="editor-form">
                                <RichField
                                    label="Question text"
                                    value={form.question_text}
                                    onChange={(html) => set('question_text', html)}
                                />

                                {['a', 'b', 'c', 'd'].map((letter) => (
                                    <label key={letter}>Option {letter.toUpperCase()}
                                        <input
                                            type="text"
                                            value={form[`option_${letter}`]}
                                            onChange={(e) => set(`option_${letter}`, e.target.value)}
                                        />
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
                                    <button type="button" onClick={startNew}>New</button>
                                    {form.id && form.active  === 1  && (
                                        <button type="button" className="danger-btn" onClick={() => setActive(0)}>Deactivate</button>
                                    )}
                                    {form.id && form.active  === 0  && (
                                        <button type="button" className="reactivate-btn" onClick={() => setActive(1)}>Reactivate</button>
                                    )}
                                    {form.id && (
                                        <button type="button" className="delete-btn" onClick={deleteQuestion}>Delete</button>
                                    )}
                                </div>
                            </div>

                            {showPreview && (
                                <div className="editor-preview qmgr-preview">
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
                                    {stripHtml(form.explanation) && (
                                        <RichHtml html={form.explanation} className="explanation" />
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
