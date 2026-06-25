/**
 * Countdown bar showing days remaining to each Core paper exam.
 *
 * Fetches exam dates from GET /api/config.php on mount and updates
 * the display every minute.
 *
 * @module components/CountdownBar
 * @license CC BY-NC-SA 4.0
 */

import { useState, useEffect } from 'react';
import client from '../api/client';

function daysUntil(dateStr) {
    const exam  = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exam.setHours(0, 0, 0, 0);
    return Math.ceil((exam - today) / 86400000);
}

export default function CountdownBar() {
    const [dates, setDates] = useState({ exam_date_paper1: null, exam_date_paper2: null });

    useEffect(() => {
        client.get('/config.php').then((r) => setDates(r.data)).catch(() => {});
        const id = setInterval(() => {
            client.get('/config.php').then((r) => setDates(r.data)).catch(() => {});
        }, 60000);
        return () => clearInterval(id);
    }, []);

    const d1 = dates.exam_date_paper1 ? daysUntil(dates.exam_date_paper1) : null;
    const d2 = dates.exam_date_paper2 ? daysUntil(dates.exam_date_paper2) : null;

    if (d1 === null && d2 === null) return null;

    return (
        <div className="countdown-bar">
            {d1 !== null && (
                <span>
                    Core 1 exam:&nbsp;
                    <strong>{d1 > 0 ? `${d1} days` : d1 === 0 ? 'Today!' : 'Passed'}</strong>
                </span>
            )}
            {d1 !== null && d2 !== null && <span className="divider">|</span>}
            {d2 !== null && (
                <span>
                    Core 2 exam:&nbsp;
                    <strong>{d2 > 0 ? `${d2} days` : d2 === 0 ? 'Today!' : 'Passed'}</strong>
                </span>
            )}
        </div>
    );
}
