import React from 'react';
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
    if (!isOpen) return null;

    const getStarters = (team: Team) => {
        return team.players
            .filter(p => p.isStarter)
            .slice(0, 5)
            .sort((a, b) => {
                if (a.position === 'GOALKEEPER' && b.position !== 'GOALKEEPER') return -1;
                if (a.position !== 'GOALKEEPER' && b.position === 'GOALKEEPER') return 1;
                return 0;
            });
    };

    const homeStarters = getStarters(homeTeam);
    const awayStarters = getStarters(awayTeam);

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/98 backdrop-blur-2xl animate-in fade-in duration-500 overflow-y-auto">
            {/* Background Ambience */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[150px] rounded-full bg-yellow-500/10"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[150px] rounded-full bg-blue-500/10"></div>
            </div>

            <div className="relative w-full min-h-full flex flex-col p-4 md:p-6 z-10">
                {/* Header */}
                <div className="flex justify-between items-start mb-4 max-w-[1800px] mx-auto w-full px-4">
                    <div className="flex flex-col">
                        <h2 className="text-white font-black text-3xl md:text-5xl uppercase italic tracking-tighter">
                            Escalação <span className="text-yellow-500 text-glow-yellow">Oficial</span>
                        </h2>
                        <div className="h-1.5 w-32 bg-yellow-500 mt-2 shadow-[0_0_20px_rgba(234,179,8,0.5)]"></div>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/5 hover:bg-white/20 text-white w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all hover:rotate-90 border border-white/10"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col gap-4 py-4">
                    {/* Home Team Section */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4 px-8">
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-yellow-500/30"></div>
                            <h3 className="text-xl md:text-2xl font-black text-yellow-500 uppercase tracking-widest italic">{homeTeam.name}</h3>
                            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-yellow-500/30"></div>
                        </div>
                        <div className="overflow-x-auto pb-4 custom-scrollbar lg:overflow-x-visible">
                            <div className="flex gap-2 md:gap-4 px-4 justify-center min-w-max animate-in slide-in-from-left-12 duration-700">
                                {homeStarters.map((player) => (
                                    <div key={player.id} className="scale-[0.55] sm:scale-[0.65] md:scale-[0.75] lg:scale-[0.8] transform transition-all duration-500 hover:scale-[0.85] hover:z-20">
                                        <PlayerCard
                                            player={{ ...player, goals: 0, assists: 0, yellowCards: 0, redCards: 0, saves: 0, goalsConceded: 0 }}
                                            teamLogo={homeTeam.logoUrl}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center -my-8 z-30">
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-2 rounded-full text-white font-black italic tracking-tighter text-2xl shadow-2xl skew-x-[-12deg]">
                            VS
                        </div>
                    </div>

                    {/* Away Team Section */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4 px-8">
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-blue-500/30"></div>
                            <h3 className="text-xl md:text-2xl font-black text-blue-500 uppercase tracking-widest italic">{awayTeam.name}</h3>
                            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-blue-500/30"></div>
                        </div>
                        <div className="overflow-x-auto pb-4 custom-scrollbar lg:overflow-x-visible">
                            <div className="flex gap-2 md:gap-4 px-4 justify-center min-w-max animate-in slide-in-from-right-12 duration-700">
                                {awayStarters.map((player) => (
                                    <div key={player.id} className="scale-[0.55] sm:scale-[0.65] md:scale-[0.75] lg:scale-[0.8] transform transition-all duration-500 hover:scale-[0.85] hover:z-20">
                                        <PlayerCard
                                            player={{ ...player, goals: 0, assists: 0, yellowCards: 0, redCards: 0, saves: 0, goalsConceded: 0 }}
                                            teamLogo={awayTeam.logoUrl}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-auto py-6 flex justify-center">
                    <div className="bg-white/5 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                        Futkings Official Match Day • 2024 Premium Edition
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchLineupModal;
