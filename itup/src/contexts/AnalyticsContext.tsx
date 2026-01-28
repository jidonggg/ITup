"use client";

import { createContext, useContext, useEffect, useRef, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "./AuthContext";

interface AnalyticsContextType {
  trackEvent: (eventType: string, eventName: string, eventData?: Record<string, unknown>) => void;
  trackClick: (elementName: string, elementData?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

// 세션 ID 생성/가져오기
function getSessionId(): string {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

// 디바이스 정보 파싱
function getDeviceInfo() {
  if (typeof window === "undefined") return {};

  const ua = navigator.userAgent;

  let deviceType = "desktop";
  if (/Mobi|Android/i.test(ua)) deviceType = "mobile";
  else if (/Tablet|iPad/i.test(ua)) deviceType = "tablet";

  let browser = "unknown";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  let os = "unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone")) os = "iOS";

  return { deviceType, browser, os, userAgent: ua };
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const pageStartTime = useRef<number>(0);
  const lastPath = useRef<string>("");
  const sessionInitialized = useRef<boolean>(false);

  // 체류시간 저장 함수 (useCallback으로 메모이제이션)
  const saveDuration = useCallback(async (path: string, duration: number) => {
    if (!isSupabaseConfigured() || duration < 1) return;

    const sessionId = getSessionId();
    const supabase = createClient();

    try {
      // 가장 최근 페이지뷰의 duration 업데이트
      const { data } = await supabase
        .from("page_views")
        .select("id")
        .eq("session_id", sessionId)
        .eq("path", path)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        await supabase
          .from("page_views")
          .update({ duration_seconds: duration })
          .eq("id", data.id);
      }
    } catch {
      // 무시
    }
  }, []);

  // 페이지 시작 시간 초기화
  useEffect(() => {
    pageStartTime.current = Date.now();
  }, []);

  // 세션 초기화
  useEffect(() => {
    if (!isSupabaseConfigured() || sessionInitialized.current) return;

    const initSession = async () => {
      const sessionId = getSessionId();
      const deviceInfo = getDeviceInfo();
      const supabase = createClient();

      try {
        await supabase.from("sessions").upsert({
          id: sessionId,
          user_id: user?.id || null,
          device_type: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          page_count: 0,
        }, { onConflict: "id" });

        sessionInitialized.current = true;
      } catch (error) {
        console.error("Session init error:", error);
      }
    };

    initSession();
  }, [user]);

  // 페이지뷰 추적
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (pathname === lastPath.current) return;

    const trackPageView = async () => {
      // 이전 페이지 체류시간 저장
      if (lastPath.current) {
        const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
        await saveDuration(lastPath.current, duration);
      }

      // 새 페이지뷰 기록
      const sessionId = getSessionId();
      const deviceInfo = getDeviceInfo();
      const supabase = createClient();

      try {
        await supabase.from("page_views").insert({
          session_id: sessionId,
          user_id: user?.id || null,
          path: pathname,
          referrer: document.referrer || null,
          user_agent: deviceInfo.userAgent,
        });

        // 세션 페이지 카운트 증가
        try {
          await supabase.rpc("increment_page_count", { session_id_param: sessionId });
        } catch {
          // RPC가 없으면 무시
        }
      } catch (error) {
        console.error("Page view tracking error:", error);
      }

      lastPath.current = pathname;
      pageStartTime.current = Date.now();
    };

    trackPageView();
  }, [pathname, user, saveDuration]);

  // 페이지 떠날 때 체류시간 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (lastPath.current) {
        const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
        // Beacon API로 비동기 전송
        if (navigator.sendBeacon && isSupabaseConfigured()) {
          const data = JSON.stringify({
            path: lastPath.current,
            duration,
            session_id: getSessionId(),
          });
          navigator.sendBeacon("/api/analytics/duration", data);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 이벤트 추적
  const trackEvent = async (eventType: string, eventName: string, eventData?: Record<string, unknown>) => {
    if (!isSupabaseConfigured()) return;

    const sessionId = getSessionId();
    const supabase = createClient();

    try {
      await supabase.from("analytics_events").insert({
        session_id: sessionId,
        user_id: user?.id || null,
        event_type: eventType,
        event_name: eventName,
        event_data: eventData || null,
        path: pathname,
      });
    } catch (error) {
      console.error("Event tracking error:", error);
    }
  };

  // 클릭 추적 (간편 함수)
  const trackClick = (elementName: string, elementData?: Record<string, unknown>) => {
    trackEvent("click", elementName, elementData);
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent, trackClick }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
