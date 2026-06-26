/**
 * Persistent admin navigation bar.
 *
 * Renders inside the site header whenever the current route is under /admin
 * (excluding the login page). Provides links to all admin sections and a
 * logout button.
 *
 * @module components/AdminNav
 * @license CC BY-NC-SA 4.0
 */

import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';

const NAV_LINKS = [
    { to: '/admin',           label: 'Dashboard', end: true },
    { to: '/admin/questions', label: 'Questions' },
    { to: '/admin/topics',    label: 'Topics' },
    { to: '/admin/flags',     label: 'Flags' },
    { to: '/admin/config',    label: 'Config' },
    { to: '/admin/users',     label: 'Users' },
];

export default function AdminNav() {
    const { pathname } = useLocation();
    const navigate     = useNavigate();

    if (!pathname.startsWith('/admin') || pathname === '/admin/login') return null;

    async function logout() {
        await client.post('/admin/logout.php').catch(() => {});
        navigate('/admin/login');
    }

    return (
        <nav className="admin-menu" aria-label="Admin navigation">
            <div className="admin-menu-links">
                {NAV_LINKS.map(({ to, label, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            'admin-menu-link' + (isActive ? ' active' : '')
                        }
                    >
                        {label}
                    </NavLink>
                ))}
            </div>
            <button onClick={logout} type="button" className="admin-menu-logout">
                Log out
            </button>
        </nav>
    );
}
