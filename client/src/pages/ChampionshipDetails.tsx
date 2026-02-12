import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLogoUrl } from '../utils/imageHelper';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaCalendarCheck, FaUsers, FaArrowLeft, FaShareAlt, FaPlus, FaDiceD20, FaFutbol, FaEdit, FaTimes, FaSave } from 'react-icons/fa';

interface Team {
    id: string;
    name: string;
    logoUrl?: string;
}

interface Match {
    id: string;
    homeTeam: Team;
    awayTeam: Team;
    round: string;
    homeScore: number | null;
    awayScore: number | null;
    status: string;
    startTime?: string;
}

interface Championship {
    id: string;
    name: string;
    type: string;
    teamsCount: number;
    status: string;
    teams: Team[];
    matches: Match[];
}

interface PlayerStat {
    id: string;
    name: string;
    team: { name: string; logoUrl?: string; };
    goals?: number;
    goalsConceded?: number;
    matchesPlayed?: number;
    assists?: number;
}

interface StandingsTeam {
    id: string;
    rank: number;
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
    cards: number;
}

const ChampionshipDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [championship, setChampionship] = useState<Championship | null>(null);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [stats, setStats] = useState<{ topScorers: PlayerStat[], topGoalkeepers: PlayerStat[], topAssists: PlayerStat[] }>({ topScorers: [], topGoalkeepers: [], topAssists: [] });
    const [standings, setStandings] = useState<StandingsTeam[]>([]);
    const [loading, setLoading] = useState(true);


    // Schedule Modal State
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');

    useEffect(() => {
        fetchChampionship();
        fetchTeams();
        fetchStats();
        fetchStandings();
    }, [id]);

    const fetchChampionship = async () => {
        try {
            const response = await api.get(`/championships/${id}`);
            setChampionship(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await api.get('/teams');
            if (Array.isArray(response.data)) {
                setAllTeams(response.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get(`/championships/${id}/stats`);
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchStandings = async () => {
        try {
            const response = await api.get(`/championships/${id}/standings`);
            setStandings(response.data);
        } catch (error) {
            console.error("Error fetching standings:", error);
        }
    };

    const handleAddTeam = async () => {
        if (!selectedTeam) return;
        try {
            await api.post(`/championships/${id}/teams`, { teamId: selectedTeam });
            fetchChampionship();
            setSelectedTeam('');
        } catch (error) {
            alert('Erro ao adicionar time. Verifique se ele já não está em outro campeonato.');
        }
    };

    const handleDraw = async () => {
        if (!championship || championship.teams.length < championship.teamsCount) {
            alert(`Você precisa de ${championship?.teamsCount} times para realizar o sorteio.`);
            return;
        }

        if (!window.confirm('Deseja sortear os jogos e iniciar o campeonato?')) return;

        try {
            const response = await api.post(`/championships/${id}/draw`);
            alert(response.data.message);
            fetchChampionship();
        } catch (error) {
            alert('Erro ao realizar sorteio.');
        }
    };

    const copyShareLink = () => {
        const url = `${window.location.origin}/c/${id}`;
        navigator.clipboard.writeText(url);
        alert('Link copiado para a área de transferência!');
    };

    const openScheduleModal = (match: Match) => {
        setSelectedMatch(match);
        // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
        if (match.startTime) {
            const date = new Date(match.startTime);
            const offset = date.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
            setScheduleDate(localISOTime);
        } else {
            setScheduleDate('');
        }
        setIsScheduleModalOpen(true);
    };

    const handleScheduleSave = async () => {
        if (!selectedMatch || !scheduleDate) return;

        try {
            await api.put(`/matches/${selectedMatch.id}`, {
                startTime: new Date(scheduleDate).toISOString(),
                status: 'SCHEDULED' // Ensure it's scheduled
            });
            alert('Partida agendada com sucesso!');
            setIsScheduleModalOpen(false);
            fetchChampionship();
        } catch (error) {
            console.error(error);
            alert('Erro ao agendar partida.');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('TEM CERTEZA? Esta ação excluirá permanentemente o campeonato e todos os seus jogos. Esta ação não pode ser desfeita.')) return;

        try {
            await api.delete(`/championships/${id}`);
            alert('Campeonato excluído com sucesso.');
            navigate('/championships');
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir campeonato.');
        }
    };

    const handleToggleStatus = async () => {
        const newStatus = championship?.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED';
        const confirmMsg = newStatus === 'DEACTIVATED'
            ? 'Deseja bloquear este campeonato? Ele não aparecerá mais como ativo.'
            : 'Deseja reativar este campeonato?';

        if (!window.confirm(confirmMsg)) return;

        try {
            await api.patch(`/championships/${id}/status`, { status: newStatus });
            fetchChampionship();
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar status.');
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><div className="animate-spin h-8 w-8 border-4 border-yellow-500 rounded-full border-t-transparent"></div></div>;
    if (!championship) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Campeonato não encontrado.</div>;

    // Group and Sort Matches
    const groupedMatches = championship.matches.reduce((acc: { [key: string]: Match[] }, match) => {
        if (!acc[match.round]) acc[match.round] = [];
        acc[match.round].push(match);
        return acc;
    }, {});

    const getRoundPriority = (round: string) => {
        const lower = round.toLowerCase();
        if (lower === 'final') return 1000;
        if (lower.includes('terceiro') || lower.includes('3º')) return 900;
        if (lower.includes('semi')) return 800;
        if (lower.includes('quarta')) return 700;
        if (round.startsWith('Rodada') || round.startsWith('Round')) {
            const num = parseInt(round.replace(/^\D+/g, ''));
            return isNaN(num) ? 100 : num;
        }
        return 50;
    };

    const sortedRounds = Object.keys(groupedMatches).sort((a, b) => getRoundPriority(a) - getRoundPriority(b));

    const availableTeams = allTeams.filter(t => !championship.teams.find(ct => ct.id === t.id));

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 pb-24 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <button onClick={() => navigate('/championships')} className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 transition-colors">
                        <FaArrowLeft /> Voltar aos Torneios
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-tighter">
                        {championship.name}
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="bg-gray-800 text-gray-300 text-xs font-bold px-3 py-1 rounded-full border border-gray-700 flex items-center gap-1">
                            <FaTrophy className="text-yellow-500" /> {championship.type}
                        </span>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${championship.status === 'ACTIVE'
                            ? 'bg-yellow-900/30 text-yellow-500 border-yellow-500/30'
                            : championship.status === 'COMPLETED'
                                ? 'bg-green-900/30 text-green-500 border-green-500/30'
                                : 'bg-gray-800 text-gray-400 border-gray-600'
                            }`}>
                            <div className={`w-2 h-2 rounded-full ${championship.status === 'ACTIVE' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
                                }`}></div>
                            {championship.status === 'ACTIVE' ? 'Em Andamento' : championship.status === 'COMPLETED' ? 'Encerrado' : 'Aberto'}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    {championship.status === 'DRAFT' && user?.role === 'ADMIN' && (
                        <button
                            onClick={handleDraw}
                            className="flex-1 md:flex-none items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-500/20 flex"
                        >
                            <FaDiceD20 /> Sortear Jogos
                        </button>
                    )}
                    <button
                        onClick={copyShareLink}
                        className="flex-1 md:flex-none items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20 flex"
                    >
                        <FaShareAlt /> Compartilhar
                    </button>

                    {user?.role === 'ADMIN' && (
                        <div className="flex gap-2">
                            <button
                                onClick={handleToggleStatus}
                                className={`flex-1 md:flex-none items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg border ${championship.status === 'DEACTIVATED'
                                    ? 'bg-yellow-600 text-black border-yellow-500 hover:bg-yellow-500 shadow-yellow-500/10'
                                    : 'bg-gray-800 text-yellow-500 border-yellow-500/30 hover:bg-gray-700 shadow-black/20'
                                    } flex`}
                                title={championship.status === 'DEACTIVATED' ? 'Reativar' : 'Bloquear/Desativar'}
                            >
                                <FaTimes /> {championship.status === 'DEACTIVATED' ? 'Reativar' : 'Bloquear'}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 md:flex-none items-center justify-center gap-2 bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/20 flex"
                                title="Excluir Definitivamente"
                            >
                                <FaTimes /> Excluir
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Teams & Info */}
                <div className="space-y-8">
                    {/* Add Team Widget (ADMIN ONLY) */}
                    {championship.status === 'DRAFT' && user?.role === 'ADMIN' && (
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <FaPlus className="text-yellow-500" /> Adicionar Time
                            </h2>
                            <div className="flex gap-2">
                                <select
                                    value={selectedTeam}
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                    className="flex-1 bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
                                >
                                    <option value="">Selecione...</option>
                                    {availableTeams.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleAddTeam}
                                    disabled={!selectedTeam}
                                    className="bg-yellow-500 text-gray-900 px-4 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FaPlus />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Teams List */}
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FaUsers className="text-blue-400" /> Times
                            </h2>
                            <span className="text-sm bg-gray-900 py-1 px-3 rounded-full text-gray-400 border border-gray-700">
                                {championship.teams.length} / {championship.teamsCount}
                            </span>
                        </div>

                        <div className="p-4 max-h-[500px] overflow-y-auto">
                            {championship.teams.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Nenhum time inscrito.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {championship.teams.map((team, index) => (
                                        <li key={team.id} className="bg-gray-700/50 p-3 rounded-xl flex items-center gap-3 hover:bg-gray-700 transition-colors">
                                            {team.logoUrl ? (
                                                <img src={getLogoUrl(team.logoUrl)} alt={team.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-400">
                                                    {index + 1}
                                                </div>
                                            )}
                                            <span className="font-bold flex-1">{team.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>




                    {/* Right Column: Matches & Bracket */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Standings Table (Only for LEAGUE_WITH_FINAL) */}
                        {championship.type === 'LEAGUE_WITH_FINAL' && (
                            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-gray-700">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FaTrophy className="text-yellow-500" /> Tabela de Classificação
                                    </h2>
                                </div>
                                <div className="p-4 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700">
                                                <th className="p-3 text-center">Pos</th>
                                                <th className="p-3">Time</th>
                                                <th className="p-3 text-center font-bold text-white">PTS</th>
                                                <th className="p-3 text-center">J</th>
                                                <th className="p-3 text-center">V</th>
                                                <th className="p-3 text-center">E</th>
                                                <th className="p-3 text-center">D</th>
                                                <th className="p-3 text-center">GP</th>
                                                <th className="p-3 text-center">GC</th>
                                                <th className="p-3 text-center">SG</th>
                                                <th className="p-3 text-center text-red-400" title="Cartões (Amarelos + Vermelhos)">
                                                    <span className="flex items-center justify-center gap-1">🟥🟨</span>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {standings.map((team) => (
                                                <tr key={team.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                                                    <td className="p-3 text-center">
                                                        <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${team.rank <= 2 ? 'bg-green-500 text-white' : 'text-gray-500'}`}>
                                                            {team.rank}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-bold flex items-center gap-2">
                                                        {team.logoUrl && <img src={getLogoUrl(team.logoUrl)} alt={team.name} className="w-5 h-5 object-contain" />}
                                                        {team.name}
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-yellow-500 text-lg">{team.points}</td>
                                                    <td className="p-3 text-center">{team.matchesPlayed}</td>
                                                    <td className="p-3 text-center text-gray-300">{team.wins}</td>
                                                    <td className="p-3 text-center text-gray-300">{team.draws}</td>
                                                    <td className="p-3 text-center text-gray-300">{team.losses}</td>
                                                    <td className="p-3 text-center text-gray-400 text-xs">{team.goalsFor}</td>
                                                    <td className="p-3 text-center text-gray-400 text-xs">{team.goalsAgainst}</td>
                                                    <td className="p-3 text-center font-bold">{team.goalDiff}</td>
                                                    <td className="p-3 text-center font-bold text-gray-400">{team.cards}</td>
                                                </tr>
                                            ))}
                                            {standings.length === 0 && (
                                                <tr>
                                                    <td colSpan={11} className="p-4 text-center text-gray-500">
                                                        Nenhuma classificação disponível.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Matches List */}
                        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-gray-700">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FaCalendarCheck className="text-green-400" /> Jogos / Tabela
                                </h2>
                            </div>

                            <div className="p-4">
                                {championship.matches.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                                            <FaFutbol size={32} />
                                        </div>
                                        <p className="text-gray-400 mb-2">Os jogos ainda não foram definidos.</p>
                                        {championship.status === 'DRAFT' && (
                                            <p className="text-sm text-yellow-500">Adicione os times e realize o sorteio para começar!</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {sortedRounds.map(roundName => (
                                            <div key={roundName} className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-px bg-gray-700 flex-1"></div>
                                                    <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] whitespace-nowrap">
                                                        {roundName}
                                                    </h3>
                                                    <div className="h-px bg-gray-700 flex-1"></div>
                                                </div>

                                                <div className="space-y-4">
                                                    {groupedMatches[roundName].map(match => (
                                                        <div
                                                            key={match.id}
                                                            className="bg-gray-900/80 p-4 rounded-xl border border-gray-700 hover:border-yellow-500/50 transition-all group"
                                                        >
                                                            <div className="flex justify-between items-center mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-2 h-2 rounded-full ${match.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
                                                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Partida #{match.id.slice(0, 4)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {match.startTime && (
                                                                        <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 flex items-center gap-1">
                                                                            <FaCalendarCheck size={10} />
                                                                            {new Date(match.startTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    )}
                                                                    {match.status === 'COMPLETED' ? (
                                                                        <span className="text-xs bg-green-900/30 text-green-500 px-2 py-0.5 rounded border border-green-500/20">Finalizado</span>
                                                                    ) : (
                                                                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">Agendado</span>
                                                                    )}
                                                                    {user?.role === 'ADMIN' && (
                                                                        <button
                                                                            onClick={() => openScheduleModal(match)}
                                                                            className="text-gray-500 hover:text-yellow-500 transition p-1"
                                                                            title="Agendar Partida"
                                                                        >
                                                                            <FaEdit />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between gap-1">
                                                                {/* Home Team */}
                                                                <div className="flex-1 text-right flex items-center justify-end gap-2 md:gap-3 min-w-0">
                                                                    <span className={`font-bold text-sm sm:text-base md:text-xl leading-tight ${!match.homeTeam ? 'text-gray-600 italic' : ''}`}>
                                                                        {match.homeTeam?.name || 'A Definir'}
                                                                    </span>
                                                                    {match.homeTeam?.logoUrl && (
                                                                        <img src={getLogoUrl(match.homeTeam.logoUrl)} alt="" className="w-6 h-6 md:w-8 md:h-8 object-contain shrink-0" />
                                                                    )}
                                                                </div>

                                                                {/* Score / VS */}
                                                                <div className="flex flex-col items-center px-2 md:px-8 shrink-0">
                                                                    {match.status === 'COMPLETED' || (match.homeScore !== null) ? (
                                                                        <div className="flex items-center gap-2 md:gap-3 font-mono text-lg md:text-3xl font-bold text-white bg-gray-800 px-3 md:px-4 py-1 rounded-lg border border-gray-700">
                                                                            <span className={match.homeScore! > match.awayScore! ? 'text-yellow-500' : ''}>{match.homeScore}</span>
                                                                            <span className="text-gray-600 text-base md:text-lg">X</span>
                                                                            <span className={match.awayScore! > match.homeScore! ? 'text-yellow-500' : ''}>{match.awayScore}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-[10px] md:text-xs border border-gray-700">
                                                                            VS
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Away Team */}
                                                                <div className="flex-1 text-left flex items-center justify-start gap-2 md:gap-3 min-w-0">
                                                                    {match.awayTeam?.logoUrl && (
                                                                        <img src={getLogoUrl(match.awayTeam.logoUrl)} alt="" className="w-6 h-6 md:w-8 md:h-8 object-contain shrink-0" />
                                                                    )}
                                                                    <span className={`font-bold text-sm sm:text-base md:text-xl leading-tight ${!match.awayTeam ? 'text-gray-600 italic' : ''}`}>
                                                                        {match.awayTeam?.name || 'A Definir'}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="flex justify-center mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {(user?.role === 'ADMIN' || match.status === 'COMPLETED') && (
                                                                    <Link
                                                                        to={`/matches/${match.id}/sheet`}
                                                                        className="text-xs font-bold text-yellow-500 hover:text-white bg-yellow-900/20 hover:bg-yellow-600/50 px-4 py-2 rounded-lg border border-yellow-500/30 transition-all uppercase tracking-wide"
                                                                    >
                                                                        {match.status === 'COMPLETED' ? 'Ver Súmula' : 'Gerenciar Partida'}
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Statistics Section */}
                    <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden mt-8">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                📊 Estatísticas
                            </h2>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {/* Top Scorers */}
                            <div>
                                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    👟 Artilharia
                                </h3>
                                <ul className="space-y-2">
                                    {stats.topScorers.length === 0 ? <li className="text-gray-500 text-sm">Nenhum gol marcado.</li> :
                                        stats.topScorers.map((p, i) => (
                                            <li key={p.id} className="bg-gray-700/50 p-2 rounded flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-400 w-4">{i + 1}</span>
                                                    <div>
                                                        <div className="text-sm font-bold">{p.name}</div>
                                                        <div className="text-xs text-gray-500">{p.team?.name}</div>
                                                    </div>
                                                </div>
                                                <div className="font-mono font-bold text-yellow-500">{p.goals} G</div>
                                            </li>
                                        ))}
                                </ul>
                            </div>

                            {/* Top Goalkeepers */}
                            <div>
                                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    🧤 Paredões (Menos Vazados)
                                </h3>
                                <ul className="space-y-2">
                                    {stats.topGoalkeepers.length === 0 ? <li className="text-gray-500 text-sm">Nenhum dado.</li> :
                                        stats.topGoalkeepers.map((p, i) => (
                                            <li key={p.id} className="bg-gray-700/50 p-2 rounded flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-400 w-4">{i + 1}</span>
                                                    <div>
                                                        <div className="text-sm font-bold">{p.name}</div>
                                                        <div className="text-xs text-gray-500">{p.team?.name}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-mono font-bold text-white">{p.goalsConceded} GS</div>
                                                    <div className="text-[10px] text-gray-500">{p.matchesPlayed} Jogos</div>
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                            {/* Top Assists */}
                            <div className="sm:col-span-2 xl:col-span-1">
                                <h3 className="text-sm font-bold text-green-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    🅰️ Garçons (Assistências)
                                </h3>
                                <ul className="space-y-2">
                                    {stats.topAssists?.length === 0 ? <li className="text-gray-500 text-sm">Nenhuma assistência.</li> :
                                        stats.topAssists?.map((p, i) => (
                                            <li key={p.id} className="bg-gray-700/50 p-2 rounded flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-400 w-4">{i + 1}</span>
                                                    <div>
                                                        <div className="text-sm font-bold">{p.name}</div>
                                                        <div className="text-xs text-gray-500">{p.team?.name}</div>
                                                    </div>
                                                </div>
                                                <div className="font-mono font-bold text-green-500">{p.assists} A</div>
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md relative">
                        <button
                            onClick={() => setIsScheduleModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
                        >
                            <FaTimes size={20} />
                        </button>

                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <FaCalendarCheck className="text-yellow-500" /> Agendar Partida
                        </h2>

                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4 bg-gray-900 p-3 rounded-lg">
                                <span className="font-bold text-gray-300">{selectedMatch?.homeTeam?.name || 'A Definir'}</span>
                                <span className="text-xs font-bold text-gray-600">VS</span>
                                <span className="font-bold text-gray-300">{selectedMatch?.awayTeam?.name || 'A Definir'}</span>
                            </div>

                            <label className="block text-sm font-bold text-gray-400 mb-2">Data e Hora</label>
                            <input
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-white focus:border-yellow-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsScheduleModalOpen(false)}
                                className="text-gray-400 hover:text-white px-4 py-2 font-bold transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleScheduleSave}
                                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-6 py-2 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition flex items-center gap-2"
                            >
                                <FaSave /> Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default ChampionshipDetails;
