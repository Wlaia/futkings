import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaSave, FaArrowLeft, FaFlag, FaPlay, FaPause, FaPlus, FaCrown, FaStar, FaBolt, FaTimes, FaHandPaper, FaUsers, FaExpand, FaShieldAlt, FaBullseye, FaCalendarCheck } from 'react-icons/fa';
import SponsorCarousel from '../components/SponsorCarousel';
import SafeImage from '../components/SafeImage';
import { SPONSORS } from '../constants/sponsors';
import MatchLineupModal from '../components/MatchLineupModal';

interface Player {
    id: string;
    name: string;
    number: number;
    position: 'GOALKEEPER' | 'FIELD';
    isStarter?: boolean;
}

interface Team {
    id: string;
    name: string;
    logoUrl?: string;
    coachName?: string;
    directorName?: string;
    players: Player[];
}

interface Match {
    id: string;
    homeTeam: Team;
    awayTeam: Team;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    round: string;
    playerStats: any[];
    championshipId?: string;
    championship: {
        gameDuration: number;
    };
    startTime?: string;
}

// Secret Cards Types
type CardType = 'KING_PLAYER' | 'DOUBLE_GOAL' | 'GK_SURPRISE' | 'EXCLUSION' | 'PENALTY_FUTKINGS';

interface SecretCard {
    id: string;
    type: CardType;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    duration: number; // in seconds (120 = 2min)
}

interface ActiveCard {
    teamId: string;
    cardId: string; // unique instance id
    type: CardType;
    startTime: number; // timestamp
    endTime: number; // timestamp
    targetPlayerId?: string; // for KING_PLAYER or EXCLUSION
}

interface Sanction {
    id: string;
    playerId: string;
    teamId: string;
    type: 'YELLOW' | 'RED';
    startTime: number;
    endTime: number; // 2 minutes
}

const SECRET_CARDS: SecretCard[] = [
    { id: 'king', type: 'KING_PLAYER', label: 'Jogador King', description: 'Gols de um jogador escolhido valem 2 - 2 min', icon: <FaCrown />, color: 'bg-yellow-500', duration: 120 },
    { id: 'double_goal', type: 'DOUBLE_GOAL', label: 'Gol em Dobro', description: 'Todos os gols do time valem 2', icon: <FaStar />, color: 'bg-purple-500', duration: 120 },
    { id: 'exclusion', type: 'EXCLUSION', label: 'Exclusão', description: 'Você escolhe um adversário pra sair 2 min', icon: <FaTimes />, color: 'bg-red-500', duration: 120 },
    { id: 'gk_surprise', type: 'GK_SURPRISE', label: 'Goleiro Surpresa', description: 'Jogador de linha vai pro gol', icon: <FaHandPaper />, color: 'bg-orange-500', duration: 120 },
    { id: 'penalty', type: 'PENALTY_FUTKINGS', label: 'Pênalti FutKings', description: 'Shootout 1x1 imediato', icon: <FaBullseye />, color: 'bg-indigo-500', duration: 120 },
];

