import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PlayerCard from '../components/PlayerCard';
import TacticalPitch from '../components/TacticalPitch';
import EditTeamModal from '../components/EditTeamModal';
import EditPlayerModal from '../components/EditPlayerModal';
import { FaEdit, FaStar, FaUserShield } from 'react-icons/fa';
import ShareTeamModal from '../components/ShareTeamModal';
import { useAuth } from '../context/AuthContext';
import CreateManagerModal from '../components/CreateManagerModal';

interface Player {
    id: string;
    name: string;
    number: number;
    position: 'GOALKEEPER' | 'FIELD';
    avatarUrl?: string;
    birthDate?: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    goalsConceded: number;
}

interface Team {
    id: string;
    name: string;
    logoUrl?: string;
    coachName?: string;
    directorName?: string;
    players: Player[];
    // Stats
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    // Public Link Settings
    isPublicLinkActive: boolean;
    publicCanAddPlayer: boolean;
    publicCanEditPlayer: boolean;
    publicCanImportPlayer: boolean;
    publicCanPrintPlayer: boolean;
    // Manager
    managerId?: string;
    manager?: { name: string; email: string };
}

const TeamDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'CARDS' | 'PITCH' | 'LIST'>('CARDS');
    const [showStats, setShowStats] = useState(false);

    // Edit Modal State
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

    // Initial load
    useEffect(() => {
        fetchTeamAndPlayers();
    }, [id]);

    const handleUpdateTeam = async (updatedData: any) => {
        if (!team) return;
        try {
            const config = updatedData instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
            await api.put(`/teams/${team.id}`, updatedData, config);
            setIsEditTeamModalOpen(false);
            fetchTeamAndPlayers();
            alert('Time atualizado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar time.');
        }
    };

    const fetchTeamAndPlayers = async () => {
        try {
            // 1. Get Players
            const playersResponse = await api.get(`/players?teamId=${id}`);

            // 2. Get Team Info
            try {
                const teamRes = await api.get(`/teams/${id}`);
                setTeam({ ...teamRes.data, players: playersResponse.data });
            } catch (e) {
                // Fallback to searching list
                const teamsResponse = await api.get('/teams');
                const foundTeam = teamsResponse.data.find((t: any) => t.id === id);
                if (foundTeam) {
                    setTeam({ ...foundTeam, players: playersResponse.data });
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Upload Logic
    const [uploadingPlayerId, setUploadingPlayerId] = useState<string | null>(null);
    const handleAvatarUpload = async (playerId: string, file: File) => {
        setUploadingPlayerId(playerId);
        const formData = new FormData();
        formData.append('photo', file);
        try {
            await api.post(`/players/${playerId}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchTeamAndPlayers();
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar foto.');
        } finally {
            setUploadingPlayerId(null);
        }
    };

    // Edit Logic
    const handleSavePlayer = async (updatedData: any) => {
        if (!editingPlayer) return;
        try {
            await api.put(`/players/${editingPlayer.id}`, updatedData);
            setEditingPlayer(null);
            fetchTeamAndPlayers();
            alert('Jogador atualizado!');
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar jogador.');
        }
    };

    // Add Player (Quick)
    const handleQuickAdd = async () => {
        const name = prompt("Nome do novo jogador:");
        if (!name) return;
        try {
            await api.post('/players', {
                name,
                number: 99,
                position: 'FIELD',
                teamId: id
            });
            fetchTeamAndPlayers();
        } catch (e) {
            alert("Erro ao criar jogador");
        }
    }

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-500 font-bold">CARREGANDO...</div>;
    if (!team) return <div className="text-white">Time não encontrado.</div>;

    // Calc Team OVR (Avg of players) - simple mock logic matching PlayerCard logic
    const calcOvr = (p: Player) => {
        let ovr = 60;
        if (p.position === 'GOALKEEPER') ovr += (p.saves * 2) - (p.goalsConceded * 1) + 15;
        else ovr += (p.goals * 3) + (p.assists * 2);
        return Math.max(45, Math.min(99, ovr));
    };
    const teamOvr = team.players.length > 0
        ? Math.floor(team.players.reduce((acc, p) => acc + calcOvr(p), 0) / team.players.length)
        : 60;

    // Helper for table stats
    const getGoalDifference = () => (team.goalsFor || 0) - (team.goalsAgainst || 0);

    return (
        <div className="min-h-screen bg-transparent text-white p-4 pb-24 md:p-8 animate-fade-in relative overflow-x-hidden">

            {/* Background Atmosphere */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black -z-10"></div>

            {/* --- HEADER --- */}
            <header className="mb-8 flex flex-col md:flex-row items-center gap-6 glass-panel p-6 rounded-2xl relative overflow-hidden">
                {/* ... (Header content mostly same, adding Stats button) */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>

                {/* Shield Area */}
                <div className="relative group shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] bg-black flex items-center justify-center overflow-hidden">
                        {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold text-gray-700">{team.name[0]}</span>
                        )}
                    </div>
                </div>

                {/* Team Info */}
                <div className="flex-grow text-center md:text-left">
                    <div className="flex items-center gap-4 justify-center md:justify-start">
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-sm">
                            {team.name}
                        </h1>
                        {/* Manager Badge if exists */}
                        {team.manager && (
                            <span className="bg-purple-900/50 text-purple-400 text-xs px-2 py-1 rounded border border-purple-500/30 flex items-center gap-1" title={`Gerenciado por: ${team.manager.name}`}>
                                <FaUserShield /> Gerenciado
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row justify-center md:justify-start items-center gap-4 mt-2">
                        <div className="bg-black/40 px-3 py-1 rounded border border-white/10 flex items-center gap-2">
                            <span className="text-yellow-500 font-bold text-sm">OVR</span>
                            <span className="text-2xl font-black text-white">{teamOvr}</span>
                        </div>
                        <div className="text-sm text-gray-400 font-bold uppercase tracking-wider">
                            {team.players.length} Jogadores
                        </div>

                        {/* Coach & Director Display */}
                        {(team.coachName || team.directorName) && (
                            <div className="flex items-center gap-4 ml-0 md:ml-4 border-l-0 md:border-l border-gray-700 pl-0 md:pl-4">
                                {team.directorName && (
                                    <div className="flex flex-col items-center md:items-start leading-none">
                                        <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                            <FaStar size={8} /> Diretor
                                        </span>
                                        <span className="text-white font-bold text-sm">{team.directorName}</span>
                                    </div>
                                )}
                                {team.coachName && (
                                    <div className="flex flex-col items-center md:items-start leading-none">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Técnico</span>
                                        <span className="text-gray-300 font-bold text-sm">{team.coachName}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 shrink-0 flex-wrap justify-center">
                    <button
                        onClick={() => setShowStats(true)}
                        className="bg-blue-900/50 border border-blue-500/30 text-blue-200 px-4 py-3 rounded-lg font-bold uppercase hover:bg-blue-800/50 transition flex items-center gap-2"
                    >
                        📊 Estatísticas
                    </button>
                    {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                        <>
                            <button
                                onClick={() => setIsEditTeamModalOpen(true)}
                                className="bg-yellow-600/20 border border-yellow-500/30 text-yellow-500 px-4 py-3 rounded-lg font-bold uppercase hover:bg-yellow-600/40 transition flex items-center gap-2"
                            >
                                <FaEdit /> Editar
                            </button>
                            <button
                                onClick={handleQuickAdd}
                                className="bg-gray-800 border border-white/20 text-white px-4 py-3 rounded-lg font-bold uppercase hover:bg-gray-700 transition"
                            >
                                + Jogador
                            </button>
                        </>
                    )}

                    {user?.role === 'ADMIN' && !team.managerId && (
                        <button
                            onClick={() => setIsManagerModalOpen(true)}
                            className="bg-purple-600/20 border border-purple-500/30 text-purple-400 px-4 py-3 rounded-lg font-bold uppercase hover:bg-purple-600/40 transition flex items-center gap-2"
                        >
                            <FaUserShield /> Criar Gerente
                        </button>
                    )}

                    <button
                        onClick={() => setIsShareModalOpen(true)}
                        className="btn-game-primary px-6 py-3 rounded-lg font-bold text-black uppercase tracking-wider flex items-center gap-2 hover:brightness-110"
                    >
                        🔗 Compartilhar
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-gray-800 border border-white/20 text-white px-4 py-3 rounded-lg font-bold hover:bg-gray-700 transition"
                    >
                        ⬅ Voltar
                    </button>
                </div>
            </header>

            {/* --- VIEW SWITCHER --- */}
            <div className="flex justify-center mb-8">
                <div className="bg-black/50 p-1 rounded-xl border border-white/10 flex gap-1">
                    <button
                        onClick={() => setViewMode('CARDS')}
                        className={`px-6 py-2 rounded-lg font-bold uppercase text-sm transition-all flex items-center gap-2 ${viewMode === 'CARDS' ? 'bg-yellow-600 text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        🧾 Cards
                    </button>
                    <button
                        onClick={() => setViewMode('PITCH')}
                        className={`px-6 py-2 rounded-lg font-bold uppercase text-sm transition-all flex items-center gap-2 ${viewMode === 'PITCH' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        ⚽ Campo
                    </button>
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={`px-6 py-2 rounded-lg font-bold uppercase text-sm transition-all flex items-center gap-2 ${viewMode === 'LIST' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        📋 Lista
                    </button>
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <main className="animate-slide-up">
                {viewMode === 'CARDS' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 justify-items-center">
                        {team.players.map(player => (
                            <div key={player.id} className="relative group/cardwrapper">
                                <PlayerCard
                                    player={player}
                                    teamLogo={team.logoUrl || undefined}
                                    onUpload={(file) => handleAvatarUpload(player.id, file)}
                                    uploading={uploadingPlayerId === player.id}
                                />
                                {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                                    <button
                                        onClick={() => setEditingPlayer(player)}
                                        className="absolute -top-2 -right-2 z-50 bg-white text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg opacity-0 group-hover/cardwrapper:opacity-100 transition-opacity hover:scale-110 cursor-pointer"
                                        title="Editar Jogador"
                                    >
                                        ✎
                                    </button>
                                )}
                            </div>
                        ))}
                        {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                            <div
                                onClick={handleQuickAdd}
                                className="w-[300px] h-[460px] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-yellow-500/50 transition opacity-60 hover:opacity-100"
                            >
                                <span className="text-4xl text-yellow-500 mb-2">+</span>
                                <span className="text-gray-400 font-bold uppercase">Novo Jogador</span>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'PITCH' && (
                    <div className="flex justify-center pb-10">
                        <TacticalPitch
                            players={team.players}
                            onPlayerClick={(p) => {
                                if (user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) {
                                    const fullPlayer = team.players.find(tp => tp.id === p.id);
                                    if (fullPlayer) setEditingPlayer(fullPlayer);
                                }
                            }}
                        />
                    </div>
                )}

                {viewMode === 'LIST' && (
                    <div className="max-w-6xl mx-auto glass-panel rounded-xl overflow-hidden shadow-2xl border border-white/10">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-black/40 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">#</th>
                                        <th className="px-6 py-4">Jogador</th>
                                        <th className="px-6 py-4">Posição</th>
                                        <th className="px-6 py-4 text-center">Gols</th>
                                        <th className="px-6 py-4 text-center">Assis</th>
                                        <th className="px-6 py-4 text-center text-yellow-500">CA</th>
                                        <th className="px-6 py-4 text-center text-red-500">CV</th>
                                        <th className="px-6 py-4 text-center">Jogos</th>
                                        <th className="px-6 py-4 text-center text-yellow-400">OVR</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {team.players.map((player) => (
                                        <tr key={player.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-mono text-gray-400">{player.number}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-white/10">
                                                        {player.avatarUrl ? (
                                                            <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold">{player.name[0]}</div>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-white">{player.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${player.position === 'GOALKEEPER' ? 'bg-yellow-600/20 text-yellow-500' : 'bg-blue-600/20 text-blue-400'}`}>
                                                    {player.position === 'GOALKEEPER' ? 'GOL' : 'LINHA'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold">{player.goals}</td>
                                            <td className="px-6 py-4 text-center font-bold text-gray-400">{player.assists}</td>
                                            <td className="px-6 py-4 text-center font-bold text-yellow-500">{player.yellowCards}</td>
                                            <td className="px-6 py-4 text-center font-bold text-red-500">{player.redCards}</td>
                                            <td className="px-6 py-4 text-center text-gray-400">-</td> {/* TODO: Add matches played per player */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="w-10 h-10 rounded bg-black border border-yellow-500/50 flex items-center justify-center font-black text-white mx-auto">
                                                    {calcOvr(player)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                                                    <button
                                                        onClick={() => setEditingPlayer(player)}
                                                        className="text-gray-400 hover:text-white transition"
                                                    >
                                                        Editar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>

            {/* --- TEAM STATS MODAL --- */}
            {showStats && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                        <button
                            onClick={() => setShowStats(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                        >
                            <span className="text-2xl">×</span>
                        </button>

                        <div className="bg-gradient-to-r from-blue-900 to-gray-900 p-8 text-center border-b border-white/10">
                            <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Estatísticas da Temporada</h2>
                            <p className="text-blue-300 font-medium">{team.name}</p>
                        </div>

                        <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Jogos</div>
                                <div className="text-4xl font-black text-white">{team.matchesPlayed || 0}</div>
                            </div>
                            <div className="bg-green-900/20 p-4 rounded-xl border border-green-500/20 text-center">
                                <div className="text-green-400 text-xs font-bold uppercase tracking-wider mb-1">Vitórias</div>
                                <div className="text-4xl font-black text-green-400">{team.wins || 0}</div>
                            </div>
                            <div className="bg-gray-800/40 p-4 rounded-xl border border-white/5 text-center">
                                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Empates</div>
                                <div className="text-4xl font-black text-gray-300">{team.draws || 0}</div>
                            </div>
                            <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/20 text-center">
                                <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Derrotas</div>
                                <div className="text-4xl font-black text-red-400">{team.losses || 0}</div>
                            </div>
                        </div>

                        <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Gols Pró</div>
                                    <div className="text-3xl font-black text-white">{team.goalsFor || 0}</div>
                                </div>
                                <div className="text-green-500 text-3xl">⚽</div>
                            </div>
                            <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Gols Sofridos</div>
                                    <div className="text-3xl font-black text-white">{team.goalsAgainst || 0}</div>
                                </div>
                                <div className="text-red-500 text-3xl">🥅</div>
                            </div>

                            <div className="col-span-1 md:col-span-2 bg-white/5 p-4 rounded-xl text-center">
                                <span className="text-gray-400 text-sm font-bold uppercase">Saldo de Gols: </span>
                                <span className={`text-2xl font-black ml-2 ${getGoalDifference() >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {getGoalDifference() > 0 ? '+' : ''}{getGoalDifference()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODALS --- */}
            {/* Edit Team Modal */}
            <EditTeamModal
                team={team}
                isOpen={isEditTeamModalOpen}
                onClose={() => setIsEditTeamModalOpen(false)}
                onSave={handleUpdateTeam}
            />

            {/* Share Modal */}
            {team && (
                <ShareTeamModal
                    team={team}
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    onUpdate={handleUpdateTeam}
                />
            )}

            {/* Create Manager Modal */}
            {team && (
                <CreateManagerModal
                    teamId={team.id}
                    isOpen={isManagerModalOpen}
                    onClose={() => setIsManagerModalOpen(false)}
                    onSuccess={fetchTeamAndPlayers}
                />
            )}

            {/* Existing Modals */}
            <EditPlayerModal
                player={editingPlayer}
                isOpen={!!editingPlayer}
                onClose={() => setEditingPlayer(null)}
                onSave={handleSavePlayer}
            />

        </div>
    );
};

export default TeamDetails;
