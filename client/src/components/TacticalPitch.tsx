import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import './TacticalPitch.css';

interface Player {
    id: string;
    name: string;
    number: number;
    position: 'GOALKEEPER' | 'FIELD';
    avatarUrl?: string;
    overall?: number;
}

interface TacticalPitchProps {
    players: Player[];
    onPlayerClick: (player: Player) => void;
}

const TacticalPitch: React.FC<TacticalPitchProps> = ({ players, onPlayerClick }) => {
    const constraintsRef = useRef(null);

    // Helper to determine initial position on pitch (0-100%)
    const getInitialPosition = (index: number, _total: number, position: string) => {
        if (position === 'GOALKEEPER') {
            return { bottom: '4%', left: '50%', transform: 'translateX(-50%)' };
        }

        const slots = [
            { bottom: '25%', left: '30%' }, // Def L
            { bottom: '25%', left: '70%' }, // Def R
            { bottom: '55%', left: '50%' }, // Mid
            { bottom: '75%', left: '35%' }, // Att L
            { bottom: '75%', left: '65%' }, // Att R
            { bottom: '42%', left: '50%' }, // CDM
        ];

        const fpIndex = players.filter(p => p.position !== 'GOALKEEPER').indexOf(players[index]);
        const slot = slots[fpIndex % slots.length] || { bottom: '50%', left: '50%' };
        return { ...slot, transform: 'translate(-50%, -50%)' };
    };

    return (
        <div
            ref={constraintsRef}
            className="pitch-surface w-full aspect-[2/3] max-w-[450px] mx-auto rounded-2xl border-[6px] border-[#2a4d2a] shadow-[0_0_100px_rgba(0,0,0,0.8)] select-none relative"
        >
            {/* Field Graphics */}
            <div className="pitch-grass-texture" />

            {/* Lines */}
            <div className="pitch-line pitch-line-border" />
            <div className="pitch-line pitch-line-center" />
            <div className="pitch-line pitch-circle-center" />
            <div className="pitch-line pitch-dot-center" />

            {/* Areas */}
            <div className="pitch-line pitch-area-bottom" />
            <div className="pitch-line pitch-area-top" />
            <div className="pitch-line pitch-goal-bottom" />
            <div className="pitch-line pitch-goal-top" />

            {/* Corner Arcs */}
            <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-white/40 rounded-tl-full" />
            <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-white/40 rounded-tr-full" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-white/40 rounded-bl-full" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-white/40 rounded-br-full" />

            {/* Players */}
            {players.map((player, idx) => {
                const initialStyle = getInitialPosition(idx, players.length, player.position);

                return (
                    <motion.div
                        key={player.id}
                        drag
                        dragConstraints={constraintsRef}
                        dragElastic={0.05}
                        dragMomentum={false}
                        initial={false}
                        className="absolute flex flex-col items-center cursor-move z-20 group"
                        style={{
                            bottom: initialStyle.bottom,
                            left: initialStyle.left,
                            width: '60px',
                            height: '80px',
                        }}
                    >
                        {/* Player Node */}
                        <div
                            onClick={() => onPlayerClick(player)}
                            className={`
                                w-14 h-14 rounded-full border-4 player-node-glow flex items-center justify-center relative overflow-hidden transition-all duration-300
                                ${player.position === 'GOALKEEPER'
                                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-600 to-yellow-900'
                                    : 'border-blue-400 bg-gradient-to-br from-blue-600 to-blue-900'}
                                hover:scale-110 active:scale-95 group-hover:border-white
                            `}
                        >
                            {player.avatarUrl ? (
                                <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-black text-lg text-white drop-shadow-md">{player.number}</span>
                            )}

                            {/* Reflection effect */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 skew-y-[-20deg] pointer-events-none" />
                        </div>

                        {/* Label */}
                        <div className="mt-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/20 shadow-xl group-hover:bg-yellow-500 group-hover:text-black transition-colors whitespace-nowrap">
                            {player.name.split(' ')[0]}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default TacticalPitch;

