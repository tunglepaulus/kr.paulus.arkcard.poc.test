import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  company: string;
  avatar: string;
  bio: string;
  cardBackground?: string;
}

export interface Award {
  id: string;
  projectName: string;
  awardShow: string;
  year: number;
  category?: string;
  sourceUrl?: string;
  confidence?: 'low' | 'medium' | 'high';
  verified?: boolean;
}

export interface ConnectedID {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  avatar: string;
  color: 'navy' | 'teal' | 'coral' | 'gold' | 'camel';
  verified?: boolean;
  email?: string;
  bio?: string;
}

interface OnboardingState {
  step: number;
  name: string;
  companies: string[];
  consentGiven: boolean;
}

interface AppState {
  // Auth state
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  onboarding: OnboardingState;
  lastSyncedAt: string | null;

  // User data
  user: UserProfile;
  awards: Award[];
  connectedIDs: ConnectedID[];

  // Actions
  setAuthenticated: (value: boolean) => void;
  setOnboardingComplete: (value: boolean) => void;
  updateOnboarding: (updates: Partial<OnboardingState>) => void;
  resetOnboarding: () => void;
  updateUser: (user: Partial<UserProfile>) => void;
  updateBio: (bio: string) => void;
  setAwards: (awards: Award[]) => void;
  addConnectedID: (id: ConnectedID) => void;
  removeConnectedID: (id: string) => void;
  addConnectedIDFromShare: (profile: Partial<ConnectedID>) => void;
  clearMockConnectedIDs: () => void;
  setLastSyncedAt: (date: string) => void;
}

// Default data
const defaultUser: UserProfile = {
  id: 'ark-001',
  name: 'Thomas Hongtack Kim',
  email: 'thomas@paulus.kr',
  jobTitle: 'CCO & Creative Solutionist',
  company: 'Paulus',
  avatar: '',
  bio: 'Creative Solutionist & Founder of 2kg Creative Solution Lab. Chief Creative Officer at Paulus. International Board of Director at The One Club for Creativity. Collective/Board of Directors at Adfest. Jury President of One Show 2025 SDG Pencil. Renowned keynote speaker and writer in the advertising industry.',
};

const defaultAwards: Award[] = [
  {
    id: 'award-1',
    projectName: 'Shared Safety - Hoban Construction',
    awardShow: 'One Show',
    year: 2024,
    category: 'Gold',
    sourceUrl: 'https://oneshow.org',
    confidence: 'high',
    verified: true,
  },
  {
    id: 'award-2',
    projectName: 'Digital Twin Technology Campaign',
    awardShow: 'Cannes Lions',
    year: 2023,
    category: 'Bronze',
    sourceUrl: 'https://www.canneslions.com',
    confidence: 'high',
    verified: true,
  },
  {
    id: 'award-3',
    projectName: 'AI Creative Strategy',
    awardShow: 'Adfest',
    year: 2023,
    category: 'Grand Prix',
    sourceUrl: 'https://www.adfest.com',
    confidence: 'high',
    verified: true,
  },
  {
    id: 'award-4',
    projectName: 'Brand Voice Innovation',
    awardShow: 'LIA',
    year: 2022,
    category: 'Gold',
    sourceUrl: 'https://www.liaawards.com',
    confidence: 'medium',
    verified: false,
  },
  {
    id: 'award-5',
    projectName: 'Synthetic Authenticity',
    awardShow: 'Spikes Asia',
    year: 2022,
    category: 'Silver',
    sourceUrl: 'https://www.spikes.asia',
    confidence: 'medium',
    verified: false,
  },
  {
    id: 'award-6',
    projectName: 'Paulus Brand Campaign',
    awardShow: 'One Show',
    year: 2021,
    category: 'Merit',
    confidence: 'low',
  },
];