const MatchSheet: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [match, setMatch] = useState<Match | null>(null);
    const [matchStatus, setMatchStatus] = useState('SCHEDULED');

    // Timer State
    // Timer State
    const [time, setTime] = useState(0); // Count UP
    const [period, setPeriod] = useState(1); // 1st or 2nd Half
    const [firstHalfFouls, setFirstHalfFouls] = useState<Record<string, number>>({});
    const [isRunning, setIsRunning] = useState(false);
    const timerRef = useRef<any>(null);
    const [extraTime, setExtraTime] = useState(0); // in minutes

    // Stats State
    const [stats, setStats] = useState<Record<string, { goals: number, assists: number, yellow: number, red: number, fouls: number, saves: number, conceded: number }>>({});
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    // Cards & Sanctions State
    const [activeCards, setActiveCards] = useState<ActiveCard[]>([]);
    const [activeSanctions, setActiveSanctions] = useState<Sanction[]>([]);

    const [isCardModalOpen, setIsCardModalOpen] = useState(false);
    const [selectedTeamForCard, setSelectedTeamForCard] = useState<string | null>(null);
    const [cardStep, setCardStep] = useState<'SELECT_CARD' | 'SELECT_PLAYER'>('SELECT_CARD');
    const [selectedCardType, setSelectedCardType] = useState<SecretCard | null>(null);

    // Director Goals State
    const [directorGoals, setDirectorGoals] = useState<Record<string, number>>({});
    const [isDirectorModalOpen, setIsDirectorModalOpen] = useState(false);
    const [selectedDirectorTeamId, setSelectedDirectorTeamId] = useState<string | null>(null);
    const [isLineupModalOpen, setIsLineupModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Shootout State
    const [isShootoutModalOpen, setIsShootoutModalOpen] = useState(false);
    const [shootoutHistory, setShootoutHistory] = useState<{ home: ('GOAL' | 'MISS')[], away: ('GOAL' | 'MISS')[] }>({ home: [], away: [] });

    const homeShootoutScore = shootoutHistory.home.filter(r => r === 'GOAL').length;
    const awayShootoutScore = shootoutHistory.away.filter(r => r === 'GOAL').length;

    // Date Modal State
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [newDate, setNewDate] = useState('');

    // Derived State for Scores
    const calculateTeamScore = (teamPlayers: Player[], teamId: string) => {
        const playerGoals = teamPlayers.reduce((acc, p) => acc + (stats[p.id]?.goals || 0), 0);
        return playerGoals + (directorGoals[teamId] || 0);
    };

    const homeScore = match ? calculateTeamScore(match.homeTeam.players, match.homeTeam.id) : 0;
    const awayScore = match ? calculateTeamScore(match.awayTeam.players, match.awayTeam.id) : 0;

    useEffect(() => {
        fetchMatch();
        return () => stopTimer();
    }, [id]);



    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Timer and Expiry Logic (Cards & Sanctions)
    useEffect(() => {
        if (isRunning) {
            timerRef.current = setInterval(() => {
                setTime(prev => {
                    const nextTime = prev + 1;
                    const maxTime = (20 + extraTime) * 60; // 20 min + extra

                    if (nextTime >= maxTime) {
                        setIsRunning(false);
                        return maxTime; // Cap at max time
                    }
                    return nextTime;
                });

                const now = Date.now();
                // Check for expired cards
                setActiveCards(prev => prev.filter(card => card.endTime > now));
                // Check for expired sanctions
                setActiveSanctions(prev => prev.filter(sanction => sanction.endTime > now));
            }, 1000);
        } else {
            stopTimer();
        }
        return () => stopTimer();
    }, [isRunning, extraTime]); // Added extraTime dependency

    const toggleTimer = async () => {
        if (matchStatus === 'COMPLETED') return; // Prevent unlocking

        // Check if time is already at max
        const maxTime = (20 + extraTime) * 60;
        if (time >= maxTime) return;

        const newIsRunning = !isRunning;

        if (newIsRunning && matchStatus === 'SCHEDULED') {
            if (!match?.startTime) {
                setNewDate('');
                setIsDateModalOpen(true);
                return;
            }

            setMatchStatus('LIVE');
            try {
                await api.put(`/matches/${id}`, {
                    status: 'LIVE',
                    homeScore,
                    awayScore
                });
            } catch (error) {
                console.error("Error starting match:", error);
            }
        }

        setIsRunning(newIsRunning);
        setUnsavedChanges(true); // Ensure FanZone gets the exact paused/resumed time
    };

    const handleDateSave = async () => {
        if (!newDate) return;
        try {
            await api.put(`/matches/${id}`, {
                startTime: new Date(newDate).toISOString()
            });
            alert('Data definida com sucesso! Agora você pode iniciar o cronômetro.');
            setIsDateModalOpen(false);
            fetchMatch();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar data.');
        }
    };

    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const addExtraTime = () => {
        setExtraTime(prev => prev + 1);
    };

    const startNextPeriod = () => {
        // Snapshot fouls from 1st half
        if (period === 1 && match) {
            setFirstHalfFouls({
                [match.homeTeam.id]: calculateTeamFouls(match.homeTeam.id),
                [match.awayTeam.id]: calculateTeamFouls(match.awayTeam.id)
            });
        }
        setPeriod(2);
        setTime(0);
        setExtraTime(0);
        setIsRunning(false);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatCardTimer = (endTime: number) => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const fetchMatch = async () => {
        try {
            const response = await api.get(`/matches/${id}`);
            if (response.data) {
                const m = response.data;
                setMatch(m);
                setMatchStatus(m.status);

                const initialStats: any = {};
                [...(m.homeTeam.players || []), ...(m.awayTeam.players || [])].forEach((p: Player) => {
                    initialStats[p.id] = { goals: 0, assists: 0, yellow: 0, red: 0, fouls: 0, saves: 0, conceded: 0 };
                });

                let totalPlayerGoalsHome = 0;
                let totalPlayerGoalsAway = 0;

                if (Array.isArray(m.playerStats)) {
                    m.playerStats.forEach((s: any) => {
                        if (initialStats[s.playerId]) {
                            initialStats[s.playerId] = {
                                goals: s.goals,
                                assists: s.assists,
                                yellow: s.yellowCards,
                                red: s.redCards,
                                fouls: s.fouls || 0,
                                saves: s.saves || 0,
                                conceded: s.goalsConceded || 0
                            };

                            // Count player goals to determine director goals residue
                            const player = m.homeTeam.players.find((p: Player) => p.id === s.playerId);
                            if (player) {
                                totalPlayerGoalsHome += s.goals;
                            } else {
                                totalPlayerGoalsAway += s.goals;
                            }
                        }
                    });
                }
                setStats(initialStats);

                // Initialize Director Goals (Residue)
                const homeDirectorGoals = (m.homeScore || 0) - totalPlayerGoalsHome;
                const awayDirectorGoals = (m.awayScore || 0) - totalPlayerGoalsAway;

                setDirectorGoals({
                    [m.homeTeam.id]: Math.max(0, homeDirectorGoals),
                    [m.awayTeam.id]: Math.max(0, awayDirectorGoals)
                });
            }
        } catch (error) {
            console.error("Error fetching match:", error);
            alert("Erro ao carregar partida.");
        }
    };

    // Director Penalty Logic
    const openDirectorModal = (teamId: string) => {
        if (matchStatus === 'COMPLETED') return;
        setSelectedDirectorTeamId(teamId);
        setIsDirectorModalOpen(true);
    };

    const handleDirectorGoal = () => {
        if (!selectedDirectorTeamId) return;

        setDirectorGoals(prev => ({
            ...prev,
            [selectedDirectorTeamId]: (prev[selectedDirectorTeamId] || 0) + 1
        }));
        setUnsavedChanges(true);
        setIsDirectorModalOpen(false);
    };

    // Card Activation Logic
    const openCardModal = (teamId: string) => {
        setSelectedTeamForCard(teamId);
        setCardStep('SELECT_CARD');
        setSelectedCardType(null);
        setIsCardModalOpen(true);
    };

    const handleCardSelect = (card: SecretCard) => {
        if (card.type === 'KING_PLAYER' || card.type === 'EXCLUSION') {
            setSelectedCardType(card);
            setCardStep('SELECT_PLAYER');
        } else {
            activateCard(card);
        }
    };

    const handlePlayerSelect = (playerId: string) => {
        if (selectedCardType) {
            activateCard(selectedCardType, playerId);
        }
    };

    const activateCard = (card: SecretCard, targetPlayerId?: string) => {
        if (!selectedTeamForCard) return;

        const now = Date.now();
        const newCard: ActiveCard = {
            teamId: selectedTeamForCard,
            cardId: Math.random().toString(36).substr(2, 9),
            type: card.type,
            startTime: now,
            endTime: now + (card.duration * 1000),
            targetPlayerId
        };

        setActiveCards(prev => [...prev, newCard]);
        setUnsavedChanges(true); // Trigger auto-save immediately to sync cards to FanZone
        setIsCardModalOpen(false);
    };

    // Calculate Goal Value Logic
    const getGoalValue = (playerId: string, teamId: string) => {
        let value = 1;
        const now = Date.now();

        // Check active cards for this team
        const teamCards = activeCards.filter(c => c.teamId === teamId && c.endTime > now);

        // Gold Goal Rule
        if (teamCards.some(c => c.type === 'DOUBLE_GOAL')) {
            value = 2;
        }

        // King Player Rule
        if (teamCards.some(c => c.type === 'KING_PLAYER' && c.targetPlayerId === playerId)) {
            value = 2;
        }

        // Final Minutes Rule (18:00 - 20:00)
        // 18 min = 1080s, 20 min = 1200s
        if (time >= 1080 && time < 1200) {
            value = 2;
        }

        return value;
    };

    const updateStat = (playerId: string, type: string, delta: number) => {
        if (matchStatus === 'COMPLETED') {
            alert("Partida finalizada. Não é possível alterar estatísticas.");
            return;
        }

        const isHome = match?.homeTeam.players.some(p => p.id === playerId);
        const teamId = isHome ? match?.homeTeam.id : match?.awayTeam.id;

        // Apply Sanction Logic (Yellow/Red Cards)
        if (match && teamId) {
            if (type === 'yellow' || type === 'red') {
                if (delta > 0) {
                    const now = Date.now();
                    const newSanction: Sanction = {
                        id: Math.random().toString(36).substr(2, 9),
                        playerId,
                        teamId,
                        type: type === 'yellow' ? 'YELLOW' : 'RED',
                        startTime: now,
                        endTime: now + (120 * 1000) // 2 minutes
                    };
                    setActiveSanctions(prev => [...prev, newSanction]);
                } else if (delta < 0) {
                    // Remove the most recent sanction of this type for this player
                    setActiveSanctions(prev => {
                        const index = [...prev].reverse().findIndex(s => s.playerId === playerId && s.type === (type === 'yellow' ? 'YELLOW' : 'RED'));
                        if (index === -1) return prev;
                        const actualIndex = prev.length - 1 - index;
                        const newSanctions = [...prev];
                        newSanctions.splice(actualIndex, 1);
                        return newSanctions;
                    });
                }
            }
        }

        // Determine Goal Value if adding a goal
        let finalDelta = delta;
        if (type === 'goals' && delta > 0 && match && teamId) {
            finalDelta = getGoalValue(playerId, teamId);
        }

        setStats(prev => {
            const current = activeCards.find(c => c.type === 'KING_PLAYER' && c.targetPlayerId === playerId && c.endTime > Date.now())
                ? { ...prev[playerId], kingGoal: true }
                : prev[playerId] || { goals: 0, assists: 0, yellow: 0, red: 0, fouls: 0, saves: 0, conceded: 0 };

            const currentVal = (current as any)[type];
            if (delta < 0 && currentVal <= 0) return prev;

            const appliedDelta = delta < 0 ? -1 : finalDelta;

            const newVal = Math.max(0, currentVal + appliedDelta);
            return {
                ...prev,
                [playerId]: { ...current, [type]: newVal }
            };
        });
        setUnsavedChanges(true);
    };

    const calculateTeamFouls = (teamId: string) => {
        if (!match) return 0;
        const teamPlayers = match.homeTeam.id === teamId ? match.homeTeam.players : match.awayTeam.players;
        const totalFouls = teamPlayers.reduce((acc, p) => acc + (stats[p.id]?.fouls || 0), 0);

        if (period === 2) {
            return totalFouls - (firstHalfFouls[teamId] || 0);
        }
        return totalFouls;
    };

    // Calculate Players On Court (Dynamic Start)
    const getPlayersOnCourt = () => {
        // Based on time (Count Up)
        // 0-60s: 1v1 (for BOTH periods)

        if (time < 60) return "1 vs 1";
        if (time < 120) return "2 vs 2";
        if (time < 180) return "3 vs 3";
        return "4 vs 4 (COMPLETO)";
    };

    const getDiffEvents = () => {
        const diffEvents: any[] = [];

        [...(match?.homeTeam.players || []), ...(match?.awayTeam.players || [])].forEach(p => {
            const current = stats[p.id];
            const originalStat = match?.playerStats?.find((ps: any) => ps.playerId === p.id);

            const original = originalStat ? {
                goals: originalStat.goals,
                assists: originalStat.assists,
                yellow: originalStat.yellowCards,
                red: originalStat.redCards,
                fouls: originalStat.fouls || 0,
                saves: originalStat.saves || 0,
                conceded: originalStat.goalsConceded || 0
            } : { goals: 0, assists: 0, yellow: 0, red: 0, fouls: 0, saves: 0, conceded: 0 };

            if (current.goals !== original.goals) diffEvents.push({ playerId: p.id, type: 'GOAL', value: current.goals - original.goals });
            if (current.assists !== original.assists) diffEvents.push({ playerId: p.id, type: 'ASSIST', value: current.assists - original.assists });
            if (current.yellow !== original.yellow) diffEvents.push({ playerId: p.id, type: 'YELLOW', value: current.yellow - original.yellow });
            if (current.red !== original.red) diffEvents.push({ playerId: p.id, type: 'RED', value: current.red - original.red });
            if (current.fouls !== original.fouls) diffEvents.push({ playerId: p.id, type: 'FOUL', value: current.fouls - original.fouls });
            if (current.saves !== original.saves) diffEvents.push({ playerId: p.id, type: 'SAVE', value: current.saves - original.saves });
            if (current.conceded !== original.conceded) diffEvents.push({ playerId: p.id, type: 'GOAL_CONCEDED', value: current.conceded - original.conceded });
        });

        return diffEvents;
    };

    // Keep track of the latest save function to avoid closure staleness
    const handleSaveRef = useRef<any>(null);
    useEffect(() => {
        handleSaveRef.current = handleSave;
    });

    // Auto-Save Effect (Debounced) for STAT changes
    useEffect(() => {
        if (!unsavedChanges || isSaving) return;

        const timeoutId = setTimeout(() => {
            if (handleSaveRef.current) handleSaveRef.current(true); // Silent save
        }, 1500); // 1.5 seconds debounce

        return () => clearTimeout(timeoutId);
    }, [unsavedChanges, isSaving]); // Trigger ONLY on unsavedChanges toggle or save logic

    // Periodic Sync for FanZone (Every 10 seconds if LIVE)
    useEffect(() => {
        if (matchStatus === 'LIVE' && isRunning) {
            const syncId = setInterval(() => {
                if (handleSaveRef.current && !isSaving) {
                    handleSaveRef.current(true); // Silent sync
                }
            }, 10000);
            return () => clearInterval(syncId);
        }
    }, [matchStatus, isRunning, isSaving]);

    const handleSave = async (silent = false) => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const diffEvents = getDiffEvents();

            await api.put(`/matches/${id}`, {
                homeScore,
                awayScore,
                status: matchStatus,
                events: diffEvents,
                elapsedTime: time,
                activeEvents: activeCards
            });

            if (!silent) alert('Súmula salva com sucesso!');
            setUnsavedChanges(false);

            // Update local match baseline to prevent double counting on next save
            setMatch(prev => {
                if (!prev) return null;
                const updatedPlayerStats = Object.keys(stats).map(playerId => {
                    const s = stats[playerId];
                    const existing = prev.playerStats.find(ps => ps.playerId === playerId);
                    return {
                        ...(existing || { playerId }),
                        goals: s.goals,
                        assists: s.assists,
                        yellowCards: s.yellow,
                        redCards: s.red,
                        fouls: s.fouls,
                        saves: s.saves,
                        goalsConceded: s.conceded
                    };
                });
                return { ...prev, playerStats: updatedPlayerStats };
            });

        } catch (error: any) {
            console.error(error);
            if (!silent) {
                if (error.response?.data?.message) {
                    alert(`Erro: ${error.response.data.message}`);
                } else {
                    alert('Erro ao salvar. Tente novamente.');
                }
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleMatchFinalize = async () => {
        if (isSaving) return;

        // Check for Draw
        if (homeScore === awayScore) {
            setIsShootoutModalOpen(true);
            return;
        }

        if (!window.confirm('Tem certeza que deseja FINALIZAR a partida? Isso encerrará o jogo e contabilizará as estatísticas.')) return;

        await finalizeMatch();
    };

    const finalizeMatch = async () => {
        setIsSaving(true);
        try {
            const diffEvents = getDiffEvents();

            const payload: any = {
                homeScore,
                awayScore,
                status: 'COMPLETED',
                events: diffEvents,
                elapsedTime: time,
                activeEvents: [] // Clear active events on end
            };

            // Include Shootout Score if it was a draw
            if (homeScore === awayScore) {
                payload.homeShootoutScore = homeShootoutScore;
                payload.awayShootoutScore = awayShootoutScore;
            }

            await api.put(`/matches/${id}`, { ...payload });

            alert('Partida finalizada com sucesso!');
            setMatchStatus('COMPLETED');
            setIsRunning(false);
            setUnsavedChanges(false);
            setIsShootoutModalOpen(false);

            if (match?.championshipId) {
                navigate(`/championships/${match.championshipId}`);
            } else {
                navigate('/dashboard');
            }

        } catch (error: any) {
            console.error(error);
            if (error.response?.data?.message) {
                alert(`Erro: ${error.response.data.message}`);
            } else {
                alert('Erro ao finalizar partida.');
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!match) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;

    const renderActiveCards = (teamId: string) => {
        const teamCards = activeCards.filter(c => c.teamId === teamId);
        // Only return if there are cards
        if (teamCards.length === 0) return null;

        return (
            <div className="flex flex-col gap-3 mt-4 w-full">
                {teamCards.map(card => {
                    const def = SECRET_CARDS.find(s => s.type === card.type);
                    return (
                        <div key={card.cardId} className={`${def?.color || 'bg-gray-700'} text-white p-3 rounded-xl flex items-center justify-between gap-4 animate-pulse shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-white/10`}>
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{def?.icon}</div>
                                <span className="font-black uppercase tracking-widest text-sm">{def?.label}</span>
                            </div>
                            <span className="font-mono bg-black/40 px-4 py-1.5 rounded-lg text-2xl font-black text-white shadow-inner">
                                {formatCardTimer(card.endTime)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render Active Sanctions (Yellow/Red timers)
    const renderActiveSanctions = (teamId: string) => {
        const teamSanctions = activeSanctions.filter(s => s.teamId === teamId);
        if (teamSanctions.length === 0) return null;

        return (
            <div className="flex flex-col gap-3 mt-4 w-full">
                {teamSanctions.map(sanction => {
                    const player = [...match.homeTeam.players, ...match.awayTeam.players].find(p => p.id === sanction.playerId);
                    if (!player) return null;
                    return (
                        <div key={sanction.id} className={`${sanction.type === 'YELLOW' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'} p-3 rounded-xl flex items-center justify-between gap-4 shadow-xl animate-pulse border border-white/10`}>
                            <div className="flex items-center gap-3">
                                <span className="font-black bg-black/20 px-3 py-1 rounded text-xl">{player.number}</span>
                                <span className="font-black uppercase tracking-widest text-sm italic">
                                    {sanction.type === 'YELLOW' ? 'CARTÃO AMARELO (TEMP)' : 'EXPULSÃO TEMPORÁRIA'}
                                </span>
                            </div>
                            <span className="font-mono bg-black/30 px-4 py-1.5 rounded-lg text-2xl font-black shadow-inner">
                                {formatCardTimer(sanction.endTime)}
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }

    const renderCardModal = () => {
        if (!isCardModalOpen || !match) return null;

        // Determine which team's players to show:
        // For EXCLUSION, show OPPONENT players.
        // For KING_PLAYER, show OWN players.
        const showOpponent = selectedCardType?.type === 'EXCLUSION';
        const teamToDisplay = showOpponent
            ? (selectedTeamForCard === match.homeTeam.id ? match.awayTeam : match.homeTeam)
            : (selectedTeamForCard === match.homeTeam.id ? match.homeTeam : match.awayTeam);

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                    <button onClick={() => setIsCardModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><FaTimes size={24} /></button>

                    <div className="p-6">
                        <h2 className="text-2xl font-black uppercase text-white mb-6 text-center">
                            {cardStep === 'SELECT_CARD' ? 'Selecionar Carta Secreta' : `${selectedCardType?.label}: Selecionar ${showOpponent ? 'Adversário' : 'Jogador'}`}
                        </h2>

                        {cardStep === 'SELECT_CARD' ? (
                            <div className="grid grid-cols-1 gap-3">
                                {SECRET_CARDS.map(card => (
                                    <button
                                        key={card.id}
                                        onClick={() => handleCardSelect(card)}
                                        className={`${card.color} hover:brightness-110 text-white p-4 rounded-xl flex items-center gap-4 transition-transform hover:scale-105 text-left`}
                                    >
                                        <div className="text-3xl bg-black/20 w-12 h-12 rounded-full flex items-center justify-center">{card.icon}</div>
                                        <div>
                                            <div className="font-bold text-lg uppercase">{card.label}</div>
                                            <div className="text-xs opacity-80">{card.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
                                {teamToDisplay.players.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handlePlayerSelect(p.id)}
                                        className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl flex items-center gap-3 border border-gray-700"
                                    >
                                        <div className="font-bold text-gray-400 w-6">{p.number}</div>
                                        <div className="font-bold text-white truncate">{p.name}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderTeamScout = (team: Team, isHome: boolean) => {
        const teamFouls = calculateTeamFouls(team.id);
        const isFoulLimit = teamFouls >= 5;

        return (
            <div className={`bg-gray-800 rounded-xl p-4 border-t-4 h-full flex flex-col ${isHome ? 'border-yellow-500' : 'border-blue-500'}`}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <SafeImage
                            src={team.logoUrl}
                            className="w-10 h-10 rounded-full bg-gray-700"
                            alt={team.name}
                            fallbackIcon={<FaShieldAlt size={16} />}
                        />
                        <div>
                            <h3 className="font-bold text-lg leading-none">{team.name}</h3>

                            {/* Director & Coach Info */}
                            <div className="flex flex-col mt-1 gap-0.5">
                                {team.directorName && (
                                    <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1" title="Diretor (Pênalti)">
                                        <FaStar size={8} /> {team.directorName}
                                    </span>
                                )}
                                {team.coachName && (
                                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                                        Téc: {team.coachName}
                                    </span>
                                )}
                            </div>

                            <button
                                onClick={() => openCardModal(team.id)}
                                className="text-[10px] mt-2 bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded uppercase font-bold flex items-center gap-1"
                            >
                                <FaBolt size={10} /> Cartas
                            </button>
                        </div>
                    </div>
                    <div className={`flex flex-col items-end ${isFoulLimit ? 'animate-pulse text-red-500' : 'text-gray-400'}`}>
                        <div className="flex items-center gap-2 font-bold text-xl">
                            <FaFlag />
                            <span>{teamFouls} / 5</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold">{isFoulLimit ? 'TIRO LIVRE!' : 'FALTAS COLETIVAS'}</span>
                    </div>
                </div>

                {/* Active Cards & Sanctions Area */}
                <div className="flex flex-col gap-2 mb-4 shrink-0">
                    {renderActiveCards(team.id)}
                    {renderActiveSanctions(team.id)}
                </div>

                <div className="flex flex-col gap-1 overflow-y-auto flex-1 h-0 pr-1 custom-scrollbar">
                    {[...team.players].sort((a, b) => {
                        // 1. Starters first
                        if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
                        // 2. Goalkeepers first (within group)
                        if (a.position !== b.position) return a.position === 'GOALKEEPER' ? -1 : 1;
                        // 3. Number ascending
                        return a.number - b.number;
                    }).map(player => {
                        const s = stats[player.id] || { goals: 0, assists: 0, yellow: 0, red: 0, fouls: 0, saves: 0, conceded: 0 };
                        // Check if player is target of active King Card
                        const isKing = activeCards.some(c => c.type === 'KING_PLAYER' && c.targetPlayerId === player.id && c.teamId === team.id);
                        // Check if player is Excluded or Sanctioned
                        const isExcluded = activeCards.some(c => c.type === 'EXCLUSION' && c.targetPlayerId === player.id && c.teamId !== team.id);
                        const isSanctioned = activeSanctions.some(sanction => sanction.playerId === player.id);

                        return (
                            <div key={player.id} className={`group bg-gray-900/40 hover:bg-gray-800 p-2 rounded flex flex-col gap-2 border-b border-gray-800 transition-all ${isKing ? 'ring-1 ring-yellow-500 bg-yellow-900/10' : ''} ${(isExcluded || isSanctioned) ? 'opacity-50 grayscale' : ''}`}>

                                {/* Row 1: Player Info */}
                                <div className="flex items-center gap-2 w-full mb-1">
                                    <span className={`font-mono font-bold text-sm min-w-[20px] text-center ${player.position === 'GOALKEEPER' ? 'text-yellow-500' : 'text-gray-400'}`}>{player.number}</span>
                                    <span className="truncate font-bold text-sm text-gray-100 group-hover:text-white flex-1 leading-tight" title={player.name}>{player.name}</span>

                                    {isKing && <FaCrown size={10} className="text-yellow-500 flex-shrink-0 animate-pulse" />}
                                    {(isExcluded || isSanctioned) && <span className="text-[9px] bg-red-600 px-1 rounded text-white font-bold">OUT</span>}
                                </div>

                                {/* Row 2: Stats Controls (Compact Grid) */}
                                <div className="grid grid-cols-[auto_auto_1fr] gap-x-2 gap-y-1 items-center w-full">

                                    {/* Goals (Col 1) */}
                                    <div className="flex items-center bg-black/40 rounded-lg overflow-hidden border border-white/5 h-8">
                                        <button
                                            disabled={matchStatus === 'COMPLETED'}
                                            onClick={() => updateStat(player.id, 'goals', -1)}
                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white/5 active:scale-95 disabled:opacity-30 transition-all font-black text-lg"
                                        >-</button>
                                        <div className="w-8 h-full flex flex-col items-center justify-center bg-black/20 px-1">
                                            <span className={`font-black text-lg leading-none ${isKing ? 'text-yellow-400' : 'text-white'}`}>{s.goals}</span>
                                        </div>
                                        <button
                                            disabled={matchStatus === 'COMPLETED'}
                                            onClick={() => updateStat(player.id, 'goals', 1)}
                                            className="w-8 h-full flex items-center justify-center text-white bg-green-600/20 hover:bg-green-600/40 active:scale-95 disabled:opacity-30 transition-all font-black text-xl"
                                        >+</button>
                                    </div>

                                    {/* Cards (Col 2) */}
                                    <div className="flex items-center gap-1.5 px-2 border-x border-gray-700/50 h-8">
                                        <div className="flex items-center gap-0.5">
                                            <button
                                                onClick={() => updateStat(player.id, 'yellow', -1)}
                                                className="w-5 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-l active:scale-95 transition-all"
                                            ><span className="text-[10px] font-black">-</span></button>
                                            <button
                                                disabled={matchStatus === 'COMPLETED'}
                                                onClick={() => updateStat(player.id, 'yellow', 1)}
                                                className={`w-6 h-8 flex items-center justify-center rounded-r transition-all active:scale-95 shadow-lg ${s.yellow > 0 ? 'bg-yellow-500 text-black' : 'bg-yellow-500/20 text-yellow-500/50 grayscale border border-yellow-500/30'}`}
                                            >
                                                <div className="w-3 h-4 bg-current rounded-[1px]"></div>
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-0.5">
                                            <button
                                                disabled={matchStatus === 'COMPLETED'}
                                                onClick={() => updateStat(player.id, 'red', 1)}
                                                className={`w-6 h-8 flex items-center justify-center rounded-l transition-all active:scale-95 shadow-lg ${s.red > 0 ? 'bg-red-600 text-white' : 'bg-red-600/20 text-red-600/50 grayscale border border-red-600/30'}`}
                                            >
                                                <div className="w-3 h-4 bg-current rounded-[1px]"></div>
                                            </button>
                                            <button
                                                onClick={() => updateStat(player.id, 'red', -1)}
                                                className="w-5 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-r active:scale-95 transition-all"
                                            ><span className="text-[10px] font-black">-</span></button>
                                        </div>
                                    </div>

                                    {/* Fouls & Assists/Saves (Col 3 - Flex) */}
                                    <div className="flex justify-end gap-1.5">
                                        {/* Fouls */}
                                        <div className="flex flex-col items-center bg-black/40 rounded overflow-hidden border border-white/5 w-9">
                                            <button
                                                disabled={matchStatus === 'COMPLETED'}
                                                onClick={() => updateStat(player.id, 'fouls', 1)}
                                                className={`w-full h-5 flex items-center justify-center transition-all active:scale-95 border-b border-white/5 ${s.fouls > 0 ? 'bg-red-900/40 text-red-400 font-black' : 'bg-gray-800 text-gray-500'}`}
                                            ><span className="text-[10px]">+</span></button>
                                            <div className="flex items-center justify-center h-4 w-full bg-black/30">
                                                <span className={`text-[10px] font-black leading-none ${s.fouls > 0 ? 'text-red-400' : 'text-gray-500'}`}>{s.fouls || 'F'}</span>
                                            </div>
                                            <button
                                                disabled={matchStatus === 'COMPLETED'}
                                                onClick={() => updateStat(player.id, 'fouls', -1)}
                                                className="w-full h-4 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-white/5 active:scale-95 transition-all"
                                            ><span className="text-[10px] font-black">-</span></button>
                                        </div>

                                        {/* Assists/Saves */}
                                        {player.position === 'GOALKEEPER' ? (
                                            <div className="flex flex-col items-center bg-black/40 rounded overflow-hidden border border-white/5 w-9">
                                                <button
                                                    disabled={matchStatus === 'COMPLETED'}
                                                    onClick={() => updateStat(player.id, 'saves', 1)}
                                                    className={`w-full h-5 flex items-center justify-center transition-all active:scale-95 border-b border-white/5 ${s.saves > 0 ? 'bg-blue-900/40 text-blue-400 font-black' : 'bg-gray-800 text-gray-500'}`}
                                                ><span className="text-[10px]">+</span></button>
                                                <div className="flex items-center justify-center h-4 w-full bg-black/30">
                                                    <span className={`text-[10px] font-black leading-none ${s.saves > 0 ? 'text-blue-400' : 'text-gray-500'}`}>{s.saves || 'D'}</span>
                                                </div>
                                                <button
                                                    disabled={matchStatus === 'COMPLETED'}
                                                    onClick={() => updateStat(player.id, 'saves', -1)}
                                                    className="w-full h-4 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-white/5 active:scale-95 transition-all"
                                                ><span className="text-[10px] font-black">-</span></button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center bg-black/40 rounded overflow-hidden border border-white/5 w-9">
                                                <button
                                                    disabled={matchStatus === 'COMPLETED'}
                                                    onClick={() => updateStat(player.id, 'assists', 1)}
                                                    className={`w-full h-5 flex items-center justify-center transition-all active:scale-95 border-b border-white/5 ${s.assists > 0 ? 'bg-green-900/40 text-green-400 font-black' : 'bg-gray-800 text-gray-500'}`}
                                                ><span className="text-[10px]">+</span></button>
                                                <div className="flex items-center justify-center h-4 w-full bg-black/30">
                                                    <span className={`text-[10px] font-black leading-none ${s.assists > 0 ? 'text-green-400' : 'text-gray-500'}`}>{s.assists || 'A'}</span>
                                                </div>
                                                <button
                                                    disabled={matchStatus === 'COMPLETED'}
                                                    onClick={() => updateStat(player.id, 'assists', -1)}
                                                    className="w-full h-4 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-white/5 active:scale-95 transition-all"
                                                ><span className="text-[10px] font-black">-</span></button>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        );
                    })}

                    {/* Director Row */}
                    {team.directorName && (
                        <div className="group bg-purple-900/20 hover:bg-purple-900/40 p-2 rounded flex flex-col gap-2 border-b border-purple-500/30 transition-all mt-2 border-l-4 border-l-purple-500">
                            <div
                                className="flex items-center gap-2 w-full cursor-pointer"
                                onClick={() => openDirectorModal(team.id)}
                            >
                                <span className="font-mono font-bold text-base min-w-[24px] text-center text-purple-400">
                                    <FaStar />
                                </span>
                                <span className="truncate font-black text-base text-purple-200 group-hover:text-purple-100 flex-1 uppercase tracking-wider">
                                    DIRETOR: {team.directorName}
                                </span>
                            </div>

                            <div className="flex items-center justify-between w-full pl-8 pr-2">
                                <span className="text-[10px] text-purple-400 font-bold uppercase">PÊNALTI DO DIRETOR</span>
                                <div className="flex items-center gap-1 bg-black/20 rounded px-1" title="Gols do Diretor">
                                    <button disabled={matchStatus === 'COMPLETED'} onClick={() => {
                                        setDirectorGoals(prev => {
                                            if ((prev[team.id] || 0) <= 0) return prev;
                                            return { ...prev, [team.id]: (prev[team.id] - 1) };
                                        });
                                        setUnsavedChanges(true);
                                    }} className="text-gray-500 hover:text-red-500 disabled:opacity-30 text-xs px-1 font-bold">-</button>
                                    <span className="font-bold text-sm min-w-[16px] text-center text-purple-400">{directorGoals[team.id] || 0}</span>
                                    <button disabled={matchStatus === 'COMPLETED'} onClick={() => {
                                        openDirectorModal(team.id);
                                    }} className="text-gray-500 hover:text-green-500 disabled:opacity-30 text-xs px-1 font-bold">+</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-2 md:p-4 pb-24">
            {/* Sticky Header with Actions - Hidden in Fullscreen */}
            {!isFullscreen && (
                <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 p-4 mb-6 shadow-xl flex justify-between items-center">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
                        <FaArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-sm font-bold uppercase tracking-widest text-gray-500 hidden md:block">{match.round}</h1>
                    </div>
                    <button
                        onClick={toggleFullscreen}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all border border-blue-600/30"
                        title="Tela Cheia"
                    >
                        <FaExpand /> <span className="hidden md:inline">TV Mode</span>
                    </button>
                    <button
                        onClick={() => handleSave()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${unsavedChanges
                            ? 'bg-yellow-500 text-black hover:bg-yellow-400 animate-pulse'
                            : 'bg-green-600 text-white hover:bg-green-500'
                            }`}
                    >
                        <FaSave /> <span className="hidden md:inline">Salvar</span>
                    </button>
                </div>
            )}

            {/* Exit Fullscreen Button (Floating) */}
            {isFullscreen && (
                <button
                    onClick={toggleFullscreen}
                    className="fixed top-4 right-4 z-[60] bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-all"
                >
                    <FaTimes size={20} />
                </button>
            )}

            {/* Left Vertical Banner (Fixed Position - 4 Stacked Squares) */}
            <div className="hidden min-[1600px]:flex flex-col gap-3 w-[200px] min-[1800px]:w-[260px] fixed top-24 left-4 z-10 transition-all duration-500">
                {SPONSORS.slice(0, 4).map((sponsor) => (
                    <div key={sponsor.id} className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group shadow-2xl hover:scale-105 relative overflow-hidden">
                        <span className="text-gray-700 font-bold group-hover:text-white transition-colors tracking-widest text-sm opacity-20">PUB {sponsor.id}</span>
                        <img
                            src={sponsor.image}
                            alt={sponsor.name}
                            className="absolute inset-0 w-full h-full object-contain p-2 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                    </div>
                ))}
            </div>

            {/* Right Vertical Banner (Fixed Position - 4 Stacked Squares) */}
            <div className="hidden min-[1600px]:flex flex-col gap-3 w-[200px] min-[1800px]:w-[260px] fixed top-24 right-4 z-10 transition-all duration-500">
                {SPONSORS.slice(4, 8).map((sponsor) => (
                    <div key={sponsor.id} className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group shadow-2xl hover:scale-105 relative overflow-hidden">
                        <span className="text-gray-700 font-bold group-hover:text-white transition-colors tracking-widest text-sm opacity-20">PUB {sponsor.id}</span>
                        <img
                            src={sponsor.image}
                            alt={sponsor.name}
                            className="absolute inset-0 w-full h-full object-contain p-2 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                    </div>
                ))}
            </div>

            <div className="w-full max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.8fr_1.1fr] gap-4 px-2 md:px-6">

                {/* Left/Right Columns (Teams) - Code is below in other chunks, this updates container grid only */}

                {/* Center / Scoreboard */}
                <div className="lg:col-start-2 order-1 lg:order-2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl text-center sticky top-24">

                        {/* ... (Timer/Scoreboard content unchanged for now, will scale automatically) ... */}
                        {/* Copy existing content logic but ensure container is flexible */}

                        {/* Dynamic Start / Players on Court Indicator */}
                        {time < 180 && (
                            <div className="mb-4">
                                <div className="text-xs uppercase text-gray-500 font-bold tracking-widest mb-1">Formato em Quadra</div>
                                <div className="inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-full animate-pulse transform hover:scale-105 transition-transform">
                                    <FaUsers className="text-blue-400 text-xl" />
                                    <span className="text-3xl font-black italic bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                        {getPlayersOnCourt()}
                                    </span>
                                </div>
                                <div className="text-sm font-bold text-gray-400 mt-3 mb-1 uppercase tracking-wider">
                                    Próximo entra em:
                                </div>
                                <div className="text-8xl md:text-9xl font-mono font-black text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)] mb-4 animate-pulse">
                                    {60 - (time % 60)}s
                                </div>
                            </div>
                        )}

                        {/* Large Timer Display */}
                        <div className="mb-4 flex flex-col items-center">
                            <span className="text-sm uppercase font-bold text-gray-500 tracking-widest mb-2">
                                {period}º Tempo
                            </span>
                            <div className="flex items-center gap-4">
                                <div className="bg-black/40 rounded-2xl px-8 py-4 border border-white/10 backdrop-blur-sm shadow-inner relative overflow-hidden">
                                    <span className={`font-mono text-7xl md:text-8xl font-black tracking-widest ${isRunning ? 'text-green-400' : 'text-gray-400'}`}>
                                        {formatTime(time)}
                                    </span>
                                    {extraTime > 0 && <span className="text-yellow-500 font-bold text-3xl ml-4 anim-pulse">+{extraTime}'</span>}

                                    {/* Double Goal Moving Background Effect */}
                                    {time >= 1080 && time < 1200 && (
                                        <div className="absolute inset-0 bg-transparent shadow-[inset_0_0_50px_rgba(147,51,234,0.3)] animate-pulse pointer-events-none"></div>
                                    )}
                                </div>
                            </div>

                            {/* Double Goal Indicator Badge */}
                            {time >= 1080 && time < 1200 && (
                                <div className="mt-4 animate-bounce bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-base font-black tracking-widest shadow-[0_0_20px_rgba(147,51,234,0.6)] border border-purple-400/50 select-none flex items-center gap-2 transform hover:scale-110 transition-transform">
                                    <FaStar className="text-yellow-300 animate-spin-slow" />
                                    MINUTOS FINAIS: GOL DUPLO!
                                    <FaStar className="text-yellow-300 animate-spin-slow" />
                                </div>
                            )}
                        </div>

                        {/* Sponsor Carousel at Halftime */}
                        {(!isRunning && time >= 1200 && period === 1) && (
                            <SponsorCarousel onClose={startNextPeriod} />
                        )}

                        <div className="flex justify-between items-center mb-4">
                            <div className="text-center">
                                <div className="flex justify-center mb-3">
                                    <SafeImage
                                        src={match.homeTeam.logoUrl}
                                        className="w-24 h-24 filter drop-shadow-lg"
                                        fallbackIcon={<FaShieldAlt size={48} />}
                                    />
                                </div>
                                <h2 className="font-bold text-2xl leading-none">{match.homeTeam.name}</h2>
                                <div className="flex flex-col mt-2 gap-1 items-center">
                                    {match.homeTeam.directorName && (
                                        <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <FaStar size={10} /> {match.homeTeam.directorName}
                                        </span>
                                    )}
                                    {match.homeTeam.coachName && (
                                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                            Téc: {match.homeTeam.coachName}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className="text-gray-600 font-bold text-2xl opacity-50">VS</span>
                            <div className="text-center">
                                <div className="flex justify-center mb-3">
                                    <SafeImage
                                        src={match.awayTeam.logoUrl}
                                        className="w-24 h-24 filter drop-shadow-lg"
                                        fallbackIcon={<FaShieldAlt size={48} />}
                                    />
                                </div>
                                <h2 className="font-bold text-2xl leading-none">{match.awayTeam.name}</h2>
                                <div className="flex flex-col mt-2 gap-1 items-center">
                                    {match.awayTeam.directorName && (
                                        <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <FaStar size={10} /> {match.awayTeam.directorName}
                                        </span>
                                    )}
                                    {match.awayTeam.coachName && (
                                        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                            Téc: {match.awayTeam.coachName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center items-center gap-8 mb-8">
                            <span className="text-9xl font-mono font-bold text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{homeScore}</span>
                            <span className="text-gray-600 text-7xl">:</span>
                            <span className="text-9xl font-mono font-bold text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{awayScore}</span>
                        </div>

                        {/* Status & Timer Controls */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="flex gap-2">
                                <div className={`text-base font-bold px-6 py-2 rounded-full uppercase border tracking-wider shadow-lg ${matchStatus === 'LIVE' ? 'bg-red-600 border-red-600 text-white animate-pulse' :
                                    matchStatus === 'COMPLETED' ? 'bg-green-600 border-green-600' : 'bg-gray-800 border-gray-600 text-gray-400'
                                    }`}>
                                    {matchStatus === 'LIVE' ? '● EM JOGO' : matchStatus === 'COMPLETED' ? 'FIM DE JOGO' : 'AGENDADO'}
                                </div>
                            </div>

                            {/* Lineup Preview Button */}
                            {matchStatus === 'SCHEDULED' && (
                                <button
                                    onClick={() => setIsLineupModalOpen(true)}
                                    className="bg-blue-600/20 text-blue-400 border border-blue-600/30 px-8 py-3 rounded-full font-bold uppercase tracking-[0.2em] hover:bg-blue-600/30 transition-all flex items-center gap-3 shadow-lg hover:scale-105 active:scale-95"
                                >
                                    <FaUsers size={20} /> Ver Escalações
                                </button>
                            )}

                            <div className="flex gap-4 w-full justify-center max-w-md">
                                <button
                                    onClick={toggleTimer}
                                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-xl transition-all shadow-lg hover:scale-105 ${isRunning
                                        ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                                        : 'bg-green-600 hover:bg-green-500 text-white'
                                        }`}
                                >
                                    {isRunning ? <><FaPause /> PAUSAR</> : <><FaPlay /> INICIAR</>}
                                </button>
                                <button
                                    onClick={addExtraTime}
                                    className="px-6 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-yellow-500 border border-gray-600 text-xl shadow-lg hover:scale-105 transition-transform"
                                    title="Adicionar +1 min de acréscimo"
                                >
                                    <FaPlus /> 1'
                                </button>
                            </div>
                        </div>

                        {/* Finalize Match Button - Visible whenever paused and not completed */}
                        {matchStatus !== 'COMPLETED' && !isRunning && (
                            <div className="mt-8 animate-in fade-in duration-500">
                                <button
                                    onClick={handleMatchFinalize}
                                    className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest shadow-lg border border-red-500 flex items-center gap-3 w-full justify-center transition-all hover:scale-105 text-lg"
                                >
                                    <FaFlag /> Finalizar Partida
                                </button>
                            </div>
                        )}

                        {/* App Logo Placeholder */}
                        <div className={`mt-8 transition-all duration-500 ${isFullscreen ? 'opacity-100 scale-125' : 'opacity-30 hover:opacity-100 grayscale hover:grayscale-0'}`}>
                            <img src="/logo.png" alt="Futkings Manager" className={`mx-auto transition-all ${isFullscreen ? 'h-32' : 'h-16'}`} />
                        </div>

                    </div>
                </div>

                {/* Left: Home Team Scout */}
                <div className="order-2 lg:order-1 h-full">
                    {renderTeamScout(match.homeTeam, true)}
                </div>

                {/* Right: Away Team Scout */}
                <div className="order-3 lg:order-3 h-full">
                    {renderTeamScout(match.awayTeam, false)}
                </div>
            </div>


            {/* Director Penalty Modal */}
            {isDirectorModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg relative bg-transparent text-center">
                        <div className="animate-pulse mb-8">
                            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_25px_rgba(236,72,153,0.6)] uppercase italic transform -skew-x-12">
                                PÊNALTI <br /> DO DIRETOR
                            </h1>
                            <div className="flex justify-center mt-4">
                                <FaStar className="text-yellow-400 text-6xl animate-spin-slow drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => setIsDirectorModalOpen(false)}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-4 px-8 rounded-2xl text-xl shadow-lg border-2 border-gray-600 transition-all hover:scale-105"
                            >
                                PERDEU
                                <span className="block text-xs font-normal opacity-60 mt-1">Cancelar</span>
                            </button>
                            <button
                                onClick={handleDirectorGoal}
                                className="bg-gradient-to-r from-green-600 to-green-400 hover:from-green-500 hover:to-green-300 text-white font-black py-4 px-12 rounded-2xl text-3xl shadow-[0_0_30px_rgba(34,197,94,0.4)] border-4 border-green-400 transition-all hover:scale-110 hover:rotate-2"
                            >
                                GOL !!!
                                <span className="block text-sm font-bold opacity-80 mt-1 uppercase tracking-widest">+1 Ponto</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {renderCardModal()}

            <MatchLineupModal
                isOpen={isLineupModalOpen}
                onClose={() => setIsLineupModalOpen(false)}
                homeTeam={match.homeTeam}
                awayTeam={match.awayTeam}
            />

            {/* Date Selection Modal */}
            {isDateModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md relative text-center">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                            <FaCalendarCheck className="text-yellow-500" /> Definir Início da Partida
                        </h2>

                        <p className="text-gray-400 mb-4 text-sm">
                            Esta partida não tem data definida. Para iniciar o cronômetro, informe a data e hora de início.
                        </p>

                        <input
                            type="datetime-local"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white focus:border-yellow-500 focus:outline-none mb-6 text-lg"
                        />

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setIsDateModalOpen(false)}
                                className="text-gray-400 hover:text-white px-4 py-2 font-bold transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDateSave}
                                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-8 py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition flex items-center gap-2"
                            >
                                <FaSave /> Salvar e Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Shootout Modal */}
            {isShootoutModalOpen && match && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-4xl relative">
                        <div className="text-center mb-12">
                            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                Empate!
                            </h2>
                            <p className="text-yellow-500 font-bold tracking-widest text-lg uppercase">Disputa de Shootouts</p>
                        </div>

                        <div className="flex items-start justify-center gap-12 mb-12">
                            {/* Home Team */}
                            <div className="flex flex-col items-center gap-6 w-1/2">
                                <SafeImage src={match.homeTeam.logoUrl} className="w-24 h-24 object-contain drop-shadow-2xl" alt={match.homeTeam.name} />
                                <h3 className="text-2xl font-bold text-white uppercase">{match.homeTeam.name}</h3>

                                {/* Score Display */}
                                <div className="text-6xl font-black text-white font-mono mb-4">{homeShootoutScore}</div>

                                {/* History Bubbles */}
                                <div className="flex gap-2 flex-wrap justify-center min-h-[32px]">
                                    {shootoutHistory.home.map((result, idx) => (
                                        <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white/20 ${result === 'GOAL' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                                            }`}>
                                            {result === 'GOAL' ? '✓' : '✕'}
                                        </div>
                                    ))}
                                </div>

                                {/* Controls */}
                                <div className="flex gap-4 w-full">
                                    <button
                                        onClick={() => setShootoutHistory(prev => ({ ...prev, home: [...prev.home, 'MISS'] }))}
                                        className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-500 border-2 border-red-600/50 py-3 rounded-xl font-bold transition uppercase tracking-wider"
                                    >
                                        Perdeu
                                    </button>
                                    <button
                                        onClick={() => setShootoutHistory(prev => ({ ...prev, home: [...prev.home, 'GOAL'] }))}
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-green-600/20 uppercase tracking-wider border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                                    >
                                        GOL
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShootoutHistory(prev => ({ ...prev, home: prev.home.slice(0, -1) }))}
                                    className="text-xs text-gray-500 hover:text-white underline mt-2"
                                >
                                    Desfazer último
                                </button>
                            </div>

                            <div className="h-64 w-px bg-gray-800 self-center"></div>

                            {/* Away Team */}
                            <div className="flex flex-col items-center gap-6 w-1/2">
                                <SafeImage src={match.awayTeam.logoUrl} className="w-24 h-24 object-contain drop-shadow-2xl" alt={match.awayTeam.name} />
                                <h3 className="text-2xl font-bold text-white uppercase">{match.awayTeam.name}</h3>

                                {/* Score Display */}
                                <div className="text-6xl font-black text-white font-mono mb-4">{awayShootoutScore}</div>

                                {/* History Bubbles */}
                                <div className="flex gap-2 flex-wrap justify-center min-h-[32px]">
                                    {shootoutHistory.away.map((result, idx) => (
                                        <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white/20 ${result === 'GOAL' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                                            }`}>
                                            {result === 'GOAL' ? '✓' : '✕'}
                                        </div>
                                    ))}
                                </div>

                                {/* Controls */}
                                <div className="flex gap-4 w-full">
                                    <button
                                        onClick={() => setShootoutHistory(prev => ({ ...prev, away: [...prev.away, 'MISS'] }))}
                                        className="flex-1 bg-red-600/20 hover:bg-red-600/40 text-red-500 border-2 border-red-600/50 py-3 rounded-xl font-bold transition uppercase tracking-wider"
                                    >
                                        Perdeu
                                    </button>
                                    <button
                                        onClick={() => setShootoutHistory(prev => ({ ...prev, away: [...prev.away, 'GOAL'] }))}
                                        className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-green-600/20 uppercase tracking-wider border-b-4 border-green-800 active:border-b-0 active:translate-y-1"
                                    >
                                        GOL
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShootoutHistory(prev => ({ ...prev, away: prev.away.slice(0, -1) }))}
                                    className="text-xs text-gray-500 hover:text-white underline mt-2"
                                >
                                    Desfazer último
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 max-w-md mx-auto">
                            <button
                                onClick={() => finalizeMatch()}
                                disabled={homeShootoutScore === awayShootoutScore}
                                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black py-4 rounded-xl text-xl shadow-xl shadow-yellow-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                                {homeShootoutScore === awayShootoutScore ? 'Desempate Obrigatório' : 'Finalizar com Shootouts'}
                            </button>
                            <button
                                onClick={() => setIsShootoutModalOpen(false)}
                                className="w-full text-gray-400 hover:text-white font-bold py-2 transition"
                            >
                                Cancelar e Voltar ao Jogo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default MatchSheet;
