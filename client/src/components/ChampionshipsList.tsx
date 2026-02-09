import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaTrophy, FaCalendarCheck, FaUsers, FaArrowRight, FaPlus, FaMedal } from 'react-icons/fa';

interface Championship {
    id: string;
    name: string;
    status: string;
    teamsCount: number;
    createdAt: string;
}

const ChampionshipsList: React.FC = () => {
    const [championships, setChampionships] = useState<Championship[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/championships').then(response => {
            if (Array.isArray(response.data)) {
                setChampionships(response.data);
            } else {
                setChampionships([]);
            }
        });
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'OPEN': return <span className="bg-green-900/50 text-green-500 text-xs font-bold px-2 py-1 rounded border border-green-500/30 uppercase">Aberto</span>;
            case 'IN_PROGRESS': return <span className="bg-yellow-900/50 text-yellow-500 text-xs font-bold px-2 py-1 rounded border border-yellow-500/30 uppercase">Em Andamento</span>;
            case 'FINISHED': return <span className="bg-gray-700 text-gray-400 text-xs font-bold px-2 py-1 rounded border border-gray-600 uppercase">Encerrado</span>;
            default: return <span className="bg-gray-700 text-gray-400 text-xs font-bold px-2 py-1 rounded">Desconhecido</span>;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <p className="text-gray-400 text-sm">Gerencie seus campeonatos</p>
                </div>
                <Link
                    to="/championships/new"
                    className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-105"
                >
                    <FaPlus /> Novo Campeonato
                </Link>
            </div>

            {championships.length === 0 ? (
                <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
                    <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                        <FaTrophy size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum campeonato encontrado</h3>
                    <p className="text-gray-500 mb-6">Crie seu primeiro campeonato para começar a gerenciar.</p>
                    <button onClick={() => navigate('/championships/new')} className="text-yellow-500 font-bold hover:underline">Criar agora</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {championships.map(champ => (
                        <div
                            key={champ.id}
                            onClick={() => navigate(`/championships/${champ.id}`)}
                            className="group bg-gray-800 rounded-xl border border-gray-700 hover:border-yellow-500 cursor-pointer transition-all hover:transform hover:-translate-y-1 hover:shadow-[0_5px_20px_rgba(0,0,0,0.3)] overflow-hidden relative"
                        >
                            {/* Decorative Background Icon */}
                            <div className="absolute -bottom-4 -right-4 text-gray-700/20 transform rotate-12 group-hover:rotate-0 transition-all duration-500">
                                <FaTrophy size={120} />
                            </div>

                            <div className="p-6 relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 border border-gray-600 flex items-center justify-center text-yellow-500 shadow-inner group-hover:from-yellow-900/20 group-hover:to-gray-800 group-hover:border-yellow-500/30 transition-all">
                                        <FaMedal size={24} />
                                    </div>
                                    {getStatusBadge(champ.status)}
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1 truncate group-hover:text-yellow-500 transition-colors">{champ.name}</h3>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                                    <FaCalendarCheck size={12} />
                                    <span>{new Date(champ.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center justify-between border-t border-gray-700/50 pt-4">
                                    <div className="flex items-center gap-2 text-gray-300 bg-gray-900/50 px-3 py-1 rounded-full text-xs">
                                        <FaUsers />
                                        <span>{champ.teamsCount || 0} Times</span>
                                    </div>
                                    <span className="text-yellow-500 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                        <FaArrowRight />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChampionshipsList;
