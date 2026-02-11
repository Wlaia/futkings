import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-gray-900 text-gray-500 py-4 text-center text-xs border-t border-gray-800 pb-24 md:pb-4">
            <p>
                Desenvolvido por: <a href="https://www.snappage.com.br" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-500 font-bold transition-colors">SnapPage</a>
                <span className="mx-2">|</span>
                v1.1.4
            </p>
        </footer>
    );
};

export default Footer;
