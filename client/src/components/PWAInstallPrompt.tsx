import React, { useState, useEffect } from 'react';
import { FaDownload, FaTimes, FaShareSquare, FaPlusSquare } from 'react-icons/fa';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if it's iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (navigator as any).standalone
            || document.referrer.includes('android-app://');

        if (isStandalone) return;

        const handler = (e: Event) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Show iOS instructions after a short delay if not standalone
        if (isIOSDevice && !isStandalone) {
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const dismissPrompt = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 z-[9999] animate-bounce-in">
            <div className="bg-gray-900 border border-yellow-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(234,179,8,0.3)] backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>

                <button
                    onClick={dismissPrompt}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
                >
                    <FaTimes />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-black flex-shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                        <FaDownload size={24} />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1">
                            Instalar Futkings
                        </h3>
                        <p className="text-gray-400 text-sm leading-tight mb-4">
                            Tenha uma experiência completa instalando nosso app em sua tela de início.
                        </p>

                        {isIOS ? (
                            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                                <p className="text-xs text-gray-300 flex items-center gap-2 mb-2">
                                    1. Toque no ícone de compartilhar <FaShareSquare className="text-blue-400" />
                                </p>
                                <p className="text-xs text-gray-300 flex items-center gap-2">
                                    2. Selecione <strong>"Tela de Início"</strong> <FaPlusSquare />
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstallClick}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 uppercase text-xs"
                            >
                                Instalar Agora
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
