import React, { useState } from 'react';
import api from '../services/api';

interface CreateManagerModalProps {
    teamId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateManagerModal: React.FC<CreateManagerModalProps> = ({ teamId, isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/teams/${teamId}/manager`, {
                name,
                email,
                password
            });
            alert('Gerente criado com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Erro ao criar gerente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-purple-900 to-gray-900 p-6 border-b border-white/10">
                    <h2 className="text-2xl font-black uppercase text-white">Novo Gerente</h2>
                    <p className="text-purple-300 text-sm">Crie um acesso exclusivo para este time.</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                    <div>
                        <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Nome do Gerente</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder="Ex: Pep Guardiola"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Email de Acesso</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder="Ex: pep@city.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder="********"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-white font-bold uppercase text-sm px-4 py-2"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase rounded-lg px-6 py-2 transition disabled:opacity-50"
                        >
                            {loading ? 'Criando...' : 'Criar Acesso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateManagerModal;
