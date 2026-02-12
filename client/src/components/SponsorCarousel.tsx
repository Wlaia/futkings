import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaRedo } from 'react-icons/fa';

import { SPONSORS } from '../constants/sponsors';

interface SponsorCarouselProps {
    onClose: () => void;
}

const SponsorCarousel: React.FC<SponsorCarouselProps> = ({ onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % SPONSORS.length);
        setProgress(0);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + SPONSORS.length) % SPONSORS.length);
        setProgress(0);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    nextSlide();
                    return 0;
                }
                return prev + 1;
            });
        }, 50);

        return () => clearInterval(interval);
    }, [currentIndex]);

    return (
        <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-0 animate-in fade-in duration-1000">
            {/* Pure Black Background - No Ambient Glow */}

            {/* Top Label */}
            <div className="absolute top-12 left-0 right-0 z-20 px-12 flex justify-between items-center max-w-[1800px] mx-auto w-full">
                <div className="flex flex-col">
                    <span className="text-yellow-500 font-black uppercase tracking-[1em] text-xl md:text-3xl italic">
                        PUBLICIDADE
                    </span>
                    <div className="h-2 w-48 bg-yellow-500 mt-4 shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
                </div>
                <div className="flex gap-3">
                    {SPONSORS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2.5 rounded-full transition-all duration-700 ${idx === currentIndex ? 'w-20 bg-yellow-500' : 'w-4 bg-white/5'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Main Stage - Full width/height focus */}
            <div className="relative w-full h-[85vh] flex items-center justify-center overflow-hidden">
                {SPONSORS.map((sponsor, index) => (
                    <div
                        key={sponsor.id}
                        className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform flex items-center justify-center p-2 md:p-4 ${index === currentIndex
                            ? 'opacity-100 scale-100 translate-x-0 rotate-0'
                            : 'opacity-0 scale-90 translate-x-[100%] rotate-6 pointer-events-none'
                            }`}
                    >
                        <div className="relative w-full h-full flex items-center justify-center max-w-[1600px]">
                            <img
                                src={sponsor.image}
                                alt={sponsor.name}
                                className="relative w-full h-full object-contain filter drop-shadow-[0_0_120px_rgba(255,255,255,0.25)] transition-transform duration-700"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    </div>
                ))}

                {/* Navigation Buttons - Larger and further apart */}
                <button
                    onClick={prevSlide}
                    className="absolute left-8 top-1/2 -translate-y-1/2 z-30 p-8 rounded-full bg-white/5 text-white hover:bg-yellow-500 hover:text-black transition-all transform hover:scale-110 border border-white/10 group"
                >
                    <FaChevronLeft size={48} className="group-hover:-translate-x-2 transition-transform" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-8 top-1/2 -translate-y-1/2 z-30 p-8 rounded-full bg-white/5 text-white hover:bg-yellow-500 hover:text-black transition-all transform hover:scale-110 border border-white/10 group"
                >
                    <FaChevronRight size={48} className="group-hover:translate-x-2 transition-transform" />
                </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-8 flex flex-col items-center gap-10 w-full">
                {/* Sponsor Name - Huge and high impact */}
                <p className="text-white font-black text-5xl md:text-8xl uppercase tracking-[0.3em] italic drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    {SPONSORS[currentIndex].name}
                </p>

                {/* Progress Bar Container - Wider */}
                <div className="w-2/3 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 transition-all duration-50 shadow-[0_0_25px_rgba(234,179,8,0.6)]" style={{ width: `${progress}%` }} />
                </div>

                {/* Action Button - Massive */}
                <button
                    onClick={onClose}
                    className="mt-6 bg-yellow-600 hover:bg-yellow-500 text-white px-20 py-6 rounded-[20px] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(202,138,4,0.4)] flex items-center gap-6 text-2xl md:text-3xl transition-all hover:scale-105 active:scale-95 border-b-[8px] border-yellow-800"
                >
                    <FaRedo className="animate-spin-slow" /> Iniciar 2º Tempo
                </button>
            </div>
        </div>
    );
};

export default SponsorCarousel;
