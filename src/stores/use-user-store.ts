import Cookies from 'js-cookie';
import { create } from 'zustand';
import { StateStorage, createJSONStorage, persist } from 'zustand/middleware';

import { UserType } from '@/types/user';

let isRememberMe = true;

// --- CONFIG COOKIE STORAGE ---
export const CookieStorage: StateStorage = {
  getItem: (name: string): string | null => {
    return Cookies.get(name) || null;
  },
  setItem: (name: string, value: string): void => {
    if (isRememberMe) {
      Cookies.set(name, value, { expires: 7, sameSite: 'None', secure: true });
    } else {
      Cookies.set(name, value, { sameSite: 'None', secure: true });
    }
  },
  removeItem: (name: string): void => {
    Cookies.remove(name, { path: '/', sameSite: 'None', secure: true });
  },
};

// --- TYPES ---
export type UserState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserType | null;
  isLoggedIn: boolean;
  hasJuryExperience: boolean;
};

type UserDispatch = {
  setUser: (user: UserType | null) => void;
  setAccessToken: (accessToken: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setHasJuryExperience: (hasJuryExperience: boolean) => void;
  login: (
    accessToken: string,
    refreshToken: string,
    user?: UserType,
    remember?: boolean,
    hasJuryExperience?: boolean
  ) => void;
  reset: () => void;
  logout: () => void;
};

const INITIAL_STATE: UserState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoggedIn: false,
  hasJuryExperience: false,
};

// --- STORE ---
export const useUserStore = create<UserState & UserDispatch>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setUser: (newUser: UserType | null) =>
        set((state) => ({
          ...state,
          user: newUser === null ? null : { ...state.user, ...newUser },
        })),

      setAccessToken: (accessToken: string) =>
        set((state) => ({
          ...state,
          accessToken,
        })),

      setRefreshToken: (refreshToken: string) =>
        set((state) => ({
          ...state,
          refreshToken,
        })),

      setIsLoggedIn: (isLoggedIn: boolean) => set((state) => ({ ...state, isLoggedIn })),

      setHasJuryExperience: (hasJuryExperience: boolean) =>
        set((state) => ({ ...state, hasJuryExperience })),

      login: (accessToken, refreshToken, user, remember = true, hasJuryExperience = false) => {
        isRememberMe = remember;

        set((state) => ({
          ...state,
          accessToken,
          refreshToken,
          user: user || state.user,
          isLoggedIn: true,
          hasJuryExperience,
        }));
      },

      reset: () => {
        // Write cleared state directly to cookie, bypassing persist middleware
        // to avoid race conditions with set() triggering re-persist
        Cookies.set('user-storage', JSON.stringify({ state: { ...INITIAL_STATE }, version: 0 }), {
          path: '/',
          sameSite: 'None',
          secure: true,
          expires: 7,
        });
        set(INITIAL_STATE);
      },

      logout: () => {
        // Write cleared state directly to cookie, bypassing persist middleware
        Cookies.set('user-storage', JSON.stringify({ state: { ...INITIAL_STATE }, version: 0 }), {
          path: '/',
          sameSite: 'None',
          secure: true,
          expires: 7,
        });
        set(INITIAL_STATE);
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => CookieStorage),
    }
  )
);
