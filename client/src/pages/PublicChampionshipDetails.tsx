import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { FaTrophy, FaCalendarCheck, FaUsers, FaFutbol, FaShareAlt, FaArrowLeft, FaShieldAlt, FaTimes } from 'react-icons/fa';
import SafeImage from '../components/SafeImage';

interface Team {
    id: string;
    name: string;
    logoUrl?: string; // Future proofing
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
    logoUrl?: string;
    teams: Team[];
    matches: Match[];
}

interface Standing {
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
    yellowCards: number;
    redCards: number;
}

const PublicChampionshipDetails: React.FC = () => {
    const { id } = useParams();
    const [championship, setChampionship] = useState<Championship | null>(null);
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

    useEffect(() => {
        fetchChampionship();
        fetchStandings();
    }, [id]);

    const fetchChampionship = async () => {
        try {
            const response = await api.get(`/public/championships/${id}`);
            setChampionship(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStandings = async () => {
        try {
            const response = await api.get(`/championships/${id}/standings`);
            setStandings(response.data);
        } catch (error) {
            console.error("Error fetching standings", error);
        }
    };

    const copyShareLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert('Link copiado! Compartilhe com a galera.');
    };

    if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><div className="animate-spin h-8 w-8 border-4 border-yellow-500 rounded-full border-t-transparent"></div></div>;
    if (!championship) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Campeonato não encontrado.</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 pb-24 font-sans">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-gray-800 pb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <SafeImage
                                src={championship.logoUrl}
                                alt={championship.name}
                                className="w-16 h-16 rounded-xl border-2 border-yellow-500/30 shadow-lg"
                                fallbackIcon={<FaTrophy size={32} className="text-yellow-500" />}
                            />
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-tighter">
                                    {championship.name}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="bg-gray-800 text-gray-300 text-xs font-bold px-3 py-1 rounded-full border border-gray-700 flex items-center gap-1">
                                <FaTrophy className="text-yellow-500" /> {championship.type}
                            </span>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${championship.status === 'IN_PROGRESS'
                                ? 'bg-yellow-900/30 text-yellow-500 border-yellow-500/30'
                                : championship.status === 'FINISHED'
                                    ? 'bg-green-900/30 text-green-500 border-green-500/30'
                                    : 'bg-gray-800 text-gray-400 border-gray-600'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${championship.status === 'IN_PROGRESS' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-500'
                                    }`}></div>
                                {championship.status === 'IN_PROGRESS' ? 'Em Andamento' : championship.status === 'FINISHED' ? 'Encerrado' : 'Aberto'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={copyShareLink}
                            className="flex-1 md:flex-none items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/20 flex"
                        >
                            <FaShareAlt /> Compartilhar
                        </button>
                        <Link
                            to="/login"
                            className="flex-1 md:flex-none items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all border border-gray-700 flex"
                        >
                            <FaArrowLeft /> Criar o meu
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Teams & Standings */}
                    <div className="space-y-8">
                        {/* Standings (If Group Stage/League) */}
                        {championship.type === 'LEAGUE_WITH_FINAL' && standings.length > 0 && (
                            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <FaTrophy className="text-yellow-500" /> Classificação
                                    </h2>
                                    <button
                                        onClick={() => setIsRulesModalOpen(true)}
                                        className="text-[10px] uppercase tracking-widest font-black text-yellow-500/40 hover:text-yellow-500 transition-colors"
                                    >
                                        Critérios
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr className="text-gray-500 border-b border-gray-700 text-[10px] uppercase font-bold tracking-wider">
                                                <th className="pb-3 pr-2">#</th>
                                                <th className="pb-3">Time</th>
                                                <th className="pb-3 text-center text-white">P</th>
                                                <th className="pb-3 text-center">J</th>
                                                <th className="pb-3 text-center">SG</th>
                                                <th className="pb-3 text-center text-yellow-500">🟨</th>
                                                <th className="pb-3 text-center text-red-500">🟥</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {standings.map((team) => (
                                                <tr key={team.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 pr-2">
                                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${team.rank <= 2 ? 'bg-green-500/20 text-green-500' : 'text-gray-600'}`}>
                                                            {team.rank}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 flex items-center gap-2">
                                                        <SafeImage
                                                            src={team.logoUrl}
                                                            className="w-5 h-5 object-contain"
                                                            fallbackIcon={<FaShieldAlt size={12} />}
                                                        />
                                                        <span className="font-bold truncate max-w-[80px] text-xs">{team.name}</span>
                                                    </td>
                                                    <td className="py-3 text-center font-black text-yellow-500">{team.points}</td>
                                                    <td className="py-3 text-center text-gray-400 font-medium">{team.matchesPlayed}</td>
                                                    <td className="py-3 text-center text-gray-400 font-medium">{team.goalDiff}</td>
                                                    <td className="py-3 text-center text-yellow-500/40 text-[9px] font-bold">{team.yellowCards}</td>
                                                    <td className="py-3 text-center text-red-500/40 text-[9px] font-bold">{team.redCards}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <FaUsers className="text-blue-400" /> Times Participantes
                            </h2>

                            <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                <ul className="space-y-3">
                                    {championship.teams.map((team) => (
                                        <li key={team.id} className="bg-gray-700/50 p-4 rounded-xl flex items-center gap-4 hover:bg-gray-700 transition-all border border-transparent hover:border-gray-600">
                                            <SafeImage
                                                src={team.logoUrl}
                                                alt={team.name}
                                                className="w-10 h-10 rounded-full border border-gray-600"
                                                fallbackIcon={<FaShieldAlt size={16} />}
                                            />
                                            <span className="font-bold text-lg">{team.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Matches */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FaCalendarCheck className="text-green-400" /> Tabela de Jogos
                                </h2>
                                <span className="text-xs text-gray-400 bg-gray-900 px-3 py-1 rounded-full">{championship.matches.length} Jogos</span>
                            </div>

                            {championship.matches.length === 0 ? (
                                <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
                                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                                        <FaFutbol size={32} />
                                    </div>
                                    <p className="text-gray-400">Tabela ainda não definida.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {championship.matches.map(match => (
                                        <div
                                            key={match.id}
                                            className="bg-gray-900/80 p-5 rounded-xl border border-gray-700 hover:border-yellow-500/30 transition-all"
                                        >
                                            <div className="flex justify-between items-center mb-4">
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
                                                    <span className="font-bold text-lg md:text-xl block truncate">{match.homeTeam.name}</span>
                                                </div>

                                                {/* Score / VS */}
                                                <div className="flex flex-col items-center px-4 md:px-8">
                                                    {match.status === 'COMPLETED' || (match.homeScore !== null) ? (
                                                        <div className="flex items-center gap-3 font-mono text-3xl md:text-4xl font-black text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">
                                                            <span>{match.homeScore}</span>
                                                            <span className="text-gray-700 text-xl">:</span>
                                                            <span>{match.awayScore}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-sm border border-gray-700 shadow-inner">
                                                            VS
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Away Team */}
                                                <div className="flex-1 text-left">
                                                    <span className="font-bold text-lg md:text-xl block truncate">{match.awayTeam.name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tie-Breaker Rules Modal */}
            {isRulesModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in shadow-2xl">
                    <div className="bg-gray-900 p-8 rounded-[32px] border border-yellow-500/20 shadow-2xl w-full max-w-md relative overflow-hidden text-center">
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
                            <div className="h-0.5 w-12 bg-yellow-500 mx-auto mt-2 rounded-full"></div>
                        </div>

                        <div className="space-y-2.5 relative z-10 text-left">
                            {[
                                { label: 'Pontos Totais', icon: '💎', color: 'text-yellow-400', desc: 'Soma total de pontos' },
                                { label: 'Mais Vitórias', icon: '✅', color: 'text-green-400', desc: 'Número de jogos vencidos' },
                                { label: 'Saldo de Gols', icon: '⚽', color: 'text-blue-400', desc: 'Gols Pró vs Gols Contra' },
                                { label: 'Fair Play (Vermelhos)', icon: '🟥', color: 'text-red-500', desc: 'Menos cartões vermelhos' },
                                { label: 'Fair Play (Amarelos)', icon: '🟨', color: 'text-orange-400', desc: 'Menos cartões amarelos' },
                                { label: 'Maior Ataque', icon: '🔥', color: 'text-white', desc: 'Mais gols marcados' }
                            ].map((rule, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-white/5 p-3.5 rounded-2xl border border-white/5 group hover:border-yellow-500/20 transition-all">
                                    <span className="text-[10px] font-black text-gray-700 w-3">0{idx + 1}</span>
                                    <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                        <span className="text-base">{rule.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className={`text-[11px] font-black ${rule.color} uppercase tracking-tighter`}>{rule.label}</div>
                                        <div className="text-[9px] text-gray-500 font-medium normal-case tracking-normal">{rule.desc}</div>
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
        </div>
    );
};

export default PublicChampionshipDetails;
