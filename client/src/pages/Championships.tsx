import React from 'react';
import ChampionshipsList from '../components/ChampionshipsList';

const Championships: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-yellow-500 mb-6 uppercase tracking-wider">Campeonatos</h1>
            <ChampionshipsList />
        </div>
    );
};

export default Championships;
