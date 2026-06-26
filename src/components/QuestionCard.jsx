/**
 * Renders a single quiz question with its four option buttons.
 *
 * Shows a formula hint overlay when the question has one.
 * In practice mode the flag button is always visible; in exam mode it appears
 * after the question is answered.
 *
 * @module components/QuestionCard
 * @license CC BY-NC-SA 4.0
 */

import { useState } from 'react';
import OptionButton from './OptionButton';
import RichHtml     from './RichHtml';
import client from '../api/client';

/**
 * @param {{
 *   question: object,
 *   questionNumber: number,
 *   total: number,
 *   chosen: number|null,
 *   revealed: boolean,
 *   onAnswer: Function,
 * }} props
 */
export default function QuestionCard({ question, questionNumber, total, chosen, revealed, onAnswer }) {
    const [flagOpen, setFlagOpen] = useState(false);
    const [flagReason, setFlagReason] = useState('');
    const [flagSent, setFlagSent] = useState(false);

    const options = [question.option_a, question.option_b, question.option_c, question.option_d];
    const answered = chosen !== null;

    function handleFlag() {
        client.post('/flag.php', { question_id: question.id, reason: flagReason })
            .then(() => { setFlagSent(true); setFlagOpen(false); })
            .catch(() => {});
    }

    return (
        <div className="question-card">
            <p className="q-meta">Question {questionNumber} of {total}</p>

            {question.formula_hint && (
                <div className="formula-box">
                    <span className="formula-kicker">Formula</span>
                    <RichHtml html={question.formula_hint} />
                    {question.formula_note && (
                        <>
                            <span className="formula-kicker">Note</span>
                            <RichHtml html={question.formula_note} />
                        </>
                    )}
                </div>
            )}

            <RichHtml html={question.question_text} className="question-text" />

            <div className="options-list">
                {options.map((opt, i) => (
                    <OptionButton
                        key={i}
                        index={i}
                        text={opt}
                        disabled={answered}
                        isChosen={chosen === i}
                        isCorrect={question.correct_index === i}
                        revealed={revealed}
                        onClick={() => onAnswer(i)}
                    />
                ))}
            </div>

            {revealed && question.explanation && (
                <RichHtml html={question.explanation} className="explanation" />
            )}

            {/* Flag control */}
            {!flagSent && answered && (
                <div className="flag-area">
                    {!flagOpen ? (
                        <button className="flag-btn" onClick={() => setFlagOpen(true)} type="button">
                            Flag this question
                        </button>
                    ) : (
                        <div className="flag-form">
                            <input
                                type="text"
                                placeholder="Brief reason (optional)"
                                value={flagReason}
                                onChange={(e) => setFlagReason(e.target.value)}
                                maxLength={200}
                            />
                            <button onClick={handleFlag} type="button">Submit flag</button>
                            <button onClick={() => setFlagOpen(false)} type="button">Cancel</button>
                        </div>
                    )}
                </div>
            )}
            {flagSent && <p className="flag-sent">Question flagged — thank you.</p>}
        </div>
    );
}
