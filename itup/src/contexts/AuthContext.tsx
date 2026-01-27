"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { User, Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Profile } from "@/lib/supabase/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  isConfigured: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const isConfigured = isSupabaseConfigured();

  const supabase = useMemo<SupabaseClient | null>(() => {
    if (!isConfigured) return null;
    try {
      return createClient();
    } catch {
      return null;
    }
  }, [isConfigured]);

  const fetchProfile = async (userId: string) => {
    if (!supabase) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(data);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!supabase) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            try {
              await fetchProfile(session.user.id);
            } catch (e) {
              console.error("Profile fetch error:", e);
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initialize();

    // Auth state change listener
    let subscription: { unsubscribe: () => void } | null = null;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            await fetchProfile(session.user.id);
          } catch (e) {
            console.error("Profile fetch error:", e);
          }
        } else {
          setProfile(null);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const signUp = async (email: string, password: string, name?: string) => {
    if (!supabase) {
      return { error: new Error("Supabase is not configured") };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || "",
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error("Supabase is not configured") };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (!supabase) return;

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isInitialized,
        isConfigured,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
