export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sector: string;
  role: string;
  passwordHash: string;
}

export interface Sector {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Booking {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  startTime: number; // 8, 9, 10, ...
  duration: number; // in hours
}

export interface AppSettings {
  logoUrl: string;
  backgroundImageUrl: string;
  homeBackgroundImageUrl: string;
  adminSecretCode: string;
  shareableUrl: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface ConfirmationState {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface AppContextType {
    currentUser: User | null;
    users: User[];
    sectors: Sector[];
    roles: Role[];
    bookings: Booking[];
    logoUrl: string;
    backgroundImageUrl: string;
    homeBackgroundImageUrl: string;
    adminSecretCode: string;
    shareableUrl: string;
    toasts: ToastMessage[];
    confirmation: ConfirmationState;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    register: (user: Omit<User, 'id' | 'passwordHash'>, pass: string) => Promise<boolean>;
    addBooking: (booking: Omit<Booking, 'id'>) => Promise<string>;
    deleteBooking: (bookingId: string) => Promise<void>;
    updateBooking: (booking: Booking) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addSector: (sectorName: string) => Promise<void>;
    updateSector: (sector: Sector) => Promise<void>;
    deleteSector: (sectorId: string) => Promise<void>;
    addRole: (roleName: string) => Promise<void>;
    updateRole: (role: Role) => Promise<void>;
    deleteRole: (roleId: string) => Promise<void>;
    setSettings: (settings: Partial<AppSettings>) => Promise<void>;
    addToast: (message: string, type: 'success' | 'error') => void;
    removeToast: (id: number) => void;
    showConfirmation: (message: string, onConfirm: () => void) => void;
    hideConfirmation: () => void;
}