import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaTrophy, FaCalendarAlt, FaUpload, FaListOl, FaCheckCircle, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const CreateChampionship: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const { register, handleSubmit, watch, setValue } = useForm();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formData = watch();

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('type', data.type);
            formData.append('teamsCount', data.teamsCount);
            formData.append('gameDuration', data.gameDuration);
            if (data.startDate) formData.append('startDate', data.startDate);
            if (data.endDate) formData.append('endDate', data.endDate);
            if (data.logo) formData.append('logo', data.logo);
            if (data.groupsCount) formData.append('groupsCount', data.groupsCount);
            if (data.qualifiersPerGroup) formData.append('qualifiersPerGroup', data.qualifiersPerGroup);

            await api.post('/championships', formData);
            alert('Campeonato criado com sucesso!');
            navigate('/dashboard');
        } catch (error) {
            alert('Erro ao criar campeonato.');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex justify-center items-start pt-12 animate-fade-in">
            <div className="w-full max-w-3xl">

                {/* Stepper Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 uppercase tracking-tighter mb-6">
                        Criar Novo Campeonato
                    </h1>
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-800 -z-10 rounded"></div>
                        <div className={`absolute left-0 top-1/2 h-1 bg-yellow-500 -z-10 rounded transition-all duration-500`} style={{ width: `${((step - 1) / 3) * 100}%` }}></div>

                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all ${step >= s ? 'bg-yellow-500 border-yellow-500 text-gray-900' : 'bg-gray-800 border-gray-700 text-gray-500'
                                }`}>
                                {step > s ? <FaCheckCircle /> : s}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
                        <span>Básico</span>
                        <span>Formato</span>
                        <span>Grupos</span>
                        <span>Revisão</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl relative overflow-hidden">

                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="space-y-6 animate-slide-in-right">
                            <h2 className="text-xl font-bold flex items-center gap-2"><FaTrophy className="text-yellow-500" /> Informações Básicas</h2>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Nome do Campeonato</label>
                                <input {...register('name', { required: true })} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-lg focus:border-yellow-500 focus:outline-none transition-colors" placeholder="Ex: Copa do Mundo 2026" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Data de Início</label>
                                    <input type="date" {...register('startDate')} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:border-yellow-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Data de Fim (Previsão)</label>
                                    <input type="date" {...register('endDate')} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:border-yellow-500 focus:outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Logo do Torneio</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer bg-gray-900 border-2 border-dashed border-gray-700 hover:border-yellow-500 rounded-xl p-6 flex flex-col items-center justify-center transition-all group">
                                        <FaUpload className="text-3xl text-gray-500 group-hover:text-yellow-500 mb-2 transition-colors" />
                                        <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Clique para enviar uma imagem</span>
                                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                    </label>
                                    {logoPreview && (
                                        <div className="w-24 h-24 bg-gray-900 rounded-xl border border-gray-700 p-2 flex items-center justify-center">
                                            <img src={logoPreview} alt="Preview" className="max-w-full max-h-full rounded" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Format */}
                    {step === 2 && (
                        <div className="space-y-6 animate-slide-in-right">
                            <h2 className="text-xl font-bold flex items-center gap-2"><FaListOl className="text-blue-500" /> Formato & Regras</h2>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-2">Tipo de Disputa</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.type === 'GROUPS_KNOCKOUT' ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}>
                                        <input type="radio" value="GROUPS_KNOCKOUT" {...register('type', { required: true })} className="hidden" />
                                        <div className="font-bold text-lg mb-1">Grupos + Mata-mata</div>
                                        <div className="text-xs text-gray-400">Estilo Copa do Mundo. Fase de grupos seguida de eliminatórias.</div>
                                    </label>
                                    <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.type === 'KNOCKOUT_ONLY' ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}>
                                        <input type="radio" value="KNOCKOUT_ONLY" {...register('type', { required: true })} className="hidden" />
                                        <div className="font-bold text-lg mb-1">Só Mata-mata</div>
                                        <div className="text-xs text-gray-400">Torneio eliminatório direto. Quem perder sai.</div>
                                    </label>
                                    <label className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${formData.type === 'LEAGUE_WITH_FINAL' ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-700 bg-gray-900 hover:border-gray-500'}`}>
                                        <input type="radio" value="LEAGUE_WITH_FINAL" {...register('type', { required: true })} className="hidden" />
                                        <div className="font-bold text-lg mb-1">Liga + Final</div>
                                        <div className="text-xs text-gray-400">Todos contra todos. Os 2 melhores fazem a Final.</div>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Quantidade de Times</label>
                                    <select {...register('teamsCount', { required: true })} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:border-yellow-500 focus:outline-none">
                                        <option value="4">4 Times</option>
                                        <option value="8">8 Times</option>
                                        <option value="16">16 Times</option>
                                        <option value="32">32 Times</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2">Duração da Partida (min)</label>
                                    <input type="number" {...register('gameDuration', { required: true, min: 5 })} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:border-yellow-500 focus:outline-none" placeholder="Ex: 20" defaultValue={20} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Configuration (Conditional) */}
                    {step === 3 && (
                        <div className="space-y-6 animate-slide-in-right">
                            <h2 className="text-xl font-bold flex items-center gap-2"><FaCalendarAlt className="text-green-500" /> Configuração da Fase de Grupos</h2>

                            {formData.type === 'GROUPS_KNOCKOUT' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Número de Grupos</label>
                                        <select {...register('groupsCount')} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:border-yellow-500 focus:outline-none">
                                            <option value="2">2 Grupos</option>
                                            <option value="4">4 Grupos</option>
                                            <option value="8">8 Grupos</option>
                                        </select>
                                        <p className="text-xs text-gray-500 mt-2">Recomendado: {parseInt(formData.teamsCount) / 4} grupos de 4 times.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-400 mb-2">Classificados por Grupo</label>
                                        <select {...register('qualifiersPerGroup')} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 focus:border-yellow-500 focus:outline-none">
                                            <option value="1">1 (Só o campeão)</option>
                                            <option value="2">2 (Campeão e Vice)</option>
                                        </select>
                                    </div>
                                </div>
                            ) : formData.type === 'LEAGUE_WITH_FINAL' ? (
                                <div className="text-center py-12">
                                    <div className="text-gray-500 mb-4 text-6xl">🔄</div>
                                    <h3 className="text-xl font-bold text-white">Pontos Corridos + Final</h3>
                                    <p className="text-gray-400">Todos os times se enfrentam. Os 2 melhores classificados disputam a final.</p>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-gray-500 mb-4 text-6xl">🏆</div>
                                    <h3 className="text-xl font-bold text-white">Mata-mata Direto</h3>
                                    <p className="text-gray-400">Nenhuma configuração de grupo necessária para este formato.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div className="space-y-6 animate-slide-in-right">
                            <h2 className="text-xl font-bold flex items-center gap-2"><FaCheckCircle className="text-yellow-500" /> Revisão</h2>

                            <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-4">
                                <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
                                    {logoPreview ? (
                                        <img src={logoPreview} className="w-16 h-16 rounded-lg object-cover" alt="Logo" />
                                    ) : (
                                        <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600"><FaTrophy size={24} /></div>
                                    )}
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{formData.name}</h3>
                                        <p className="text-gray-400 text-sm">
                                            {formData.type === 'GROUPS_KNOCKOUT' ? 'Grupos + Mata-mata' : formData.type === 'LEAGUE_WITH_FINAL' ? 'Liga + Final' : 'Mata-mata Direto'} • {formData.teamsCount} Times
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500 block">Duração</span>
                                        <span className="text-white font-bold">{formData.gameDuration} min</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block">Início</span>
                                        <span className="text-white font-bold">{formData.startDate ? new Date(formData.startDate).toLocaleDateString() : 'Não definido'}</span>
                                    </div>
                                    {formData.type === 'GROUPS_KNOCKOUT' && (
                                        <>
                                            <div>
                                                <span className="text-gray-500 block">Grupos</span>
                                                <span className="text-white font-bold">{formData.groupsCount}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500 block">Classificados</span>
                                                <span className="text-white font-bold">{formData.qualifiersPerGroup}/grupo</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
                        {step > 1 ? (
                            <button type="button" onClick={prevStep} className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 font-bold transition">
                                <FaArrowLeft /> Voltar
                            </button>
                        ) : (
                            <button type="button" onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-white px-4 py-2 font-bold transition">
                                Cancelar
                            </button>
                        )}

                        {step < 4 ? (
                            <button type="button" onClick={nextStep} className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-6 py-3 rounded-xl font-bold shadow-lg shadow-yellow-500/20 transition flex items-center gap-2">
                                Próximo <FaArrowRight />
                            </button>
                        ) : (
                            <button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Criando...' : 'Confirmar e Criar'} <FaCheckCircle />
                            </button>
                        )}
                    </div>

                </form>
            </div >
        </div >
    );
};

export default CreateChampionship;
