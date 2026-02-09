import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        try {
            await api.post('/auth/register', data);
            alert('Cadastro realizado com sucesso! Faça login.');
            navigate('/');
        } catch (error) {
            alert('Erro ao cadastrar.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
                <div className="flex flex-col items-center mb-6">
                    <img src="/logo.png" alt="Futkings Logo" className="h-20 w-auto mb-4 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                    <h2 className="text-3xl font-bold text-yellow-500 text-center">Crie sua conta</h2>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome</label>
                        <input
                            {...register('name')}
                            type="text"
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                            placeholder="Seu Nome"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Senha</label>
                        <input
                            {...register('password')}
                            type="password"
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                            placeholder="********"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Conta</label>
                        <select
                            {...register('role')}
                            className="w-full px-4 py-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                        >
                            <option value="PLAYER">Jogador</option>
                            <option value="MANAGER">Manager (Time)</option>
                            <option value="ADMIN">Administrador (Debug)</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-2 rounded hover:from-green-400 hover:to-emerald-400 transition"
                    >
                        Cadastrar
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-400">
                    Já tem conta? <Link to="/" className="text-yellow-500 hover:underline">Faça Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
