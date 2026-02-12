import React from 'react';
import { APP_VERSION } from '../version';

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-gray-900 text-gray-500 py-4 text-center text-xs border-t border-gray-800 pb-24 md:pb-4">
            <p>
                Desenvolvido por: <a href="https://www.snappage.com.br" target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:text-yellow-500 font-bold transition-colors">SnapPage</a>
                <span className="mx-2">|</span>
                v{APP_VERSION}
                <button
                    onClick={async () => {
                        if (window.confirm('Deseja limpar o cache e forçar a atualização para a versão mais recente?')) {
                            if ('serviceWorker' in navigator) {
                                const registrations = await navigator.serviceWorker.getRegistrations();
                                for (const registration of registrations) {
                                    await registration.unregister();
                                }
                            }
                            localStorage.removeItem('last_notified_version');
                            window.location.reload();
                        }
                    }}
                    className="ml-2 hover:text-white opacity-20 hover:opacity-100 transition-all font-mono"
                    title="Forçar Atualização"
                >
                    [RECARREGAR]
                </button>
            </p>
        </footer>
    );
};

export default Footer;
