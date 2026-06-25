/**
 * Admin config editor — exam dates and quiz sizes.
 *
 * @module pages/admin/ConfigEditor
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function ConfigEditor() {
    const [cfg,     setCfg]     = useState({});
    const [success, setSuccess] = useState('');
    const [error,   setError]   = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Public endpoint is fine for reading config
        client.get('/config.php')
            .then((r) => setCfg(r.data))
            .catch(() => setError('Failed to load config'));
    }, [navigate]);

    function set(key, value) {
        setCfg((c) => ({ ...c, [key]: value }));
        setSuccess('');
    }

    async function save() {
        try {
            await client.put('/admin/config.php', cfg);
            setSuccess('Config saved.');
        } catch (err) {
            if (err.response?.status === 401) navigate('/admin/login');
            else setError('Save failed');
        }
    }

    return (
        <div className="admin-config">
            <h1>Config / Exam Dates</h1>

            <div className="config-form">
                <label>Paper 1 exam date
                    <input type="date" value={cfg.exam_date_paper1 || ''}
                        onChange={(e) => set('exam_date_paper1', e.target.value)} />
                </label>
                <label>Paper 2 exam date
                    <input type="date" value={cfg.exam_date_paper2 || ''}
                        onChange={(e) => set('exam_date_paper2', e.target.value)} />
                </label>
                <label>Questions per unit quiz
                    <input type="number" min={1} max={50} value={cfg.quiz_size || ''}
                        onChange={(e) => set('quiz_size', e.target.value)} />
                </label>
                <label>Questions per mock paper
                    <input type="number" min={1} max={100} value={cfg.mock_size || ''}
                        onChange={(e) => set('mock_size', e.target.value)} />
                </label>

                {error   && <p className="form-error">{error}</p>}
                {success && <p className="form-success">{success}</p>}

                <button type="button" onClick={save}>Save Config</button>
            </div>
        </div>
    );
}
