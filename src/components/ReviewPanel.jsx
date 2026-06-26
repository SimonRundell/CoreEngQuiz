/**
 * Wrong-answer review shown at the end of a quiz.
 *
 * Lists each incorrectly answered question, the student's choice,
 * the correct answer, and any stored explanation.
 *
 * @module components/ReviewPanel
 * @license CC BY-NC-SA 4.0
 */

import RichHtml from './RichHtml';

const LABELS = ['A', 'B', 'C', 'D'];

/**
 * @param {{ questions: object[], chosen: (number|null)[] }} props
 */
export default function ReviewPanel({ questions, chosen }) {
    const wrong = questions
        .map((q, i) => ({ q, i, c: chosen[i] }))
        .filter(({ q, c }) => c !== null && c !== q.correct_index);

    if (!wrong.length) {
        return <p className="review-perfect">Perfect score — nothing to review!</p>;
    }

    const opts = (q) => [q.option_a, q.option_b, q.option_c, q.option_d];

    return (
        <div className="review-panel">
            <h3>Review Wrong Answers ({wrong.length})</h3>
            {wrong.map(({ q, i, c }) => (
                <div className="review-item" key={i}>
                    <RichHtml html={q.question_text} className="review-q" />
                    <p>
                        <span className="review-wrong">
                            Your answer: {LABELS[c]}. {opts(q)[c]}
                        </span>
                    </p>
                    <p>
                        <span className="review-correct">
                            Correct: {LABELS[q.correct_index]}. {opts(q)[q.correct_index]}
                        </span>
                    </p>
                    {q.explanation && (
                        <RichHtml html={q.explanation} className="review-explanation" />
                    )}
                </div>
            ))}
        </div>
    );
}
