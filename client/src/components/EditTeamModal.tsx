import React, { useState, useEffect } from 'react';

interface EditTeamModalProps {
    team: {
        id: string;
        name: string;
        logoUrl?: string;
        coachName?: string;
        directorName?: string;
    } | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedTeam: any) => void;
}

const EditTeamModal: React.FC<EditTeamModalProps> = ({ team, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState<any>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);

    useEffect(() => {
        if (team) {
            setFormData({
                name: team.name,
                logoUrl: team.logoUrl || '',
                coachName: team.coachName || '',
                directorName: team.directorName || ''
            });
            setLogoFile(null);
        }
    }, [team]);

    if (!isOpen || !team) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Use FormData for file upload
        const data = new FormData();
        data.append('name', formData.name);
        data.append('coachName', formData.coachName);
        data.append('directorName', formData.directorName);

        // If file selected, append it
        if (logoFile) {
            data.append('logo', logoFile);
        } else {
            // If no file, keep existing URL logic (though backend might need tweaking if we send both? 
            // Controller logic: const { logoUrl } = req.body; let final = logoUrl; if (file) final = ...
            // So if we send logoUrl, it's fine.
            data.append('logoUrl', formData.logoUrl);
        }

        onSave(data);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">

                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-yellow-500">✎</span> Editar Time
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Nome do Time</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-yellow-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Logo do Time</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-yellow-500 outline-none mb-2"
                            />
                            <div className="text-xs text-gray-500 mb-1">Ou URL da Logo:</div>
                            <input
                                type="text"
                                name="logoUrl"
                                value={formData.logoUrl}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-yellow-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Nome do Técnico</label>
                            <input
                                type="text"
                                name="coachName"
                                value={formData.coachName}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-yellow-500 outline-none"
                                placeholder="Ex: Tite"
                            />
                        </div>
                        <div>
                            <label className="text-xs uppercase text-gray-400 font-bold mb-1 block">Nome do Diretor</label>
                            <input
                                type="text"
                                name="directorName"
                                value={formData.directorName}
                                onChange={handleChange}
                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-yellow-500 outline-none"
                                placeholder="Ex: Rodrigo Caetano"
                            />
                        </div>
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

export default EditTeamModal;
