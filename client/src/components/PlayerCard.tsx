import React from 'react';
import { FaUser } from 'react-icons/fa';
import { getLogoUrl } from '../utils/imageHelper';


interface Player {
    id: string;
    name: string;
    number: number;
    position: 'GOALKEEPER' | 'FIELD';
    avatarUrl?: string;
    birthDate?: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    goalsConceded: number;
}


const PlayerCard: React.FC<{
    player: Player;
    teamLogo?: string;
    onUpload?: (file: File) => void;
    uploading?: boolean;
}> = ({ player, teamLogo, onUpload, uploading }) => {
    const isGoalkeeper = player.position === 'GOALKEEPER';

    const calculateAge = (birthDate?: string) => {
        if (!birthDate) return 18 + (player.name.length % 15);
        const birth = new Date(birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Calculate Overall Rating (Simple dynamic logic)
    // Base 60 + performance logic
    let overall = 60;

    if (isGoalkeeper) {
        overall += (player.saves * 2) - (player.goalsConceded * 1);
        // Bonus for clean sheets logic would go here, simplistic for now
        overall += 15; // GK Base Buff
    } else {
        overall += (player.goals * 3) + (player.assists * 2);
    }

    // Cap min/max
    overall = Math.max(45, Math.min(99, overall));

    const age = calculateAge(player.birthDate);

    return (
        <div className="card-ultimate-container w-[300px] h-[460px] flex flex-col p-4 relative font-sans select-none mx-auto group perspective-1000">

            {/* Holographic Shine Overlay */}
            <div className="card-holo-overlay"></div>

            {/* Sparkles Texture */}
            <div className="bg-sparkles absolute inset-0 pointer-events-none z-0"></div>

            {/* Custom Background Image Overlay */}
            <div className="absolute inset-0 z-0 opacity-50 mix-blend-overlay">
                <img
                    src="https://img.freepik.com/premium-photo/golden-trophy-cup-with-falling-confetti-stadium-background-3d-rendering_634574-1226.jpg"
                    alt="Background"
                    className="w-full h-full object-cover filter contrast-125 brightness-75 sepia-[.5]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-90"></div>
            </div>

            {/* --- TOP SECTION --- */}
            <div className="flex justify-between items-start mb-2 relative z-10 h-[50px]">
                {/* OVR (Top Left) */}
                <div className="flex flex-col items-center leading-none">
                    <span className="text-5xl font-extrabold text-gold-gradient tracking-tighter drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">{Math.floor(overall)}</span>
                    <span className="text-[10px] uppercase font-bold text-yellow-500 tracking-widest mt-1 text-neon-glow">OVR</span>
                </div>

                {/* Team Logo (Center-Top - Optional decorative placement or Watermark) */}
                {teamLogo && (
                    <div className="absolute left-1/2 top-0 transform -translate-x-1/2 opacity-30 w-32 h-32 pointer-events-none grayscale brightness-50 contrast-125">
                        <img src={getLogoUrl(teamLogo)} alt="" className="w-full h-full object-contain" />
                    </div>
                )}

                {/* POS (Top Right) */}
                <div className="flex flex-col items-center leading-none">
                    <span className="text-3xl font-bold text-white drop-shadow-md pb-1 border-b-2 border-yellow-500/80">
                        {isGoalkeeper ? 'GK' : 'ST'}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">POS</span>
                </div>
            </div>

            {/* --- PHOTO SECTION (Circular) --- */}
            <div className="relative w-full flex justify-center items-center my-2 z-20 group/img">
                {/* Gold Ring Container */}
                <div className="photo-ring w-44 h-44 flex items-center justify-center relative bg-gradient-to-br from-gray-900 via-gray-800 to-black">

                    {/* The Image */}
                    <div className="w-full h-full rounded-full overflow-hidden relative bg-gray-900 photo-ring-inner shadow-inner">
                        {uploading ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-black/80">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-500 mb-1"></div>
                                <span className="text-[10px] text-yellow-500 font-bold animate-pulse">Enviando...</span>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                {player.avatarUrl && !player.avatarUrl.includes('dicebear') ? (
                                    <img
                                        src={getLogoUrl(player.avatarUrl)}
                                        alt={player.name}
                                        className="w-full h-full object-cover img-dramatic transition-transform duration-500 group-hover/img:scale-110 group-hover/img:rotate-2"
                                    />
                                ) : (
                                    <FaUser className="text-gray-600 text-6xl" />
                                )}
                            </div>
                        )}

                        {/* Upload Overlay */}
                        {onUpload && !uploading && (
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-300 backdrop-blur-sm">
                                <span className="text-white text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] filter drop-shadow-lg">✨📷</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files && e.target.files[0] && onUpload(e.target.files[0])}
                                />
                            </label>
                        )}
                    </div>
                </div>
            </div>

            {/* --- NAME SECTION --- */}
            <div className="text-center relative z-20 mt-2 mb-4">
                <h2 className="text-2xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 via-white to-yellow-100 tracking-wide truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] filter brightness-110">
                    {player.name}
                </h2>
                <div className="divider-gold w-3/4 mx-auto mt-1 shadow-[0_0_8px_rgba(255,215,0,0.4)]"></div>
            </div>

            {/* --- STATS GRID --- */}
            <div className="bg-black/40 rounded-xl p-3 backdrop-blur-md border border-white/5 relative z-10 flex-grow shadow-inner hover:bg-black/50 transition-colors">
                {/* 2 Rows x 3 Cols */}
                <div className="grid grid-cols-3 gap-y-3 gap-x-1 text-center h-full items-center">

                    {/* Col 1 */}
                    <div className="flex flex-col group/stat hover:scale-110 transition-transform cursor-default">
                        <span className="stat-label group-hover/stat:text-yellow-300">IDADE</span>
                        <span className="stat-value">{age}</span>
                    </div>
                    <div className="flex flex-col group/stat hover:scale-110 transition-transform cursor-default">
                        <span className="stat-label group-hover/stat:text-yellow-300">CAMISA</span>
                        <span className="stat-value">{player.number}</span>
                    </div>
                    <div className="flex flex-col group/stat hover:scale-110 transition-transform cursor-default">
                        {/* Dynamic Stat depends on Position */}
                        <span className="stat-label group-hover/stat:text-yellow-300">{isGoalkeeper ? 'DEFESAS' : 'GOLS'}</span>
                        <span className="stat-value text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">{isGoalkeeper ? player.saves : player.goals}</span>
                    </div>

                    {/* Col 2 (Row 2) */}
                    <div className="flex flex-col group/stat hover:scale-110 transition-transform cursor-default">
                        <span className="stat-label group-hover/stat:text-yellow-300">CARTÕES</span>
                        <div className="flex justify-center gap-1 h-[26px] items-center">
                            <div className="relative transform hover:rotate-12 transition-transform">
                                <div className={`w-3 h-4 bg-yellow-500 rounded-[2px] shadow-[0_0_5px_rgba(234,179,8,0.8)] border border-white/20 ${player.yellowCards === 0 ? 'opacity-20 shadow-none' : ''}`}></div>
                                {player.yellowCards > 0 && <span className="absolute -top-1 -right-1 text-[8px] bg-black text-white w-3 h-3 rounded-full leading-3 flex items-center justify-center">{player.yellowCards}</span>}
                            </div>
                            <div className="relative transform hover:-rotate-12 transition-transform">
                                <div className={`w-3 h-4 bg-red-600 rounded-[2px] shadow-[0_0_5px_rgba(220,38,38,0.8)] border border-white/20 ${player.redCards === 0 ? 'opacity-20 shadow-none' : ''}`}></div>
                                {player.redCards > 0 && <span className="absolute -top-1 -right-1 text-[8px] bg-black text-white w-3 h-3 rounded-full leading-3 flex items-center justify-center">{player.redCards}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col group/stat hover:scale-110 transition-transform cursor-default">
                        <span className="stat-label group-hover/stat:text-yellow-300">{isGoalkeeper ? 'SOFRIDOS' : 'ASSIST'}</span>
                        <span className="stat-value text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">{isGoalkeeper ? player.goalsConceded : player.assists}</span>
                    </div>
                    <div className="flex flex-col group/stat hover:scale-110 transition-transform cursor-default">
                        {/* Generic 'Form' or Extra Stat */}
                        <span className="stat-label group-hover/stat:text-yellow-300">FORMA</span>
                        <span className="stat-value text-gray-300">-</span>
                    </div>

                </div>
            </div>

            {/* Footnote / Rare Badge */}
            <div className="absolute bottom-2 left-0 right-0 text-center opacity-60">
                <span className="text-[8px] uppercase tracking-[0.3em] text-yellow-500 font-bold drop-shadow-md">★ FUTKINGS RARE ★</span>
            </div>

        </div>
    );
};

export default PlayerCard;
