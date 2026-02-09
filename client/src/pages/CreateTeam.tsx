import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateTeam: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        try {
            await api.post('/teams', data);
            alert('Time criado com sucesso!');
            navigate('/dashboard');
        } catch (error) {
            alert('Erro ao criar time.');
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-yellow-500 mb-6">Novo Time</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome do Time</label>
                        <input
                            {...register('name')}
                            required
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                            placeholder="Ex: Kings FC"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">URL do Logo (Opcional)</label>
                        <input
                            {...register('logoUrl')}
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome do Técnico</label>
                        <input
                            {...register('coachName')}
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                            placeholder="Ex: Tite"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome do Diretor</label>
                        <input
                            {...register('directorName')}
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                            placeholder="Ex: Rodrigo Caetano"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-yellow-500 text-gray-900 font-bold rounded hover:bg-yellow-400 transition"
                        >
                            Criar Time
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeam;
