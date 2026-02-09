import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaSave, FaArrowLeft, FaFlag, FaPlay, FaPause, FaPlus, FaCrown, FaBan, FaStar, FaBolt, FaTimes, FaHandPaper, FaUsers, FaExpand, FaRedo } from 'react-icons/fa';

interface Player {
    id: string;
    name: string;
    number: number;
    position: 'GOALKEEPER' | 'FIELD';
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
}

// Secret Cards Types
type CardType = 'KING_PLAYER' | 'LESS_ONE' | 'DOUBLE_GOAL' | 'GK_SURPRISE' | 'EXCLUSION';

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
    { id: 'king', type: 'KING_PLAYER', label: 'Jogador King', description: 'Gols valem o dobro por 2 min', icon: <FaCrown />, color: 'bg-yellow-500', duration: 120 },
    { id: 'less_one', type: 'LESS_ONE', label: 'Adversário -1', description: 'Retira 1 jogador adversário por 2 min', icon: <FaBan />, color: 'bg-red-500', duration: 120 },
    { id: 'double_goal', type: 'DOUBLE_GOAL', label: 'Gol em Dobro', description: 'Todos os gols valem 2 por 2 min', icon: <FaStar />, color: 'bg-purple-500', duration: 120 },
    { id: 'gk_surprise', type: 'GK_SURPRISE', label: 'Goleiro Surpresa', description: 'Adversário troca GK por linha por 2 min', icon: <FaHandPaper />, color: 'bg-orange-500', duration: 120 },
    { id: 'exclusion', type: 'EXCLUSION', label: 'Exclusão', description: 'Retira jogador específico por 2 min', icon: <FaBolt />, color: 'bg-indigo-500', duration: 120 },
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

    // Derived State for Scores
    const calculateTeamScore = (teamPlayers: Player[]) => {
        return teamPlayers.reduce((acc, p) => acc + (stats[p.id]?.goals || 0), 0);
    };

    const homeScore = match ? calculateTeamScore(match.homeTeam.players) : 0;
    const awayScore = match ? calculateTeamScore(match.awayTeam.players) : 0;

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

    const toggleTimer = () => {
        if (matchStatus === 'COMPLETED') return; // Prevent unlocking

        // Check if time is already at max
        const maxTime = (20 + extraTime) * 60;
        if (time >= maxTime) return;

        setIsRunning(!isRunning);
        if (!isRunning && matchStatus === 'SCHEDULED') {
            setMatchStatus('LIVE');
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
                        }
                    });
                }
                setStats(initialStats);
            }
        } catch (error) {
            console.error("Error fetching match:", error);
            alert("Erro ao carregar partida.");
        }
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
        if (delta > 0 && match && teamId) {
            if (type === 'yellow' || type === 'red') {
                const now = Date.now();
                const newSanction: Sanction = {
                    id: Math.random().toString(36).substr(2, 9),
                    playerId,
                    teamId,
                    type: type as 'YELLOW' | 'RED',
                    startTime: now,
                    endTime: now + (120 * 1000) // 2 minutes
                };
                setActiveSanctions(prev => [...prev, newSanction]);
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
        return teamPlayers.reduce((acc, p) => acc + (stats[p.id]?.fouls || 0), 0);
    };

    // Calculate Players On Court (Dynamic Start)
    const getPlayersOnCourt = () => {
        // Based on time (Count Up)
        // 0-60s: 1v1 (for BOTH periods)

        if (time < 60) return "1 vs 1";
        if (time < 120) return "2 vs 2";
        if (time < 180) return "3 vs 3";
        if (time < 240) return "4 vs 4";
        return "5 vs 5 (COMPLETO)";
    };

    const handleSave = async () => {
        try {
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
                // ... other stats
            });

            await api.put(`/matches/${id}`, {
                homeScore,
                awayScore,
                status: matchStatus,
                events: diffEvents
            });

            alert('Súmula salva com sucesso!');
            setUnsavedChanges(false);
            fetchMatch();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar. Tente novamente.');
        }
    };

    const handleMatchFinalize = async () => {
        if (!window.confirm('Tem certeza que deseja FINALIZAR a partida? Isso encerrará o jogo e contabilizará as estatísticas.')) return;

        try {
            await api.put(`/matches/${id}`, {
                homeScore,
                awayScore,
                status: 'COMPLETED',
                events: []
            });

            alert('Partida finalizada com sucesso!');
            setMatchStatus('COMPLETED');
            setIsRunning(false);
            setUnsavedChanges(false);

            if (match?.championshipId) {
                navigate(`/championships/${match.championshipId}`);
            } else {
                navigate('/dashboard');
            }

        } catch (error) {
            console.error(error);
            alert('Erro ao finalizar partida.');
        }
    };

    if (!match) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;

    const renderActiveCards = (teamId: string) => {
        const teamCards = activeCards.filter(c => c.teamId === teamId);
        // Only return if there are cards
        if (teamCards.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {teamCards.map(card => {
                    const def = SECRET_CARDS.find(s => s.type === card.type);
                    return (
                        <div key={card.cardId} className={`${def?.color || 'bg-gray-700'} text-white px-2 py-1 rounded-md flex items-center gap-2 text-xs font-bold animate-pulse shadow-lg`}>
                            {def?.icon}
                            <span>{def?.label}</span>
                            <span className="font-mono bg-black/20 px-1 rounded">{formatCardTimer(card.endTime)}</span>
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
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {teamSanctions.map(sanction => {
                    const player = [...match.homeTeam.players, ...match.awayTeam.players].find(p => p.id === sanction.playerId);
                    if (!player) return null;
                    return (
                        <div key={sanction.id} className={`${sanction.type === 'YELLOW' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'} px-2 py-1 rounded-md flex items-center gap-2 text-xs font-bold shadow-lg animate-pulse`}>
                            <span className="font-black bg-black/20 px-1 rounded text-[10px]">{player.number}</span>
                            <span>{sanction.type === 'YELLOW' ? 'Temp' : 'Expulso'}</span>
                            <span className="font-mono bg-black/20 px-1 rounded">{formatCardTimer(sanction.endTime)}</span>
                        </div>
                    );
                })}
            </div>
        );
    }

    const renderCardModal = () => {
        if (!isCardModalOpen) return null;
        const team = selectedTeamForCard === match.homeTeam.id ? match.homeTeam : match.awayTeam;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
                    <button onClick={() => setIsCardModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><FaTimes size={24} /></button>

                    <div className="p-6">
                        <h2 className="text-2xl font-black uppercase text-white mb-6 text-center">
                            {cardStep === 'SELECT_CARD' ? 'Selecionar Carta Secreta' : `Escolher Jogador: ${selectedCardType?.label}`}
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
                                {team.players.map(p => (
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
                        <img src={team.logoUrl || '/placeholder-shield.png'} className="w-10 h-10 rounded-full bg-gray-700" alt={team.name} />
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
                    {team.players.map(player => {
                        const s = stats[player.id] || { goals: 0, assists: 0, yellow: 0, red: 0, fouls: 0, saves: 0, conceded: 0 };
                        // Check if player is target of active King Card
                        const isKing = activeCards.some(c => c.type === 'KING_PLAYER' && c.targetPlayerId === player.id && c.teamId === team.id);
                        // Check if player is Excluded or Sanctioned
                        const isExcluded = activeCards.some(c => c.type === 'EXCLUSION' && c.targetPlayerId === player.id && c.teamId !== team.id);
                        const isSanctioned = activeSanctions.some(sanction => sanction.playerId === player.id);

                        return (
                            <div key={player.id} className={`group bg-gray-900/40 hover:bg-gray-800 p-2 rounded flex flex-col gap-2 border-b border-gray-800 transition-all ${isKing ? 'ring-1 ring-yellow-500 bg-yellow-900/10' : ''} ${(isExcluded || isSanctioned) ? 'opacity-50 grayscale' : ''}`}>

                                {/* Row 1: Player Info */}
                                <div className="flex items-center gap-2 w-full">
                                    <span className={`font-mono font-bold text-base min-w-[24px] text-center ${player.position === 'GOALKEEPER' ? 'text-yellow-500' : 'text-gray-400'}`}>{player.number}</span>
                                    <span className="truncate font-bold text-base text-gray-100 group-hover:text-white flex-1" title={player.name}>{player.name}</span>

                                    {isKing && <FaCrown size={12} className="text-yellow-500 flex-shrink-0 animate-pulse" />}
                                    {(isExcluded || isSanctioned) && <span className="text-[10px] bg-red-600 px-1 rounded text-white font-bold">OUT</span>}
                                </div>

                                {/* Row 2: Stats Controls (Distributed) */}
                                <div className="flex items-center justify-between w-full pl-8 pr-2">

                                    {/* Goals */}
                                    <div className="flex items-center gap-1 bg-black/20 rounded px-1" title="Gols">
                                        <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, 'goals', -1)} className="text-gray-500 hover:text-red-500 disabled:opacity-30 text-xs px-1 font-bold">-</button>
                                        <span className={`font-bold text-sm min-w-[16px] text-center ${isKing ? 'text-yellow-400' : 'text-white'}`}>{s.goals}</span>
                                        <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, 'goals', 1)} className="text-gray-500 hover:text-green-500 disabled:opacity-30 text-xs px-1 font-bold">+</button>
                                    </div>

                                    {/* Cards */}
                                    <div className="flex items-center gap-2 border-l border-gray-700 pl-2">
                                        <button
                                            disabled={matchStatus === 'COMPLETED'}
                                            onClick={() => updateStat(player.id, 'yellow', 1)}
                                            className={`w-3 h-5 rounded-[1px] bg-yellow-500 hover:opacity-80 disabled:opacity-30 ${s.yellow > 0 ? 'ring-1 ring-white' : 'opacity-40'}`}
                                            title="+ Amarelo"
                                        ></button>
                                        <button
                                            disabled={matchStatus === 'COMPLETED'}
                                            onClick={() => updateStat(player.id, 'red', 1)}
                                            className={`w-3 h-5 rounded-[1px] bg-red-600 hover:opacity-80 disabled:opacity-30 ${s.red > 0 ? 'ring-1 ring-white' : 'opacity-40'}`}
                                            title="+ Vermelho"
                                        ></button>
                                    </div>

                                    {/* Fouls */}
                                    <div className="flex items-center gap-1 border-l border-gray-700 pl-2" title="Faltas">
                                        <span className="text-[10px] text-gray-500 font-bold mr-1">F</span>
                                        <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, 'fouls', 1)} className={`text-xs hover:text-white disabled:opacity-30 ${s.fouls > 0 ? 'text-red-400 font-bold' : 'text-gray-600'}`}>
                                            {s.fouls > 0 ? s.fouls : '+'}
                                        </button>
                                    </div>

                                    {/* Assists/Saves */}
                                    {player.position === 'GOALKEEPER' ? (
                                        <div className="flex items-center gap-1 border-l border-gray-700 pl-2" title="Defesas Difíceis">
                                            <span className="text-[10px] text-gray-500 font-bold mr-1">DD</span>
                                            <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, 'saves', 1)} className={`text-xs hover:text-blue-400 disabled:opacity-30 ${s.saves > 0 ? 'text-blue-400 font-bold' : 'text-gray-600'}`}>
                                                {s.saves > 0 ? s.saves : '+'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 border-l border-gray-700 pl-2" title="Assistências">
                                            <span className="text-[10px] text-gray-500 font-bold mr-1">A</span>
                                            <button disabled={matchStatus === 'COMPLETED'} onClick={() => updateStat(player.id, 'assists', 1)} className={`text-xs hover:text-white disabled:opacity-30 ${s.assists > 0 ? 'text-green-400 font-bold' : 'text-gray-600'}`}>
                                                {s.assists > 0 ? s.assists : '+'}
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </div>
                        );
                    })}
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
                        onClick={handleSave}
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

            {/* Left Vertical Banner (Fixed Position - 3 Stacked Squares) */}
            <div className="hidden min-[1900px]:flex flex-col gap-4 w-[300px] fixed top-24 left-4 z-10 transition-all duration-500">
                {/* 1 */}
                <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group shadow-2xl hover:scale-105 relative overflow-hidden">
                    <span className="text-gray-600 font-bold group-hover:text-white transition-colors tracking-widest text-xl">PUB 1</span>
                    <img src="/sponsors/publicidade1.png" alt="Publicidade 1" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                {/* 2 */}
                <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group shadow-2xl hover:scale-105 relative overflow-hidden">
                    <span className="text-gray-600 font-bold group-hover:text-white transition-colors tracking-widest text-xl">PUB 2</span>
                    <img src="/sponsors/publicidade2.png" alt="Publicidade 2" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                {/* 3 */}
                <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group shadow-2xl hover:scale-105 relative overflow-hidden">
                    <span className="text-gray-600 font-bold group-hover:text-white transition-colors tracking-widest text-xl">PUB 3</span>
                    <img src="/sponsors/publicidade3.png" alt="Publicidade 3" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
            </div>

            {/* Right Vertical Banner (Fixed Position - 3 Stacked Squares) */}
            <div className="hidden min-[1900px]:flex flex-col gap-4 w-[300px] fixed top-24 right-4 z-10 transition-all duration-500">
                {/* 4 */}
                <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group shadow-2xl hover:scale-105 relative overflow-hidden">
                    <span className="text-gray-600 font-bold group-hover:text-white transition-colors tracking-widest text-xl">PUB 4</span>
                    <img src="/sponsors/publicidade4.png" alt="Publicidade 4" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                {/* 5 */}
                <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group shadow-2xl hover:scale-105 relative overflow-hidden">
                    <span className="text-gray-600 font-bold group-hover:text-white transition-colors tracking-widest text-xl">PUB 5</span>
                    <img src="/sponsors/publicidade5.png" alt="Publicidade 5" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
                {/* 6 */}
                <div className="w-full aspect-square bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer group shadow-2xl hover:scale-105 relative overflow-hidden">
                    <span className="text-gray-600 font-bold group-hover:text-white transition-colors tracking-widest text-xl">PUB 6</span>
                    <img src="/sponsors/publicidade6.png" alt="Publicidade 6" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
            </div>

            <div className="max-w-[1250px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_1fr] gap-6 px-4">

                {/* Left/Right Columns (Teams) - Code is below in other chunks, this updates container grid only */}

                {/* Center / Scoreboard */}
                <div className="lg:col-start-2 order-1 lg:order-2">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-2xl text-center sticky top-24">

                        {/* ... (Timer/Scoreboard content unchanged for now, will scale automatically) ... */}
                        {/* Copy existing content logic but ensure container is flexible */}

                        {/* Dynamic Start / Players on Court Indicator */}
                        {time < 240 && (
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
                                <div className="text-6xl font-mono font-black text-yellow-500 drop-shadow-lg mb-4">
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

                        {/* End of Period Actions */}
                        {(!isRunning && time >= 1200 && period === 1) && (
                            <div className="mb-8 animate-bounce">
                                <button
                                    onClick={startNextPeriod}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-wider shadow-lg flex items-center gap-3 mx-auto text-lg"
                                >
                                    <FaRedo /> Iniciar 2º Tempo
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-4">
                            <div className="text-center">
                                <img src={match.homeTeam.logoUrl || '/placeholder-shield.png'} className="w-24 h-24 mx-auto mb-3 filter drop-shadow-lg" />
                                <h2 className="font-bold text-2xl leading-none">{match.homeTeam.name}</h2>
                            </div>
                            <span className="text-gray-600 font-bold text-2xl opacity-50">VS</span>
                            <div className="text-center">
                                <img src={match.awayTeam.logoUrl || '/placeholder-shield.png'} className="w-24 h-24 mx-auto mb-3 filter drop-shadow-lg" />
                                <h2 className="font-bold text-2xl leading-none">{match.awayTeam.name}</h2>
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

                        {/* Finalize Match Button - Only visible after 2nd Half ends */}
                        {matchStatus !== 'COMPLETED' && !isRunning && period >= 2 && time >= ((20 + extraTime) * 60) && (
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


            {renderCardModal()}
        </div >
    );
};

export default MatchSheet;
