/**
 * Linear progress bar for quiz question position.
 *
 * @module components/ProgressBar
 * @license CC BY-NC-SA 4.0
 */

/**
 * @param {{ current: number, total: number }} props
 */
export default function ProgressBar({ current, total }) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    return (
        <div className="progress-wrap" aria-label={`Question ${current} of ${total}`}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
    );
}
