import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'MERCHANT' | 'AFFILIATE' | 'CUSTOMER';
  tenantId?: string | null;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  phone?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isInitialized: false,
      isAuthenticated: false,
      tokens: {
        accessToken: null,
        refreshToken: null,
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (tokens) => {
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        set({ tokens });
      },

      login: async (email, password) => {
        const response = await authApi.login(email, password);
        const { user, tokens } = response.data.data;
        
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Clear redirect tracking on successful login
        sessionStorage.removeItem('redirect_from_/login');
        sessionStorage.removeItem('redirect_from_/register');
        
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      register: async (data) => {
        const response = await authApi.register(data);
        const { user, tokens } = response.data.data;
        
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        
        // Clear redirect tracking on successful register
        sessionStorage.removeItem('redirect_from_/login');
        sessionStorage.removeItem('redirect_from_/register');
        
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: async () => {
        const { tokens } = get();
        if (tokens.refreshToken) {
          try {
            await authApi.logout(tokens.refreshToken);
          } catch {
            // Ignore logout errors
          }
        }
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Clear all redirect tracking on logout
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('redirect_from_')) {
            sessionStorage.removeItem(key);
          }
        });
        
        set({
          user: null,
          tokens: { accessToken: null, refreshToken: null },
          isAuthenticated: false,
        });
      },

      initAuth: async () => {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (accessToken && refreshToken) {
          set({
            tokens: { accessToken, refreshToken },
            isLoading: false,
          });
          
          // Fetch current user
          try {
            const response = await authApi.me();
            set({
              user: response.data.data.user,
              isAuthenticated: true,
              isInitialized: true,
            });
          } catch {
            // Token invalid, clear auth
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            set({
              tokens: { accessToken: null, refreshToken: null },
              user: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            });
          }
        } else {
          set({ 
            isLoading: false,
            isInitialized: true,
          });
        }
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          tokens: { accessToken: null, refreshToken: null },
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
    }
  )
);
