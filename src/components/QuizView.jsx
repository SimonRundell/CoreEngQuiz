/**
 * Quiz runner view.
 *
 * Orchestrates the active quiz: renders the question card, progress bar
 * and timer during the quiz; shows results + review at the end.
 *
 * Handles the Enter-key shortcut to advance after answering.
 *
 * @module components/QuizView
 * @license CC BY-NC-SA 4.0
 */

import { useEffect } from 'react';
import QuestionCard   from './QuestionCard';
import ProgressBar    from './ProgressBar';
import ResultsPanel   from './ResultsPanel';
import TopicBreakdown from './TopicBreakdown';
import ReviewPanel    from './ReviewPanel';
import { formatTime } from '../hooks/useTimer';

/**
 * @param {{
 *   quizState: string,
 *   questions: object[],
 *   index: number,
 *   chosen: (number|null)[],
 *   revealed: boolean[],
 *   correct: number,
 *   quizKey: string,
 *   practiceMode: boolean,
 *   elapsed: number,
 *   sessionKey: string,
 *   topicTitle: string,
 *   onAnswer: Function,
 *   onNext: Function,
 *   onFinish: Function,
 *   onBack: Function,
 * }} props
 */
export default function QuizView({
    quizState, questions, index, chosen, revealed,
    correct, quizKey, practiceMode, elapsed, sessionKey,
    topicTitle, onAnswer, onNext, onFinish, onBack,
}) {
    const isLast     = index === questions.length - 1;
    const answered   = chosen[index] !== null;
    const canAdvance = answered;

    // Enter key shortcut
    useEffect(() => {
        function onKey(e) {
            if (e.key !== 'Enter') return;
            if (!canAdvance) return;
            if (quizState === 'running') {
                if (isLast) onFinish();
                else onNext();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [canAdvance, isLast, onFinish, onNext, quizState]);

    if (quizState === 'finished') {
        return (
            <div className="quiz-view">
                <ResultsPanel
                    correct={correct}
                    total={questions.length}
                    elapsed={elapsed}
                    quizKey={quizKey}
                    practiceMode={practiceMode}
                    sessionKey={sessionKey}
                    onBack={onBack}
                />
                <TopicBreakdown questions={questions} chosen={chosen} topicTitle={topicTitle} />
                <ReviewPanel questions={questions} chosen={chosen} />
            </div>
        );
    }

    return (
        <div className="quiz-view">
            <div className="quiz-header">
                <h2 className="quiz-title">{topicTitle}</h2>
                <div className="timer" aria-live="off">{formatTime(elapsed)}</div>
            </div>

            <ProgressBar current={index + 1} total={questions.length} />

            <QuestionCard
                question={questions[index]}
                questionNumber={index + 1}
                total={questions.length}
                chosen={chosen[index]}
                revealed={revealed[index]}
                onAnswer={onAnswer}
            />

            <div className="quiz-controls">
                <button className="back-btn" onClick={onBack} type="button">Back</button>
                {canAdvance && (
                    <button className="next-btn" onClick={isLast ? onFinish : onNext} type="button">
                        {isLast ? (practiceMode ? 'Finish' : 'Submit') : 'Next'}
                    </button>
                )}
                {!practiceMode && !answered && isLast && (
                    <button className="next-btn" onClick={onFinish} type="button">Submit</button>
                )}
            </div>
        </div>
    );
}
