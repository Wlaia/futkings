import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { FaEdit, FaPlus, FaLock, FaPrint } from 'react-icons/fa';
import SafeImage from '../components/SafeImage';

import PlayerCard from '../components/PlayerCard';
import PublicPlayerModal from '../components/PublicPlayerModal';

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
    manager?: { name: string };
    players: Player[];
    isPublicLinkActive: boolean;
    publicCanAddPlayer: boolean;
    publicCanEditPlayer: boolean;
    publicCanImportPlayer: boolean;
    publicCanPrintPlayer: boolean;
    championship?: { registrationEnabled: boolean };
}

const PublicTeamDetails: React.FC = () => {
    const { id } = useParams();
    const [team, setTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
    const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>(undefined);

    useEffect(() => {
        fetchTeam();
    }, [id]);

    const fetchTeam = async () => {
        try {
            const response = await api.get(`/public/teams/${id}`);
            if (response.data) {
                // Determine if we should show the team
                // Logic: If isPublicLinkActive is false, we might want to hide it.
                // However, the user said "remove permissions -> read only".
                // We assume "Active Link" means "Link Works".
                // If the user wants to DISABLE the link entirely, they toggle "Ativar Link" off. 
                // Then we show "Inactive".
                setTeam(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlayer = async (data: any) => {
        if (!team) return;
        try {
            if (modalMode === 'ADD') {
                await api.post(`/public/teams/${team.id}/players`, data);
            } else {
                if (!selectedPlayer) return;
                await api.put(`/public/teams/${team.id}/players/${selectedPlayer.id}`, data);
            }
            fetchTeam(); // Refresh
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const handleDeletePlayer = async () => {
        if (!team || !selectedPlayer) return;
        try {
            await api.delete(`/public/teams/${team.id}/players/${selectedPlayer.id}`);
            fetchTeam();
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    if (loading) return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center font-bold">Carregando...</div>;

    if (!team) return <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center font-bold">Time não encontrado.</div>;

    if (!team.isPublicLinkActive) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center gap-4">
                <FaLock size={48} className="text-gray-600" />
                <h1 className="text-2xl font-bold text-gray-400">Este link não está mais ativo.</h1>
                <p className="text-gray-500">Solicite um novo link ao organizador.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 animate-fade-in pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center gap-6 mb-12 border-b border-gray-800 pb-8">
                <SafeImage
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-yellow-500 shadow-xl shadow-yellow-900/20"
                    fallbackIcon={
                        <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center text-4xl font-bold text-gray-600">
                            {team.name.charAt(0)}
                        </div>
                    }
                />
                <div className="text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter drop-shadow-md">
                        {team.name}
                    </h1>
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                        <span className="text-yellow-500 font-bold uppercase text-xs tracking-widest bg-yellow-500/10 px-2 py-1 rounded">
                            {team.players.length} Jogadores
                        </span>
                        {/* Manager info is optional or hidden for public logic usually, keeping simple */}
                    </div>
                </div>

                <div className="md:ml-auto flex gap-4">
                    {/* Print Button */}
                    {team.publicCanPrintPlayer && (
                        <button
                            onClick={() => window.print()}
                            className="bg-gray-800 border border-white/20 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 hover:bg-gray-700 transition"
                        >
                            <FaPrint /> Imprimir
                        </button>
                    )}

                    {/* Add Player Button */}
                    {team.publicCanAddPlayer && (
                        <button
                            onClick={() => {
                                if (team.championship?.registrationEnabled === false) {
                                    alert("As inscrições de jogadores estão bloqueadas para este campeonato.");
                                    return;
                                }
                                setModalMode('ADD');
                                setSelectedPlayer(undefined);
                                setIsModalOpen(true);
                            }}
                            className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider shadow-lg flex items-center gap-2 transition-transform hover:scale-105 ${team.championship?.registrationEnabled === false
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-500 text-white'
                                }`}
                            title={team.championship?.registrationEnabled === false ? "Inscrições Bloqueadas" : "Adicionar Jogador"}
                        >
                            {team.championship?.registrationEnabled === false ? <FaLock /> : <FaPlus />}
                            {team.championship?.registrationEnabled === false ? 'Inscrições Bloqueadas' : 'Adicionar Jogador'}
                        </button>
                    )}
                </div>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 justify-items-center">
                {team.players.map(player => (
                    <div key={player.id} className="relative group/cardwrapper hover:z-10 transition-all">
                        <PlayerCard player={player} teamLogo={team.logoUrl || undefined} />

                        {/* Edit Overlay */}
                        {team.publicCanEditPlayer && (
                            <div className="absolute top-4 right-4 z-50 opacity-0 group-hover/cardwrapper:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setModalMode('EDIT');
                                        setSelectedPlayer(player);
                                        setIsModalOpen(true);
                                    }}
                                    className="bg-yellow-500 hover:bg-yellow-400 text-black p-3 rounded-full shadow-lg transform hover:scale-110 transition-transform"
                                    title="Editar Jogador"
                                >
                                    <FaEdit size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {team.players.length === 0 && (
                <div className="text-center py-20 opacity-50">
                    <div className="text-6xl mb-4">👕</div>
                    <p className="text-xl font-bold">Nenhum jogador cadastrado.</p>
                    {team.publicCanAddPlayer && <p className="text-sm mt-2">Use o botão acima para começar.</p>}
                </div>
            )}

            {/* MODAL */}
            <PublicPlayerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                mode={modalMode}
                initialData={selectedPlayer}
                onSave={handleSavePlayer}
                onDelete={handleDeletePlayer}
            />
        </div>
    );
};

export default PublicTeamDetails;
