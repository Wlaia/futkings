import React, { useState, useEffect } from 'react';

interface Player {
    id: string;
    name: string;
    number: number;
    position: 'GOALKEEPER' | 'FIELD';
    birthDate?: string;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    saves: number;
    goalsConceded: number;
    isStarter?: boolean;
}

interface EditPlayerModalProps {
    player: Player | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedPlayer: any) => void;
    startersCount: number;
}

const EditPlayerModal: React.FC<EditPlayerModalProps> = ({ player, isOpen, onClose, onSave, startersCount }) => {
    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (player) {
            setFormData({ ...player });
        }
    }, [player]);

    if (!isOpen || !player) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        if (name === 'isStarter' && checked && !player?.isStarter && startersCount >= 5) {
            alert("Máximo de 5 titulares permitidos!");
            return;
        }

        setFormData((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (name === 'name' || name === 'position' || name === 'birthDate' ? value : parseInt(value) || 0)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const isGoalkeeper = formData.position === 'GOALKEEPER';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">

                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-yellow-500">✎</span> Editar Jogador
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[80vh]">

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="col-span-2">
                            <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Nome</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-yellow-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Número</label>
                            <input
                                type="number"
                                name="number"
                                value={formData.number || ''}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-yellow-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Posição</label>
                            <select
                                name="position"
                                value={formData.position || 'FIELD'}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-yellow-500 outline-none"
                            >
                                <option value="FIELD">Linha (ST/DEF/MID)</option>
                                <option value="GOALKEEPER">Goleiro (GK)</option>
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Data de Nascimento</label>
                            <input
                                type="date"
                                name="birthDate"
                                value={formData.birthDate ? String(formData.birthDate).split('T')[0] : ''}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-yellow-500 outline-none"
                            />
                        </div>
                        <div className={`col-span-2 flex items-center gap-3 bg-black/40 p-3 rounded border ${!formData.isStarter && startersCount >= 5 ? 'border-red-500/30 opacity-50' : 'border-white/10'}`}>
                            <input
                                type="checkbox"
                                name="isStarter"
                                id="isStarter"
                                checked={formData.isStarter || false}
                                onChange={handleChange}
                                disabled={!formData.isStarter && startersCount >= 5}
                                className="w-5 h-5 accent-yellow-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <label htmlFor="isStarter" className={`text-sm font-bold cursor-pointer select-none ${!formData.isStarter && startersCount >= 5 ? 'text-gray-500' : 'text-white'}`}>
                                Jogador Titular? <span className="text-yellow-500 ml-1">★</span>
                                {!formData.isStarter && startersCount >= 5 && <span className="text-red-400 text-xs ml-2">(Máx. 5 atingido)</span>}
                            </label>
                        </div>
                    </div>

                    <div className="h-[1px] bg-white/10 w-full mb-6"></div>

                    {/* Stats */}
                    <h4 className="text-yellow-500 font-bold uppercase text-sm mb-4">Estatísticas (Temporada)</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Gols</label>
                            <input type="number" name="goals" value={formData.goals} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2 text-center text-white" />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Assistências</label>
                            <input type="number" name="assists" value={formData.assists} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2 text-center text-white" />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Amarelos</label>
                            <input type="number" name="yellowCards" value={formData.yellowCards} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2 text-center text-yellow-200" />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Vermelhos</label>
                            <input type="number" name="redCards" value={formData.redCards} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded p-2 text-center text-red-300" />
                        </div>

                        {/* GK Stats */}
                        {isGoalkeeper && (
                            <>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Defesas</label>
                                    <input type="number" name="saves" value={formData.saves || 0} onChange={handleChange} className="w-full bg-black/40 border border-blue-500/30 rounded p-2 text-center text-blue-200" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase text-gray-500 font-bold mb-1 block">Gols Sofridos</label>
                                    <input type="number" name="goalsConceded" value={formData.goalsConceded || 0} onChange={handleChange} className="w-full bg-black/40 border border-red-500/30 rounded p-2 text-center text-red-200" />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 bg-transparent border border-gray-600 text-gray-300 py-3 rounded hover:bg-white/5 transition">Cancelar</button>
                        <button type="submit" className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded shadow-[0_0_15px_rgba(234,179,8,0.4)] transition">Salvar Alterações</button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditPlayerModal;
