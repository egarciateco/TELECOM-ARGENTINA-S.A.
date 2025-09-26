import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, logoUrl } = useAppContext();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                navigate('/agenda');
            } else {
                setError('Email o contraseña incorrectos.');
            }
        } catch (err) {
            setError('Ocurrió un error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-black bg-opacity-50">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-start z-10">
                 <img src={logoUrl} alt="TELECOM Logo" className="h-12 object-contain" />
            </header>

            <main className="w-full max-w-md">
                <div className="bg-gray-900 bg-opacity-80 p-8 rounded-xl shadow-2xl backdrop-blur-md">
                    <h2 className="text-3xl font-bold text-center text-white mb-8">Iniciar Sesión</h2>
                    {error && <p className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">{error}</p>}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-300">Contraseña</label>
                            <input
                                type={isPasswordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 right-0 top-6 px-3 flex items-center text-gray-400 hover:text-white"
                            >
                                {isPasswordVisible ? (
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 5.943 14.478 3 10 3a9.953 9.953 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2 2 0 012.828 2.828l1.515 1.515A4 4 0 0011 8c-2.21 0-4 1.79-4 4a4.006 4.006 0 00.97 2.473l.603.602z" clipRule="evenodd" /></svg>
                                ) : (
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                )}
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-400">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300">
                            Crear Cuenta
                        </Link>
                    </p>
                </div>
            </main>
            
            <footer className="absolute bottom-4 left-4 text-xs text-left text-gray-300">
                 <div>
                    <p>Realizado por:</p>
                    <p>Esteban García.</p>
                </div>
            </footer>
        </div>
    );
};

export default LoginPage;