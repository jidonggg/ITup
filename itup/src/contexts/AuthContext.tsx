"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
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

  const fetchProfile = useCallback(async (userId: string, userMetadataName?: string) => {
    if (!supabase) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      // 프로필에 이름이 없고 user_metadata에 이름이 있으면 자동 업데이트
      if (!data.name && userMetadataName) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ name: userMetadataName })
          .eq("id", userId);

        if (!updateError) {
          data.name = userMetadataName;
        }
      }
      setProfile(data);
    }
    // data가 null이면 기존 profile 유지 (덮어쓰지 않음)
  }, [supabase]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.user_metadata?.name);
    }
  };

  useEffect(() => {
    // 5초 타임아웃 - Supabase 응답 없을 시 안전 장치
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setIsInitialized(true);
    }, 5000);

    if (!supabase) {
      setIsLoading(false);
      setIsInitialized(true);
      clearTimeout(timeout);
      return;
    }

    // onAuthStateChange가 INITIAL_SESSION 이벤트로 초기화를 처리
    // initialize에서 별도로 프로필을 fetch하지 않음 (race condition 방지)
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          await fetchProfile(session.user.id, session.user.user_metadata?.name);
        } catch {
          // 프로필 갱신 실패 시 무시
        }
      } else {
        setProfile(null);
      }

      // 초기화 완료 처리 (INITIAL_SESSION 이벤트)
      if (event === "INITIAL_SESSION") {
        setIsLoading(false);
        setIsInitialized(true);
        clearTimeout(timeout);
      }
    });

    return () => {
      clearTimeout(timeout);
      data.subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

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

  const signOut = useCallback(async () => {
    // 1. Supabase 클라이언트 세션 무효화 (refresh token 폐기 + 내부 상태 정리)
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // 무시
      }
    }
    // 2. React 상태 초기화
    setUser(null);
    setProfile(null);
    setSession(null);
    // 3. 서버 사이드 쿠키 정리 + 리디렉트
    window.location.href = "/api/auth/signout";
  }, [supabase]);

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
