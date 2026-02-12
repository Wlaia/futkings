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

const SponsorCarousel: React.FC = () => {
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
        }, 50); // 5 seconds total (100 * 50ms)

        return () => clearInterval(interval);
    }, [currentIndex]);

    return (
        <div className="relative w-full overflow-hidden rounded-2xl bg-gray-900/50 backdrop-blur-md border border-white/10 shadow-2xl animate-in zoom-in duration-500">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500 animate-pulse">
                        Espaço Publicitário
                    </span>
                    <div className="flex gap-1">
                        {SPONSORS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-yellow-500' : 'w-2 bg-white/20'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Slides */}
            <div className="relative aspect-[16/9] md:aspect-[21/9] flex items-center justify-center p-8">
                {SPONSORS.map((sponsor, index) => (
                    <div
                        key={sponsor.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out transform flex items-center justify-center p-6 ${index === currentIndex
                                ? 'opacity-100 scale-100 translate-x-0'
                                : 'opacity-0 scale-95 translate-x-full'
                            }`}
                    >
                        <img
                            src={sponsor.image}
                            alt={sponsor.name}
                            className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-yellow-500 transition-all duration-50" style={{ width: `${progress}%` }} />

            {/* Navigation Buttons */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 text-white hover:bg-yellow-500 hover:text-black transition-all transform hover:scale-110 border border-white/10"
            >
                <FaChevronLeft size={20} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 text-white hover:bg-yellow-500 hover:text-black transition-all transform hover:scale-110 border border-white/10"
            >
                <FaChevronRight size={20} />
            </button>

            {/* Footer Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="text-center">
                    <p className="text-white font-bold text-xl uppercase tracking-widest drop-shadow-lg italic">
                        {SPONSORS[currentIndex].name}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SponsorCarousel;
