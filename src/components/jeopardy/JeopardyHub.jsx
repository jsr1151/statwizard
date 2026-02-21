import React, { useMemo, useState } from 'react';
import { AlertTriangle, Trophy, Users, BookOpen, Shuffle, RefreshCcw } from 'lucide-react';
import { EPISODE_INDEX, EPISODE_MAP, valueRows } from '../../data/jeopardyEpisodes';

const USER_KEY = 'jeopardy_user';
const STATS_KEY = 'jeopardy_stats_v1';

const defaultStats = {
    gamesPlayed: 0,
    totalEndingMoney: 0,
    averageEndingMoney: 0,
    episodesCompleted: [],
    correct: 0,
    incorrect: 0,
    skipped: 0,
    learnQueue: []
};

const roundOrder = ['jeopardy', 'double', 'triple', 'final'];

const safeParse = (value, fallback) => {
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

const readStatsMap = () => safeParse(localStorage.getItem(STATS_KEY), {});

const getUserStats = (userName) => {
    const statsMap = readStatsMap();
    return statsMap[userName] || { ...defaultStats };
};

const saveUserStats = (userName, stats) => {
    const statsMap = readStatsMap();
    statsMap[userName] = stats;
    localStorage.setItem(STATS_KEY, JSON.stringify(statsMap));
};

const randomFrom = (array) => array[Math.floor(Math.random() * array.length)];

const selectRandomEpisode = ({ seasonFilter, tagFilter }) => {
    const bySeason = seasonFilter ? EPISODE_INDEX.filter((e) => e.season === Number(seasonFilter)) : EPISODE_INDEX;
    const byTag = tagFilter ? bySeason.filter((e) => e.tags.includes(tagFilter)) : bySeason;
    const pool = byTag.length > 0 ? byTag : EPISODE_INDEX;
    const selected = randomFrom(pool);
    return EPISODE_MAP[selected.id];
};

const pickCategories = (categories, count) => {
    if (categories.length <= count) {
        return categories;
    }
    const shuffled = [...categories].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

const createGameBoard = (episode, settings, learnQueue = []) => {
    const rounds = {
        jeopardy: pickCategories(episode.rounds.jeopardy, settings.categoryCount),
        double: settings.enableDouble ? pickCategories(episode.rounds.double, settings.categoryCount) : [],
        triple: settings.enableTriple ? pickCategories(episode.rounds.triple, Math.max(2, Math.floor(settings.categoryCount / 2))) : [],
        final: settings.enableFinal ? episode.rounds.final : null
    };

    if (settings.mode === 'learn' && learnQueue.length > 0) {
        const learnIds = new Set(learnQueue);
        rounds.jeopardy = rounds.jeopardy.map((category) => ({
            ...category,
            clues: category.clues.map((clue) => ({
                ...clue,
                highlighted: learnIds.has(clue.id)
            }))
        }));
    }

    return rounds;
};

const formatMoney = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const JeopardyHub = ({ darkMode }) => {
    const [userName, setUserName] = useState(localStorage.getItem(USER_KEY) || '');
    const [draftUserName, setDraftUserName] = useState(localStorage.getItem(USER_KEY) || '');
    const [settings, setSettings] = useState({
        mode: 'competition',
        method: 'replay',
        seasonFilter: '',
        tagFilter: '',
        episodeId: EPISODE_INDEX[0]?.id || '',
        categoryCount: 6,
        enableDouble: true,
        enableTriple: false,
        enableFinal: true,
        normalizeTripleStumper: false
    });
    const [players, setPlayers] = useState([{ id: 'p1', name: 'Player 1', score: 0 }]);
    const [selectedPlayerId, setSelectedPlayerId] = useState('p1');
    const [activeRound, setActiveRound] = useState('jeopardy');
    const [board, setBoard] = useState(null);
    const [activeClue, setActiveClue] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [wager, setWager] = useState('1000');
    const [sessionCounts, setSessionCounts] = useState({ correct: 0, incorrect: 0, skipped: 0 });
    const [sessionScore, setSessionScore] = useState(0);

    const stats = useMemo(() => (userName ? getUserStats(userName) : { ...defaultStats }), [userName, board, sessionCounts]);

    const saveLogin = () => {
        const normalized = draftUserName.trim();
        if (!normalized) {
            return;
        }
        localStorage.setItem(USER_KEY, normalized);
        setUserName(normalized);
    };

    const updateSetting = (key, value) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const addPlayer = () => {
        const nextId = `p${players.length + 1}`;
        const next = [...players, { id: nextId, name: `Player ${players.length + 1}`, score: 0 }];
        setPlayers(next);
        setSelectedPlayerId(nextId);
    };

    const updatePlayerName = (id, name) => {
        setPlayers((prev) => prev.map((player) => (player.id === id ? { ...player, name } : player)));
    };

    const startGame = () => {
        if (!userName) {
            return;
        }
        let episode = EPISODE_MAP[settings.episodeId] || EPISODE_MAP[EPISODE_INDEX[0].id];
        if (settings.method === 'random') {
            episode = selectRandomEpisode(settings);
        }

        const initialBoard = createGameBoard(episode, settings, stats.learnQueue);
        setBoard({
            episodeId: episode.id,
            season: episode.season,
            airDate: episode.airDate,
            rounds: initialBoard,
            completedClues: {}
        });
        setSessionCounts({ correct: 0, incorrect: 0, skipped: 0 });
        setSessionScore(0);
        setActiveRound('jeopardy');
        setActiveClue(null);
        setShowAnswer(false);
        setPlayers((prev) => prev.map((player) => ({ ...player, score: 0 })));
    };

    const selectClue = (round, category, clue) => {
        if (board?.completedClues?.[clue.id]) {
            return;
        }
        setActiveRound(round);
        setActiveClue({ round, categoryId: category.id, ...clue });
        setShowAnswer(false);
    };

    const markClue = (result) => {
        if (!activeClue || !board || !userName) {
            return;
        }

        const clueValue = activeClue.isDailyDouble ? Math.max(0, Number(wager) || activeClue.value) : activeClue.value;
        const scoreDelta = result === 'correct' ? clueValue : result === 'incorrect' ? -clueValue : 0;

        if (settings.mode === 'competition') {
            setPlayers((prev) => prev.map((player) => (
                player.id === selectedPlayerId ? { ...player, score: player.score + scoreDelta } : player
            )));
        } else {
            setSessionScore((prev) => prev + scoreDelta);
        }

        const nextCounts = {
            ...sessionCounts,
            [result]: sessionCounts[result] + 1
        };
        setSessionCounts(nextCounts);

        const nextBoard = {
            ...board,
            completedClues: {
                ...board.completedClues,
                [activeClue.id]: {
                    result,
                    round: activeClue.round,
                    value: clueValue,
                    tripleStumper: result === 'skipped'
                }
            }
        };
        setBoard(nextBoard);

        const existingStats = getUserStats(userName);
        const learnQueue = new Set(existingStats.learnQueue);
        if (result === 'incorrect' || result === 'skipped') {
            learnQueue.add(activeClue.id);
        }
        if (result === 'correct' && learnQueue.has(activeClue.id)) {
            learnQueue.delete(activeClue.id);
        }
        const nextStats = {
            ...existingStats,
            correct: existingStats.correct + (result === 'correct' ? 1 : 0),
            incorrect: existingStats.incorrect + (result === 'incorrect' ? 1 : 0),
            skipped: existingStats.skipped + (result === 'skipped' ? 1 : 0),
            learnQueue: [...learnQueue]
        };
        saveUserStats(userName, nextStats);

        setActiveClue(null);
    };

    const endGame = () => {
        if (!board || !userName) {
            return;
        }
        const endingMoney = settings.mode === 'competition'
            ? players.reduce((total, player) => total + player.score, 0)
            : sessionScore;

        const existingStats = getUserStats(userName);
        const gamesPlayed = existingStats.gamesPlayed + 1;
        const totalEndingMoney = existingStats.totalEndingMoney + endingMoney;
        const episodesCompleted = [...new Set([...existingStats.episodesCompleted, board.episodeId])];
        const nextStats = {
            ...existingStats,
            gamesPlayed,
            totalEndingMoney,
            averageEndingMoney: gamesPlayed > 0 ? Math.round(totalEndingMoney / gamesPlayed) : 0,
            episodesCompleted
        };

        saveUserStats(userName, nextStats);
        setBoard(null);
        setActiveClue(null);
    };

    const totalClues = board
        ? [...board.rounds.jeopardy, ...board.rounds.double, ...board.rounds.triple].reduce((total, category) => total + category.clues.length, 0)
        : 0;
    const solvedClues = board ? Object.keys(board.completedClues).length : 0;

    if (!userName) {
        return (
            <div className={`rounded-2xl border p-6 md:p-8 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className="text-3xl font-black mb-2">Trivia Party Login</h2>
                <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'} mb-6`}>Sign in to save Jeopardy stats and unlock Learn mode history.</p>
                <div className="flex flex-col md:flex-row gap-3">
                    <input
                        value={draftUserName}
                        onChange={(event) => setDraftUserName(event.target.value)}
                        placeholder="Enter display name"
                        className={`px-4 py-3 rounded-xl border w-full ${darkMode ? 'bg-slate-950 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
                    />
                    <button onClick={saveLogin} className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors">Log In</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className={`rounded-2xl border p-4 md:p-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black">Jeopardy Control Center</h2>
                        <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Logged in as <span className="font-bold">{userName}</span></p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div className={`rounded-xl px-3 py-2 border ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="font-semibold">Games</div>
                            <div className="text-lg font-black">{stats.gamesPlayed}</div>
                        </div>
                        <div className={`rounded-xl px-3 py-2 border ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="font-semibold">Avg Money</div>
                            <div className="text-lg font-black">{formatMoney(stats.averageEndingMoney)}</div>
                        </div>
                        <div className={`rounded-xl px-3 py-2 border ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="font-semibold">Correct</div>
                            <div className="text-lg font-black">{stats.correct}</div>
                        </div>
                        <div className={`rounded-xl px-3 py-2 border ${darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="font-semibold">Incorrect</div>
                            <div className="text-lg font-black">{stats.incorrect}</div>
                        </div>
                    </div>
                </div>
                <div className={`mt-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Episodes completed: {stats.episodesCompleted.length} • Skipped clues: {stats.skipped} • Learn queue: {stats.learnQueue.length}
                </div>
            </div>

            {!board && (
                <div className={`rounded-2xl border p-4 md:p-6 space-y-5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="grid md:grid-cols-2 gap-4">
                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Game Type</span>
                            <select value={settings.mode} onChange={(event) => updateSetting('mode', event.target.value)} className={`w-full rounded-xl border px-3 py-2 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`}>
                                <option value="competition">Competition</option>
                                <option value="practice">Practice</option>
                                <option value="learn">Learn</option>
                            </select>
                        </label>
                        <label className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider">Jeopardy Method</span>
                            <select value={settings.method} onChange={(event) => updateSetting('method', event.target.value)} className={`w-full rounded-xl border px-3 py-2 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`}>
                                <option value="replay">Replay</option>
                                <option value="random">Random</option>
                                <option value="custom">Custom</option>
                            </select>
                        </label>
                    </div>

                    {(settings.method === 'replay' || settings.method === 'custom') && (
                        <label className="space-y-2 block">
                            <span className="text-xs font-bold uppercase tracking-wider">Episode</span>
                            <select value={settings.episodeId} onChange={(event) => updateSetting('episodeId', event.target.value)} className={`w-full rounded-xl border px-3 py-2 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`}>
                                {EPISODE_INDEX.map((episode) => (
                                    <option key={episode.id} value={episode.id}>{episode.id} • Season {episode.season} • {episode.airDate}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    {settings.method === 'random' && (
                        <div className="grid md:grid-cols-3 gap-4">
                            <label className="space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Season Filter</span>
                                <input value={settings.seasonFilter} onChange={(event) => updateSetting('seasonFilter', event.target.value)} placeholder="e.g., 40" className={`w-full rounded-xl border px-3 py-2 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`} />
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Tag Filter</span>
                                <input value={settings.tagFilter} onChange={(event) => updateSetting('tagFilter', event.target.value)} placeholder="science, history..." className={`w-full rounded-xl border px-3 py-2 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`} />
                            </label>
                            <label className="space-y-2">
                                <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
                                <input type="number" min="2" max="6" value={settings.categoryCount} onChange={(event) => updateSetting('categoryCount', Number(event.target.value) || 6)} className={`w-full rounded-xl border px-3 py-2 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`} />
                            </label>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.enableDouble} onChange={(event) => updateSetting('enableDouble', event.target.checked)} /> Enable Double Jeopardy</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.enableTriple} onChange={(event) => updateSetting('enableTriple', event.target.checked)} /> Enable Triple Jeopardy</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.enableFinal} onChange={(event) => updateSetting('enableFinal', event.target.checked)} /> Add Final Jeopardy</label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.normalizeTripleStumper} onChange={(event) => updateSetting('normalizeTripleStumper', event.target.checked)} /> Triple Stumper = blue style</label>
                    </div>

                    {settings.mode === 'competition' && (
                        <div className={`rounded-xl border p-3 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold flex items-center gap-2"><Users className="w-4 h-4" /> Players / Teams</h3>
                                <button onClick={addPlayer} className="text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold">Add</button>
                            </div>
                            <div className="grid md:grid-cols-2 gap-2">
                                {players.map((player) => (
                                    <div key={player.id} className="flex items-center gap-2">
                                        <input
                                            value={player.name}
                                            onChange={(event) => updatePlayerName(player.id, event.target.value)}
                                            className={`w-full rounded-lg border px-2 py-1.5 text-sm ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`}
                                        />
                                        <span className="text-sm font-bold">{formatMoney(player.score)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Random mode uses a lightweight episode index ({EPISODE_INDEX.length} episodes) for faster selection before loading full clues.
                    </div>

                    <button onClick={startGame} className="w-full md:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-wider hover:bg-indigo-500 transition-colors">
                        Start Game
                    </button>
                </div>
            )}

            {board && (
                <div className={`rounded-2xl border p-4 md:p-6 space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-2xl font-black">Episode {board.episodeId}</h3>
                            <p className={`${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Season {board.season} • {board.airDate} • Solved {solvedClues}/{totalClues}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={endGame} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold">End Game</button>
                            <button onClick={startGame} className="px-4 py-2 rounded-lg border font-bold"><RefreshCcw className="w-4 h-4 inline mr-1" />Restart</button>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {roundOrder.map((round) => {
                            const available = round === 'final' ? Boolean(board.rounds.final) : board.rounds[round].length > 0;
                            if (!available) {
                                return null;
                            }
                            return (
                                <button
                                    key={round}
                                    onClick={() => setActiveRound(round)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold uppercase ${activeRound === round ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')}`}
                                >
                                    {round}
                                </button>
                            );
                        })}
                    </div>

                    {settings.mode === 'competition' && (
                        <div className="grid md:grid-cols-3 gap-3">
                            {players.map((player) => (
                                <button
                                    key={player.id}
                                    onClick={() => setSelectedPlayerId(player.id)}
                                    className={`text-left rounded-xl border px-3 py-2 ${selectedPlayerId === player.id ? 'border-indigo-500 bg-indigo-500/10' : (darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50')}`}
                                >
                                    <div className="font-bold">{player.name}</div>
                                    <div className="text-sm">{formatMoney(player.score)}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {activeRound !== 'final' && board.rounds[activeRound].length > 0 && (
                        <div className="overflow-auto">
                            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${board.rounds[activeRound].length}, minmax(160px, 1fr))` }}>
                                {board.rounds[activeRound].map((category) => (
                                    <div key={category.id} className={`rounded-xl border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                        <div className={`px-3 py-2 text-sm font-black uppercase tracking-wide ${darkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-700'}`}>{category.title}</div>
                                        <div className="p-2 grid gap-2">
                                            {category.clues.map((clue) => {
                                                const solved = board.completedClues[clue.id];
                                                const isStumper = solved?.tripleStumper;
                                                const stumperClass = isStumper && !settings.normalizeTripleStumper
                                                    ? 'bg-red-600/30 border-red-500 text-red-100'
                                                    : '';
                                                const learnClass = clue.highlighted ? 'ring-2 ring-amber-400/70' : '';
                                                return (
                                                    <button
                                                        key={clue.id}
                                                        onClick={() => selectClue(activeRound, category, clue)}
                                                        disabled={Boolean(solved)}
                                                        className={`rounded-lg border px-2 py-3 font-bold transition-all ${solved ? `opacity-70 ${stumperClass}` : (darkMode ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/30' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100')} ${learnClass}`}
                                                    >
                                                        {solved ? solved.result.toUpperCase() : formatMoney(clue.value)}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeRound === 'final' && board.rounds.final && (
                        <div className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="text-xs uppercase tracking-wider font-bold mb-2">Final Jeopardy</div>
                            <div className="font-black text-lg">{board.rounds.final.category}</div>
                            <div className="mt-2">{board.rounds.final.clue}</div>
                            <div className={`mt-3 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Answer: {board.rounds.final.answer}</div>
                        </div>
                    )}

                    {activeClue && (
                        <div className={`rounded-xl border p-4 space-y-3 ${activeClue.isDailyDouble ? 'animate-pulse border-amber-400' : ''} ${darkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                                {activeClue.isDailyDouble ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <BookOpen className="w-4 h-4" />}
                                {activeClue.isDailyDouble ? 'Double Jeopardy Cue' : 'Clue'}
                            </div>
                            <div className="text-lg font-semibold">{activeClue.question}</div>
                            {activeClue.isDailyDouble && (
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-semibold">Wager</label>
                                    <input type="number" min="0" value={wager} onChange={(event) => setWager(event.target.value)} className={`rounded-lg border px-2 py-1 w-36 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300'}`} />
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setShowAnswer((prev) => !prev)} className="px-3 py-2 rounded-lg border text-sm font-semibold">{showAnswer ? 'Hide Answer' : 'Reveal Answer'}</button>
                                <button onClick={() => markClue('correct')} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold">Right</button>
                                <button onClick={() => markClue('incorrect')} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold">Wrong</button>
                                <button onClick={() => markClue('skipped')} className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold">Skip / Triple Stumper</button>
                            </div>
                            {showAnswer && <div className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Answer: {activeClue.answer}</div>}
                        </div>
                    )}

                    <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Session totals: {sessionCounts.correct} correct, {sessionCounts.incorrect} incorrect, {sessionCounts.skipped} skipped.
                        {settings.mode !== 'competition' && ` Current money: ${formatMoney(sessionScore)}.`}
                    </div>
                </div>
            )}

            <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2 font-bold mb-2"><Shuffle className="w-4 h-4" /> Clue Library Status</div>
                <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Indexed episodes: {EPISODE_INDEX.length} • Cached clue sets: {Object.keys(EPISODE_MAP).length} • Value ladders: {Object.values(valueRows).length}
                </div>
                <div className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    If your backend DB has missing clues, keep this local cache as fallback while you repair ingestion.
                </div>
            </div>
        </div>
    );
};

export default JeopardyHub;
