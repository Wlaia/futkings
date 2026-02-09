import React from 'react';
import TeamList from '../components/TeamList';

const Teams: React.FC = () => {
    return (
        <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-yellow-500 mb-6 uppercase tracking-wider">Gerenciar Times</h1>
            <TeamList />
        </div>
    );
};

export default Teams;
