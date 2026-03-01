import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { SPONSORS } from '../constants/sponsors';

interface SponsorCarouselProps {
    onClose: () => void;
}

const SponsorCarousel: React.FC<SponsorCarouselProps> = ({ onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % SPONSORS.length);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000); // 5 seconds per slide
        return () => clearInterval(interval);
    }, [currentIndex]);

    // Render via Portal to ensure it covers the entire viewport, overriding #root constraints
    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-0 animate-in fade-in duration-1000">
            {/* Main Stage - Full width/height focus */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                {SPONSORS.map((sponsor, index) => (
                    <div
                        key={sponsor.id}
                        className={`absolute inset-0 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] transform flex items-center justify-center p-4 md:p-8 ${index === currentIndex
                            ? 'opacity-100 scale-100 translate-x-0 rotate-0'
                            : 'opacity-0 scale-90 translate-x-[100%] rotate-6 pointer-events-none'
                            }`}
                    >
                        <div className="relative w-full h-full flex items-center justify-center max-w-[1800px]">
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
            </div>

            {/* Bottom Controls - ONLY Button as requested */}
            <div className="absolute bottom-12 flex flex-col items-center gap-6 w-full z-50">
                <button
                    onClick={onClose}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-16 py-6 rounded-[20px] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(202,138,4,0.4)] flex items-center gap-6 text-2xl md:text-3xl transition-all hover:scale-105 active:scale-95 border-b-[8px] border-yellow-800"
                >
                    INICIAR 2º TEMPO
                </button>
            </div>
        </div>,
        document.body
    );
};

export default SponsorCarousel;
