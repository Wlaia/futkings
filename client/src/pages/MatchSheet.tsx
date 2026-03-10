import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaSave, FaArrowLeft, FaFlag, FaPlay, FaPause, FaStar, FaBolt, FaTimes, FaHandPaper, FaExpand, FaShieldAlt, FaBullseye, FaCalendarCheck, FaStopwatch, FaCrown, FaUsers } from 'react-icons/fa';
import SponsorCarousel from '../components/SponsorCarousel';
// Import removed for unused SPONSORS
import SafeImage from '../components/SafeImage';
import MatchLineupModal from '../components/MatchLineupModal';
import GoalAnimation from '../components/GoalAnimation';

interface Player {
    id: string;
    name: string;
    number: number;
    position: 'GOALKEEPER' | 'FIELD';
    isStarter?: boolean;
    avatarUrl?: string;
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

interface CardUsage {
    h1: boolean;
    h2: boolean;
    pres: boolean;
}

interface AllCardUsage {
    home: CardUsage;
    away: CardUsage;
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
    { id: 'penalty', type: 'PENALTY_FUTKINGS', label: 'Pênalti FutKings', description: 'Shootout 1x1 imediato', icon: <FaBullseye />, color: 'bg-indigo-500', duration: 0 },
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

    // Goal Animation State
    const [goalAnimation, setGoalAnimation] = useState<{
        isOpen: boolean;
        teamName?: string;
        teamLogo?: string;
        playerName?: string;
        playerAvatar?: string;
        goalValue?: number;
    }>({ isOpen: false });

    const [cardUsage, setCardUsage] = useState<AllCardUsage>({
        home: { h1: false, h2: false, pres: false },
        away: { h1: false, h2: false, pres: false }
    });

    const [teamFoulsState, setTeamFoulsState] = useState<Record<string, number>>({});

    // Shootout State
    const [isShootoutModalOpen, setIsShootoutModalOpen] = useState(false);
    const [isPenaltyFutkingsModalOpen, setIsPenaltyFutkingsModalOpen] = useState(false);
    const [penaltyFutkingsTeamId, setPenaltyFutkingsTeamId] = useState<string | null>(null);
    const [shootoutHistory, setShootoutHistory] = useState<{ home: ('GOAL' | 'MISS')[], away: ('GOAL' | 'MISS')[] }>({ home: [], away: [] });

    const homeShootoutScore = shootoutHistory.home.filter(r => r === 'GOAL').length;
    const awayShootoutScore = shootoutHistory.away.filter(r => r === 'GOAL').length;
    const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);

    // Date Modal State
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [newDate, setNewDate] = useState('');

    // Timer Pause Tracker (For freezing cards)
    const [pauseTimestamp, setPauseTimestamp] = useState<number | null>(Date.now());

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
                        setPauseTimestamp(Date.now());
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

