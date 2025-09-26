import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const PasswordInput: React.FC<{name: string, value: string, placeholder: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean}> = 
({ name, value, placeholder, onChange, required }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative">
            <input
                type={isVisible ? 'text' : 'password'}
                name={name}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                required={required}
                className="input-style w-full pr-10"
            />
            <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
            >
                {isVisible ? (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 5.943 14.478 3 10 3a9.953 9.953 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2 2 0 012.828 2.828l1.515 1.515A4 4 0 0011 8c-2.21 0-4 1.79-4 4a4.006 4.006 0 00.97 2.473l.603.602z" clipRule="evenodd" /></svg>
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                )}
            </button>
        </div>
    );
};

const RegisterPage: React.FC = () => {
    const { register, sectors, roles, logoUrl, adminSecretCode, addToast } = useAppContext();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        sector: sectors[0]?.name || '',
        role: roles.find(r => r.name === 'Empleado')?.name || '',
        password: '',
        confirmPassword: '',
        adminCode: ''
    });
    const [error, setError] = useState('');
    const [phoneFormatWarning, setPhoneFormatWarning] = useState(false);
    
    const isRegisteringAsAdmin = formData.role === 'Administrador';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'role' && value === 'Administrador') {
                newState.sector = ''; 
            }
            return newState;
        });
        
        if (name === 'phone') {
            const phoneRegex = /^\(\d{3}\)-\d{7}$/;
            setPhoneFormatWarning(!phoneRegex.test(value) && value.length > 0);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        let passwordToRegister = '';

        if (isRegisteringAsAdmin) {
            if (formData.adminCode !== adminSecretCode) {
                setError('El código de administrador es incorrecto.');
                return;
            }
            passwordToRegister = formData.adminCode;
        } else {
            if (formData.password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres.');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Las contraseñas no coinciden.');
                return;
            }
            passwordToRegister = formData.password;
        }

        const { password, confirmPassword, adminCode, ...userData } = formData;
        
        const success = await register(userData, passwordToRegister);
        
        if (success) {
            addToast('¡Cuenta creada exitosamente! Por favor, inicie sesión.', 'success');
            navigate('/login');
        } else {
            setError('El email ya está registrado.');
        }
    };
    
    return (
         <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-black bg-opacity-50">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-start z-10">
                 <img src={logoUrl} alt="TELECOM Logo" className="h-12 object-contain" />
            </header>

            <main className="w-full max-w-lg">
                <div className="bg-gray-900 bg-opacity-80 p-8 rounded-xl shadow-2xl backdrop-blur-md text-white">
                    <h2 className="text-3xl font-bold text-center mb-8">Crear Cuenta</h2>
                    {error && <p className="bg-red-500 text-white p-3 rounded-md mb-4 text-center">{error}</p>}
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <input name="firstName" placeholder="Nombre" value={formData.firstName} onChange={handleChange} required className="input-style" />
                        <input name="lastName" placeholder="Apellido" value={formData.lastName} onChange={handleChange} required className="input-style" />
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="md:col-span-2 input-style" />
                        <div>
                            <input name="phone" placeholder="Celular (###)-#######" value={formData.phone} onChange={handleChange} className="input-style" />
                            {phoneFormatWarning && <p className="text-yellow-400 text-xs mt-1">Formato sugerido: (###)-#######</p>}
                        </div>
                        <select name="sector" value={formData.sector} onChange={handleChange} required={!isRegisteringAsAdmin} disabled={isRegisteringAsAdmin} className="input-style disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isRegisteringAsAdmin ? <option value="">N/A</option> : sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                        <select name="role" value={formData.role} onChange={handleChange} required className="md:col-span-2 input-style">
                            {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>

                        {isRegisteringAsAdmin ? (
                            <div className="md:col-span-2 transition-all duration-300">
                                <PasswordInput name="adminCode" value={formData.adminCode} placeholder="Código de Administrador" onChange={handleChange} required />
                            </div>
                        ) : (
                            <>
                                <PasswordInput name="password" value={formData.password} placeholder="Contraseña" onChange={handleChange} required />
                                <PasswordInput name="confirmPassword" value={formData.confirmPassword} placeholder="Confirmar Contraseña" onChange={handleChange} required />
                            </>
                        )}
                        
                        <button type="submit" className="md:col-span-2 w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">Crear Cuenta</button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-400">
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
                            Iniciar Sesión
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
            <style>{`
                .input-style {
                    background-color: #374151; /* bg-gray-700 */
                    border: 1px solid #4B5563; /* border-gray-600 */
                    border-radius: 0.375rem; /* rounded-md */
                    padding: 0.5rem 0.75rem;
                    color: white;
                    width: 100%;
                }
                .input-style:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px #3B82F6; /* focus:ring-blue-500 */
                    border-color: #3B82F6; /* focus:border-blue-500 */
                }
            `}</style>
        </div>
    );
};

export default RegisterPage;