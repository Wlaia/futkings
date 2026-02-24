import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFutbol } from 'react-icons/fa';
import SafeImage from './SafeImage';

interface GoalAnimationProps {
    isOpen: boolean;
    onClose: () => void;
    teamName?: string;
    teamLogo?: string;
    playerName?: string;
    playerAvatar?: string;
    goalValue?: number;
}

const GoalAnimation: React.FC<GoalAnimationProps> = ({
    isOpen,
    onClose,
    teamName,
    teamLogo,
    playerName,
    playerAvatar,
    goalValue
}) => {
    React.useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Slightly longer for more details
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 backdrop-blur-xl overflow-hidden"
                    onClick={onClose}
                >
                    {/* Background Particles/Effects */}
                    <div className="absolute inset-0 z-0">
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: Math.random() * window.innerWidth,
                                    y: window.innerHeight + 100,
                                    scale: Math.random() * 0.5 + 0.5,
                                    opacity: 0
                                }}
                                animate={{
                                    y: -100,
                                    opacity: [0, 1, 0],
                                    rotate: 360
                                }}
                                transition={{
                                    duration: Math.random() * 2 + 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2
                                }}
                                className="absolute text-yellow-500/10"
                            >
                                <FaFutbol size={Math.random() * 40 + 20} />
                            </motion.div>
                        ))}
                    </div>

                    <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-4">
                        {/* Player Image with Team Shield Overlay */}
                        <div className="relative mb-12">
                            {/* Player Photo (Main) */}
                            <motion.div
                                initial={{ scale: 0, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', damping: 15, stiffness: 100, delay: 0.1 }}
                                className="w-64 h-64 md:w-80 md:h-80 bg-gradient-to-br from-gray-800 to-black rounded-3xl p-1.5 shadow-[0_0_80px_rgba(234,179,8,0.4)] border-2 border-yellow-500/30 overflow-hidden relative"
                            >
                                <div className="w-full h-full rounded-[22px] overflow-hidden bg-gray-900 border border-white/10">
                                    <SafeImage
                                        src={playerAvatar}
                                        className="w-full h-full object-cover"
                                        alt={playerName}
                                        fallbackIcon={<div className="w-full h-full flex items-center justify-center text-6xl text-gray-700 bg-gray-900"><FaFutbol className="animate-pulse" /></div>}
                                    />
                                </div>

                                {/* Inner Glow Effect */}
                                <div className="absolute inset-0 rounded-[22px] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] pointer-events-none"></div>
                            </motion.div>

                            {/* Team Shield (Small Corner Frame) */}
                            <motion.div
                                initial={{ x: 50, y: 50, scale: 0, rotate: 45 }}
                                animate={{ x: 0, y: 0, scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', delay: 0.4, damping: 10 }}
                                className="absolute -bottom-6 -right-6 w-24 h-24 md:w-32 md:h-32 bg-gray-900 rounded-2xl border-2 border-yellow-500 p-2.5 shadow-2xl z-20 backdrop-blur-md"
                            >
                                <div className="w-full h-full bg-white/5 rounded-lg p-1">
                                    <SafeImage
                                        src={teamLogo}
                                        className="w-full h-full object-contain"
                                        alt={teamName}
                                    />
                                </div>
                            </motion.div>
                        </div>

                        {/* Text Information */}
                        <div className="text-center space-y-4">
                            {/* GOOOOOL Highlighting */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase mb-2">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 drop-shadow-[0_5px_15px_rgba(234,179,8,0.5)]">
                                        GOOOOOOL!
                                    </span>
                                </h2>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="space-y-1"
                            >
                                <div className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight leading-none drop-shadow-lg">
                                    {playerName || 'EQUIPE'}
                                </div>
                                <div className="text-lg md:text-xl font-bold text-yellow-500 uppercase tracking-[0.3em] opacity-80 decoration-yellow-500/50 underline underline-offset-8">
                                    {teamName}
                                </div>

                                {goalValue && goalValue > 1 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 1 }}
                                        className="inline-block mt-8 bg-gradient-to-r from-yellow-500 to-orange-600 text-black px-8 py-2 rounded-xl font-black text-2xl shadow-xl shadow-yellow-500/20"
                                    >
                                        VALE {goalValue}!
                                    </motion.div>
                                )}
                            </motion.div>
                        </div>
                    </div>

                    {/* Flash effect */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="absolute inset-0 bg-white z-[310] pointer-events-none"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GoalAnimation;
