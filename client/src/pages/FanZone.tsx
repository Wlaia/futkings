import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaTrophy, FaCalendarAlt, FaSignInAlt, FaStar, FaFire, FaFutbol, FaHandPaper, FaTimes } from 'react-icons/fa';
import { SPONSORS, SUPPORTERS } from '../constants/sponsors';
import { getLogoUrl } from '../utils/imageHelper';
import GoalAnimation from '../components/GoalAnimation';

interface Championship {
    id: string;
    name: string;
    logoUrl?: string;
    status: 'ACTIVE' | 'COMPLETED' | 'DRAFT';
    type: string;
}

interface Team {
    id: string;
    name: string;
    logoUrl?: string;
}

interface Player {
    id: string;
    name: string;
    teamId: string;
    avatarUrl?: string;
}

interface Match {
    id: string;
    homeTeam?: Team;
    awayTeam?: Team;
    homeScore: number;
    awayScore: number;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
    startTime: string;
    championship?: { name: string };
    elapsedTime?: number;
    activeEvents?: any[];
    playerStats?: {
        player: Player;
        goals: number;
        yellowCards: number;
        redCards: number;
    }[];
}

// Map Card Types
const CARD_CONFIG: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
    'KING_PLAYER': { label: 'King', color: 'bg-yellow-500 text-black', icon: <FaStar /> },
    'DOUBLE_GOAL': { label: 'Dobro', color: 'bg-purple-500 text-white', icon: <FaStar /> },
    'EXCLUSION': { label: 'Exclusão', color: 'bg-red-500 text-white', icon: <FaFire /> },
    'GK_SURPRISE': { label: 'Goleiro S.', color: 'bg-orange-500 text-white', icon: <FaHandPaper /> },
    'PENALTY_FUTKINGS': { label: 'Shootout', color: 'bg-indigo-500 text-white', icon: <FaFutbol /> }
};

interface Standing {
    rank: number;
    id: string;
    name: string;
    logoUrl?: string;
    points: number;
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    yellowCards: number;
    redCards: number;
}

interface PlayerStat {
    id: string;
    name: string;
    team: { name: string; logoUrl?: string };
    goals?: number;
    goalsConceded?: number;
    matchesPlayed?: number;
}

