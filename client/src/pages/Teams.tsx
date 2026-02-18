import React from 'react';
import TeamList from '../components/TeamList';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

const Teams: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-yellow-500 uppercase tracking-wider">Gerenciar Times</h1>
                <Link to="/dashboard" className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-500">
                    <FaHome /> <span>Dashboard</span>
                </Link>
            </div>
            <TeamList />
        </div>
    );
};

export default Teams;
