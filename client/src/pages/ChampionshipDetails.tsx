import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { FaTrophy, FaCalendarCheck, FaUsers, FaArrowLeft, FaShareAlt, FaPlus, FaDiceD20, FaFutbol } from 'react-icons/fa';

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

const ChampionshipDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [championship, setChampionship] = useState<Championship | null>(null);
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [stats, setStats] = useState<{ topScorers: PlayerStat[], topGoalkeepers: PlayerStat[], topAssists: PlayerStat[] }>({ topScorers: [], topGoalkeepers: [], topAssists: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChampionship();
        fetchTeams();
        fetchStats();
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

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><div className="animate-spin h-8 w-8 border-4 border-yellow-500 rounded-full border-t-transparent"></div></div>;
    if (!championship) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Campeonato não encontrado.</div>;

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
                    {championship.status === 'DRAFT' && (
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
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Teams & Info */}
                <div className="space-y-8">
                    {/* Add Team Widget */}
                    {championship.status === 'DRAFT' && (
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
                                            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-400">
                                                {index + 1}
                                            </div>
                                            <span className="font-bold flex-1">{team.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>




                    {/* Right Column: Matches & Bracket */}
                    <div className="lg:col-span-2 space-y-8">
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
                                    <div className="space-y-4">
                                        {championship.matches.map(match => (
                                            <div
                                                key={match.id}
                                                className="bg-gray-900/80 p-4 rounded-xl border border-gray-700 hover:border-yellow-500/50 transition-all group"
                                            >
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{match.round}</span>
                                                    {match.status === 'COMPLETED' ? (
                                                        <span className="text-xs bg-green-900/30 text-green-500 px-2 py-0.5 rounded border border-green-500/20">Finalizado</span>
                                                    ) : (
                                                        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700">Agendado</span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    {/* Home Team */}
                                                    <div className="flex-1 text-right">
                                                        <span className={`font-bold text-lg md:text-xl block truncate ${!match.homeTeam ? 'text-gray-600 italic' : ''}`}>
                                                            {match.homeTeam?.name || 'A Definir'}
                                                        </span>
                                                    </div>

                                                    {/* Score / VS */}
                                                    <div className="flex flex-col items-center px-4 md:px-8">
                                                        {match.status === 'COMPLETED' || (match.homeScore !== null) ? (
                                                            <div className="flex items-center gap-3 font-mono text-2xl md:text-3xl font-bold text-yellow-500">
                                                                <span>{match.homeScore}</span>
                                                                <span className="text-gray-600 text-lg">X</span>
                                                                <span>{match.awayScore}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-xs border border-gray-700">
                                                                VS
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Away Team */}
                                                    <div className="flex-1 text-left">
                                                        <span className={`font-bold text-lg md:text-xl block truncate ${!match.awayTeam ? 'text-gray-600 italic' : ''}`}>
                                                            {match.awayTeam?.name || 'A Definir'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-center mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link
                                                        to={`/matches/${match.id}/sheet`}
                                                        className="text-xs font-bold text-yellow-500 hover:text-white bg-yellow-900/20 hover:bg-yellow-600/50 px-4 py-2 rounded-lg border border-yellow-500/30 transition-all uppercase tracking-wide"
                                                    >
                                                        {match.status === 'COMPLETED' ? 'Ver Súmula' : 'Gerenciar Partida'}
                                                    </Link>
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
        </div >
    );
};

export default ChampionshipDetails;
