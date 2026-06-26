/**
 * Admin dashboard — summary stats and navigation links.
 *
 * @module pages/admin/Dashboard
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function Dashboard() {
    const [topics, setTopics]   = useState([]);
    const [flags,  setFlags]    = useState([]);
    const [error,  setError]    = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            client.get('/admin/topics.php'),
            client.get('/admin/flags.php'),
        ]).then(([t, f]) => {
            setTopics(t.data);
            setFlags(f.data);
        }).catch((err) => {
            if (err.response?.status === 401) navigate('/admin/login');
            else setError('Failed to load dashboard data');
        });
    }, [navigate]);

    const totalQ   = topics.reduce((s, t) => s + Number(t.question_count), 0);
    const flagCount = flags.length;

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>

            {error && <p className="form-error">{error}</p>}

            <div className="stat-cards">
                <div className="stat-card">
                    <span className="stat-num">{topics.length}</span>
                    <span className="stat-label">Topics</span>
                </div>
                <div className="stat-card">
                    <span className="stat-num">{totalQ}</span>
                    <span className="stat-label">Active Questions</span>
                </div>
                <div className="stat-card flagged">
                    <span className="stat-num">{flagCount}</span>
                    <span className="stat-label">Flagged</span>
                </div>
            </div>

            <section>
                <h2>Questions per Topic</h2>
                <table className="admin-table">
                    <thead><tr><th>Code</th><th>Title</th><th>Paper</th><th>Questions</th></tr></thead>
                    <tbody>
                        {topics.map((t) => (
                            <tr key={t.id}>
                                <td>{t.code}</td>
                                <td>{t.title}</td>
                                <td>{t.paper}</td>
                                <td>{t.question_count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}
