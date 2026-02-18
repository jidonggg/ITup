"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { User, Session, SupabaseClient } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Profile } from "@/lib/supabase/types";
import { trackEvent } from "@/lib/analytics/track";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  isConfigured: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
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

    // 첫 번째 시도
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    let profileData = data;

    // 실패 시 토큰 갱신 후 재시도 (INITIAL_SESSION 시 토큰이 아직 갱신되지 않았을 수 있음)
    const PROFILE_RETRY_DELAY_MS = 300;
    if (!profileData && error) {
      await new Promise(resolve => setTimeout(resolve, PROFILE_RETRY_DELAY_MS));
      const { data: retryData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      profileData = retryData;
    }

    if (profileData) {
      // 프로필에 이름이 없고 user_metadata에 이름이 있으면 자동 업데이트
      if (!profileData.name && userMetadataName) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ name: userMetadataName })
          .eq("id", userId);

        if (!updateError) {
          profileData.name = userMetadataName;
        }
      }
      setProfile(profileData);
      // 이름을 localStorage에 캐시 (F5 시 fallback용, 1시간 만료)
      try {
        if (profileData.name) {
          localStorage.setItem("cached_profile_name", profileData.name);
          localStorage.setItem("cached_profile_timestamp", String(Date.now()));
        }
      } catch { /* 무시 */ }
    }
    // fetch 실패 시 기존 profile 유지 (캐시에서 복원된 것 포함)
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id, user.user_metadata?.name);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Supabase 응답 없을 시 안전 장치
    const AUTH_INIT_TIMEOUT_MS = 5000;
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setIsInitialized(true);
    }, AUTH_INIT_TIMEOUT_MS);

    if (!supabase) {
      setIsLoading(false);
      setIsInitialized(true);
      clearTimeout(timeout);
      return;
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // INITIAL_SESSION: 캐시된 프로필로 즉시 표시, DB fetch는 백그라운드
        if (event === "INITIAL_SESSION") {
          try {
            const cachedName = localStorage.getItem("cached_profile_name");
            const cachedTimestamp = localStorage.getItem("cached_profile_timestamp");
            const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간
            const isCacheValid = cachedTimestamp && (Date.now() - Number(cachedTimestamp)) < CACHE_TTL_MS;
            if (cachedName && isCacheValid) {
              setProfile({ id: session.user.id, name: cachedName } as Profile);
            } else {
              // 만료된 캐시 정리
              localStorage.removeItem("cached_profile_name");
              localStorage.removeItem("cached_profile_timestamp");
            }
          } catch { /* 무시 */ }
          setIsLoading(false);
          setIsInitialized(true);
          clearTimeout(timeout);
        }
        // 프로필을 백그라운드에서 fetch (await 없이 → UI 차단 안 함)
        fetchProfile(session.user.id, session.user.user_metadata?.name).catch(() => {});
        // 관리자 여부 체크 (백그라운드)
        fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
          .then(res => res.json())
          .then(data => setIsAdmin(!!data.isAdmin))
          .catch(() => setIsAdmin(false));
      } else {
        setProfile(null);
        setIsAdmin(false);
        if (event === "INITIAL_SESSION") {
          setIsLoading(false);
          setIsInitialized(true);
          clearTimeout(timeout);
        }
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
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (!error) {
      trackEvent({ category: "auth", action: "signup" });
    }
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
    if (!error) {
      trackEvent({ category: "auth", action: "login" });
    }
    return { error: error as Error | null };
  };

  const signOut = useCallback(async () => {
    // 서버 사이드 로그아웃 라우트로 이동
    // 서버에서 Set-Cookie로 쿠키 삭제 + 클라이언트에서 스토리지 정리 + 홈 리디렉트
    window.location.href = "/api/auth/signout";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isInitialized,
        isConfigured,
        isAdmin,
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
