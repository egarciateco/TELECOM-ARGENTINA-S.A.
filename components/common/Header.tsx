import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext';
import { formatUserText } from '../../utils/helpers';

const Header: React.FC = () => {
    const { currentUser, logout, logoUrl, addToast, shareableUrl } = useAppContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleShare = async () => {
        const title = 'Reserva de Sala - TELECOM';
        const text = 'Gestiona y reserva salas de reuniones de forma eficiente.';
        
        const shareData: ShareData = { title, text };
        
        if (shareableUrl && shareableUrl.startsWith('http')) {
            shareData.url = shareableUrl;
        }

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                 if(shareData.url) {
                    navigator.clipboard.writeText(shareData.url);
                    addToast('¡Enlace para compartir copiado!', 'success');
                 } else {
                    addToast('No hay un enlace para compartir configurado.', 'error');
                 }
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                return;
            }
            console.error('Error al compartir:', err);
            addToast('No se pudo compartir la aplicación.', 'error');
        }
    };


    return (
        <header className="bg-gray-900 bg-opacity-70 text-white p-4 flex justify-between items-center shadow-lg">
            <Link to="/agenda" className="flex items-center space-x-3">
                <img src={logoUrl} alt="TELECOM Logo" className="h-10 object-contain" />
                <span className="text-xl font-bold tracking-wider">Reserva de Sala</span>
            </Link>
            <div className="flex items-center space-x-4">
                 {currentUser && (
                    <div className="text-right" style={{ fontSize: '8px', lineHeight: '1.2' }}>
                        <p className="font-semibold">{formatUserText(currentUser.lastName)}, {formatUserText(currentUser.firstName)}</p>
                        <p>{formatUserText(currentUser.role)}</p>
                    </div>
                )}
                {currentUser?.role === 'Administrador' && (
                    <Link to="/admin" className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                        Panel Admin
                    </Link>
                )}
                <button
                    onClick={handleShare}
                    title="Compartir aplicación"
                    className="p-2 text-sm bg-teal-600 hover:bg-teal-700 rounded-full transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                </button>
                <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-xs bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                    Cerrar Sesión
                </button>
            </div>
        </header>
    );
};

export default Header;