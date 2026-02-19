import React from 'react';
import { useAuth } from '../context/AuthContext';
import BottomMenu from './BottomMenu';

import { Link } from 'react-router-dom';
import { FaFutbol } from 'react-icons/fa';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { user, signOut } = useAuth();
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">

            {/* Desktop/Tablet Header (Hidden on small mobile if we want a different look, but usually good to keep) */}
            <header className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-6 py-4 flex justify-between items-center transition-all duration-300">
                <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img src="/logo.png" alt="Futkings" className="h-10 w-auto md:h-12 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                    <h1 className="hidden md:block text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-tighter">
                        Futkings Manager
                    </h1>
                </Link>

                {!isFullscreen && (
                    <div className="flex items-center gap-4">
                        <Link to="/friendlies" className={`flex items-center gap-3 p-3 rounded-lg transition-all ${location.pathname === '/friendlies' ? 'bg-yellow-500 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${location.pathname === '/friendlies' ? 'bg-black/20' : 'bg-gray-800'}`}>
                                <FaFutbol />
                            </div>
                            <span className="tracking-wide">Amistosos</span>
                        </Link>
                        <div className="text-right hidden sm:block">
                            <p className="font-bold text-sm text-white">{user?.name}</p>
                            <span className="text-[10px] bg-yellow-900/50 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20">{user?.role}</span>
                        </div>
                        <button
                            onClick={signOut}
                            className="text-xs font-bold text-red-500 border border-red-500/30 px-3 py-1.5 rounded hover:bg-red-900/20 transition"
                        >
                            SAIR
                        </button>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            {/* Added pb-24 to content to account for Bottom Menu height on mobile */}
            <main className="flex-grow p-4 md:p-8 pb-24 md:pb-8 overflow-x-hidden w-full max-w-7xl mx-auto">
                {children}
            </main>

            {/* Mobile Bottom Menu */}
            <BottomMenu />

        </div>
    );
};

export default Layout;
