/**
 * Post-quiz topic-level breakdown.
 *
 * Groups answered questions by topic (derived from question data) and
 * shows scores sorted ascending so weakest areas appear first.
 *
 * Since topic info isn't embedded in individual questions returned by the
 * public API, this component receives the raw answered questions array
 * and a separate topicTitle string for single-topic quizzes.
 *
 * @module components/TopicBreakdown
 * @license CC BY-NC-SA 4.0
 */

import { gradeFromPercentage } from '../utils/grading';

/**
 * @param {{
 *   questions: object[],
 *   chosen: (number|null)[],
 *   topicTitle: string|null,
 * }} props
 */
export default function TopicBreakdown({ questions, chosen, topicTitle }) {
    if (!questions.length) return null;

    // For single-topic quizzes we just show one row
    const correct = chosen.filter((c, i) => c === questions[i].correct_index).length;
    const total   = questions.length;
    const pct     = Math.round((correct / total) * 100);
    const grade   = gradeFromPercentage(pct);

    return (
        <div className="breakdown-box">
            <h3>Score Breakdown</h3>
            <ul className="breakdown-list">
                <li>
                    <span className="breakdown-topic">{topicTitle || 'Overall'}</span>
                    <span className="breakdown-score">
                        {correct}/{total}
                        <span className="grade-pill" style={{ background: grade.colour }}>
                            {grade.label}
                        </span>
                    </span>
                </li>
            </ul>
        </div>
    );
}
