import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaDiceD20, FaCheckCircle, FaTimes } from 'react-icons/fa';
import SafeImage from './SafeImage';
import type { Match, Team } from '../types.ts';

interface DrawAnimationModalProps {
    isOpen: boolean;
    onClose: () => void;
    matches: Match[];
    teams: Team[];
}

const DrawAnimationModal: React.FC<DrawAnimationModalProps> = ({ isOpen, onClose, matches, teams }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<'INTRO' | 'SHUFFLING_HOME' | 'SHUFFLING_AWAY' | 'REVEALED' | 'FINISHED'>('INTRO');
    const [shuffledTeam, setShuffledTeam] = useState<Team | null>(null);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
            setPhase('INTRO');
        }
    }, [isOpen]);

    // Animation Sequence
    useEffect(() => {
        if (!isOpen) return;

        let timeout: ReturnType<typeof setTimeout>;
        let shuffleInterval: ReturnType<typeof setInterval>;

        const startShuffle = () => {
            shuffleInterval = setInterval(() => {
                const randomTeam = teams[Math.floor(Math.random() * teams.length)];
                setShuffledTeam(randomTeam);
            }, 100);
        };

        const stopShuffle = () => clearInterval(shuffleInterval);

        if (phase === 'INTRO') {
            timeout = setTimeout(() => setPhase('SHUFFLING_HOME'), 2000);
        } else if (phase === 'SHUFFLING_HOME') {
            startShuffle();
            timeout = setTimeout(() => {
                stopShuffle();
                setPhase('SHUFFLING_AWAY');
            }, 2000);
        } else if (phase === 'SHUFFLING_AWAY') {
            startShuffle();
            timeout = setTimeout(() => {
                stopShuffle();
                setPhase('REVEALED');
            }, 2000);
        } else if (phase === 'REVEALED') {
            timeout = setTimeout(() => {
                if (currentIndex < matches.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                    setPhase('SHUFFLING_HOME');
                } else {
                    setPhase('FINISHED');
                }
            }, 3000); // Show result for 3 seconds
        }

        return () => {
            clearTimeout(timeout);
            stopShuffle();
        };
    }, [phase, isOpen, currentIndex, matches.length, teams]);

    if (!isOpen) return null;

    const currentMatch = matches[currentIndex];

    // Slot Machine Component for Team
    const SlotMachine = ({ team, isShuffling, label }: { team: Team | undefined, isShuffling: boolean, label: string }) => (
        <div className="flex flex-col items-center gap-4 w-48">
            <span className="text-gray-400 font-bold tracking-widest text-sm uppercase">{label}</span>
            <div className="w-32 h-32 bg-gray-800 rounded-2xl border-4 border-gray-700 flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={isShuffling ? shuffledTeam?.id : team?.id}
                        initial={{ y: 50, opacity: 0, filter: 'blur(10px)' }}
                        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                        exit={{ y: -50, opacity: 0, filter: 'blur(10px)' }}
                        transition={{ duration: 0.1 }}
                        className="absolute inset-0 flex items-center justify-center p-2"
                    >
                        <SafeImage
                            src={isShuffling ? shuffledTeam?.logoUrl : team?.logoUrl}
                            className="w-24 h-24 object-contain drop-shadow-lg"
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className={`text-xl font-black text-center min-h-[3.5rem] flex items-center justify-center leading-tight ${!isShuffling ? 'text-white' : 'text-gray-600 blur-sm'}`}>
                {isShuffling ? '???' : team?.name}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
            <div className="w-full max-w-4xl flex flex-col items-center">

                {/* Header */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                    >
                        <FaDiceD20 className="text-6xl text-yellow-500 mb-4 animate-spin-slow" />
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter">
                            Sorteio Oficial
                        </h2>
                        <p className="text-yellow-500 font-bold tracking-[0.5em] mt-2">DEFININDO CONFRONTOS</p>
                    </motion.div>
                </div>

                {/* Main Content */}
                <div className="w-full min-h-[400px] flex items-center justify-center relative">

                    {phase === 'FINISHED' ? (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gray-800/50 p-12 rounded-3xl border border-green-500/30 text-center backdrop-blur-md"
                        >
                            <FaCheckCircle className="text-8xl text-green-500 mx-auto mb-6" />
                            <h3 className="text-4xl font-bold text-white mb-4">Sorteio Finalizado!</h3>
                            <p className="text-gray-400 text-xl mb-8">Todos os confrontos da 1ª Rodada foram definidos.</p>
                            <button
                                onClick={onClose}
                                className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-12 rounded-xl text-xl transition shadow-lg shadow-green-500/20"
                            >
                                Ver Tabela Completa
                            </button>
                        </motion.div>
                    ) : (
                        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">

                            {/* Home Team */}
                            <SlotMachine
                                team={currentMatch?.homeTeam}
                                isShuffling={phase === 'INTRO' || phase === 'SHUFFLING_HOME'}
                                label="MANDANTE"
                            />

                            {/* VS Badge */}
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center font-black text-2xl text-black shadow-[0_0_30px_rgba(234,179,8,0.5)] z-10">
                                    VS
                                </div>
                                <div className="text-gray-500 font-mono mt-4 text-sm">
                                    JOGO {currentIndex + 1} / {matches.length}
                                </div>
                            </div>

                            {/* Away Team */}
                            <SlotMachine
                                team={currentMatch?.awayTeam}
                                isShuffling={phase !== 'SHUFFLING_AWAY' && phase !== 'REVEALED'}
                                label="VISITANTE"
                            />
                        </div>
                    )}

                </div>

                {/* Skip Button */}
                {phase !== 'FINISHED' && (
                    <button
                        onClick={() => setPhase('FINISHED')}
                        className="mt-12 text-gray-500 hover:text-white transition flex items-center gap-2"
                    >
                        <FaTimes /> Pular Animação
                    </button>
                )}

            </div>
        </div>
    );
};

export default DrawAnimationModal;
