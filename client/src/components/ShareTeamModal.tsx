
import React, { useState, useEffect } from 'react';
import { FaShareAlt, FaCopy, FaCheck } from 'react-icons/fa';

interface Team {
    id: string;
    isPublicLinkActive: boolean;
    publicCanAddPlayer: boolean;
    publicCanEditPlayer: boolean;
    publicCanImportPlayer: boolean; // Just a placeholder for now
    publicCanPrintPlayer: boolean;  // Just a placeholder for now
}

interface ShareTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    team: Team;
    onUpdate: (data: Partial<Team>) => Promise<void>;
}

const ShareTeamModal: React.FC<ShareTeamModalProps> = ({ isOpen, onClose, team, onUpdate }) => {
    const [isActive, setIsActive] = useState(false);
    const [canAdd, setCanAdd] = useState(false);
    const [canEdit, setCanEdit] = useState(false);
    const [canImport, setCanImport] = useState(false);
    const [canPrint, setCanPrint] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && team) {
            setIsActive(team.isPublicLinkActive || false);
            setCanAdd(team.publicCanAddPlayer || false);
            setCanEdit(team.publicCanEditPlayer || false);
            setCanImport(team.publicCanImportPlayer || false);
            setCanPrint(team.publicCanPrintPlayer || false);
        }
    }, [isOpen, team]);

    if (!isOpen || !team) return null;

    const publicUrl = `${window.location.origin}/public/teams/${team.id}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        await onUpdate({
            isPublicLinkActive: isActive,
            publicCanAddPlayer: canAdd,
            publicCanEditPlayer: canEdit,
            publicCanImportPlayer: canImport,
            publicCanPrintPlayer: canPrint
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in-up">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <FaShareAlt className="text-blue-500" />
                        Compartilhar Equipe
                    </h2>

                    {/* Link Section */}
                    <div className="mb-6 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Link Público</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={publicUrl}
                                readOnly
                                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none select-all"
                            />
                            <button
                                onClick={handleCopy}
                                className={`px-4 py-2 rounded-lg font-bold transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                            >
                                {copied ? <FaCheck /> : <FaCopy />}
                            </button>
                        </div>
                        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300 mt-2 block underline">
                            Abrir link
                        </a>
                    </div>

                    {/* Permissions Section */}
                    <div className="space-y-4 mb-8">
                        {/* Toggle Active */}
                        <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg border border-gray-600/50">
                            <span className={`font-bold ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>Ativar link</span>
                            <button
                                onClick={() => setIsActive(!isActive)}
                                className={`w-12 h-6 rounded-full transition-colors relative ${isActive ? 'bg-blue-600' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isActive ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        {/* Permissions Checkboxes */}
                        <div className={`space-y-3 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-gray-300 group-hover:text-white transition-colors">Adicionar jogadores</span>
                                <input type="checkbox" checked={canAdd} onChange={e => setCanAdd(e.target.checked)} className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800" />
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-gray-300 group-hover:text-white transition-colors">Editar e remover jogadores</span>
                                <input type="checkbox" checked={canEdit} onChange={e => setCanEdit(e.target.checked)} className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800" />
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-gray-300 group-hover:text-white transition-colors">Importar Jogadores do organizador</span>
                                <input type="checkbox" checked={canImport} onChange={e => setCanImport(e.target.checked)} className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800" />
                            </label>

                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-gray-300 group-hover:text-white transition-colors">Imprimir Jogadores</span>
                                <input type="checkbox" checked={canPrint} onChange={e => setCanPrint(e.target.checked)} className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800" />
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-gray-600 text-gray-300 font-bold hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-900/20"
                        >
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareTeamModal;
