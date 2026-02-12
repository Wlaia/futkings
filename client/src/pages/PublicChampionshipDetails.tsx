import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { FaTrophy, FaCalendarCheck, FaUsers, FaFutbol, FaShareAlt, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
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

const PublicChampionshipDetails: React.FC = () => {
    const { id } = useParams();
    const [championship, setChampionship] = useState<Championship | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChampionship();
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
                    {/* Left Column: Teams */}
                    <div className="space-y-8">
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
        </div>
    );
};

export default PublicChampionshipDetails;
