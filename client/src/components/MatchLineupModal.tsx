import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import PlayerCard from './PlayerCard';

interface Player {
    id: string;
    name: string;
    number: number;
    position: 'GOALKEEPER' | 'FIELD';
    avatarUrl?: string;
    isStarter?: boolean;
}

interface Team {
    id: string;
    name: string;
    logoUrl?: string;
    players: Player[];
}

interface MatchLineupModalProps {
    isOpen: boolean;
    onClose: () => void;
    homeTeam: Team;
    awayTeam: Team;
}

const MatchLineupModal: React.FC<MatchLineupModalProps> = ({ isOpen, onClose, homeTeam, awayTeam }) => {
    const [activeTab, setActiveTab] = useState<'HOME' | 'AWAY'>('HOME');

    if (!isOpen) return null;

    const currentTeam = activeTab === 'HOME' ? homeTeam : awayTeam;
    const starters = currentTeam.players
        .filter(p => p.isStarter)
        .slice(0, 5)
        .sort((a, b) => {
            if (a.position === 'GOALKEEPER' && b.position !== 'GOALKEEPER') {
                return -1;
            }
            if (a.position !== 'GOALKEEPER' && b.position === 'GOALKEEPER') {
                return 1;
            }
            return 0;
        });

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[120px] rounded-full transition-colors duration-1000 ${activeTab === 'HOME' ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}></div>
                <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[120px] rounded-full transition-colors duration-1000 ${activeTab === 'HOME' ? 'bg-yellow-500/10' : 'bg-blue-500/10'}`}></div>
            </div>

            <div className="relative w-full h-full flex flex-col p-4 md:p-8 max-w-[1400px] mx-auto z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex flex-col">
                        <h2 className="text-white font-black text-4xl md:text-6xl uppercase italic tracking-tighter">
                            Escalação <span className="text-yellow-500">Oficial</span>
                        </h2>
                        <div className="h-1.5 w-48 bg-yellow-500 mt-2 shadow-[0_0_20px_rgba(234,179,8,0.5)]"></div>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/10 hover:bg-white/20 text-white w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all hover:rotate-90"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                {/* Team Selector */}
                <div className="flex gap-4 mb-12">
                    <button
                        onClick={() => setActiveTab('HOME')}
                        className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeTab === 'HOME' ? 'bg-yellow-500 text-black scale-105 shadow-[0_0_30px_rgba(234,179,8,0.3)]' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                        {homeTeam.name}
                    </button>
                    <button
                        onClick={() => setActiveTab('AWAY')}
                        className={`flex-1 py-4 rounded-xl font-black uppercase tracking-widest transition-all ${activeTab === 'AWAY' ? 'bg-blue-600 text-white scale-105 shadow-[0_0_30px_rgba(37,99,235,0.3)]' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                        {awayTeam.name}
                    </button>
                </div>

                {/* Players Grid */}
                <div className="flex-1 flex items-center justify-center overflow-x-auto pb-8 custom-scrollbar">
                    <div className="flex gap-6 md:gap-12 px-4 animate-in slide-in-from-bottom-12 duration-700 ease-out">
                        {starters.map((player, idx) => (
                            <div
                                key={player.id}
                                className="transform transition-all duration-500 delay-[idx*100ms] hover:scale-110"
                                style={{ animationDelay: `${idx * 150}ms` }}
                            >
                                <div className="scale-[0.85] md:scale-100">
                                    <PlayerCard
                                        player={{
                                            ...player,
                                            goals: 0,
                                            assists: 0,
                                            yellowCards: 0,
                                            redCards: 0,
                                            saves: 0,
                                            goalsConceded: 0
                                        }}
                                        teamLogo={currentTeam.logoUrl}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer info */}
                <div className="mt-8 flex justify-center">
                    <div className="bg-white/5 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 text-gray-400 font-bold uppercase tracking-widest text-sm">
                        Futkings Match Day • Temporada 2024
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchLineupModal;
