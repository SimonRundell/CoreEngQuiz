/**
 * Central quiz state machine hook.
 *
 * Manages questions, current index, user answers, scoring and mode.
 * The hook is mode-agnostic: practice mode shows feedback per question,
 * exam mode withholds it until showResults() is called.
 *
 * @module hooks/useQuiz
 * @license CC BY-NC-SA 4.0
 */

import { useState, useCallback } from 'react';

/** @typedef {'idle'|'running'|'finished'} QuizState */

const INITIAL = {
    state: 'idle',
    questions: [],
    index: 0,
    chosen: [],       // chosen answer index per question (null = unanswered)
    revealed: [],     // whether feedback is shown per question
    correct: 0,
    quizKey: null,
    practiceMode: true,
};

/**
 * @returns {{
 *   quizState: QuizState,
 *   questions: object[],
 *   index: number,
 *   chosen: (number|null)[],
 *   revealed: boolean[],
 *   correct: number,
 *   quizKey: string|null,
 *   practiceMode: boolean,
 *   startQuiz: Function,
 *   answerQuestion: Function,
 *   nextQuestion: Function,
 *   showResults: Function,
 *   resetQuiz: Function,
 *   setPracticeMode: Function,
 * }}
 */
export function useQuiz() {
    const [quiz, setQuiz] = useState(INITIAL);

    const startQuiz = useCallback((questions, quizKey, practiceMode) => {
        setQuiz({
            state: 'running',
            questions,
            index: 0,
            chosen:   new Array(questions.length).fill(null),
            revealed: new Array(questions.length).fill(false),
            correct: 0,
            quizKey,
            practiceMode,
        });
    }, []);

    const answerQuestion = useCallback((answerIndex) => {
        setQuiz((prev) => {
            if (prev.state !== 'running') return prev;
            if (prev.chosen[prev.index] !== null) return prev; // already answered

            const newChosen   = [...prev.chosen];
            const newRevealed = [...prev.revealed];
            newChosen[prev.index] = answerIndex;

            const isCorrect = answerIndex === prev.questions[prev.index].correct_index;
            const newCorrect = prev.correct + (isCorrect ? 1 : 0);

            if (prev.practiceMode) {
                newRevealed[prev.index] = true;
            }

            return { ...prev, chosen: newChosen, revealed: newRevealed, correct: newCorrect };
        });
    }, []);

    const nextQuestion = useCallback(() => {
        setQuiz((prev) => {
            if (prev.index < prev.questions.length - 1) {
                return { ...prev, index: prev.index + 1 };
            }
            // Last question — auto-finish
            return { ...prev, state: 'finished', revealed: prev.revealed.map(() => true) };
        });
    }, []);

    const showResults = useCallback(() => {
        setQuiz((prev) => ({
            ...prev,
            state: 'finished',
            revealed: prev.revealed.map(() => true),
        }));
    }, []);

    const resetQuiz = useCallback(() => {
        setQuiz(INITIAL);
    }, []);

    const setPracticeMode = useCallback((val) => {
        setQuiz((prev) => ({ ...prev, practiceMode: val }));
    }, []);

    return {
        quizState:    quiz.state,
        questions:    quiz.questions,
        index:        quiz.index,
        chosen:       quiz.chosen,
        revealed:     quiz.revealed,
        correct:      quiz.correct,
        quizKey:      quiz.quizKey,
        practiceMode: quiz.practiceMode,
        startQuiz,
        answerQuestion,
        nextQuestion,
        showResults,
        resetQuiz,
        setPracticeMode,
    };
}
