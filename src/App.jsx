/**
 * Root application component.
 *
 * Handles quiz state, theme toggle and routing between the student-facing
 * quiz pages and the admin area.
 *
 * @module App
 * @license CC BY-NC-SA 4.0
 */

import { useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import CountdownBar   from './components/CountdownBar';
import Home           from './pages/Home';
import QuizView       from './components/QuizView';
import Login          from './pages/admin/Login';
import Dashboard      from './pages/admin/Dashboard';
import QuestionEditor from './pages/admin/QuestionEditor';
import TopicManager   from './pages/admin/TopicManager';
import FlagReview     from './pages/admin/FlagReview';
import ConfigEditor   from './pages/admin/ConfigEditor';
import { useQuiz }    from './hooks/useQuiz';
import { useTimer }   from './hooks/useTimer';
import { useSession } from './hooks/useSession';
import client         from './api/client';
import './styles/main.css';

export default function App() {
    const sessionKey  = useSession();
    const [dark, setDark]             = useState(() => localStorage.getItem('theme') === 'dark');
    const [practiceMode, setPractice] = useState(true);
    const [topicTitle, setTopicTitle] = useState('');

    const { elapsed, start: startTimer, stop: stopTimer } = useTimer();

    const {
        quizState, questions, index, chosen, revealed,
        correct, quizKey, startQuiz, answerQuestion,
        nextQuestion, showResults, resetQuiz,
    } = useQuiz();

    const navigate = useNavigate();

    function toggleTheme() {
        const next = !dark;
        setDark(next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    }

    const handleStart = useCallback(async ({ type, topicId, paper, key, title }) => {
        const cfg      = await client.get('/config.php').then((r) => r.data).catch(() => ({}));
        const quizSize = Number(cfg.quiz_size) || 10;
        const mockSize = Number(cfg.mock_size) || 30;

        let qs;
        if (type === 'topic') {
            const r = await client.get('/questions.php', { params: { topic_id: topicId, n: quizSize } });
            qs = r.data;
        } else {
            const r = await client.get('/questions.php', { params: { paper, n: mockSize } });
            qs = r.data;
        }

        if (!qs.length) return;

        setTopicTitle(title);
        startQuiz(qs, key, practiceMode);
        startTimer();
        navigate('/quiz');
    }, [practiceMode, startQuiz, startTimer, navigate]);

    function handleBack() {
        resetQuiz();
        stopTimer();
        navigate('/');
    }

    return (
        <div className={`app-root${dark ? ' dark' : ''}`}>
            <header className="app-header">
                
                <CountdownBar />
                <div className="header-bar">
                    <img src="/favicon.png" alt="T Level Core Engineering Logo" className="header-logo" />
                    <h1>T Level Core Engineering Quiz</h1>
                    <div className="header-actions">
                        <button className="theme-btn" onClick={toggleTheme} type="button" aria-label="Toggle theme">
                            {dark ? '☀ Light' : '☽ Dark'}
                        </button>
                    </div>
                </div>
            </header>

            <main className="app-main">
                <Routes>
                    <Route path="/" element={
                        <Home
                            sessionKey={sessionKey}
                            practiceMode={practiceMode}
                            onPracticeModeChange={setPractice}
                            onStart={handleStart}
                        />
                    } />
                    <Route path="/quiz" element={
                        <QuizView
                            quizState={quizState}
                            questions={questions}
                            index={index}
                            chosen={chosen}
                            revealed={revealed}
                            correct={correct}
                            quizKey={quizKey}
                            practiceMode={practiceMode}
                            elapsed={elapsed}
                            sessionKey={sessionKey}
                            topicTitle={topicTitle}
                            onAnswer={answerQuestion}
                            onNext={nextQuestion}
                            onFinish={() => { stopTimer(); showResults(); }}
                            onBack={handleBack}
                        />
                    } />
                    <Route path="/admin/login"     element={<Login />} />
                    <Route path="/admin"           element={<Dashboard />} />
                    <Route path="/admin/questions" element={<QuestionEditor />} />
                    <Route path="/admin/topics"    element={<TopicManager />} />
                    <Route path="/admin/flags"     element={<FlagReview />} />
                    <Route path="/admin/config"    element={<ConfigEditor />} />
                </Routes>
            </main>
        </div>
    );
}
