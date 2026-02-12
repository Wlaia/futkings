import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface Sponsor {
    id: number;
    image: string;
    name: string;
}

const SPONSORS: Sponsor[] = [
    { id: 1, image: '/sponsors/publicidade1.png', name: 'Patrocinador 1' },
    { id: 2, image: '/sponsors/publicidade2.png', name: 'Patrocinador 2' },
    { id: 3, image: '/sponsors/publicidade3.png', name: 'Patrocinador 3' },
    { id: 4, image: '/sponsors/publicidade4.png', name: 'Patrocinador 4' },
    { id: 5, image: '/sponsors/publicidade5.png', name: 'Patrocinador 5' },
];

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
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-4 md:p-12 animate-in fade-in zoom-in duration-500">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-yellow-500/10 blur-[120px] rounded-full animate-pulse " />
            </div>

            {/* Top Label */}
            <div className="absolute top-12 left-0 right-0 z-20 px-8 flex justify-between items-center max-w-[1400px] mx-auto w-full">
                <div className="flex flex-col">
                    <span className="text-yellow-500 font-black uppercase tracking-[0.5em] text-sm md:text-xl italic animate-pulse">
                        Espaço Publicitário
                    </span>
                    <div className="h-1 w-24 bg-yellow-500 mt-2" />
                </div>
                <div className="flex gap-2">
                    {SPONSORS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-500 ${idx === currentIndex ? 'w-12 bg-yellow-500' : 'w-3 bg-white/10'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Main Stage */}
            <div className="relative w-full max-w-[1400px] aspect-video flex items-center justify-center">
                {SPONSORS.map((sponsor, index) => (
                    <div
                        key={sponsor.id}
                        className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform flex items-center justify-center p-4 md:p-12 ${index === currentIndex
                            ? 'opacity-100 scale-100 translate-x-0 rotate-0'
                            : 'opacity-0 scale-75 translate-x-32 rotate-6 pointer-events-none'
                            }`}
                    >
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Card Shadow/Glow */}
                            <div className="absolute inset-0 bg-white/5 rounded-[40px] border border-white/10 shadow-[0_0_100px_rgba(255,255,255,0.05)]" />

                            <img
                                src={sponsor.image}
                                alt={sponsor.name}
                                className="relative max-w-[85%] max-h-[85%] object-contain filter drop-shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-transform duration-700 hover:scale-105"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    </div>
                ))}

                {/* Navigation Buttons */}
                <button
                    onClick={prevSlide}
                    className="absolute -left-4 md:-left-8 top-1/2 -translate-y-1/2 z-30 p-4 md:p-6 rounded-2xl bg-white/5 text-white hover:bg-yellow-500 hover:text-black transition-all transform hover:scale-110 border border-white/10 backdrop-blur-md group"
                >
                    <FaChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute -right-4 md:-right-8 top-1/2 -translate-y-1/2 z-30 p-4 md:p-6 rounded-2xl bg-white/5 text-white hover:bg-yellow-500 hover:text-black transition-all transform hover:scale-110 border border-white/10 backdrop-blur-md group"
                >
                    <FaChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-12 flex flex-col items-center gap-8 w-full">
                {/* Sponsor Name */}
                <p className="text-white font-black text-3xl md:text-5xl uppercase tracking-[0.2em] italic drop-shadow-2xl">
                    {SPONSORS[currentIndex].name}
                </p>

                {/* Progress Bar Container */}
                <div className="w-1/2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 transition-all duration-50 shadow-[0_0_15px_rgba(234,179,8,0.5)]" style={{ width: `${progress}%` }} />
                </div>

                {/* Action Button */}
                <button
                    onClick={onClose}
                    className="mt-4 bg-yellow-600 hover:bg-yellow-500 text-white px-16 py-6 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(202,138,4,0.4)] flex items-center gap-4 text-2xl md:text-3xl transition-all hover:scale-110 active:scale-95 border-b-8 border-yellow-800"
                >
                    <FaRedo className="animate-spin-slow" /> Iniciar 2º Tempo
                </button>
            </div>
        </div>
    );
};

export default SponsorCarousel;
