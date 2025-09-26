import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AgendaPage from './pages/AgendaPage';
import AdminPage from './pages/AdminPage';
import { useAppContext } from './hooks/useAppContext';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { ToastMessage } from './types';

const Toast: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
    const { removeToast } = useAppContext();
    const nodeRef = React.useRef(null);
    return (
        <CSSTransition
            nodeRef={nodeRef}
            key={toast.id}
            timeout={300}
            classNames="toast"
            unmountOnExit
            onEntered={() => setTimeout(() => removeToast(toast.id), 3000)}
        >
            <div ref={nodeRef} className="bg-gray-800 border border-gray-600 text-white p-4 rounded-lg shadow-lg flex items-center">
                <div className="flex-shrink-0">
                    {toast.type === 'success' && (
                        <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {toast.type === 'error' && (
                        <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                   )}
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium">{toast.message}</p>
                </div>
            </div>
        </CSSTransition>
    );
};

const ToastContainer: React.FC = () => {
    const { toasts } = useAppContext();

    return (
        <div className="fixed bottom-4 right-4 z-[9999] w-80 space-y-2">
            <TransitionGroup>
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} />
                ))}
            </TransitionGroup>
        </div>
    );
};

const ConfirmationModal: React.FC = () => {
    const { confirmation } = useAppContext();
    const nodeRef = React.useRef(null);

    if (!confirmation.isOpen) return null;

    return (
        <div ref={nodeRef} className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000]">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-sm">
                <h3 className="text-lg font-bold mb-4">Confirmar Acción</h3>
                <p className="text-gray-300 mb-6">{confirmation.message}</p>
                <div className="flex justify-end space-x-4">
                    <button onClick={confirmation.onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition">
                        Cancelar
                    </button>
                    <button onClick={confirmation.onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


const AppContent: React.FC = () => {
    const { backgroundImageUrl, homeBackgroundImageUrl, isLoading } = useAppContext();
    const location = useLocation();

    const isHomePage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';
    const activeBg = isHomePage ? homeBackgroundImageUrl : backgroundImageUrl;
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-xl">Cargando datos de la aplicación...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen bg-cover bg-center transition-all duration-500" 
            style={{ backgroundImage: `url(${activeBg})` }}
        >
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <ToastContainer />
            <ConfirmationModal />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <HashRouter>
            <AppContent />
        </HashRouter>
    );
};

// FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { currentUser } = useAppContext();
    return currentUser ? children : <Navigate to="/login" />;
};

// FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { currentUser } = useAppContext();
    return currentUser && currentUser.role === 'Administrador' ? children : <Navigate to="/agenda" />;
};

export default App;