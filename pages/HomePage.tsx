import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const HomePage: React.FC = () => {
    const { logoUrl } = useAppContext();

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-black bg-opacity-50">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-start z-10">
                <img src={logoUrl} alt="TELECOM Logo" className="h-12 object-contain" />
            </header>

            <main className="w-full max-w-md text-center">
                <div className="bg-gray-900 bg-opacity-80 p-10 rounded-xl shadow-2xl backdrop-blur-md">
                    <h1 className="text-5xl font-bold text-white mb-4">Reserva de Sala</h1>
                    <p className="text-xl text-gray-300 mb-8">TELECOM</p>
                    <Link
                        to="/login"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
                    >
                        Acceder
                    </Link>
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

export default HomePage;