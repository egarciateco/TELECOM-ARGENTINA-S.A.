import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Sector, Role, Booking, AppSettings, ToastMessage, AppContextType, ConfirmationState } from '../types';
import { INITIAL_ROLES, INITIAL_SECTORS, DEFAULT_LOGO_URL, DEFAULT_BACKGROUND_URL, INITIAL_ADMIN_SECRET_CODE, DEFAULT_HOME_BACKGROUND_URL, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, DEFAULT_SHAREABLE_URL } from '../constants';
import { mockUsers, mockBookings } from '../utils/mockData';
import { getItem, setItem } from '../utils/idb';
import { formatDate } from '../utils/helpers';

declare global {
    interface Window {
        emailjs: any;
    }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Audio Context for Bell Sound ---
let audioContext: AudioContext | null = null;
const playNotificationSound = () => {
    if (typeof window.AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        return;
    }
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
};

const usePersistentStorage = <T,>(key: string, initialValue: T): [T, (value: T) => Promise<void>, boolean] => {
    const [storedValue, setStoredValue] = useState<T>(initialValue);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initialLoad = async () => {
            try {
                const value = await getItem<T>(key);
                if (value === undefined || value === null) {
                    setStoredValue(initialValue);
                    await setItem(key, initialValue);
                } else {
                    setStoredValue(value);
                }
            } catch (err) {
                console.error(`Failed to load ${key} from IndexedDB`, err);
                setStoredValue(initialValue);
            } finally {
                setLoading(false);
            }
        };
        initialLoad();
    }, [key, JSON.stringify(initialValue)]);

    const setValue = async (value: T) => {
        try {
            await setItem(key, value);
            setStoredValue(value);
        } catch (error) {
            console.error(`Failed to save ${key} to IndexedDB`, error);
            throw error; // Re-throw to be caught by callers
        }
    };

    return [storedValue, setValue, loading];
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser, currentUserLoading] = usePersistentStorage<User | null>('currentUser', null);
    const [users, setUsers, usersLoading] = usePersistentStorage<User[]>('users', mockUsers);
    const [sectors, setSectors, sectorsLoading] = usePersistentStorage<Sector[]>('sectors', INITIAL_SECTORS);
    const [roles, setRoles, rolesLoading] = usePersistentStorage<Role[]>('roles', INITIAL_ROLES);
    const [bookings, setBookings, bookingsLoading] = usePersistentStorage<Booking[]>('bookings', mockBookings);
    const [settings, setAppSettings, settingsLoading] = usePersistentStorage<AppSettings>('appSettings', {
        logoUrl: DEFAULT_LOGO_URL,
        backgroundImageUrl: DEFAULT_BACKGROUND_URL,
        homeBackgroundImageUrl: DEFAULT_HOME_BACKGROUND_URL,
        adminSecretCode: INITIAL_ADMIN_SECRET_CODE,
        shareableUrl: DEFAULT_SHAREABLE_URL,
    });
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        isOpen: false,
        message: '',
        onConfirm: () => {},
        onCancel: () => {},
    });

    const isLoading = currentUserLoading || usersLoading || sectorsLoading || rolesLoading || bookingsLoading || settingsLoading;

    const addToast = (message: string, type: 'success' | 'error') => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
        if(type === 'success') {
            playNotificationSound();
        }
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const hideConfirmation = () => {
        setConfirmation({ ...confirmation, isOpen: false });
    };

    const showConfirmation = (message: string, onConfirm: () => void) => {
        setConfirmation({
            isOpen: true,
            message,
            onConfirm: () => {
                onConfirm();
                hideConfirmation();
            },
            onCancel: hideConfirmation,
        });
    };

    const sendBookingNotificationEmail = useCallback(async (action: 'creada' | 'modificada' | 'eliminada', booking: Booking) => {
        const user = users.find(u => u.id === booking.userId);
        if (!user) return "Usuario de la reserva no encontrado.";

        try {
            if (typeof window.emailjs === 'undefined') {
                console.error('EmailJS SDK not loaded.');
                return 'AVISO: El servicio de email no está disponible.';
            }
            
            const isEmailJsConfigured =
                EMAILJS_SERVICE_ID &&
                EMAILJS_TEMPLATE_ID &&
                EMAILJS_PUBLIC_KEY;

            if (!isEmailJsConfigured) {
                return 'AVISO: Las notificaciones por email están desactivadas.';
            }
            
            const bookingDate = new Date(booking.date + 'T00:00:00');
            const templateParams = {
                action,
                user_name: `${user.lastName}, ${user.firstName}`,
                user_sector: user.sector,
                booking_day: formatDate(bookingDate),
                booking_time: `${booking.startTime}:00 - ${booking.startTime + booking.duration}:00`,
            };

            const usersToNotify = users.filter(u => u.role !== 'Administrador');
            if (usersToNotify.length === 0) {
                return 'No hay usuarios para notificar.';
            }

            let successCount = 0;
            let quotaReached = false;
            
            for (const targetUser of usersToNotify) {
                try {
                    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                        ...templateParams,
                        to_email: targetUser.email,
                    }, EMAILJS_PUBLIC_KEY);
                    successCount++;
                } catch (error: any) {
                    if (error?.status === 426) {
                        console.warn("EmailJS quota reached. Stopping email notifications.");
                        quotaReached = true;
                        break; 
                    }

                    const errorText = (error instanceof Error) ? error.toString() : JSON.stringify(error);
                     if (errorText.includes("The recipients address is empty")) {
                        console.error(`%c[AYUDA EMAILJS] El error "The recipients address is empty" significa que tu plantilla de correo en EmailJS no está configurada para recibir la dirección del destinatario. \nSolución: Ve a tu plantilla en el panel de EmailJS -> Pestaña "Settings" -> y en el campo "To Email", escribe exactamente: {{to_email}}`, 'color: yellow; font-weight: bold; font-size: 14px;');
                    } else {
                        console.error(`Failed to send email to ${targetUser.email}:`, errorText);
                    }
                }
            }

            if (quotaReached) {
                return `pero se ha alcanzado la cuota de envío de emails.`;
            }

            if (successCount === 0) {
                return `pero falló el envío de todas las notificaciones.`;
            } else {
                return `Notificaciones enviadas a ${successCount} de ${usersToNotify.length} usuarios.`;
            }
        } catch (error) {
            console.error("Error catastrófico en sendBookingNotificationEmail:", error);
            return `pero ocurrió un error grave al intentar enviar notificaciones.`;
        }
    }, [users]);

    const login = async (email: string, pass: string): Promise<boolean> => {
        const user = users.find(u => u.email === email.toLowerCase());
        if (user && user.passwordHash === `hashed_${pass}`) {
            await setCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const register = async (userData: Omit<User, 'id' | 'passwordHash'>, pass: string): Promise<boolean> => {
        if (users.some(u => u.email === userData.email.toLowerCase())) {
            return false;
        }
        const newUser: User = { ...userData, id: Date.now().toString(), email: userData.email.toLowerCase(), passwordHash: `hashed_${pass}` };
        await setUsers([...users, newUser]);
        return true;
    };

    const addBooking = async (bookingData: Omit<Booking, 'id'>): Promise<string> => {
        const newBooking: Booking = { ...bookingData, id: Date.now().toString() };
        await setBookings([...bookings, newBooking]);
        const emailStatus = await sendBookingNotificationEmail('creada', newBooking);
        return emailStatus;
    };

    const deleteBooking = async (bookingId: string) => {
        const bookingToDelete = bookings.find(b => b.id === bookingId);
        if (bookingToDelete) {
            await setBookings(bookings.filter(b => b.id !== bookingId));
            const emailStatus = await sendBookingNotificationEmail('eliminada', bookingToDelete);
            addToast(`Reserva eliminada. ${emailStatus}`, 'success');
        } else {
            throw new Error("Reserva no encontrada.");
        }
    };

    const updateBooking = async (updatedBooking: Booking) => {
        await setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
        const emailStatus = await sendBookingNotificationEmail('modificada', updatedBooking);
        addToast(`Reserva modificada. ${emailStatus}`, 'success');
    };

    const updateUser = async (updatedUser: User) => {
        const originalUser = users.find(u => u.id === updatedUser.id);
        if (!originalUser) {
            throw new Error("Usuario no encontrado para actualizar.");
        }

        let userToSave = { ...updatedUser };
        let toastMessage = 'Usuario actualizado.';

        const wasAdmin = originalUser.role === 'Administrador';
        const isAdmin = updatedUser.role === 'Administrador';

        if (!wasAdmin && isAdmin) { // Promoted to Admin
            userToSave.passwordHash = `hashed_${settings.adminSecretCode}`;
            toastMessage = `Usuario promovido a Administrador. Contraseña cambiada al código secreto.`;
        } else if (wasAdmin && !isAdmin) { // Demoted from Admin
             // When demoting, ensure the password hash reverts to the user's original hash,
             // not the admin secret hash they were temporarily using.
            userToSave.passwordHash = originalUser.passwordHash;
            toastMessage = `Administrador degradado. La contraseña del usuario ha sido conservada.`;
        }

        await setUsers(users.map(u => u.id === userToSave.id ? userToSave : u));
        addToast(toastMessage, 'success');
    };

    const deleteUser = async (userId: string) => {
        await setUsers(users.filter(u => u.id !== userId));
        await setBookings(bookings.filter(b => b.userId !== userId));
        addToast('Usuario y sus reservas eliminados.', 'success');
    };

    const addSector = async (sectorName: string) => {
        await setSectors([...sectors, { id: Date.now().toString(), name: sectorName }]);
        addToast('Sector añadido.', 'success');
    };

    const updateSector = async (updatedSector: Sector) => {
        await setSectors(sectors.map(s => s.id === updatedSector.id ? updatedSector : s));
        addToast('Sector actualizado.', 'success');
    };

    const deleteSector = async (sectorId: string) => {
        await setSectors(sectors.filter(s => s.id !== sectorId));
        addToast('Sector eliminado.', 'success');
    };

    const addRole = async (roleName: string) => {
        await setRoles([...roles, { id: Date.now().toString(), name: roleName }]);
        addToast('Rol añadido.', 'success');
    };

    const updateRole = async (updatedRole: Role) => {
        await setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
        addToast('Rol actualizado.', 'success');
    };

    const deleteRole = async (roleId: string) => {
        await setRoles(roles.filter(r => r.id !== roleId));
        addToast('Rol eliminado.', 'success');
    };

    const setSettings = async (newSettings: Partial<AppSettings>) => {
        await setAppSettings({...settings, ...newSettings});
    };

    const value: AppContextType = {
        currentUser, users, sectors, roles, bookings,
        logoUrl: settings.logoUrl,
        backgroundImageUrl: settings.backgroundImageUrl,
        homeBackgroundImageUrl: settings.homeBackgroundImageUrl,
        adminSecretCode: settings.adminSecretCode,
        shareableUrl: settings.shareableUrl,
        toasts, confirmation, isLoading,
        login, logout, register,
        addBooking, deleteBooking, updateBooking,
        updateUser, deleteUser,
        addSector, updateSector, deleteSector,
        addRole, updateRole, deleteRole,
        setSettings, addToast, removeToast,
        showConfirmation, hideConfirmation,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export { AppContext };