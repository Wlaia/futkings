import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaTrophy, FaUsers, FaShoppingBag, /* FaCog */ } from 'react-icons/fa';

const BottomMenu: React.FC = () => {
    const navItems = [
        { path: '/dashboard', icon: <FaHome size={20} />, label: 'Início' },
        { path: '/championships', icon: <FaTrophy size={20} />, label: 'Campeonatos' },
        { path: '/teams', icon: <FaUsers size={20} />, label: 'Times' },
        { path: '/store', icon: <FaShoppingBag size={20} />, label: 'Loja' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 pb-safe pt-2 px-6 flex justify-between items-center z-50 md:hidden shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive
                            ? 'text-yellow-500 scale-110'
                            : 'text-gray-500 hover:text-gray-300'
                        }`
                    }
                >
                    {item.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </NavLink>
            ))}
        </div>
    );
};

export default BottomMenu;
