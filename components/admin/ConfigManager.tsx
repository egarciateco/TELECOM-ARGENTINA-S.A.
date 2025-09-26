import React, { useState, useRef } from 'react';
import { useAppContext } from '../../hooks/useAppContext';

const ConfigManager: React.FC = () => {
    const { logoUrl, backgroundImageUrl, homeBackgroundImageUrl, adminSecretCode, shareableUrl, setSettings, addToast } = useAppContext();
    const [newLogoUrl, setNewLogoUrl] = useState(logoUrl);
    const [newBgUrl, setNewBgUrl] = useState(backgroundImageUrl);
    const [newHomeBgUrl, setNewHomeBgUrl] = useState(homeBackgroundImageUrl);
    const [newAdminCode, setNewAdminCode] = useState(adminSecretCode);
    const [newShareableUrl, setNewShareableUrl] = useState(shareableUrl);
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const logoFileRef = useRef<HTMLInputElement>(null);
    const bgFileRef = useRef<HTMLInputElement>(null);
    const homeBgFileRef = useRef<HTMLInputElement>(null);
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (!newAdminCode.trim()) {
                addToast('El código de administrador no puede estar vacío.', 'error');
                setIsSaving(false);
                return;
            }
            await setSettings({ 
                logoUrl: newLogoUrl, 
                backgroundImageUrl: newBgUrl,
                homeBackgroundImageUrl: newHomeBgUrl,
                adminSecretCode: newAdminCode,
                shareableUrl: newShareableUrl,
            });
            addToast('Configuración guardada.', 'success');
        } catch(error) {
            console.error("Failed to save settings", error);
            addToast('Error al guardar la configuración.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<string>>,
        fieldName: 'logoUrl' | 'backgroundImageUrl' | 'homeBackgroundImageUrl'
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
            if (typeof reader.result === 'string') {
                setter(reader.result);
                // Auto-save image on selection
                try {
                    await setSettings({ [fieldName]: reader.result });
                    addToast('Imagen guardada automáticamente.', 'success');
                } catch (error) {
                    console.error("Failed to auto-save image", error);
                    addToast('Error al guardar la imagen.', 'error');
                }
            }
        };
        reader.onerror = () => {
            addToast('Hubo un error al leer el archivo.', 'error');
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    };

    const ImageInput = ({ label, value, setter, fileRef, alt, fieldName }: { label: string, value: string, setter: React.Dispatch<React.SetStateAction<string>>, fileRef: React.RefObject<HTMLInputElement>, alt: string, fieldName: 'logoUrl' | 'backgroundImageUrl' | 'homeBackgroundImageUrl' }) => (
        <div>
            <label className="block text-sm font-medium text-white mb-2">{label}</label>
            <div className="flex items-center gap-2 md:gap-4">
                 <img src={value} alt={alt} className="h-12 w-16 object-contain bg-white p-1 rounded-md"/>
                 <input
                    type="text"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder="Pegar URL o subir archivo"
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-xs"
                />
                <input type="file" ref={fileRef} hidden onChange={(e) => handleFileChange(e, setter, fieldName)} accept="image/*" />
                <button 
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-2 text-xs bg-gray-600 hover:bg-gray-500 rounded-md transition whitespace-nowrap"
                >
                    Cambiar...
                </button>
            </div>
            <p className="text-xs text-white mt-1">Sube un archivo (se guarda al instante) o pega una URL (requiere guardar cambios).</p>
        </div>
    );

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-white">Configuración Visual y de Acceso</h2>
            <div className="space-y-6">
                
                <ImageInput label="Imagen del Logotipo de TELECOM" value={newLogoUrl} setter={setNewLogoUrl} fileRef={logoFileRef} alt="Logo Preview" fieldName="logoUrl" />
                <ImageInput label="Imagen de Fondo (General)" value={newBgUrl} setter={setNewBgUrl} fileRef={bgFileRef} alt="Background Preview" fieldName="backgroundImageUrl" />
                <ImageInput label="Imagen de Fondo (Página de Inicio)" value={newHomeBgUrl} setter={setNewHomeBgUrl} fileRef={homeBgFileRef} alt="Home Background Preview" fieldName="homeBackgroundImageUrl" />
                
                <div>
                    <label className="block text-sm font-medium text-white mb-2">URL de la Aplicación para Compartir</label>
                    <input
                        type="text"
                        value={newShareableUrl}
                        onChange={(e) => setNewShareableUrl(e.target.value)}
                        placeholder="https://ejemplo.com/app"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                    />
                     <p className="text-xs text-white mt-1">El enlace que se usará al hacer clic en el botón "Compartir".</p>
                </div>

                 <div>
                    <label className="block text-sm font-medium text-white mb-2">Código de Administrador</label>
                    <div className="relative">
                        <input
                            type={isCodeVisible ? 'text' : 'password'}
                            value={newAdminCode}
                            onChange={(e) => setNewAdminCode(e.target.value)}
                            placeholder="Código secreto para registro de admin"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white pr-10"
                        />
                         <button
                            type="button"
                            onClick={() => setIsCodeVisible(!isCodeVisible)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                        >
                            {isCodeVisible ? (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 5.943 14.478 3 10 3a9.953 9.953 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2 2 0 012.828 2.828l1.515 1.515A4 4 0 0011 8c-2.21 0-4 1.79-4 4a4.006 4.006 0 00.97 2.473l.603.602z" clipRule="evenodd" /></svg>
                            ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-white mt-1">Este código se utiliza como contraseña al registrar una nueva cuenta de administrador.</p>
                </div>

                <div className="pt-4">
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-40" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigManager;