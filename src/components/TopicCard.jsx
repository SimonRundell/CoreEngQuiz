/**
 * Clickable card representing a topic or mock paper on the home screen.
 *
 * @module components/TopicCard
 * @license CC BY-NC-SA 4.0
 */

/**
 * @param {{ title: string, subtitle: string, questionCount: number|null, bestPct: number|null, onClick: Function }} props
 */
export default function TopicCard({ title, subtitle, questionCount, bestPct, onClick }) {
    return (
        <div className="card" onClick={onClick} role="button" tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick()}>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
            <div className="card-meta">
                {questionCount != null && (
                    <span className="q-count">{questionCount} questions</span>
                )}
                {bestPct != null && (
                    <span className="best-score">Best: {bestPct}%</span>
                )}
            </div>
        </div>
    );
}
