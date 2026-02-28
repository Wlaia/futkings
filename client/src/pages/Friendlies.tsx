import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaFutbol, FaCheck, FaShieldAlt, FaRandom, FaCalendarCheck } from 'react-icons/fa';
import SafeImage from '../components/SafeImage';
import { useNavigate } from 'react-router-dom';
import DrawAnimationModal from '../components/DrawAnimationModal';

interface Team {
    id: string;
    name: string;
    logoUrl?: string;
}

interface Match {
    homeTeam: Team;
    awayTeam: Team;
    date?: string; // ISO string for local state
    savedId?: string; // If already saved
    // Dummy fields for compatibility if needed, but we can just use new structure
}

interface Round {
    roundNumber: number;
    matches: Match[];
    bye?: Team;
}

const Friendlies: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);

    // Initialize state from LocalStorage if available
    const [selectedTeams, setSelectedTeams] = useState<string[]>(() => {
        const saved = localStorage.getItem('friendlies_selectedTeams');
        return saved ? JSON.parse(saved) : [];
    });

    const [schedule, setSchedule] = useState<Round[]>(() => {
        const saved = localStorage.getItem('friendlies_schedule');
        return saved ? JSON.parse(saved) : [];
    });

    const [numRounds, setNumRounds] = useState(() => {
        const saved = localStorage.getItem('friendlies_numRounds');
        return saved ? parseInt(saved) : 1;
    });
    const navigate = useNavigate();
    const [savingDetails, setSavingDetails] = useState<{ roundIdx: number, matchIdx: number, loading: boolean } | null>(null);
    const [showDrawModal, setShowDrawModal] = useState(false);
    const [drawMatches, setDrawMatches] = useState<any[]>([]); // Using any to bypass strict checks or cast properly

    useEffect(() => {
        api.get('/teams?limit=100').then(res => {
            if (Array.isArray(res.data)) setTeams(res.data);
            else if (res.data && res.data.teams) setTeams(res.data.teams);
        }).catch(console.error);
    }, []);

    // Persist state to LocalStorage
    useEffect(() => {
        localStorage.setItem('friendlies_selectedTeams', JSON.stringify(selectedTeams));
        localStorage.setItem('friendlies_schedule', JSON.stringify(schedule));
        localStorage.setItem('friendlies_numRounds', numRounds.toString());
    }, [selectedTeams, schedule, numRounds]);

    const handleReset = () => {
        if (window.confirm("Deseja iniciar um novo sorteio? Isso apagará os jogos atuais.")) {
            setSelectedTeams([]);
            setSchedule([]);
            setNumRounds(1);
            localStorage.removeItem('friendlies_selectedTeams');
            localStorage.removeItem('friendlies_schedule');
            localStorage.removeItem('friendlies_numRounds');
        }
    };

    const toggleTeam = (id: string) => {
        setSelectedTeams(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };

    const generateSchedule = () => {
        if (selectedTeams.length < 2) {
            alert("Selecione pelo menos 2 times.");
            return;
        }

        const activeTeams = teams.filter(t => selectedTeams.includes(t.id));
        const generatedRounds: Round[] = [];

        // Simple Round Robin Logic extended for N rounds
        // Valid for any number of teams.
        // If Odd, add a dummy team for "Bye"
        let rotation = [...activeTeams];
        if (rotation.length % 2 !== 0) {
            rotation.push({ id: 'BYE', name: 'Folga' });
        }

        const totalTeams = rotation.length;
        // const totalRounds = totalTeams - 1; // Max unique rounds in round robin

        // We generate 'numRounds' rounds. If numRounds > totalRounds, we repeat cycle
        for (let i = 0; i < numRounds; i++) {
            const roundMatches: Match[] = [];
            let byeTeam: Team | undefined = undefined;

            // Algorithm for Round i
            // Pairing: (0, N-1), (1, N-2), ...
            for (let j = 0; j < totalTeams / 2; j++) {
                const home = rotation[j];
                const away = rotation[totalTeams - 1 - j];

                if (home.id === 'BYE') {
                    byeTeam = away;
                } else if (away.id === 'BYE') {
                    byeTeam = home;
                } else {
                    roundMatches.push({ homeTeam: home, awayTeam: away });
                }
            }

            generatedRounds.push({
                roundNumber: i + 1,
                matches: roundMatches,
                bye: byeTeam
            });

            // Rotate teams for the next round, keeping the first team fixed
            const fixed = rotation[0];
            const tail = rotation.slice(1);
            rotation = [fixed, ...tail.slice(tail.length - 1), ...tail.slice(0, tail.length - 1)];
        }

        setSchedule(generatedRounds);

        // Trigger Animation for the first round (or all if we want complex logic, but let's do 1st round for impact)
        if (generatedRounds.length > 0) {
            setDrawMatches(generatedRounds[0].matches);
            setShowDrawModal(true);
        }
    };

    const handleDateChange = (roundIdx: number, matchIdx: number, date: string) => {
        const newSchedule = [...schedule];
        newSchedule[roundIdx].matches[matchIdx].date = date;
        setSchedule(newSchedule);
    };

    const handleSaveMatch = async (roundIdx: number, matchIdx: number) => {
        const match = schedule[roundIdx].matches[matchIdx];
        if (!match.date) {
            alert("Por favor, selecione uma data e hora para a partida.");
            return;
        }

        setSavingDetails({ roundIdx, matchIdx, loading: true });
        try {
            const response = await api.post('/matches', {
                homeTeamId: match.homeTeam.id,
                awayTeamId: match.awayTeam.id,
                startTime: match.date,
                round: `Amistoso - Jogo ${schedule[roundIdx].roundNumber}`
            });

            const savedMatch = response.data;
            // Mark as saved or redirect
            if (window.confirm("Partida salva! Deseja ir para a súmula agora?")) {
                navigate(`/matches/${savedMatch.id}/sheet`);
            } else {
                const newSchedule = [...schedule];
                newSchedule[roundIdx].matches[matchIdx].savedId = savedMatch.id;
                setSchedule(newSchedule);
            }

        } catch (error) {
            console.error(error);
            alert("Erro ao salvar partida.");
        } finally {
            setSavingDetails(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 pb-24">
            <h1 className="text-4xl font-black text-yellow-500 uppercase tracking-tighter mb-8 flex items-center gap-3">
                <FaFutbol /> Amistosos
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Team Selection */}
                <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">
                            Selecione os Times ({selectedTeams.length})
                        </h2>
                        {schedule.length > 0 && (
                            <button
                                onClick={handleReset}
                                className="text-red-500 text-xs font-bold hover:underline"
                            >
                                Novo Sorteio
                            </button>
                        )}
                    </div>

                    <div className="flex justify-end mb-4">
                        <div className="text-sm flex gap-2 items-center">
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={numRounds}
                                onChange={e => setNumRounds(parseInt(e.target.value) || 1)}
                                className="bg-gray-900 border border-gray-600 rounded px-2 py-1 w-16 text-center"
                            />
                            <span className="text-gray-400">Jogos por time</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {teams.map(team => (
                            <div
                                key={team.id}
                                onClick={() => toggleTeam(team.id)}
                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${selectedTeams.includes(team.id)
                                    ? 'bg-yellow-500/20 border-yellow-500'
                                    : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                                    }`}
                            >
                                <div className="relative">
                                    <SafeImage src={team.logoUrl} className="w-12 h-12 rounded-full object-cover" fallbackIcon={<FaShieldAlt size={24} />} />
                                    {selectedTeams.includes(team.id) && (
                                        <div className="absolute -top-1 -right-1 bg-yellow-500 text-black rounded-full p-1 border-2 border-gray-800">
                                            <FaCheck size={8} />
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-center truncate w-full">{team.name}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={generateSchedule}
                        className="w-full mt-6 bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <FaRandom /> Gerar Jogos
                    </button>
                </div>

                {/* Schedule Display */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 dashed relative min-h-[400px]">
                    {schedule.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 opacity-50">
                            <FaCalendarCheck size={64} className="mb-4" />
                            <p>Selecione os times e gere os jogos</p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                            {schedule.map((round, roundIdx) => (
                                <div key={round.roundNumber} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-yellow-500 font-black uppercase tracking-widest mb-3 sticky top-0 bg-gray-900/90 backdrop-blur py-2 z-10 border-b border-gray-700">
                                        Jogo {round.roundNumber}
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {round.matches.map((match, matchIdx) => (
                                            <div key={matchIdx} className={`flex flex-col gap-2 bg-gray-900 p-4 rounded-xl border ${match.savedId ? 'border-green-500/50' : 'border-gray-700 hover:border-gray-600'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <span className="font-bold text-right flex-1 truncate">{match.homeTeam.name}</span>
                                                        <SafeImage src={match.homeTeam.logoUrl} className="w-8 h-8 rounded-full bg-gray-800" fallbackIcon={<FaShieldAlt />} />
                                                    </div>
                                                    <span className="mx-4 font-black text-gray-600">VS</span>
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <SafeImage src={match.awayTeam.logoUrl} className="w-8 h-8 rounded-full bg-gray-800" fallbackIcon={<FaShieldAlt />} />
                                                        <span className="font-bold text-left flex-1 truncate">{match.awayTeam.name}</span>
                                                    </div>
                                                </div>

                                                {/* Controls */}
                                                {!match.savedId ? (
                                                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-800">
                                                        <input
                                                            type="datetime-local"
                                                            className="bg-black/30 border border-gray-700 rounded px-2 text-sm text-gray-300 flex-1"
                                                            onChange={(e) => handleDateChange(roundIdx, matchIdx, e.target.value)}
                                                        />
                                                        <button
                                                            onClick={() => handleSaveMatch(roundIdx, matchIdx)}
                                                            disabled={savingDetails?.loading}
                                                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded transition disabled:opacity-50"
                                                        >
                                                            {savingDetails?.matchIdx === matchIdx && savingDetails?.roundIdx === roundIdx ? 'Salvando...' : 'Salvar'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center mt-1">
                                                        <button
                                                            onClick={() => navigate(`/matches/${match.savedId}/sheet`)}
                                                            className="text-green-500 text-xs font-bold hover:underline flex items-center gap-1"
                                                        >
                                                            <FaCheck /> Salvo! Ir para Súmula
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {round.bye && (
                                            <div className="text-center text-sm text-gray-500 italic mt-1 bg-black/20 py-1 rounded">
                                                Folga: <span className="text-gray-400 font-bold">{round.bye.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Draw Animation Modal */}
            <DrawAnimationModal
                isOpen={showDrawModal}
                onClose={() => setShowDrawModal(false)}
                matches={drawMatches}
                teams={teams}
            />
        </div>
    );
};

export default Friendlies;
