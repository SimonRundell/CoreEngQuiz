/**
 * End-of-quiz results panel.
 *
 * Displays score, grade band and time taken. Posts the score to the
 * server and retrieves the session best to display.
 *
 * @module components/ResultsPanel
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import { gradeFromPercentage } from '../utils/grading';
import { formatTime } from '../hooks/useTimer';
import client from '../api/client';

/**
 * @param {{
 *   correct: number,
 *   total: number,
 *   elapsed: number,
 *   quizKey: string,
 *   practiceMode: boolean,
 *   sessionKey: string,
 *   onBack: Function,
 * }} props
 */
export default function ResultsPanel({ correct, total, elapsed, quizKey, practiceMode, sessionKey, onBack }) {
    const pct   = total > 0 ? Math.round((correct / total) * 100) : 0;
    const grade = gradeFromPercentage(pct);
    const [bestPct, setBestPct] = useState(null);

    useEffect(() => {
        client.post('/scores.php', {
            session_key:     sessionKey,
            quiz_key:        quizKey,
            correct,
            total,
            pct,
            elapsed_seconds: elapsed,
            practice_mode:   practiceMode ? 1 : 0,
        }).then(() => {
            return client.get('/scores.php', { params: { session: sessionKey, quiz: quizKey } });
        }).then((r) => {
            if (r.data) setBestPct(r.data.pct);
        }).catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="results-panel">
            <h2>Quiz Complete</h2>
            <div className="score-block">
                <span className="score-number">{correct} / {total}</span>
                <span className="score-pct">{pct}%</span>
                <span className="grade-badge" style={{ background: grade.colour }}>
                    {grade.label}
                </span>
            </div>
            <p className="time-taken">Time: {formatTime(elapsed)}</p>
            {bestPct !== null && (
                <p className="best-score-note">Your best score for this quiz: {bestPct}%</p>
            )}
            <button className="back-btn" onClick={onBack} type="button">Back to Topics</button>
        </div>
    );
}
