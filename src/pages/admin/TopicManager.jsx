/**
 * Admin topic management page.
 *
 * Allows editing topic title, paper assignment, sort order and active status.
 * Also supports adding new topics.
 *
 * @module pages/admin/TopicManager
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

const BLANK = { code: '', title: '', paper: 1, sort_order: 0 };

export default function TopicManager() {
    const [topics,  setTopics]  = useState([]);
    const [editing, setEditing] = useState(null);  // topic id being edited
    const [newForm, setNewForm] = useState(BLANK);
    const [error,   setError]   = useState('');
    const navigate = useNavigate();

    function load() {
        client.get('/admin/topics.php')
            .then((r) => setTopics(r.data))
            .catch((err) => { if (err.response?.status === 401) navigate('/admin/login'); });
    }

    useEffect(load, [navigate]);

    async function saveEdit(t) {
        await client.put(`/admin/topics.php?id=${t.id}`, {
            title:      t.title,
            paper:      Number(t.paper),
            sort_order: Number(t.sort_order),
            active:     Number(t.active),
        }).catch(() => setError('Save failed'));
        setEditing(null);
        load();
    }

    async function createTopic() {
        if (!newForm.code || !newForm.title) { setError('Code and title required'); return; }
        await client.post('/admin/topics.php', {
            code:       newForm.code,
            title:      newForm.title,
            paper:      Number(newForm.paper),
            sort_order: Number(newForm.sort_order),
        }).catch(() => setError('Create failed'));
        setNewForm(BLANK);
        load();
    }

    function updateField(id, field, value) {
        setTopics((ts) => ts.map((t) => t.id === id ? { ...t, [field]: value } : t));
    }

    return (
        <div className="admin-topics">
            <h1>Topic Manager</h1>
            {error && <p className="form-error">{error}</p>}

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Code</th><th>Title</th><th>Paper</th>
                        <th>Sort</th><th>Active</th><th>Questions</th><th></th>
                    </tr>
                </thead>
                <tbody>
                    {topics.map((t) => editing === t.id ? (
                        <tr key={t.id}>
                            <td>{t.code}</td>
                            <td><input value={t.title} onChange={(e) => updateField(t.id, 'title', e.target.value)} /></td>
                            <td>
                                <select value={t.paper} onChange={(e) => updateField(t.id, 'paper', e.target.value)}>
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                </select>
                            </td>
                            <td><input type="number" value={t.sort_order} style={{ width: 50 }}
                                onChange={(e) => updateField(t.id, 'sort_order', e.target.value)} /></td>
                            <td>
                                <select value={t.active} onChange={(e) => updateField(t.id, 'active', e.target.value)}>
                                    <option value={1}>Yes</option>
                                    <option value={0}>No</option>
                                </select>
                            </td>
                            <td>{t.question_count}</td>
                            <td>
                                <button type="button" onClick={() => saveEdit(t)}>Save</button>
                                <button type="button" onClick={() => setEditing(null)}>Cancel</button>
                            </td>
                        </tr>
                    ) : (
                        <tr key={t.id} className={!t.active ? 'inactive-row' : ''}>
                            <td>{t.code}</td>
                            <td>{t.title}</td>
                            <td>{t.paper}</td>
                            <td>{t.sort_order}</td>
                            <td>{t.active ? 'Yes' : 'No'}</td>
                            <td>{t.question_count}</td>
                            <td><button type="button" onClick={() => setEditing(t.id)}>Edit</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <section className="new-topic">
                <h2>Add New Topic</h2>
                <div className="new-topic-form">
                    <label>Code <input value={newForm.code} onChange={(e) => setNewForm((f) => ({ ...f, code: e.target.value }))} /></label>
                    <label>Title <input value={newForm.title} onChange={(e) => setNewForm((f) => ({ ...f, title: e.target.value }))} /></label>
                    <label>Paper
                        <select value={newForm.paper} onChange={(e) => setNewForm((f) => ({ ...f, paper: e.target.value }))}>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                        </select>
                    </label>
                    <label>Sort order <input type="number" value={newForm.sort_order}
                        onChange={(e) => setNewForm((f) => ({ ...f, sort_order: e.target.value }))} /></label>
                    <button type="button" onClick={createTopic}>Add Topic</button>
                </div>
            </section>
        </div>
    );
}
