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

  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    // TODO: 디버그 로그 - 관리자 페이지 접근 문제 해결 후 제거
    console.log("[AuthContext] fetchProfile:", { userId, data, error });

    setProfile(data);
  }, [supabase]);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
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

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          try {
            await fetchProfile(session.user.id);
          } catch {
            // 프로필 로드 실패 시 무시 - 인증 자체는 정상 처리
          }
        }
      } catch {
        // 세션 초기화 실패 시 무시 - 미인증 상태로 진행
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
        clearTimeout(timeout);
      }
    };

    initialize();

    // Auth state change listener
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          await fetchProfile(session.user.id);
        } catch {
          // 프로필 갱신 실패 시 무시 - 기존 프로필 유지
        }
      } else {
        setProfile(null);
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

  const signOut = async () => {
    if (!supabase) return;

    try {
      // scope: 'local'로 현재 브라우저 세션만 종료 (쿠키/스토리지 확실히 제거)
      // 'global'은 서버 API 호출이 실패하면 로컬 세션이 남는 문제가 있음
      const { error } = await supabase.auth.signOut({ scope: 'local' });

      if (error) {
        console.error("로그아웃 에러:", error);
      }
    } catch (e) {
      console.error("로그아웃 중 예외:", e);
    } finally {
      // 에러가 발생해도 로컬 상태는 초기화
      setUser(null);
      setProfile(null);
      setSession(null);

      // 로그아웃 후 홈으로 리다이렉트 (full reload로 모든 상태 초기화)
      window.location.href = "/";
    }
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
