/**
 * Admin login page.
 *
 * Posts credentials to /api/admin/login.php and redirects to the
 * admin dashboard on success.
 *
 * @module pages/admin/Login
 * @license CC BY-NC-SA 4.0
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState('');
    const [busy, setBusy]         = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await client.post('/admin/login.php', { username, password });
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="admin-login">
            <h1>Admin Login</h1>
            <form onSubmit={handleSubmit} className="login-form">
                <label>
                    Username
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </label>
                <label>
                    Password
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </label>
                {error && <p className="form-error">{error}</p>}
                <button type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
            </form>
        </div>
    );
}
