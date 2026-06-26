/**
 * Admin user management page.
 *
 * Lets the logged-in admin change their own username/password and
 * create or delete other admin accounts.
 *
 * @module pages/admin/UserManager
 * @license CC BY-NC-SA 4.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function UserManager() {
    const [users,     setUsers]     = useState([]);
    const [currentId, setCurrentId] = useState(null);
    const [pageError, setPageError] = useState('');
    const [notice,    setNotice]    = useState('');

    const [selfForm,  setSelfForm]  = useState({ new_username: '', new_password: '', confirm: '', current_password: '' });
    const [selfBusy,  setSelfBusy]  = useState(false);
    const [selfError, setSelfError] = useState('');

    const [newForm,  setNewForm]  = useState({ username: '', password: '', confirm: '' });
    const [newBusy,  setNewBusy]  = useState(false);
    const [newError, setNewError] = useState('');

    const navigate = useNavigate();

    const loadUsers = useCallback(async () => {
        try {
            const { data } = await client.get('/admin/users.php');
            setUsers(data.users);
            setCurrentId(data.current_id);
            const me = data.users.find((u) => u.id === data.current_id);
            if (me) setSelfForm((f) => ({ ...f, new_username: me.username }));
        } catch (err) {
            if (err.response?.status === 401) navigate('/admin/login');
            else setPageError('Failed to load users');
        }
    }, [navigate]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    function flash(msg) {
        setNotice(msg);
        setTimeout(() => setNotice(''), 4000);
    }

    async function handleSelfSubmit(e) {
        e.preventDefault();
        if (selfForm.new_password && selfForm.new_password !== selfForm.confirm) {
            setSelfError('New passwords do not match');
            return;
        }
        setSelfBusy(true);
        setSelfError('');
        try {
            await client.patch('/admin/users.php', {
                current_password: selfForm.current_password,
                new_username:     selfForm.new_username || undefined,
                new_password:     selfForm.new_password || undefined,
            });
            setSelfForm((f) => ({ ...f, current_password: '', new_password: '', confirm: '' }));
            flash('Credentials updated');
            loadUsers();
        } catch (err) {
            setSelfError(err.response?.data?.error || 'Update failed');
        } finally {
            setSelfBusy(false);
        }
    }

    async function handleCreateSubmit(e) {
        e.preventDefault();
        if (newForm.password !== newForm.confirm) {
            setNewError('Passwords do not match');
            return;
        }
        setNewBusy(true);
        setNewError('');
        try {
            await client.post('/admin/users.php', { username: newForm.username, password: newForm.password });
            flash(`Admin "${newForm.username}" created`);
            setNewForm({ username: '', password: '', confirm: '' });
            loadUsers();
        } catch (err) {
            setNewError(err.response?.data?.error || 'Create failed');
        } finally {
            setNewBusy(false);
        }
    }

    async function handleDelete(id, username) {
        if (!window.confirm(`Delete admin "${username}"? This cannot be undone.`)) return;
        try {
            await client.delete(`/admin/users.php?id=${id}`);
            flash(`Admin "${username}" deleted`);
            loadUsers();
        } catch (err) {
            setPageError(err.response?.data?.error || 'Delete failed');
        }
    }

    return (
        <div className="admin-page">
            <h1>User Management</h1>

            {pageError && <p className="form-error">{pageError}</p>}
            {notice    && <p className="form-success">{notice}</p>}

            {/* ── Own account ──────────────────────────────────────────── */}
            <section className="admin-section">
                <h2>Your Account</h2>
                <form onSubmit={handleSelfSubmit} className="editor-form" style={{ maxWidth: '420px' }}>
                    <label>
                        Username
                        <input
                            type="text"
                            value={selfForm.new_username}
                            onChange={(e) => setSelfForm((f) => ({ ...f, new_username: e.target.value }))}
                            required
                        />
                    </label>
                    <label>
                        New password <span className="field-hint">(leave blank to keep current)</span>
                        <input
                            type="password"
                            value={selfForm.new_password}
                            onChange={(e) => setSelfForm((f) => ({ ...f, new_password: e.target.value }))}
                        />
                    </label>
                    <label>
                        Confirm new password
                        <input
                            type="password"
                            value={selfForm.confirm}
                            onChange={(e) => setSelfForm((f) => ({ ...f, confirm: e.target.value }))}
                        />
                    </label>
                    <label>
                        Current password <span className="field-hint">(required to save any change)</span>
                        <input
                            type="password"
                            value={selfForm.current_password}
                            onChange={(e) => setSelfForm((f) => ({ ...f, current_password: e.target.value }))}
                            required
                        />
                    </label>
                    {selfError && <p className="form-error">{selfError}</p>}
                    <button type="submit" className="save-btn" disabled={selfBusy}>
                        {selfBusy ? 'Saving…' : 'Save Changes'}
                    </button>
                </form>
            </section>

            {/* ── All admins ───────────────────────────────────────────── */}
            <section className="admin-section">
                <h2>All Admin Accounts</h2>
                <table className="admin-table">
                    <thead>
                        <tr><th>Username</th><th></th></tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td>
                                    {u.username}
                                    {u.id === currentId && <span className="badge" style={{ marginLeft: '6px' }}>you</span>}
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="danger-btn"
                                        disabled={u.id === currentId || users.length <= 1}
                                        onClick={() => handleDelete(u.id, u.username)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h3 style={{ marginTop: '2rem' }}>Create New Admin</h3>
                <form onSubmit={handleCreateSubmit} className="editor-form" style={{ maxWidth: '420px' }}>
                    <label>
                        Username
                        <input
                            type="text"
                            value={newForm.username}
                            onChange={(e) => setNewForm((f) => ({ ...f, username: e.target.value }))}
                            required
                        />
                    </label>
                    <label>
                        Password <span className="field-hint">(min 6 characters)</span>
                        <input
                            type="password"
                            value={newForm.password}
                            onChange={(e) => setNewForm((f) => ({ ...f, password: e.target.value }))}
                            required
                        />
                    </label>
                    <label>
                        Confirm password
                        <input
                            type="password"
                            value={newForm.confirm}
                            onChange={(e) => setNewForm((f) => ({ ...f, confirm: e.target.value }))}
                            required
                        />
                    </label>
                    {newError && <p className="form-error">{newError}</p>}
                    <button type="submit" className="save-btn" disabled={newBusy}>
                        {newBusy ? 'Creating…' : 'Create Admin'}
                    </button>
                </form>
            </section>
        </div>
    );
}
