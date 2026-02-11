import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const onSubmit = async (data: any) => {
        try {
            const response = await api.post('/auth/login', data);
            signIn(response.data.token, response.data.user);
            navigate('/dashboard');
        } catch (error) {
            alert('Erro ao fazer login. Verifique suas credenciais.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
                <div className="flex flex-col items-center mb-6">
                    <img src="/logo.png" alt="Futkings Logo" className="h-24 w-auto mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.6)] animate-pulse-slow" />
                    <h2 className="text-3xl font-bold text-yellow-500 uppercase tracking-tighter">Futkings Manager</h2>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold py-2 rounded hover:from-yellow-400 hover:to-orange-400 transition"
                    >
                        Entrar
                    </button>
                </form>
                <p className="mt-4 text-center text-sm text-gray-400">
                    Não tem conta? <Link to="/register" className="text-yellow-500 hover:underline">Cadastre-se</Link>
                </p>
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <Link
                        to="/hub"
                        className="block w-full bg-gray-700 hover:bg-gray-600 text-yellow-500 font-bold py-3 rounded-lg text-center transition-all border border-yellow-500/20 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                    >
                        ⚽ Acessar Área do Torcedor
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