// Sample connected IDs to demonstrate the feature
const defaultConnectedIDs: ConnectedID[] = [
  {
    id: 'conn-demo-1',
    name: 'Sarah Chen',
    jobTitle: 'Executive Creative Director',
    company: 'Ogilvy',
    avatar: '',
    color: 'navy',
    verified: true,
    email: 'sarah.chen@ogilvy.com',
  },
  {
    id: 'conn-demo-2',
    name: 'Marcus Williams',
    jobTitle: 'Chief Strategy Officer',
    company: 'TBWA',
    avatar: '',
    color: 'teal',
    verified: true,
    email: 'marcus.w@tbwa.com',
  },
  {
    id: 'conn-demo-3',
    name: 'Yuki Tanaka',
    jobTitle: 'Creative Director',
    company: 'Dentsu',
    avatar: '',
    color: 'coral',
    verified: false,
    email: 'yuki.tanaka@dentsu.co.jp',
  },
  {
    id: 'conn-demo-4',
    name: 'Emma Rodriguez',
    jobTitle: 'Global Brand Director',
    company: 'Wieden+Kennedy',
    avatar: '',
    color: 'gold',
    verified: true,
    email: 'emma.r@wk.com',
  },
];

const initialOnboarding: OnboardingState = {
  step: 0,
  name: '',
  companies: [],
  consentGiven: false,
};

const colorOptions: ConnectedID['color'][] = ['navy', 'teal', 'coral', 'gold', 'camel'];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      onboarding: initialOnboarding,
      lastSyncedAt: new Date().toISOString(),

      user: defaultUser,
      awards: defaultAwards,
      connectedIDs: defaultConnectedIDs,

      // Actions
      setAuthenticated: (value) => set({ isAuthenticated: value }),

      setOnboardingComplete: (value) => set({ hasCompletedOnboarding: value }),

      updateOnboarding: (updates) =>
        set((state) => ({
          onboarding: { ...state.onboarding, ...updates },
        })),

      resetOnboarding: () => set({ onboarding: initialOnboarding }),

      updateUser: (updates) =>
        set((state) => ({
          user: { ...state.user, ...updates },
        })),

      updateBio: (bio) =>
        set((state) => ({
          user: { ...state.user, bio },
        })),

      setAwards: (awards) => set({ awards }),

      addConnectedID: (newID) =>
        set((state) => ({
          connectedIDs: [...state.connectedIDs, newID],
        })),

      removeConnectedID: (id) =>
        set((state) => ({
          connectedIDs: state.connectedIDs.filter((conn) => conn.id !== id),
        })),

      // Add connected ID from shared link or QR scan - avoids duplicates
      addConnectedIDFromShare: (profile) => {
        const state = get();

        // Check for duplicates by name and company
        const existingIndex = state.connectedIDs.findIndex(
          (conn) => conn.name === profile.name && conn.company === profile.company
        );

        if (existingIndex !== -1) {
          // Already exists, don't add duplicate
          return;
        }

        // Create new connected ID
        const newConnection: ConnectedID = {
          id: `conn-${Date.now()}`,
          name: profile.name || 'Unknown',
          jobTitle: profile.jobTitle || '',
          company: profile.company || '',
          avatar: profile.avatar || '',
          color: colorOptions[state.connectedIDs.length % colorOptions.length],
          verified: profile.verified ?? false,
          email: profile.email,
          bio: profile.bio,
        };

        set((state) => ({
          connectedIDs: [...state.connectedIDs, newConnection],
        }));
      },

      // Clear mock connected IDs
      clearMockConnectedIDs: () => {
        set((state) => ({
          connectedIDs: state.connectedIDs.filter((conn) => !conn.id.match(/^conn-[1-4]$/)),
        }));
      },

      setLastSyncedAt: (date) => set({ lastSyncedAt: date }),
    }),
    {
      name: 'arkid-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        user: state.user,
        lastSyncedAt: state.lastSyncedAt,
        connectedIDs: state.connectedIDs,
      }),
    }
  )
);
