import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PlayerCard from '../components/PlayerCard';
import TacticalPitch from '../components/TacticalPitch';
import EditTeamModal from '../components/EditTeamModal';
import EditPlayerModal from '../components/EditPlayerModal';
import { FaEdit, FaUserShield } from 'react-icons/fa';

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
    isStarter?: boolean;
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
    const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
    const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

    const togglePlayerExpand = (playerId: string) => {
        setExpandedPlayerId(prev => prev === playerId ? null : playerId);
    };

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

    // Delete Team (Admin Only)
    const handleDeleteTeam = async () => {
        if (!team) return;
        if (!window.confirm(`Tem certeza que deseja excluir o time "${team.name}"? Esta ação não pode ser desfeita e excluirá todos os jogadores associados.`)) {
            return;
        }

        try {
            await api.delete(`/teams/${team.id}`);
            alert('Time excluído com sucesso!');
            navigate('/teams');
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir time.');
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-yellow-500 font-bold">CARREGANDO...</div>;
    if (!team) return <div className="text-white">Time não encontrado.</div>;

    // Sort Players: GK > Field for both lists
    const sortPlayers = (list: Player[]) => {
        return list.sort((a, b) => {
            if (a.position !== b.position) return a.position === 'GOALKEEPER' ? -1 : 1;
            return a.number - b.number;
        });
    };

    const starters = team ? sortPlayers(team.players.filter(p => p.isStarter)) : [];
    const reserves = team ? sortPlayers(team.players.filter(p => !p.isStarter)) : [];

    const handleToggleStarter = async (player: Player) => {
        if (!team) return;

        // Check Limit
        if (!player.isStarter && starters.length >= 5) {
            alert("Máximo de 5 titulares permitidos!");
            return;
        }

        // Optimistic Update
        const updatedStatus = !player.isStarter;
        const updatedPlayers = team.players.map(p =>
            p.id === player.id ? { ...p, isStarter: updatedStatus } : p
        );
        setTeam({ ...team, players: updatedPlayers });

        try {
            await api.put(`/players/${player.id}`, { isStarter: updatedStatus });
        } catch (error) {
            console.error("Error toggling starter:", error);
            fetchTeamAndPlayers(); // Revert
        }
    };

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
            <header className="mb-6 flex flex-col md:flex-row items-center gap-4 glass-panel p-4 rounded-xl relative overflow-hidden">
                {/* ... (Header content mostly same, adding Stats button) */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div>

                {/* Shield Area */}
                <div className="relative group shrink-0">
                    <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)] bg-black flex items-center justify-center overflow-hidden">
                        {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl md:text-4xl font-bold text-gray-700">{team.name[0]}</span>
                        )}
                    </div>
                </div>

                {/* Team Info */}
                <div className="flex-grow text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-3 justify-center md:justify-start">
                        {/* Logo for Mobile (inside info flow) or kept as is but smaller */}
                    </div>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                        <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 drop-shadow-sm leading-none">
                            {team.name}
                        </h1>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-2">
                        <div className="bg-black/40 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1.5">
                            <span className="text-yellow-500 font-bold text-xs">OVR</span>
                            <span className="text-lg font-black text-white">{teamOvr}</span>
                        </div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                            {team.players.length} Jogadores
                        </div>
                        {/* Manager Badge */}
                        {team.manager && (
                            <span className="bg-purple-900/50 text-purple-400 text-[10px] px-1.5 py-0.5 rounded border border-purple-500/30 flex items-center gap-1">
                                <FaUserShield size={10} /> {team.manager.name.split(' ')[0]}
                            </span>
                        )}
                    </div>
                    {/* Coach/Director Compact */}
                    {(team.coachName || team.directorName) && (
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-1.5 text-[10px] text-gray-400">
                            {team.directorName && <span>Dir: <strong className="text-white">{team.directorName}</strong></span>}
                            {team.coachName && <span>Téc: <strong className="text-white">{team.coachName}</strong></span>}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto shrink-0">
                    <button
                        onClick={() => setShowStats(true)}
                        className="bg-blue-900/50 border border-blue-500/30 text-blue-200 px-3 py-2 rounded-lg font-bold uppercase text-xs hover:bg-blue-800/50 transition flex items-center justify-center gap-2"
                    >
                        📊 Estatísticas
                    </button>
                    {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                        <>
                            <button
                                onClick={() => setIsEditTeamModalOpen(true)}
                                className="bg-yellow-600/20 border border-yellow-500/30 text-yellow-500 px-3 py-2 rounded-lg font-bold uppercase text-xs hover:bg-yellow-600/40 transition flex items-center justify-center gap-2"
                            >
                                <FaEdit /> Editar
                            </button>
                            <button
                                onClick={handleQuickAdd}
                                className="bg-gray-800 border border-white/20 text-white px-3 py-2 rounded-lg font-bold uppercase text-xs hover:bg-gray-700 transition flex items-center justify-center gap-2"
                            >
                                + Jogador
                            </button>
                        </>
                    )}

                    {user?.role === 'ADMIN' && !team.managerId && (
                        <button
                            onClick={() => setIsManagerModalOpen(true)}
                            className="bg-purple-600/20 border border-purple-500/30 text-purple-400 px-3 py-2 rounded-lg font-bold uppercase text-xs hover:bg-purple-600/40 transition flex items-center justify-center gap-2 col-span-2 md:col-span-1"
                        >
                            <FaUserShield /> Gerente
                        </button>
                    )}


                    {user?.role === 'ADMIN' && (
                        <button
                            onClick={handleDeleteTeam}
                            className="bg-red-900/20 border border-red-500/30 text-red-500 px-3 py-2 rounded-lg font-bold uppercase text-xs hover:bg-red-900/40 transition flex items-center justify-center gap-2"
                        >
                            🗑️ Excluir
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-gray-800 border border-white/20 text-white px-3 py-2 rounded-lg font-bold text-xs hover:bg-gray-700 transition flex items-center justify-center gap-2 col-span-2 md:col-span-1"
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
                    <div className="flex flex-col gap-12">
                        {/* --- TITULARES --- */}
                        {starters.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-black uppercase tracking-wider text-yellow-500 drop-shadow-md flex items-center gap-2">
                                        <span className="text-3xl">★</span> Titulares
                                    </h2>
                                    <div className="h-[1px] bg-gradient-to-r from-yellow-500/50 to-transparent flex-grow"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 justify-items-center">
                                    {starters.map(player => (
                                        <div key={player.id} className="relative group/cardwrapper">
                                            <PlayerCard
                                                player={player}
                                                teamLogo={team.logoUrl || undefined}
                                                onUpload={(file) => handleAvatarUpload(player.id, file)}
                                                uploading={uploadingPlayerId === player.id}
                                            />
                                            {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                                                <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover/cardwrapper:opacity-100 transition-opacity z-10">
                                                    <button
                                                        onClick={() => setEditingPlayer(player)}
                                                        className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg hover:scale-110 cursor-pointer"
                                                        title="Editar Jogador"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleStarter(player)}
                                                        className="bg-gray-800 text-gray-400 w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg hover:scale-110 hover:text-white cursor-pointer border border-white/20"
                                                        title="Mover para Reservas"
                                                    >
                                                        ⬇
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* --- RESERVAS --- */}
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-2xl font-black uppercase tracking-wider text-gray-400 drop-shadow-md flex items-center gap-2">
                                    <span className="text-2xl opacity-50">👥</span> Reservas
                                </h2>
                                <div className="h-[1px] bg-gradient-to-r from-gray-700 to-transparent flex-grow"></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 justify-items-center">
                                {reserves.map(player => (
                                    <div key={player.id} className="relative group/cardwrapper">
                                        <div className="scale-90 opacity-90 hover:scale-100 hover:opacity-100 transition-all duration-300">
                                            <PlayerCard
                                                player={player}
                                                teamLogo={team.logoUrl || undefined}
                                                onUpload={(file) => handleAvatarUpload(player.id, file)}
                                                uploading={uploadingPlayerId === player.id}
                                            />
                                        </div>
                                        {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                                            <div className="absolute top-2 left-2 flex flex-col gap-2 opacity-0 group-hover/cardwrapper:opacity-100 transition-opacity z-10">
                                                <button
                                                    onClick={() => setEditingPlayer(player)}
                                                    className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg hover:scale-110 cursor-pointer"
                                                    title="Editar Jogador"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStarter(player)}
                                                    className="bg-yellow-600 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-lg hover:scale-110 cursor-pointer border border-yellow-400"
                                                    title="Promover a Titular"
                                                >
                                                    ⬆
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add Player Button (Always in Reserves or at end) */}
                                {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                                    <div
                                        onClick={handleQuickAdd}
                                        className="w-[270px] h-[414px] scale-90 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-yellow-500/50 transition opacity-60 hover:opacity-100"
                                    >
                                        <span className="text-4xl text-yellow-500 mb-2">+</span>
                                        <span className="text-gray-400 font-bold uppercase">Novo Jogador</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {viewMode === 'PITCH' && (
                    <div className="flex justify-center pb-10">
                        <TacticalPitch
                            players={starters.length > 0 ? starters : reserves.slice(0, 7)}
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
                            {/* --- TITULARES --- */}
                            {starters.length > 0 && (
                                <>
                                    <div className="bg-black/40 px-6 py-3 border-b border-white/10 flex items-center justify-between">
                                        <h3 className="text-yellow-500 font-black uppercase tracking-wider flex items-center gap-2">
                                            <span className="text-lg">★</span> Titulares
                                        </h3>
                                        <span className="text-xs font-bold text-gray-500">{starters.length} Jogadores</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {starters.map((player) => (
                                            <div key={player.id} className="bg-white/5 rounded-xl overflow-hidden border border-white/10 transition-colors hover:border-yellow-500/30">
                                                {/* Header */}
                                                <div
                                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
                                                    onClick={() => togglePlayerExpand(player.id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-2xl font-mono text-yellow-500 font-bold w-10 text-center">{player.number}</span>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden border-2 border-yellow-500/30">
                                                                {player.avatarUrl ? (
                                                                    <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold">{player.name[0]}</div>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-white text-lg leading-tight">{player.name}</span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit mt-1 ${player.position === 'GOALKEEPER' ? 'bg-yellow-900/40 text-yellow-500' : 'bg-blue-900/40 text-blue-400'}`}>
                                                                    {player.position === 'GOALKEEPER' ? 'GOLEIRO' : 'LINHA'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`text-yellow-500 transform transition-transform duration-300 ${expandedPlayerId === player.id ? 'rotate-180' : ''}`}>
                                                        ▼
                                                    </div>
                                                </div>

                                                {/* Details (Accordion) */}
                                                {expandedPlayerId === player.id && (
                                                    <div className="bg-black/20 p-4 border-t border-white/5 animate-fade-in">
                                                        <div className="grid grid-cols-5 gap-2 text-center mb-4">
                                                            <div className="bg-white/5 rounded p-2 flex flex-col items-center">
                                                                <span className="text-[10px] text-gray-400 uppercase font-bold">Gols</span>
                                                                <span className="text-xl font-bold text-white">{player.goals}</span>
                                                            </div>
                                                            <div className="bg-white/5 rounded p-2 flex flex-col items-center">
                                                                <span className="text-[10px] text-gray-400 uppercase font-bold">Assis</span>
                                                                <span className="text-xl font-bold text-white">{player.assists}</span>
                                                            </div>
                                                            <div className="bg-white/5 rounded p-2 flex flex-col items-center">
                                                                <span className="text-[10px] text-yellow-600 uppercase font-bold">CA</span>
                                                                <span className="text-xl font-bold text-yellow-500">{player.yellowCards}</span>
                                                            </div>
                                                            <div className="bg-white/5 rounded p-2 flex flex-col items-center">
                                                                <span className="text-[10px] text-red-600 uppercase font-bold">CV</span>
                                                                <span className="text-xl font-bold text-red-500">{player.redCards}</span>
                                                            </div>
                                                            <div className="bg-white/5 rounded p-2 flex flex-col items-center border border-yellow-500/20">
                                                                <span className="text-[10px] text-yellow-500 uppercase font-bold">OVR</span>
                                                                <span className="text-xl font-black text-yellow-500">{calcOvr(player)}</span>
                                                            </div>
                                                        </div>

                                                        {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                                                            <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-white/5">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); }}
                                                                    className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                                                                >
                                                                    ✎ Editar
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleToggleStarter(player); }}
                                                                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition border border-white/10"
                                                                >
                                                                    ⬇ Para Reserva
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* --- RESERVAS --- */}
                            <div className="bg-black/40 px-6 py-3 border-b border-white/10 border-t flex items-center justify-between">
                                <h3 className="text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                    <span className="text-lg opacity-50">👥</span> Reservas
                                </h3>
                                <span className="text-xs font-bold text-gray-500">{reserves.length} Jogadores</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {reserves.map((player) => (
                                    <div key={player.id} className="bg-white/5 rounded-xl overflow-hidden border border-white/5 transition-colors hover:bg-white/10">
                                        {/* Header */}
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition"
                                            onClick={() => togglePlayerExpand(player.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-mono text-gray-500 font-bold w-10 text-center">{player.number}</span>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-gray-900 overflow-hidden border border-white/10 grayscale group-hover:grayscale-0">
                                                        {player.avatarUrl ? (
                                                            <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-sm font-bold">{player.name[0]}</div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-300 text-lg leading-tight">{player.name}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-fit mt-1 ${player.position === 'GOALKEEPER' ? 'bg-yellow-900/20 text-yellow-700' : 'bg-blue-900/20 text-blue-800'}`}>
                                                            {player.position === 'GOALKEEPER' ? 'GOLEIRO' : 'LINHA'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`text-gray-500 transform transition-transform duration-300 ${expandedPlayerId === player.id ? 'rotate-180' : ''}`}>
                                                ▼
                                            </div>
                                        </div>

                                        {/* Details (Accordion) */}
                                        {expandedPlayerId === player.id && (
                                            <div className="bg-black/20 p-4 border-t border-white/5 animate-fade-in">
                                                <div className="grid grid-cols-5 gap-2 text-center mb-4">
                                                    <div className="bg-white/5 rounded p-2 flex flex-col items-center">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Gols</span>
                                                        <span className="text-xl font-bold text-white">{player.goals}</span>
                                                    </div>
                                                    <div className="bg-white/5 rounded p-2 flex flex-col items-center">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">Assis</span>
                                                        <span className="text-xl font-bold text-white">{player.assists}</span>
                                                    </div>
                                                    <div className="bg-white/5 rounded p-2 flex flex-col items-center">
                                                        <span className="text-[10px] text-yellow-600 uppercase font-bold">CA</span>
                                                        <span className="text-xl font-bold text-yellow-600">{player.yellowCards}</span>
                                                    </div>
                                                    <div className="bg-white/5 rounded p-2 flex flex-col items-center">
                                                        <span className="text-[10px] text-red-600 uppercase font-bold">CV</span>
                                                        <span className="text-xl font-bold text-red-600">{player.redCards}</span>
                                                    </div>
                                                    <div className="bg-white/5 rounded p-2 flex flex-col items-center border border-white/10">
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold">OVR</span>
                                                        <span className="text-xl font-black text-white">{calcOvr(player)}</span>
                                                    </div>
                                                </div>

                                                {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && user.id === team.managerId)) && (
                                                    <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-white/5">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setEditingPlayer(player); }}
                                                            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                                                        >
                                                            ✎ Editar
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleToggleStarter(player); }}
                                                            className="flex-1 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition border border-yellow-500/30"
                                                        >
                                                            ⬆ Virar Titular
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
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
                startersCount={starters.length}
            />

        </div>
    );
};

export default TeamDetails;
