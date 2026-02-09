import React, { useState, useEffect } from 'react';
import { FaUser, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

interface PublicPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'ADD' | 'EDIT';
    initialData?: any;
    onSave: (data: any) => Promise<void>;
    onDelete?: () => Promise<void>;
}

const PublicPlayerModal: React.FC<PublicPlayerModalProps> = ({
    isOpen, onClose, mode, initialData, onSave, onDelete
}) => {
    const [formData, setFormData] = useState({
        name: '',
        number: '',
        position: 'FIELD',
        birthDate: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'EDIT' && initialData) {
                setFormData({
                    name: initialData.name || '',
                    number: initialData.number || '',
                    position: initialData.position || 'FIELD',
                    birthDate: initialData.birthDate ? String(initialData.birthDate).split('T')[0] : ''
                });
            } else {
                setFormData({ name: '', number: '', position: 'FIELD', birthDate: '' });
            }
        }
    }, [initialData, mode, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar jogador.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (window.confirm('Tem certeza que deseja remover este jogador?')) {
            setLoading(true);
            try {
                await onDelete();
                onClose();
            } catch (error) {
                console.error(error);
                alert('Erro ao remover jogador.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <FaTimes size={20} />
                </button>

                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        {mode === 'ADD' ? <span className="text-green-500">+</span> : <span className="text-yellow-500">✎</span>}
                        {mode === 'ADD' ? 'Adicionar Jogador' : 'Editar Jogador'}
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Jogador</label>
                            <input
                                required
                                name="name"
                                placeholder="Ex: Neymar Jr"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Número</label>
                                <input
                                    required
                                    type="number"
                                    name="number"
                                    placeholder="10"
                                    value={formData.number}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Posição</label>
                                <select
                                    name="position"
                                    value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition-colors appearance-none"
                                >
                                    <option value="FIELD">Linha</option>
                                    <option value="GOALKEEPER">Goleiro</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data de Nascimento</label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    value={formData.birthDate || ''}
                                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8 pt-4 border-t border-gray-800">
                            {mode === 'EDIT' && onDelete && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2"
                                >
                                    <FaTrash />
                                </button>
                            )}
                            <div className="flex-1"></div>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 text-gray-400 hover:text-white font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2 rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2"
                            >
                                {loading ? 'Salvando...' : <><FaSave /> Salvar</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default PublicPlayerModal;