const FanZone: React.FC = () => {
    const navigate = useNavigate();
    const [activeChampionships, setActiveChampionships] = useState<Championship[]>([]);
    const [featuredMatch, setFeaturedMatch] = useState<Match | null>(null);
    const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
    const [standings, setStandings] = useState<Standing[]>([]);
    const [topScorers, setTopScorers] = useState<PlayerStat[]>([]);
    const [topGoalkeepers, setTopGoalkeepers] = useState<PlayerStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    // Local ticker for the LIVE match
    const [localTime, setLocalTime] = useState(0);

    // Goal Animation State
    const prevScoresRef = useRef<{ home: number, away: number }>({ home: 0, away: 0 });
    const prevPlayerStatsRef = useRef<Record<string, number>>({});
    const isFirstFetchRef = useRef(true);
    const [goalAnimation, setGoalAnimation] = useState<{
        isOpen: boolean;
        teamName?: string;
        teamLogo?: string;
        playerName?: string;
        playerAvatar?: string;
        goalValue?: number;
    }>({ isOpen: false });

    const fetchData = async () => {
        try {
            const [champsRes, matchesRes] = await Promise.all([
                api.get('/public/championships/public-list'),
                api.get('/public/matches/public-list')
            ]);

            // Safe assignment with filtering for null/undefined items
            const matchesData = Array.isArray(matchesRes.data) ? matchesRes.data.filter((m: any) => m) : [];
            const championshipsData = Array.isArray(champsRes.data) ? champsRes.data.filter((c: any) => c) : [];

            setActiveChampionships(championshipsData);

            let featured: Match | null = null;
            if (matchesData.length > 0) {
                // Priority: Latest LIVE match, then next upcoming match
                const liveMatches = matchesData.filter((m: Match) => m.status === 'LIVE');

                if (liveMatches.length > 0) {
                    // Sort by startTime desc if available
                    featured = liveMatches.sort((a: Match, b: Match) => {
                        const dateA = a.startTime ? new Date(a.startTime).getTime() : 0;
                        const dateB = b.startTime ? new Date(b.startTime).getTime() : 0;
                        return dateB - dateA;
                    })[0];
                } else {
                    featured = matchesData[0]; // First upcoming or recent
                }
                setFeaturedMatch(featured);

                if (featured && featured.status === 'LIVE' && featured.elapsedTime !== undefined) {
                    const fMatch = featured;
                    // Sync local time but allow it to have slightly ticked forward if we were already ticking
                    setLocalTime(prev => Math.max(prev, fMatch.elapsedTime || 0));

                    // Detection logic for GOOOOOL animation
                    if (!isFirstFetchRef.current) {
                        const homeScoreInc = featured.homeScore > prevScoresRef.current.home;
                        const awayScoreInc = featured.awayScore > prevScoresRef.current.away;

                        if (homeScoreInc || awayScoreInc) {
                            // Try to find the specific player who scored by comparing stats
                            let scorer = null;
                            if (featured.playerStats) {
                                scorer = featured.playerStats.find((ps: any) => {
                                    const prevGoals = prevPlayerStatsRef.current[ps.playerId] || 0;
                                    return ps.goals > prevGoals;
                                })?.player;
                            }

                            const team = homeScoreInc ? featured.homeTeam : featured.awayTeam;
                            const diff = homeScoreInc
                                ? featured.homeScore - prevScoresRef.current.home
                                : featured.awayScore - prevScoresRef.current.away;

                            setGoalAnimation({
                                isOpen: true,
                                teamName: team?.name,
                                teamLogo: team?.logoUrl,
                                playerName: scorer?.name,
                                playerAvatar: scorer?.avatarUrl,
                                goalValue: diff
                            });
                        }
                    }

                    // Update refs
                    prevScoresRef.current = {
                        home: featured.homeScore,
                        away: featured.awayScore
                    };

                    if (featured.playerStats) {
                        const newStats: Record<string, number> = {};
                        featured.playerStats.forEach((ps: any) => {
                            newStats[ps.playerId] = ps.goals;
                        });
                        prevPlayerStatsRef.current = newStats;
                    }

                    isFirstFetchRef.current = false;
                } else {
                    setLocalTime(0);
                    // Also reset trackers if no live match to ensure fresh start when one begins
                    prevScoresRef.current = { home: 0, away: 0 };
                    prevPlayerStatsRef.current = {}; // Reset player stats tracker
                    isFirstFetchRef.current = true;
                }

                // Upcoming Matches (excluding featured if it's scheduled)
                const upcoming = matchesData.filter((m: Match) =>
                    m.status === 'SCHEDULED' && m.id !== featured?.id
                ).slice(0, 5); // Take next 5
                setUpcomingMatches(upcoming);

            } else {
                setFeaturedMatch(null);
                setUpcomingMatches([]);
            }

            // Fetch Standings and Stats for the first active championship or the featured match's championship
            let champIdToFetch = null;
            if (featured?.championship) {
                // Try to find championship ID from active list matching name
                const champ = championshipsData.find((c: Championship) => c.name === featured.championship?.name);
                if (champ) champIdToFetch = champ.id;
            }

            if (!champIdToFetch && championshipsData.length > 0) {
                // Default to first active if any
                const active = championshipsData.find((c: Championship) => c.status === 'ACTIVE');
                if (active) champIdToFetch = active.id;
            }

            if (champIdToFetch) {
                const [standingsRes, statsRes] = await Promise.all([
                    api.get(`/championships/${champIdToFetch}/standings`),
                    api.get(`/championships/${champIdToFetch}/stats`)
                ]);
                setStandings(standingsRes.data.slice(0, 5)); // Top 5
                setTopScorers(statsRes.data.topScorers || []);
                setTopGoalkeepers(statsRes.data.topGoalkeepers || []);
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching Fan Zone data", error);
            setError("Failed to load data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Local Clock Effect
    useEffect(() => {
        let clockId: ReturnType<typeof setInterval>;
        if (featuredMatch?.status === 'LIVE') {
            clockId = setInterval(() => {
                setLocalTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(clockId);
    }, [featuredMatch?.status]);

    // Sponsors & Supporters imported from constants

    const formatTime = (seconds?: number) => {
        if (!seconds) return '00:00';
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

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Em Andamento';
            case 'COMPLETED': return 'Finalizado';
            case 'DRAFT': return 'Inscrições Abertas';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-yellow-600 text-black';
            case 'COMPLETED': return 'bg-green-600 text-white';
            case 'DRAFT': return 'bg-blue-600 text-white';
            default: return 'bg-gray-600';
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.onerror = null; // Prevent infinite loop
        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-shield'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'%3E%3C/path%3E%3C/svg%3E";
    };

    if (error) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
                <div className="text-center p-6">
                    <h2 className="text-3xl font-bold mb-4">Ops! Algo deu errado.</h2>
                    <p className="text-gray-400 mb-6">Não foi possível carregar o Fan Zone.</p>
                    <button onClick={() => window.location.reload()} className="bg-yellow-500 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-400 transition">
                        Tentar Novamente
                    </button>
                    <button onClick={() => navigate('/login')} className="block mt-4 text-gray-500 hover:text-white mx-auto text-sm underline">
                        Ir para Área Restrita
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-x-hidden">

            {/* Top Navigation */}
            <nav className="fixed w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Futkings" className="h-10 w-auto" />
                    <span className="text-xl font-black italic tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 hidden md:block">
                        Futkings <span className="text-white not-italic font-light">FanZone</span>
                    </span>
                </div>
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/10 hover:border-yellow-500/50"
                >
                    <FaSignInAlt /> <span className="hidden md:inline">Área Restrita</span>
                </button>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-12 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-900/20 to-[#0f172a] z-0 pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-yellow-500/10 blur-[120px] rounded-full z-0 pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in-up">
                        <FaFire /> O Palco dos Campeões
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black mb-6 leading-tight tracking-tighter animate-fade-in-up delay-100">
                        ACOMPANHE <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">CADA LANCE</span>
                    </h1>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-24 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

                {/* Left Column: Featured Match & Agenda */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Live / Featured Match */}
                    <section>
                        {loading && !featuredMatch ? (
                            <div className="animate-pulse flex justify-center">
                                <div className="h-64 w-full bg-gray-800 rounded-3xl"></div>
                            </div>
                        ) : featuredMatch && featuredMatch.homeTeam && featuredMatch.awayTeam ? (
                            <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-1 shadow-2xl overflow-hidden group">
                                <div className="bg-gray-900/50 backdrop-blur-xl p-6 md:p-8 rounded-[20px] relative overflow-hidden">
                                    {/* Effects */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
                                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

                                    <div className="text-center text-xs text-gray-400 uppercase tracking-widest mb-6">
                                        {featuredMatch.championship?.name || 'Amistoso Oficial'}
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                        {/* Home Team */}
                                        <div className="text-center md:text-right flex-1 w-full">
                                            <img
                                                src={getLogoUrl(featuredMatch.homeTeam?.logoUrl)}
                                                className="w-16 h-16 md:w-20 md:h-20 mx-auto md:ml-auto md:mr-0 mb-3 drop-shadow-xl object-contain"
                                                alt={featuredMatch.homeTeam?.name}
                                                onError={handleImageError}
                                            />
                                            <h3 className="text-xl font-black uppercase italic tracking-tighter truncate">{featuredMatch.homeTeam?.name}</h3>
                                        </div>

                                        {/* Score / VS */}
                                        <div className="flex flex-col items-center px-4 shrink-0 relative">
                                            {featuredMatch.status === 'LIVE' ? (
                                                <div className="flex flex-col items-center gap-1 mb-2">
                                                    <div className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full animate-pulse border border-red-500/20">
                                                        • AO VIVO •
                                                    </div>
                                                    <div className="text-2xl font-mono font-black text-yellow-500 bg-black/50 px-4 py-1.5 rounded-xl border border-yellow-500/30 shadow-inner">
                                                        {formatTime(localTime)}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm font-bold text-gray-400 bg-gray-800 border border-gray-700 px-4 py-1.5 rounded-xl mb-4 shadow-inner">
                                                    {featuredMatch.startTime ? new Date(featuredMatch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 text-5xl md:text-7xl font-black font-mono">
                                                <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">{featuredMatch.homeScore}</span>
                                                <span className="text-gray-700 text-3xl md:text-5xl -translate-y-1">x</span>
                                                <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">{featuredMatch.awayScore}</span>
                                            </div>
                                            <div className="mt-3 text-gray-500 font-mono font-bold text-sm tracking-widest uppercase">
                                                {featuredMatch.status === 'LIVE' ? 'Andamento' : featuredMatch.status === 'COMPLETED' ? 'Finalizado' : 'Agendado'}
                                            </div>
                                        </div>

                                        {/* Away Team */}
                                        <div className="text-center md:text-left flex-1 w-full">
                                            <img
                                                src={getLogoUrl(featuredMatch.awayTeam?.logoUrl)}
                                                className="w-16 h-16 md:w-20 md:h-20 mx-auto md:mr-auto md:ml-0 mb-3 drop-shadow-xl object-contain"
                                                alt={featuredMatch.awayTeam?.name}
                                                onError={handleImageError}
                                            />
                                            <h3 className="text-xl font-black uppercase italic tracking-tighter truncate">{featuredMatch.awayTeam?.name}</h3>
                                        </div>
                                    </div>

                                    {/* Match Stats (Goals) */}
                                    {(featuredMatch.status === 'LIVE' || featuredMatch.status === 'COMPLETED') && featuredMatch.playerStats && featuredMatch.playerStats.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                            <div className="text-right">
                                                {featuredMatch.playerStats
                                                    .filter(s => s.player?.teamId === featuredMatch.homeTeam?.id && s.goals > 0)
                                                    .map(s => (
                                                        <div key={s.player.id} className="text-sm text-gray-300 flex items-center justify-end gap-2">
                                                            {s.player.name} <span className="text-yellow-500 font-bold">x{s.goals}</span> <FaFutbol className="text-xs" />
                                                        </div>
                                                    ))}
                                            </div>
                                            <div className="text-left">
                                                {featuredMatch.playerStats
                                                    .filter(s => s.player?.teamId === featuredMatch.awayTeam?.id && s.goals > 0)
                                                    .map(s => (
                                                        <div key={s.player.id} className="text-sm text-gray-300 flex items-center gap-2">
                                                            <FaFutbol className="text-xs" /> <span className="text-yellow-500 font-bold">x{s.goals}</span> {s.player.name}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Active Events Display (Secret Cards & Director Penalties) */}
                                    {featuredMatch.status === 'LIVE' && featuredMatch.activeEvents && featuredMatch.activeEvents.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-white/5 flex gap-8 justify-between">
                                            {/* Home Team Cards */}
                                            <div className="flex-1 flex flex-col gap-2 items-end">
                                                {featuredMatch.activeEvents.filter(e => e.teamId === featuredMatch.homeTeam?.id && e.endTime > Date.now()).map(e => {
                                                    const config = CARD_CONFIG[e.type] || { label: e.type, color: 'bg-gray-700 text-white', icon: <FaStar /> };
                                                    return (
                                                        <div key={e.cardId} className={`${config.color} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse`}>
                                                            {config.icon} {config.label} <span className="font-mono bg-black/30 px-1.5 rounded">{formatCardTimer(e.endTime)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {/* Away Team Cards */}
                                            <div className="flex-1 flex flex-col gap-2 items-start">
                                                {featuredMatch.activeEvents.filter(e => e.teamId === featuredMatch.awayTeam?.id && e.endTime > Date.now()).map(e => {
                                                    const config = CARD_CONFIG[e.type] || { label: e.type, color: 'bg-gray-700 text-white', icon: <FaStar /> };
                                                    return (
                                                        <div key={e.cardId} className={`${config.color} px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse`}>
                                                            <span className="font-mono bg-black/30 px-1.5 rounded">{formatCardTimer(e.endTime)}</span> {config.label} {config.icon}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-900/50 rounded-3xl border border-dashed border-gray-800">
                                <FaCalendarAlt className="text-4xl text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400">Nenhum jogo em destaque</h3>
                            </div>
                        )}
                    </section>

                    {/* Upcoming Agenda */}
                    {upcomingMatches.length > 0 && (
                        <section>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><FaCalendarAlt className="text-yellow-500" /> Próximos Jogos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {upcomingMatches.map(match => (
                                    <div key={match.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-yellow-500/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <img src={getLogoUrl(match.homeTeam?.logoUrl)} className="w-8 h-8 object-contain" onError={handleImageError} />
                                            <span className="font-bold text-sm">{match.homeTeam?.name}</span>
                                        </div>
                                        <div className="flex flex-col items-center px-2">
                                            <span className="text-xs font-bold text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                                                {match.startTime ? new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'vs'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 justify-end">
                                            <span className="font-bold text-sm">{match.awayTeam?.name}</span>
                                            <img src={getLogoUrl(match.awayTeam?.logoUrl)} className="w-8 h-8 object-contain" onError={handleImageError} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: Standings & Highlights */}
                <div className="space-y-8">

                    {/* Mini Standings */}
                    {standings.length > 0 && (
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-black italic uppercase flex items-center gap-2 text-yellow-500">
                                    <FaTrophy /> Classificação
                                </h3>
                                <button
                                    onClick={() => setIsRulesModalOpen(true)}
                                    className="text-[9px] uppercase tracking-widest font-black text-yellow-500/40 hover:text-yellow-500 transition-colors"
                                >
                                    Critérios
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="text-gray-500 border-b border-white/5">
                                            <th className="pb-2 pl-2">#</th>
                                            <th className="pb-2">Time</th>
                                            <th className="pb-2 text-center">P</th>
                                            <th className="pb-2 text-center">J</th>
                                            <th className="pb-2 text-center">V</th>
                                            <th className="pb-2 text-center">🟨</th>
                                            <th className="pb-2 text-center">🟥</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {standings.map((team) => (
                                            <tr key={team.id}>
                                                <td className="py-3 pl-2 font-bold text-gray-400">{team.rank}º</td>
                                                <td className="py-3 flex items-center gap-2">
                                                    <img src={getLogoUrl(team.logoUrl)} className="w-6 h-6 object-contain" onError={handleImageError} />
                                                    <span className="font-medium truncate max-w-[100px]">{team.name}</span>
                                                </td>
                                                <td className="py-3 text-center font-bold text-yellow-500">{team.points}</td>
                                                <td className="py-3 text-center text-gray-400">{team.matchesPlayed}</td>
                                                <td className="py-3 text-center text-gray-400">{team.wins}</td>
                                                <td className="py-3 text-center text-yellow-500/50 text-[10px] font-bold">{team.yellowCards}</td>
                                                <td className="py-3 text-center text-red-500/50 text-[10px] font-bold">{team.redCards}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Top Scorers */}
                    {topScorers.length > 0 && (
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>
                            <h3 className="text-lg font-black italic uppercase mb-4 flex items-center gap-2 text-white relative z-10">
                                <FaFutbol className="text-yellow-500" /> Artilharia
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {topScorers.slice(0, 3).map((player, index) => (
                                    <div key={player.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{player.name}</p>
                                                <p className="text-xs text-gray-400">{player.team.name}</p>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-yellow-500">{player.goals} Gols</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top Goalkeepers */}
                    {topGoalkeepers.length > 0 && (
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
                            <h3 className="text-lg font-black italic uppercase mb-4 flex items-center gap-2 text-white relative z-10">
                                <FaHandPaper className="text-blue-500" /> Paredões
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {topGoalkeepers.slice(0, 3).map((player, index) => (
                                    <div key={player.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'}`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">{player.name}</p>
                                                <p className="text-xs text-gray-400">{player.team.name}</p>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-blue-400">{player.goalsConceded} Gols</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Active Championships Grid */}
            <section className="max-w-7xl mx-auto px-6 mb-24">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <FaTrophy className="text-yellow-500" /> Torneios Ativos
                    </h2>
                </div>

                {loading && activeChampionships.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="animate-spin h-8 w-8 border-4 border-yellow-500 rounded-full border-t-transparent mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeChampionships.length === 0 ? (
                            <div className="col-span-3 text-center py-12 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                                <p className="text-gray-400">Nenhum campeonato encontrado.</p>
                            </div>
                        ) : (
                            activeChampionships.map(champ => (
                                <div
                                    key={champ.id}
                                    onClick={() => navigate(`/c/${champ.id}`)}
                                    className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-yellow-500/50 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 ${getStatusColor(champ.status)} text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase`}>
                                        {getStatusLabel(champ.status)}
                                    </div>
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                                            {champ.logoUrl ? (
                                                <img
                                                    src={getLogoUrl(champ.logoUrl)}
                                                    className="w-full h-full object-cover"
                                                    onError={handleImageError}
                                                />
                                            ) : (
                                                <FaTrophy className="text-3xl text-gray-600" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-500 transition-colors truncate">{champ.name}</h3>
                                    <p className="text-gray-500 text-sm mb-6 truncate">{champ.type}</p>

                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                        <span className="flex items-center gap-1"><FaStar className="text-yellow-500" /> {champ.type}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            {/* Sponsors Section */}
            <section className="border-t border-white/5 bg-black/20 pt-16 pb-8 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center mb-10">
                    <h4 className="text-xs font-black text-yellow-500 uppercase tracking-[0.4em] mb-2">Main Partners</h4>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Patrocinadores <span className="text-yellow-500">Master</span></h2>
                </div>

                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
                        {SPONSORS.map((s) => (
                            <div key={s.id} className="group relative aspect-[16/9] flex items-center justify-center bg-white/5 rounded-3xl p-6 hover:bg-white/10 transition-all hover:scale-[1.02] border border-white/5 hover:border-yellow-500/30 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <img
                                    src={s.image}
                                    alt={s.name}
                                    className="max-w-full max-h-full object-contain filter brightness-110 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                                    onError={handleImageError}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Supporters Section */}
            <section className="border-b border-white/5 bg-black/20 pb-16 pt-8 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center mb-8">
                    <div className="h-px w-24 bg-white/10 mx-auto mb-6" />
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Apoio Institucional e Regional</h4>
                </div>

                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-wrap justify-center gap-6 md:gap-10 opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                        {SUPPORTERS.map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-3 group">
                                <div className="w-24 h-14 md:w-32 md:h-16 flex items-center justify-center bg-white/5 rounded-xl p-3 border border-white/5 group-hover:border-white/20 transition-all">
                                    <img
                                        src={s.image}
                                        alt={s.name}
                                        className="max-w-full max-h-full object-contain"
                                        onError={handleImageError}
                                    />
                                </div>
                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Virtual Store Section */}
            <section className="max-w-7xl mx-auto px-6 mb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                            <span className="text-yellow-500">🛍️</span> Loja Oficial
                        </h2>
                        <span className="inline-flex items-center gap-1.5 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-yellow-500/20 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                            Em Construção
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Products - same as before */}
                    <div className="group relative">
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 relative overflow-hidden h-80 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                            {/* Real Image - Shirt */}
                            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                                <img src="/products/jersey.png" alt="Camisa Oficial" className="w-full h-full object-contain filter drop-shadow-2xl" onError={handleImageError} />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] rounded-2xl">
                                    <span className="bg-yellow-500 text-black text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-lg">EM BREVE</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="font-bold text-lg text-white group-hover:text-yellow-500 transition-colors">Camisa Oficial Black Edition</h3>
                            <p className="text-gray-500 text-sm mb-2">Edição de Colecionador</p>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xl font-bold text-white">R$ 149,90</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Minimal */}
            <footer className="py-12 text-center text-gray-600 border-t border-white/5">
                <div className="flex justify-center items-center gap-4 mb-4">
                    <img src="/logo.png" className="h-8 grayscale opacity-50" />
                </div>
                <p className="text-sm">© 2026 Futkings Manager. Todos os direitos reservados.</p>
            </footer>

            {isRulesModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
                    <div className="bg-[#0f172a] p-8 rounded-[32px] border border-yellow-500/20 shadow-2xl w-full max-w-md relative overflow-hidden">
                        {/* Interactive Background */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/10 rounded-full -mr-20 -mt-20 blur-[80px]"></div>
                        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/10 rounded-full -ml-30 -mb-30 blur-[100px]"></div>

                        <button
                            onClick={() => setIsRulesModalOpen(false)}
                            className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                        >
                            <FaTimes size={20} />
                        </button>

                        <div className="relative z-10 text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-yellow-500/30 shadow-2xl shadow-yellow-500/10">
                                <FaTrophy className="text-yellow-500 text-2xl" />
                            </div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Regras de Desempate</h2>
                            <div className="h-1 w-12 bg-yellow-500 mx-auto mt-2 rounded-full"></div>
                        </div>

                        <div className="space-y-2.5 relative z-10">
                            {[
                                { label: 'Pontos Totais', icon: '💎', color: 'text-yellow-400', desc: 'Maior pontuação geral' },
                                { label: 'Mais Vitórias', icon: '✅', color: 'text-green-400', desc: 'Número de jogos vencidos' },
                                { label: 'Saldo de Gols', icon: '⚽', color: 'text-blue-400', desc: 'Gols Pró vs Gols Contra' },
                                { label: 'Menos Vermelhos', icon: '🟥', color: 'text-red-500', desc: 'Disciplina Fair Play' },
                                { label: 'Menos Amarelos', icon: '🟨', color: 'text-orange-400', desc: 'Disciplina Fair Play' },
                                { label: 'Mais Gols Pró', icon: '🔥', color: 'text-white', desc: 'Volume de ataque' }
                            ].map((rule, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-white/5 p-3.5 rounded-2xl border border-white/5 group hover:border-yellow-500/20 transition-all">
                                    <span className="text-xs font-black text-gray-600 w-4">#{(idx + 1)}</span>
                                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                        <span className="text-base">{rule.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-xs font-bold ${rule.color} uppercase tracking-tight`}>{rule.label}</div>
                                        <div className="text-[10px] text-gray-500 italic mt-0.5">{rule.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setIsRulesModalOpen(false)}
                            className="w-full mt-8 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-yellow-500/20 uppercase tracking-widest text-xs"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            <GoalAnimation
                {...goalAnimation}
                onClose={() => setGoalAnimation(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default FanZone;
