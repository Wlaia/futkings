import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaTrophy, FaCalendarAlt, FaSignInAlt, FaStar, FaFire } from 'react-icons/fa';
import { getLogoUrl } from '../utils/imageHelper';

interface Championship {
    id: string;
    name: string;
    logoUrl?: string;
    status: 'ACTIVE' | 'COMPLETED' | 'DRAFT';
    type: string;
}

interface Team {
    id: string;
    name: string;
    logoUrl?: string;
}

interface Match {
    id: string;
    homeTeam?: Team;
    awayTeam?: Team;
    homeScore: number;
    awayScore: number;
    status: 'SCHEDULED' | 'LIVE' | 'COMPLETED';
    startTime: string;
    championship?: { name: string };
    playerStats?: any[];
}

const FanZone: React.FC = () => {
    const navigate = useNavigate();
    const [activeChampionships, setActiveChampionships] = useState<Championship[]>([]);
    const [featuredMatch, setFeaturedMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [champsRes, matchesRes] = await Promise.all([
                api.get('/championships/public-list'),
                api.get('/matches/public-list')
            ]);

            // Safe assignment with filtering for null/undefined items
            const matchesData = Array.isArray(matchesRes.data) ? matchesRes.data.filter((m: any) => m) : [];
            const championshipsData = Array.isArray(champsRes.data) ? champsRes.data.filter((c: any) => c) : [];

            setActiveChampionships(championshipsData);

            if (matchesData.length > 0) {
                // Priority: LIVE match, then next upcoming match
                const liveMatch = matchesData.find((m: Match) => m.status === 'LIVE');
                if (liveMatch) {
                    setFeaturedMatch(liveMatch);
                } else {
                    setFeaturedMatch(matchesData[0]); // First upcoming or recent
                }
            } else {
                setFeaturedMatch(null);
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching Fan Zone data", error);
            setError("Failed to load data");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Poll every 5s for near-realtime updates
        return () => clearInterval(interval);
    }, []);

    // Sponsors - only existing ones
    const sponsors = [
        { name: "Global Sports", logo: "/sponsors/publicidade1.png" },
        { name: "Tech Arena", logo: "/sponsors/publicidade2.png" },
        { name: "Energy Drink", logo: "/sponsors/publicidade3.png" },
        { name: "Bet365", logo: "/sponsors/publicidade4.png" },
        { name: "Nike", logo: "/sponsors/publicidade5.png" },
    ];

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'Em Andamento';
            case 'COMPLETED': return 'Finalizado';
            case 'DRAFT': return 'Inscrições Abertas';
            default: return status;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-yellow-600 text-black';
            case 'COMPLETED': return 'bg-green-600 text-white';
            case 'DRAFT': return 'bg-blue-600 text-white';
            default: return 'bg-gray-600';
        }
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.onerror = null; // Prevent infinite loop
        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 24 24' fill='none' stroke='%234b5563' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-shield'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'%3E%3C/path%3E%3C/svg%3E";
    };

    if (error) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
                <div className="text-center p-6">
                    <h2 className="text-3xl font-bold mb-4">Ops! Algo deu errado.</h2>
                    <p className="text-gray-400 mb-6">Não foi possível carregar o Fan Zone.</p>
                    <button onClick={() => window.location.reload()} className="bg-yellow-500 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-400 transition">
                        Tentar Novamente
                    </button>
                    <button onClick={() => navigate('/login')} className="block mt-4 text-gray-500 hover:text-white mx-auto text-sm underline">
                        Ir para Área Restrita
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">
                <div className="text-center p-6">
                    <h2 className="text-3xl font-bold mb-4">Ops! Algo deu errado.</h2>
                    <p className="text-gray-400 mb-6">Não foi possível carregar o Fan Zone.</p>
                    <button onClick={() => window.location.reload()} className="bg-yellow-500 text-black px-6 py-2 rounded-full font-bold hover:bg-yellow-400 transition">
                        Tentar Novamente
                    </button>
                    <button onClick={() => navigate('/login')} className="block mt-4 text-gray-500 hover:text-white mx-auto text-sm underline">
                        Ir para Área Restrita
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans overflow-x-hidden">

            {/* Top Navigation */}
            <nav className="fixed w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="Futkings" className="h-10 w-auto" />
                    <span className="text-xl font-black italic tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 hidden md:block">
                        Futkings <span className="text-white not-italic font-light">FanZone</span>
                    </span>
                </div>
                <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/10 hover:border-yellow-500/50"
                >
                    <FaSignInAlt /> <span className="hidden md:inline">Área Restrita</span>
                </button>
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-900/20 to-[#0f172a] z-0 pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-yellow-500/10 blur-[120px] rounded-full z-0 pointer-events-none" />

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest mb-6 animate-fade-in-up">
                        <FaFire /> O Palco dos Campeões
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black mb-6 leading-tight tracking-tighter animate-fade-in-up delay-100">
                        ACOMPANHE <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">CADA LANCE</span>
                    </h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
                        Resultados ao vivo, estatísticas detalhadas e a cobertura completa dos campeonatos mais disputados da várzea.
                    </p>

                    <div className="flex flex-col md:flex-row justify-center gap-4 animate-fade-in-up delay-300">
                        <button className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black py-4 px-10 rounded-2xl text-lg shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] transition-all transform hover:-translate-y-1">
                            JOGOS DE HOJE
                        </button>
                        <button className="bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-10 rounded-2xl text-lg border border-white/10 backdrop-blur-sm transition-all flex items-center justify-center gap-2">
                            <FaTrophy className="text-yellow-500" /> CAMPEONATOS
                        </button>
                    </div>
                </div>
            </header>

            {/* Live / Featured Match */}
            <section className="max-w-6xl mx-auto px-4 mb-24 relative z-10">
                {loading && !featuredMatch ? (
                    <div className="animate-pulse flex justify-center">
                        <div className="h-64 w-full bg-gray-800 rounded-3xl"></div>
                    </div>
                ) : featuredMatch && featuredMatch.homeTeam && featuredMatch.awayTeam ? (
                    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl p-1 shadow-2xl overflow-hidden group">
                        <div className="bg-gray-900/50 backdrop-blur-xl p-8 md:p-12 rounded-[20px] relative overflow-hidden">
                            {/* Background Effects */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

                            <div className="text-center text-xs text-gray-400 uppercase tracking-widest mb-8">
                                {featuredMatch.championship?.name || 'Amistoso Oficial'}
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                {/* Home Team */}
                                <div className="text-center md:text-right flex-1 w-full">
                                    <img
                                        src={getLogoUrl(featuredMatch.homeTeam?.logoUrl)}
                                        className="w-20 h-20 md:w-24 md:h-24 mx-auto md:ml-auto md:mr-0 mb-4 drop-shadow-xl object-contain"
                                        alt={featuredMatch.homeTeam?.name}
                                        onError={handleImageError}
                                    />
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter truncate">{featuredMatch.homeTeam?.name}</h3>
                                    <p className="text-gray-500 font-bold">Mandante</p>
                                </div>

                                {/* Score / VS */}
                                <div className="flex flex-col items-center px-8">
                                    {featuredMatch.status === 'LIVE' ? (
                                        <div className="text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full mb-4 animate-pulse">
                                            • AO VIVO •
                                        </div>
                                    ) : (
                                        <div className="text-xs font-bold text-gray-500 bg-gray-800 px-3 py-1 rounded-full mb-4">
                                            {featuredMatch.startTime ? new Date(featuredMatch.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-6 text-5xl md:text-7xl font-black font-mono">
                                        <span className="text-white">{featuredMatch.homeScore}</span>
                                        <span className="text-gray-700">:</span>
                                        <span className="text-white">{featuredMatch.awayScore}</span>
                                    </div>
                                    <div className="mt-4 text-green-400 font-mono font-bold text-lg">
                                        {featuredMatch.status === 'LIVE' ? 'Em andamento' : featuredMatch.status === 'COMPLETED' ? 'Finalizado' : 'Agendado'}
                                    </div>
                                </div>

                                {/* Away Team */}
                                <div className="text-center md:text-left flex-1 w-full">
                                    <img
                                        src={getLogoUrl(featuredMatch.awayTeam?.logoUrl)}
                                        className="w-20 h-20 md:w-24 md:h-24 mx-auto md:mr-auto md:ml-0 mb-4 drop-shadow-xl object-contain"
                                        alt={featuredMatch.awayTeam?.name}
                                        onError={handleImageError}
                                    />
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter truncate">{featuredMatch.awayTeam?.name}</h3>
                                    <p className="text-gray-500 font-bold">Visitante</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-900/50 rounded-3xl border border-dashed border-gray-800">
                        <FaCalendarAlt className="text-4xl text-gray-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-400">Nenhum jogo programado para hoje</h3>
                        <p className="text-gray-600">Confira a tabela dos campeonatos.</p>
                    </div>
                )}
            </section>

            {/* Active Championships Grid */}
            <section className="max-w-7xl mx-auto px-6 mb-24">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <FaTrophy className="text-yellow-500" /> Torneios Ativos
                    </h2>
                    <button className="text-gray-400 hover:text-yellow-500 transition font-bold text-sm">
                        Ver Todos
                    </button>
                </div>

                {loading && activeChampionships.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="animate-spin h-8 w-8 border-4 border-yellow-500 rounded-full border-t-transparent mx-auto"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeChampionships.length === 0 ? (
                            <div className="col-span-3 text-center py-12 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
                                <p className="text-gray-400">Nenhum campeonato encontrado.</p>
                            </div>
                        ) : (
                            activeChampionships.map(champ => (
                                <div
                                    key={champ.id}
                                    onClick={() => navigate(`/c/${champ.id}`)}
                                    className="group bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-yellow-500/50 transition-all cursor-pointer relative overflow-hidden"
                                >
                                    <div className={`absolute top-0 right-0 ${getStatusColor(champ.status)} text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase`}>
                                        {getStatusLabel(champ.status)}
                                    </div>
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden">
                                            {champ.logoUrl ? (
                                                <img
                                                    src={getLogoUrl(champ.logoUrl)}
                                                    className="w-full h-full object-cover"
                                                    onError={handleImageError}
                                                />
                                            ) : (
                                                <FaTrophy className="text-3xl text-gray-600" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-500 transition-colors truncate">{champ.name}</h3>
                                    <p className="text-gray-500 text-sm mb-6 truncate">{champ.type}</p>

                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                        <span className="flex items-center gap-1"><FaStar className="text-yellow-500" /> {champ.type}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            {/* Sponsors Marquee */}
            <section className="border-y border-white/5 bg-black/20 py-12 mb-12 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 text-center mb-8">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-[0.2em]">Patrocinadores Oficiais</h4>
                </div>

                <div className="flex justify-center flex-wrap gap-8 md:gap-16">
                    {sponsors.map((s, i) => (
                        <div key={i} className="w-32 h-20 flex items-center justify-center bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors">
                            <img
                                src={s.logo}
                                alt={s.name}
                                className="max-w-full max-h-full object-contain hover:scale-110 transition-transform"
                                onError={handleImageError}
                            />
                        </div>
                    ))}
                </div>
            </section>

            {/* Virtual Store Section */}
            <section className="max-w-7xl mx-auto px-6 mb-24">
                <div className="flex items-center justify-between mb-12">
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                        <span className="text-yellow-500">🛍️</span> Loja Oficial
                    </h2>
                    <button className="text-gray-400 hover:text-yellow-500 transition font-bold text-sm">
                        Ver Coleção Completa
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Product 1 */}
                    <div className="group relative">
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 relative overflow-hidden h-80 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
                            {/* Mockup Placeholder - Shirt */}
                            <div className="relative z-10 text-center">
                                <div className="text-6xl mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">👕</div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-yellow-500/50 uppercase tracking-widest rotate-6">Futkings</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="font-bold text-lg text-white group-hover:text-yellow-500 transition-colors">Camisa Oficial Black Edition</h3>
                            <p className="text-gray-500 text-sm mb-2">Edição de Colecionador</p>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xl font-bold text-white">R$ 129,90</span>
                                <button className="bg-white/10 hover:bg-yellow-500 hover:text-black text-white p-2 rounded-full transition-colors">
                                    <FaSignInAlt className="rotate-[-90deg]" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product 2 */}
                    <div className="group relative">
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 relative overflow-hidden h-80 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                            <div className="relative z-10 text-center">
                                <div className="text-6xl mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">🧴</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="font-bold text-lg text-white group-hover:text-blue-500 transition-colors">Squeeze Térmica Futkings</h3>
                            <p className="text-gray-500 text-sm mb-2">Mantenha-se hidratado</p>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xl font-bold text-white">R$ 49,90</span>
                                <button className="bg-white/10 hover:bg-blue-500 hover:text-white text-white p-2 rounded-full transition-colors">
                                    <FaSignInAlt className="rotate-[-90deg]" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product 3 */}
                    <div className="group relative">
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 relative overflow-hidden h-80 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
                            <div className="relative z-10 text-center">
                                <div className="text-6xl mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">🧢</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="font-bold text-lg text-white group-hover:text-red-500 transition-colors">Boné Snapback</h3>
                            <p className="text-gray-500 text-sm mb-2">Estilo fora de campo</p>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xl font-bold text-white">R$ 79,90</span>
                                <button className="bg-white/10 hover:bg-red-500 hover:text-white text-white p-2 rounded-full transition-colors">
                                    <FaSignInAlt className="rotate-[-90deg]" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Product 4 */}
                    <div className="group relative">
                        <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-8 relative overflow-hidden h-80 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                            <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
                            <div className="relative z-10 text-center">
                                <div className="text-6xl mb-4 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">🎒</div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="font-bold text-lg text-white group-hover:text-purple-500 transition-colors">Mochila Esportiva</h3>
                            <p className="text-gray-500 text-sm mb-2">Para todo o equipamento</p>
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-xl font-bold text-white">R$ 199,90</span>
                                <button className="bg-white/10 hover:bg-purple-500 hover:text-white text-white p-2 rounded-full transition-colors">
                                    <FaSignInAlt className="rotate-[-90deg]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Minimal */}
            <footer className="py-12 text-center text-gray-600 border-t border-white/5">
                <div className="flex justify-center items-center gap-4 mb-4">
                    <img src="/logo.png" className="h-8 grayscale opacity-50" />
                </div>
                <p className="text-sm">© 2026 Futkings Manager. Todos os direitos reservados.</p>
            </footer>

        </div>
    );
};

export default FanZone;
