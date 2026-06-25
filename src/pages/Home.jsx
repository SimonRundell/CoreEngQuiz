/**
 * Home page — topic selection grid and mock paper cards.
 *
 * Fetches topics and best scores from the API on mount.
 * Triggers a quiz start via the onStart callback passed from App.
 *
 * @module pages/Home
 * @license CC BY-NC-SA 4.0
 */

import { useEffect, useState } from 'react';
import TopicCard  from '../components/TopicCard';
import client     from '../api/client';

/**
 * @param {{
 *   sessionKey: string,
 *   practiceMode: boolean,
 *   onPracticeModeChange: Function,
 *   onStart: Function,
 * }} props
 */
export default function Home({ sessionKey, practiceMode, onPracticeModeChange, onStart }) {
    const [topics, setTopics]     = useState([]);
    const [scores, setScores]     = useState({});
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        client.get('/topics.php')
            .then((r) => {
                setTopics(r.data);
                return r.data;
            })
            .then((topicList) => {
                // Fetch best scores for all topics + mock papers in parallel
                const keys = [
                    ...topicList.map((t) => t.code),
                    'mock_paper1',
                    'mock_paper2',
                ];
                return Promise.all(
                    keys.map((k) =>
                        client.get('/scores.php', { params: { session: sessionKey, quiz: k } })
                            .then((r) => ({ key: k, data: r.data }))
                            .catch(() => ({ key: k, data: null }))
                    )
                );
            })
            .then((results) => {
                const map = {};
                results.forEach(({ key, data }) => { map[key] = data?.pct ?? null; });
                setScores(map);
            })
            .finally(() => setLoading(false));
    }, [sessionKey]);

    const paper1Topics = topics.filter((t) => t.paper === 1);
    const paper2Topics = topics.filter((t) => t.paper === 2);

    return (
        <div className="home-page">
            <div className="home-controls">
                <label className="mode-toggle">
                    <input
                        type="checkbox"
                        checked={practiceMode}
                        onChange={(e) => onPracticeModeChange(e.target.checked)}
                    />
                    Practice mode (instant feedback)
                </label>
            </div>

            {loading && <p className="loading">Loading topics…</p>}

            <section>
                <h2>Core Mock Papers</h2>
                <p className="section-note">30 questions balanced across all topics in each paper.</p>
                <div className="grid">
                    <TopicCard
                        title="Core Mock Paper 1"
                        subtitle="Paper 1 topics (Units 4–9)"
                        questionCount={null}
                        bestPct={scores['mock_paper1'] ?? null}
                        onClick={() => onStart({ type: 'mock', paper: 1, key: 'mock_paper1', title: 'Core Mock Paper 1' })}
                    />
                    <TopicCard
                        title="Core Mock Paper 2"
                        subtitle="Paper 2 topics (Units 1–3, 10–17)"
                        questionCount={null}
                        bestPct={scores['mock_paper2'] ?? null}
                        onClick={() => onStart({ type: 'mock', paper: 2, key: 'mock_paper2', title: 'Core Mock Paper 2' })}
                    />
                </div>
            </section>

            <section>
                <h2>Paper 1 — Core Engineering Principles (Units 4–9)</h2>
                <p className="section-note">10 random questions from each topic bank.</p>
                <div className="grid">
                    {paper1Topics.map((t) => (
                        <TopicCard
                            key={t.id}
                            title={t.title}
                            subtitle={null}
                            questionCount={t.question_count}
                            bestPct={scores[t.code] ?? null}
                            onClick={() => onStart({ type: 'topic', topicId: t.id, key: t.code, title: t.title })}
                        />
                    ))}
                </div>
            </section>

            <section>
                <h2>Paper 2 — Engineering Context, Systems &amp; Management (Units 1–3, 10–17)</h2>
                <p className="section-note">10 random questions from each topic bank.</p>
                <div className="grid">
                    {paper2Topics.map((t) => (
                        <TopicCard
                            key={t.id}
                            title={t.title}
                            subtitle={null}
                            questionCount={t.question_count}
                            bestPct={scores[t.code] ?? null}
                            onClick={() => onStart({ type: 'topic', topicId: t.id, key: t.code, title: t.title })}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
