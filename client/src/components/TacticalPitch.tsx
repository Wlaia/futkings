import React from 'react';

interface Player {
    id: string;
    name: string;
    number: number;
    position: 'GOALKEEPER' | 'FIELD';
    avatarUrl?: string;
    overall?: number; // Optional prop if we pre-calc it, otherwise calc here
}

interface TacticalPitchProps {
    players: Player[];
    onPlayerClick: (player: Player) => void;
}

const TacticalPitch: React.FC<TacticalPitchProps> = ({ players, onPlayerClick }) => {

    // Helper to determine position on pitch (0-100%)
    // Simple logic for 5-a-side / 7-a-side distribution
    const getPositionStyle = (index: number, total: number, position: string) => {
        if (position === 'GOALKEEPER') {
            return { bottom: '5%', left: '50%', transform: 'translateX(-50%)' };
        }

        // Distribute field players
        // Simple distinct positions for demo visual
        const isDefender = index % 2 === 0; // Mock logic
        const yPos = isDefender ? '30%' : '60%';
        const xPos = isDefender ? (index % 3 === 0 ? '30%' : '70%') : (index % 3 === 0 ? '40%' : '60%');

        // Spread logic manually for better aesthetics if small number
        // This is a naive implementation, can be improved with real tactical formations later
        const fieldPlayers = players.filter(p => p.position !== 'GOALKEEPER');
        const fieldIndex = fieldPlayers.findIndex(p => p.id === players[index].id); // This won't work directly inside map of all players easily without robust logic.

        // Quick hardcoded slots for up to 7 players to look good
        const slots = [
            { bottom: '25%', left: '30%' }, // Def L
            { bottom: '25%', left: '70%' }, // Def R
            { bottom: '55%', left: '50%' }, // Mid
            { bottom: '75%', left: '35%' }, // Att L
            { bottom: '75%', left: '65%' }, // Att R
            { bottom: '40%', left: '50%' }, // CDM
        ];

        if (position !== 'GOALKEEPER') {
            // Find index among field players
            const fpIndex = players.filter(p => p.position !== 'GOALKEEPER').indexOf(players[index]);
            const slot = slots[fpIndex % slots.length];
            return slot;
        }

        return { top: '50%', left: '50%' };
    };

    return (
        <div className="pitch-container relative w-full aspect-[2/3] max-w-[400px] mx-auto bg-green-900 rounded-xl border-4 border-white/20 shadow-2xl overflow-hidden select-none">
            {/* Field Texture */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/grass.png')]"></div>

            {/* Lines */}
            <div className="absolute inset-4 border-2 border-white/40 opacity-60 rounded-sm"></div>
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/30"></div> {/* Center Line (Vertical for layout?? No, standard pitch is vertical here) */}

            <div className="absolute top-[50%] left-0 right-0 h-[1px] bg-white/40"></div> {/* Halfway line */}
            <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-20 h-20 border-2 border-white/40 rounded-full"></div> {/* Center Circle */}

            {/* Boxes */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[15%] border-2 border-b-0 border-white/40 bg-white/5"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[15%] border-2 border-t-0 border-white/40 bg-white/5"></div>

            {/* Players */}
            {players.map((player, idx) => {
                const posStyle = getPositionStyle(idx, players.length, player.position);

                return (
                    <div
                        key={player.id}
                        className="absolute flex flex-col items-center cursor-pointer transition-transform hover:scale-125 z-10 group"
                        style={posStyle}
                        onClick={() => onPlayerClick(player)}
                    >
                        {/* Player Dot/Icon */}
                        <div className={`w-10 h-10 rounded-full border-2 ${player.position === 'GOALKEEPER' ? 'border-yellow-400 bg-yellow-900' : 'border-blue-400 bg-blue-900'} flex items-center justify-center shadow-lg relative overflow-hidden`}>
                            {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-xs">{player.number}</span>
                            )}
                        </div>

                        {/* Name Label */}
                        <div className="mt-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider text-white border border-white/10 group-hover:bg-black/80 transition-colors">
                            {player.name.split(' ')[0]}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TacticalPitch;
