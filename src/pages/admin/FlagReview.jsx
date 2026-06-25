/**
 * Admin flag review page.
 *
 * Lists all flagged questions and allows the admin to dismiss the flag
 * or deactivate the question entirely.
 *
 * @module pages/admin/FlagReview
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

const OPTS = (q) => [q.option_a, q.option_b, q.option_c, q.option_d];
const LABELS = ['A', 'B', 'C', 'D'];

export default function FlagReview() {
    const [flags,   setFlags]   = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    function load() {
        setLoading(true);
        client.get('/admin/flags.php')
            .then((r) => setFlags(r.data))
            .catch((err) => { if (err.response?.status === 401) navigate('/admin/login'); })
            .finally(() => setLoading(false));
    }

    useEffect(load, [navigate]);

    async function resolve(id, action) {
        await client.put(`/admin/flags.php?id=${id}`, { action }).catch(() => {});
        load();
    }

    if (loading) return <p className="loading">Loading flagged questions…</p>;

    return (
        <div className="admin-flags">
            <h1>Flag Review ({flags.length})</h1>
            {flags.length === 0 && <p>No flagged questions.</p>}
            {flags.map((q) => (
                <div key={q.id} className="flag-card">
                    <p className="flag-topic">{q.topic_title}</p>
                    <p className="review-q">{q.question_text}</p>
                    <ul>
                        {OPTS(q).map((o, i) => (
                            <li key={i} className={i === q.correct_index ? 'correct-opt' : ''}>
                                <strong>{LABELS[i]}.</strong> {o}
                            </li>
                        ))}
                    </ul>
                    {q.flag_reason && <p className="flag-reason"><em>Reason: {q.flag_reason}</em></p>}
                    <div className="flag-actions">
                        <button type="button" onClick={() => navigate(`/admin/questions?edit=${q.id}`)}>Edit</button>
                        <button type="button" onClick={() => resolve(q.id, 'dismiss')}>Dismiss Flag</button>
                        <button type="button" className="danger-btn" onClick={() => resolve(q.id, 'deactivate')}>Deactivate</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