        const now = Date.now();
        if (newIsRunning) {
            // Resuming from pause: Shift endpoints by the time we spent paused
            if (pauseTimestamp) {
                const diff = now - pauseTimestamp;
                setActiveCards(prev => prev.map(c => ({ ...c, startTime: c.startTime + diff, endTime: c.endTime + diff })));
                setActiveSanctions(prev => prev.map(s => ({ ...s, startTime: s.startTime + diff, endTime: s.endTime + diff })));
            }
            setPauseTimestamp(null);
        } else {
            // Pausing timer: record the current real-world time
            if (!pauseTimestamp) {
                setPauseTimestamp(now);
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
        setPauseTimestamp(Date.now());
        if (period === 1) setIsSponsorModalOpen(true);
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
        const referenceTime = pauseTimestamp || Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - referenceTime) / 1000));
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

                // Load Card Usage from metadata if exists
                if (m.metadata?.cardUsage) {
                    setCardUsage(m.metadata.cardUsage);
                }
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

        const team = selectedDirectorTeamId === match?.homeTeam.id ? match?.homeTeam : match?.awayTeam;

        setDirectorGoals(prev => ({
            ...prev,
            [selectedDirectorTeamId]: (prev[selectedDirectorTeamId] || 0) + 1
        }));

        // AUTOMATICALLY Increment Opposing Goalkeeper Conceded Goals
        const opposingTeam = selectedDirectorTeamId === match?.homeTeam.id ? match?.awayTeam : match?.homeTeam;
        const opposingGk = opposingTeam?.players.find(p => p.position === 'GOALKEEPER');
        if (opposingGk) {
            setStats(prev => ({
                ...prev,
                [opposingGk.id]: {
                    ...(prev[opposingGk.id] || { goals: 0, assists: 0, yellow: 0, red: 0, fouls: 0, saves: 0, conceded: 0 }),
                    conceded: (prev[opposingGk.id]?.conceded || 0) + 1
                }
            }));
        }

        // Trigger Animation
        setGoalAnimation({
            isOpen: true,
            teamName: team?.name,
            teamLogo: team?.logoUrl,
            goalValue: 1 // Director goal always 1
        });

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

        if (card.type === 'PENALTY_FUTKINGS') {
            setPenaltyFutkingsTeamId(selectedTeamForCard);
            setIsPenaltyFutkingsModalOpen(true);
            setIsCardModalOpen(false);
            return;
        }

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

        // Final Minutes Rule (18:00 onwards, including extra time)
        // 18 min = 1080s
        if (time >= 1080) {
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
                    const currentYellows = stats[playerId]?.yellow || 0;

                    // If adding a yellow and player already has 1, trigger 2nd yellow -> Red logic
                    if (type === 'yellow' && currentYellows >= 1) {
                        // 1. Add the Red Card to statistics automatically
                        updateStat(playerId, 'red', 1);
                        // 2. We don't need to add a new yellow sanction because the red one will handle the 2-min penalty
                        return;
                    }

                    const newSanction: Sanction = {
                        id: Math.random().toString(36).substr(2, 9),
                        playerId,
                        teamId,
                        type: type === 'yellow' ? 'YELLOW' : 'RED',
                        startTime: now,
                        endTime: now + (120 * 1000) // 2 minutes for team penalty
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

            // Trigger Animation for Goal
            if (type === 'goals' && delta > 0) {
                const team = isHome ? match?.homeTeam : match?.awayTeam;
                const player = team?.players.find(p => p.id === playerId);
                setGoalAnimation({
                    isOpen: true,
                    teamName: team?.name,
                    teamLogo: team?.logoUrl,
                    playerName: player?.name,
                    playerAvatar: player?.avatarUrl,
                    goalValue: finalDelta
                });

                // AUTOMATICALLY Increment Opposing Goalkeeper Conceded Goals
                const opposingTeam = isHome ? match?.awayTeam : match?.homeTeam;
                const opposingGk = opposingTeam?.players.find(p => p.position === 'GOALKEEPER');
                if (opposingGk) {
                    setTimeout(() => {
                        setStats(latest => ({
                            ...latest,
                            [opposingGk.id]: {
                                ...(latest[opposingGk.id] || { goals: 0, assists: 0, yellow: 0, red: 0, fouls: 0, saves: 0, conceded: 0 }),
                                conceded: (latest[opposingGk.id]?.conceded || 0) + appliedDelta
                            }
                        }));
                    }, 0);
                }
            }

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
        return "4 vs 4";
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
                homeShootoutScore,
                awayShootoutScore,
                status: matchStatus,
                events: diffEvents,
                elapsedTime: time,
                activeEvents: activeCards,
                metadata: {
                    cardUsage
                }
            });

            if (!silent) alert('Súmula salva com sucesso!');
            setUnsavedChanges(false);

            // Update local match baseline to prevent double counting on next save
            setMatch(prev => {
                if (!prev) return null;
                const updatedPlayerStats = Object.keys(stats).map(playerId => {
                    const s = stats[playerId];
                    const existing = prev.playerStats.find(ps => ps.playerId === playerId);
                    const isHome = match?.homeTeam.players.some(hp => hp.id === playerId);
                    const teamId = isHome ? match?.homeTeam.id : match?.awayTeam.id;
                    const isFirstPlayer = match && match[isHome ? 'homeTeam' : 'awayTeam'].players[0].id === playerId;

                    return {
                        ...(existing || { playerId }),
                        goals: s.goals,
                        assists: s.assists,
                        yellowCards: s.yellow,
                        redCards: s.red,
                        // Assign all team fouls to the first player to preserve DB schema without migrating backend
                        fouls: (isFirstPlayer && teamId) ? (teamFoulsState[teamId] || 0) : 0,
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
            <div className="flex flex-col gap-4 mt-4 w-full">
                {teamCards.map(card => {
                    const def = SECRET_CARDS.find(s => s.type === card.type);
                    return (
                        <div key={card.cardId} className={`${def?.color || 'bg-gray-700'} text-white p-4 md:p-5 rounded-2xl flex items-center justify-between gap-4 animate-pulse shadow-xl border border-white/10`}>
                            <div className="flex items-center gap-4">
                                <div className="text-4xl">{def?.icon}</div>
                                <span className="font-black uppercase tracking-widest text-lg md:text-xl">{def?.label}</span>
                            </div>
                            <span className="font-mono bg-black/40 px-6 py-2 rounded-xl text-3xl md:text-4xl font-black text-white shadow-inner tabular-nums">
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
            <div className="flex flex-col gap-4 mt-4 w-full">
                {teamSanctions.map(sanction => {
                    const player = [...match.homeTeam.players, ...match.awayTeam.players].find(p => p.id === sanction.playerId);
                    if (!player) return null;
                    return (
                        <div key={sanction.id} className={`${sanction.type === 'YELLOW' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'} p-4 md:p-5 rounded-2xl flex items-center justify-between gap-4 shadow-xl animate-pulse border border-white/10`}>
                            <div className="flex items-center gap-4">
                                <span className="font-black bg-black/20 px-4 py-2 rounded-xl text-3xl">{player.number}</span>
                                <span className="font-black uppercase tracking-widest text-lg md:text-xl italic">
                                    {sanction.type === 'YELLOW' ? 'CARTÃO AMARELO (2 MIN)' : 'PUNIÇÃO COLETIVA (2 MIN)'}
                                </span>
                            </div>
                            <span className="font-mono bg-black/30 px-6 py-2 rounded-xl text-3xl md:text-4xl font-black shadow-inner tabular-nums">
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
        const teamFouls = teamFoulsState[team.id] || 0;
        const isFoulLimit = teamFouls >= 5;

        return (
            <div className={`bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border-t-8 shadow-2xl transition-all ${isHome ? 'border-yellow-500 shadow-yellow-500/10' : 'border-blue-500 shadow-blue-500/10'}`}>
                {/* Team Header Info (Redesigned & Simplified) */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700/50 shrink-0">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xl md:text-2xl uppercase text-white/50 tracking-tighter">{team.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => openCardModal(team.id)}
                                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl uppercase font-black text-sm md:text-base flex items-center gap-2 shadow-lg transition-all active:scale-95"
                            >
                                <FaBolt size={18} /> USAR CARTA
                            </button>
                            {isFoulLimit && <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-black animate-pulse">TIRO LIVRE!</span>}
                        </div>
                    </div>
                    <div className={`flex flex-col items-end ${isFoulLimit ? 'text-red-500' : 'text-gray-400'} bg-gray-900/60 p-2 rounded-2xl border border-gray-800 shadow-inner`}>
                        <div className="flex items-center gap-3 font-black text-3xl md:text-5xl italic">
                            <button disabled={matchStatus === 'COMPLETED'} onClick={() => setTeamFoulsState(prev => ({ ...prev, [team.id]: Math.max(0, (prev[team.id] || 0) - 1) }))} className="text-gray-500 hover:text-red-500 transition-all font-black px-2">-</button>
                            <FaFlag className={`text-xl md:text-3xl ${isFoulLimit ? 'animate-bounce' : ''}`} />
                            <span className="min-w-[40px] text-center">{teamFouls}</span>
                            <button disabled={matchStatus === 'COMPLETED'} onClick={() => setTeamFoulsState(prev => ({ ...prev, [team.id]: (prev[team.id] || 0) + 1 }))} className="text-gray-500 hover:text-green-500 transition-all font-black px-2">+</button>
                        </div>
                        <span className="text-xs md:text-sm uppercase font-black tracking-widest opacity-60 text-right mt-1 px-4">Faltas Coletivas</span>
                    </div>
                </div>

                {/* Active Cards & Sanctions Area */}
                <div className="flex flex-col gap-3 mb-6 shrink-0">
                    {renderActiveCards(team.id)}
                    {renderActiveSanctions(team.id)}
                </div>

                {/* Player List (Flat Dashboard List Layout) */}
                <div className="flex flex-col gap-1.5 md:gap-2 content-start w-full mt-2">
                    {[...team.players].sort((a, b) => {
                        if (a.isStarter !== b.isStarter) return a.isStarter ? -1 : 1;
                        if (a.position !== b.position) return a.position === 'GOALKEEPER' ? -1 : 1;
                        return a.number - b.number;
                    }).sort((a, b) => {
                        const redA = (stats[a.id]?.red || 0) > 0;
                        const redB = (stats[b.id]?.red || 0) > 0;
                        if (redA !== redB) return redA ? 1 : -1;
                        return 0;
                    }).map(player => {
                        const s = stats[player.id] || { goals: 0, assists: 0, yellow: 0, red: 0, fouls: 0, saves: 0, conceded: 0 };
                        const isKing = activeCards.some(c => c.type === 'KING_PLAYER' && c.targetPlayerId === player.id && c.teamId === team.id);
                        const isExcluded = activeCards.some(c => c.type === 'EXCLUSION' && c.targetPlayerId === player.id && c.teamId !== team.id);
                        const hasRedCard = s.red > 0;
                        const isSanctioned = activeSanctions.some(sanction => sanction.playerId === player.id) || hasRedCard;

                        return (
                            <div key={player.id} className={`group bg-gray-900/40 hover:bg-gray-800 border-b border-gray-800/80 p-1.5 md:p-2 flex flex-row items-center justify-between gap-2 lg:gap-4 transition-all shadow-sm ${isKing ? 'ring-1 ring-yellow-500/50 bg-yellow-900/10' : ''} ${(isExcluded || isSanctioned) ? 'opacity-40 grayscale pointer-events-none' : ''}`}>

                                {/* 1. Player Info (Left aligned) */}
                                <div className="flex items-center gap-2 md:gap-3 w-[140px] md:w-[200px] shrink-0">
                                    <span className={`font-mono font-black text-lg md:text-xl w-6 md:w-8 text-center shrink-0 ${player.position === 'GOALKEEPER' ? 'text-yellow-500' : 'text-gray-500'}`}>{player.number}</span>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className={`truncate font-black text-sm md:text-base uppercase italic tracking-tighter ${hasRedCard ? 'text-red-500' : 'text-gray-100'}`}>{player.name}</div>
                                        {player.position === 'GOALKEEPER' && <span className="text-[8px] md:text-[9px] font-bold text-yellow-600 uppercase tracking-widest leading-none">Goleiro</span>}
                                    </div>
                                    <div className="flex gap-1 shrink-0 ml-1">
                                        {isKing && <FaCrown className="text-yellow-500 text-sm md:text-base" />}
                                        {(isExcluded || isSanctioned) && <span className="bg-red-600 text-white text-[8px] font-black px-1 py-0.5 rounded italic">FORA</span>}
                                    </div>
                                </div>

                                {/* 2. Controls (Right aligned flex-1) */}
                                <div className="flex items-center justify-end gap-1.5 md:gap-3 flex-1">

                                    {/* Goals Control Array */}
                                    <div className="flex items-center bg-black/40 rounded overflow-hidden border border-white/10 h-8 md:h-10 shadow-inner">
                                        <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, 'goals', -1)} className="w-8 md:w-10 h-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white/5 transition-all font-black text-lg">-</button>
                                        <div className="w-6 md:w-8 h-full flex items-center justify-center bg-black/30 border-x border-white/5">
                                            <span className={`font-black text-base md:text-lg ${isKing ? 'text-yellow-400' : 'text-white'}`}>{s.goals}</span>
                                        </div>
                                        <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, 'goals', 1)} className="w-8 md:w-10 h-full flex items-center justify-center text-white bg-green-600/40 hover:bg-green-600/60 transition-all font-black text-lg">+</button>
                                    </div>

                                    {/* Cards (Yellow/Red) */}
                                    <div className="flex gap-1">
                                        <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, 'yellow', 1)} className={`w-8 h-8 md:w-10 md:h-10 flex flex-col items-center justify-center rounded transition-all shadow-md ${s.yellow > 0 ? 'bg-yellow-500 text-black' : 'bg-yellow-500/10 text-yellow-500/30 border border-yellow-500/20'}`}>
                                            <div className="w-2.5 h-3.5 md:w-3 md:h-4 bg-current rounded-[1px] shadow-sm"></div>
                                        </button>
                                        <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, 'red', 1)} className={`w-8 h-8 md:w-10 md:h-10 flex flex-col items-center justify-center rounded transition-all shadow-md ${s.red > 0 ? 'bg-red-600 text-white' : 'bg-red-600/10 text-red-600/30 border border-red-600/20'}`}>
                                            <div className="w-2.5 h-3.5 md:w-3 md:h-4 bg-current rounded-[1px] shadow-sm"></div>
                                        </button>
                                    </div>

                                    {/* Assists/Saves Only (No Fouls) */}
                                    <div className="flex items-center bg-black/40 rounded overflow-hidden border border-white/10 w-9 md:w-12 h-8 md:h-10 shadow-inner">
                                        <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, player.position === 'GOALKEEPER' ? 'saves' : 'assists', 1)} className={`w-full h-full flex flex-col items-center justify-center transition-all ${s.saves > 0 || s.assists > 0 ? 'bg-blue-600/40 text-blue-400' : 'text-gray-500 hover:text-white'}`}>
                                            {player.position === 'GOALKEEPER' ? <FaHandPaper size={10} className="mb-0.5" /> : <FaBolt size={10} className="mb-0.5" />}
                                            <span className="text-[10px] md:text-xs font-black leading-none">{player.position === 'GOALKEEPER' ? s.saves : s.assists}</span>
                                        </button>
                                    </div>

                                </div>
                            </div>
                        );
                    })}

                    {/* Director Entry */}
                    {team.directorName && (
                        <div className="bg-purple-900/20 p-3 md:p-4 rounded-xl border border-purple-500/30 mt-3 flex justify-between items-center shadow-md">
                            <div className="flex items-center gap-3">
                                <FaCrown className="text-purple-400 text-xl md:text-2xl" />
                                <div>
                                    <div className="text-[10px] md:text-xs font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Pênalti do Presidente</div>
                                    <div className="text-lg md:text-xl font-black text-white italic uppercase tracking-tighter">{team.directorName}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1.5 border border-purple-500/20 shadow-inner">
                                <button
                                    onClick={() => setDirectorGoals(prev => ({ ...prev, [team.id]: Math.max(0, (prev[team.id] || 0) - 1) }))}
                                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-purple-400 hover:text-red-500 font-black text-2xl md:text-3xl"
                                >-</button>
                                <span className="text-2xl md:text-3xl font-black text-white min-w-[32px] md:min-w-[40px] text-center">{directorGoals[team.id] || 0}</span>
                                <button
                                    onClick={() => openDirectorModal(team.id)}
                                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-purple-400 hover:text-green-500 font-black text-2xl md:text-3xl"
                                >+</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen bg-[#0a0a0c] text-white flex flex-col ${isFullscreen ? 'p-0' : 'p-2 md:p-4'} transition-all duration-700`}>
            <div className="flex-1 flex flex-col w-full h-screen overflow-y-auto">

                {/* NEW TV SCOREBOARD HEADER */}
                <div className={`sticky top-0 z-[100] w-full bg-gradient-to-b from-black/98 to-transparent backdrop-blur-md transition-all duration-700 ${isFullscreen ? 'pt-8 pb-12' : 'pt-2 pb-6'}`}>
                    <div className="max-w-[1400px] mx-auto flex items-center justify-between px-8 relative">

                        {/* Home Team Card Slots */}
                        <div className="flex gap-2 mr-4 md:mr-8">
                            {[3, 2, 1].map(slot => {
                                const side = 'home';
                                const key = slot === 1 ? 'h1' : slot === 2 ? 'h2' : 'pres';
                                const isUsed = cardUsage[side][key as keyof CardUsage];
                                const isPre = slot === 3;
                                const baseColor = isPre ? 'bg-cyan-400' : 'bg-green-500';

                                return (
                                    <button
                                        key={side + slot}
                                        onClick={() => setCardUsage(prev => ({ ...prev, [side]: { ...prev[side], [key]: !isUsed } }))}
                                        className={`w-8 h-12 md:w-10 md:h-16 rounded transition-all shadow-md flex justify-center items-center ${isUsed ? 'bg-gray-800/80 border-2 border-gray-700 opacity-50' : `${baseColor} border-2 border-white/20 hover:brightness-110 shadow-[0_0_15px_rgba(255,255,255,0.1)]`}`}
                                        title={slot === 1 ? "Carta 1º Tempo" : slot === 2 ? "Carta 2º Tempo" : "Pênalti do Presidente"}
                                    >
                                        {isUsed && <span className="text-gray-400 font-black text-xl md:text-2xl drop-shadow-md">X</span>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* CENTRAL TV SCOREBOARD */}
                        <div className="flex flex-col items-center relative z-10 scale-110 md:scale-125">
                            <div className="flex items-center gap-4 bg-black/80 px-10 py-4 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                                {/* Moving Shine Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shine pointer-events-none"></div>

                                {/* Home Name (Abbr) */}
                                <div className="text-4xl font-black italic tracking-tighter text-white uppercase">{match.homeTeam.name.substring(0, 3)}</div>

                                {/* Home Shield */}
                                <SafeImage src={match.homeTeam.logoUrl} className="w-20 h-20 drop-shadow-2xl" fallbackIcon={<FaShieldAlt size={40} />} />

                                {/* SCORE */}
                                <div className="flex items-center gap-4 md:gap-6 px-6 py-2 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                                    <div className="text-7xl font-mono font-black text-white tabular-nums w-[80px] text-right">{homeScore}</div>
                                    <div className="flex items-center justify-center px-2">
                                        <img src="/logo.png" alt="Futkings" className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                                    </div>
                                    <div className="text-7xl font-mono font-black text-white tabular-nums w-[80px] text-left">{awayScore}</div>
                                </div>

                                {/* Away Shield */}
                                <SafeImage src={match.awayTeam.logoUrl} className="w-20 h-20 drop-shadow-2xl" fallbackIcon={<FaShieldAlt size={40} />} />

                                {/* Away Name (Abbr) */}
                                <div className="text-4xl font-black italic tracking-tighter text-white uppercase">{match.awayTeam.name.substring(0, 3)}</div>
                            </div>

                            {/* SCALING & TIMER BADGES */}
                            {time < 180 ? (
                                /* SCALING PHASE UI (0-3 mins) */
                                <div className="mt-[-25px] flex flex-col items-center z-20 gap-2">
                                    {/* Court Format Badge */}
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-300 drop-shadow-md mb-1">
                                            Formato em Quadra
                                        </span>
                                        <div className="bg-indigo-950/80 px-6 py-2 rounded-2xl border border-indigo-500/30 flex items-center gap-2 shadow-[0_0_20px_rgba(55,48,163,0.5)]">
                                            <FaUsers className="text-blue-400 text-lg md:text-xl" />
                                            <span className="font-black text-xl md:text-2xl text-indigo-200 tracking-wider">
                                                {getPlayersOnCourt()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Next Entry Countdown */}
                                    <div className="flex flex-col items-center mt-2">
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-red-100 drop-shadow-md mb-1 animate-pulse">
                                            Próximo entra em:
                                        </span>
                                        <div className="font-mono text-6xl md:text-8xl font-black text-orange-400 drop-shadow-[0_0_30px_rgba(251,146,60,0.6)] leading-none transition-all">
                                            {60 - (time % 60)}<span className="text-3xl md:text-4xl text-orange-500/80">s</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* NORMAL PHASE UI (4v4) */
                                <div className="mt-[-25px] flex flex-col items-center z-20 gap-2">
                                    {/* Court Format Badge OR Double Goal Warning */}
                                    <div className="flex flex-col items-center">
                                        {time >= 1080 ? (
                                            <>
                                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-red-500 drop-shadow-md mb-1 animate-pulse">
                                                    Atenção
                                                </span>
                                                <div className="bg-red-950/80 px-6 py-2 rounded-2xl border border-red-500 flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse">
                                                    <FaBolt className="text-yellow-400 text-lg md:text-xl" />
                                                    <span className="font-black text-xl md:text-2xl text-red-400 tracking-wider">
                                                        GOLS VALEM 2!
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 drop-shadow-md mb-1">
                                                    Formato em Quadra
                                                </span>
                                                <div className="bg-black/90 px-6 py-2 rounded-2xl border border-yellow-500/30 flex items-center gap-2 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                                                    <FaUsers className="text-yellow-500 text-lg md:text-xl" />
                                                    <span className="font-black text-xl md:text-2xl text-yellow-400 tracking-wider">
                                                        {getPlayersOnCourt()}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Game Time (Big Orange Style) */}
                                    <div className="flex flex-col items-center mt-2">
                                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-yellow-100/50 drop-shadow-md mb-1 flex items-center gap-2">
                                            <FaStopwatch className={isRunning ? 'animate-pulse text-orange-400' : 'text-gray-500'} /> Tempo de Jogo
                                        </span>
                                        <div className={`font-mono text-6xl md:text-8xl font-black transition-all flex items-end leading-none ${time >= 1080 ? 'text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]' : 'text-orange-400 drop-shadow-[0_0_30px_rgba(251,146,60,0.6)]'}`}>
                                            {formatTime(time)}
                                            {extraTime > 0 && <span className={`text-3xl md:text-4xl ml-2 mb-1 ${time >= 1080 ? 'text-red-400/80' : 'text-orange-500/80'}`}>+{extraTime}'</span>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Away Team Card Slots */}
                        <div className="flex gap-2 ml-4 md:ml-8">
                            {[1, 2, 3].map(slot => {
                                const side = 'away';
                                const key = slot === 1 ? 'h1' : slot === 2 ? 'h2' : 'pres';
                                const isUsed = cardUsage[side][key as keyof CardUsage];
                                const isPre = slot === 3;
                                const baseColor = isPre ? 'bg-cyan-400' : 'bg-green-500';

                                return (
                                    <button
                                        key={side + slot}
                                        onClick={() => setCardUsage(prev => ({ ...prev, [side]: { ...prev[side], [key]: !isUsed } }))}
                                        className={`w-8 h-12 md:w-10 md:h-16 rounded transition-all shadow-md flex justify-center items-center ${isUsed ? 'bg-gray-800/80 border-2 border-gray-700 opacity-50' : `${baseColor} border-2 border-white/20 hover:brightness-110 shadow-[0_0_15px_rgba(255,255,255,0.1)]`}`}
                                        title={slot === 1 ? "Carta 1º Tempo" : slot === 2 ? "Carta 2º Tempo" : "Pênalti do Presidente"}
                                    >
                                        {isUsed && <span className="text-gray-400 font-black text-xl md:text-2xl drop-shadow-md">X</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Exit Fullscreen Button (Floating) - Subtle when in FS */}
                    {isFullscreen && (
                        <button
                            onClick={toggleFullscreen}
                            className="fixed top-8 right-8 z-[110] bg-black/50 text-white/50 hover:text-white p-4 rounded-full hover:bg-black/80 transition-all opacity-20 hover:opacity-100"
                        >
                            <FaTimes size={32} />
                        </button>
                    )}
                </div>

                {/* Floating Navigation Controls (Only visible when NOT in TV mode, or subtle overlay in TV mode) */}
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-4 bg-black/80 backdrop-blur-2xl px-8 py-4 rounded-3xl border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.8)] transition-all duration-500 ${isFullscreen ? ((!isRunning || time === 0) ? 'opacity-90 scale-100 translate-y-0' : 'opacity-10 hover:opacity-100 scale-90 translate-y-2') : 'opacity-100'}`}>
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white p-3 hover:bg-white/10 rounded-2xl transition-all">
                        <FaArrowLeft size={24} />
                    </button>

                    <div className="h-8 w-px bg-white/10 mx-2"></div>

                    {/* Main Action: START/PAUSE */}
                    <button
                        onClick={toggleTimer}
                        className={`flex items-center gap-4 px-10 py-4 rounded-2xl font-black text-xl transition-all active:scale-95 shadow-2xl ${isRunning
                            ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/20'
                            : 'bg-green-600 text-white hover:bg-green-500 shadow-green-600/20 animate-pulse'
                            }`}
                    >
                        {isRunning ? <FaPause /> : <FaPlay />}
                        <span>{isRunning ? 'PAUSAR' : (time === 0 ? 'INICIAR' : 'RETOMAR')}</span>
                    </button>

                    {/* Period/Extra Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={startNextPeriod}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/5 transition-all"
                        >
                            {period === 1 ? 'FIM 1ºT' : 'PRÓXIMO'}
                        </button>
                        <button onClick={addExtraTime} className="bg-yellow-600/20 text-yellow-500 hover:bg-yellow-600/30 p-4 rounded-2xl border border-yellow-600/20 transition-all font-black">
                            +1'
                        </button>
                    </div>

                    <div className="h-8 w-px bg-white/10 mx-2"></div>

                    <button
                        onClick={toggleFullscreen}
                        className="flex items-center gap-3 px-6 py-4 rounded-2xl font-black bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all border border-blue-600/30"
                    >
                        <FaExpand /> {isFullscreen ? 'ADMIN' : 'TV MODE'}
                    </button>

                    <button
                        onClick={() => handleSave()}
                        className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${unsavedChanges
                            ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                            : 'bg-green-700/40 text-green-400'
                            }`}
                    >
                        <FaSave /> SALVAR
                    </button>

                    {matchStatus === 'LIVE' && (
                        <button
                            onClick={handleMatchFinalize}
                            className="bg-red-900/40 text-red-500 hover:bg-red-600 hover:text-white px-6 py-4 rounded-2xl font-black text-sm uppercase transition-all"
                        >
                            ENCERRAR
                        </button>
                    )}
                </div>



                <div className={`w-full max-w-none px-2 lg:px-4 xl:px-6 2xl:px-8 mx-auto grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-8 pb-32 transition-all duration-500`}>

                    {/* Left Column (Home Team) */}
                    <div className="h-fit">
                        {renderTeamScout(match.homeTeam, true)}
                    </div>

                    {/* Right Column (Away Team) */}
                    <div className="h-fit">
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

                {/* Penalty FutKings Modal */}
                {isPenaltyFutkingsModalOpen && match && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md relative text-center">
                            <div className="animate-pulse mb-6">
                                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600 uppercase italic">
                                    Penalti Futkings
                                </h2>
                                <div className="flex justify-center mt-2">
                                    <FaBullseye className="text-indigo-500 text-4xl" />
                                </div>
                            </div>

                            <p className="text-gray-400 mb-4 text-sm uppercase tracking-widest font-bold">
                                Time: {penaltyFutkingsTeamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}
                            </p>

                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={() => {
                                        setIsPenaltyFutkingsModalOpen(false);
                                        setPenaltyFutkingsTeamId(null);
                                    }}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-4 rounded-xl shadow-lg border border-gray-600 transition-all hover:scale-105 uppercase"
                                >
                                    ERROU
                                </button>
                                <button
                                    onClick={() => {
                                        if (penaltyFutkingsTeamId) {
                                            const team = penaltyFutkingsTeamId === match.homeTeam.id ? match.homeTeam : match.awayTeam;
                                            setDirectorGoals(prev => ({
                                                ...prev,
                                                [penaltyFutkingsTeamId]: (prev[penaltyFutkingsTeamId] || 0) + 1
                                            }));

                                            // AUTOMATICALLY Increment Opposing Goalkeeper Conceded Goals
                                            const opposingTeam = penaltyFutkingsTeamId === match.homeTeam.id ? match.awayTeam : match.homeTeam;
                                            const opposingGk = opposingTeam.players.find(p => p.position === 'GOALKEEPER');
                                            if (opposingGk) {
                                                setStats(prev => ({
                                                    ...prev,
                                                    [opposingGk.id]: {
                                                        ...(prev[opposingGk.id] || { goals: 0, assists: 0, yellow: 0, red: 0, fouls: 0, saves: 0, conceded: 0 }),
                                                        conceded: (prev[opposingGk.id]?.conceded || 0) + 1
                                                    }
                                                }));
                                            }

                                            setGoalAnimation({
                                                isOpen: true,
                                                teamName: team?.name,
                                                teamLogo: team?.logoUrl,
                                                goalValue: 1
                                            });
                                            setUnsavedChanges(true);
                                        }
                                        setIsPenaltyFutkingsModalOpen(false);
                                        setPenaltyFutkingsTeamId(null);
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg border border-indigo-400 transition-all hover:scale-110 uppercase"
                                >
                                    GOL !!!
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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

                <GoalAnimation
                    {...goalAnimation}
                    onClose={() => setGoalAnimation(prev => ({ ...prev, isOpen: false }))}
                />

                {isSponsorModalOpen && (
                    <SponsorCarousel onClose={() => setIsSponsorModalOpen(false)} />
                )}
            </div>
        </div>
    );
};

export default MatchSheet;
