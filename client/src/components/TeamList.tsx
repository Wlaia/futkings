import React, { useEffect, useState } from 'react';
import SafeImage from './SafeImage';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaShieldAlt, FaUserTie, FaPlus, FaArrowRight, FaUsers } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

interface Team {
    id: string;
    name: string;
    logoUrl?: string;
    manager?: {
        name: string;
    };
    players?: any[]; // Assuming we might have this later or count it
}

const TeamList: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(false);

    const fetchTeams = (page = 1) => {
        setLoading(true);
        api.get(`/teams?page=${page}&limit=12`).then(response => {
            const { teams: newTeams, pagination: pag } = response.data;
            if (page === 1) {
                setTeams(newTeams);
            } else {
                setTeams(prev => [...prev, ...newTeams]);
            }
            setPagination(pag);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchTeams(1);
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <p className="text-gray-400 text-sm">Gerencie seus elencos</p>
                </div>
                {user?.role === 'ADMIN' && (
                    <Link
                        to="/teams/new"
                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-105"
                    >
                        <FaPlus /> Novo Time
                    </Link>
                )}
            </div>

            {teams.length === 0 ? (
                <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                        <FaShieldAlt size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum time cadastrado</h3>
                    <p className="text-gray-500 mb-6">Crie seu primeiro time para começar a montar o elenco.</p>
                    <button onClick={() => navigate('/teams/new')} className="text-yellow-500 font-bold hover:underline">Criar agora</button>
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams.map(team => (
                            <div
                                key={team.id}
                                onClick={() => navigate(`/teams/${team.id}`)}
                                className="group bg-gray-800 rounded-xl border border-gray-700 hover:border-yellow-500 cursor-pointer transition-all hover:transform hover:-translate-y-1 hover:shadow-[0_5px_20px_rgba(0,0,0,0.3)] overflow-hidden relative"
                            >
                                {/* Decorative Background Icon */}
                                <div className="absolute -bottom-8 -right-8 text-gray-700/10 transform rotate-12 group-hover:rotate-0 transition-all duration-500">
                                    <FaShieldAlt size={150} />
                                </div>

                                <div className="p-6 relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <SafeImage
                                            src={team.logoUrl}
                                            alt={team.name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-600 group-hover:border-yellow-500 transition-colors shadow-inner"
                                            fallbackIcon={<FaShieldAlt size={32} />}
                                        />
                                        <div>
                                            <h3 className="text-xl font-bold text-white group-hover:text-yellow-500 transition-colors truncate w-40 md:w-48">{team.name}</h3>
                                            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                                <FaUserTie size={12} />
                                                <span className="truncate max-w-[120px]">{team.manager?.name || 'Sem Manager'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-gray-700/50 pt-4">
                                        <div className="flex items-center gap-2 text-gray-300 bg-gray-900/50 px-3 py-1 rounded-full text-xs">
                                            <FaUsers />
                                            <span>Elenco</span>
                                        </div>
                                        <span className="text-yellow-500 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-2 font-bold text-sm">
                                            Gerenciar <FaArrowRight />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination.page < pagination.totalPages && (
                        <div className="flex justify-center pt-4">
                            <button
                                onClick={() => fetchTeams(pagination.page + 1)}
                                disabled={loading}
                                className="bg-gray-800 hover:bg-gray-700 text-yellow-500 px-8 py-3 rounded-xl font-bold border border-gray-700 transition-all disabled:opacity-50"
                            >
                                {loading ? 'Carregando...' : 'Carregar Mais Times'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeamList;
