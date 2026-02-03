import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile, Mentor } from "@/lib/supabase/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  mentor: Mentor | null;
  isLoading: boolean;
  isInitialized: boolean;

  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setMentor: (mentor: Mentor | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  session: null,
  mentor: null,
  isLoading: true,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setMentor: (mentor) => set({ mentor }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  reset: () => set({ user: null, profile: null, session: null, mentor: null }),
}));
