"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function FreeTrialBanner() {
  const { user } = useAuth();
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const checkEligibility = async () => {
      try {
        const headers: Record<string, string> = {};
        if (user) {
          const supabase = createClient();
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) {
            headers["Authorization"] = `Bearer ${data.session.access_token}`;
          }
        }
        const response = await fetch("/api/free-trial/check", { headers });
        const data = await response.json();
        setIsEligible(data.eligible);
      } catch {
        // Fail-Open: 에러 시에도 배너 표시 (비로그인 사용자 포함)
        setIsEligible(true);
      }
    };

    const fetchTopMentor = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("mentors")
          .select("id")
          .eq("is_approved", true)
          .eq("is_active", true)
          .order("rating", { ascending: false })
          .limit(1)
          .single();
        if (data) setMentorId(data.id);
      } catch {
        // 멘토 조회 실패 시 /mentors로 이동하도록 null 유지
      }
    };

    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([checkEligibility(), fetchTopMentor()]);
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  // 로딩 중에는 아무것도 렌더링하지 않음 (깜빡임 방지)
  if (isLoading) return null;
  if (isEligible === false) return null;

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-accent/15 via-primary/8 to-accent/15 backdrop-blur-sm border border-accent/20 rounded-2xl p-6 md:p-8 shadow-lg shadow-accent/[0.04]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent/8 rounded-full -translate-y-1/2 translate-x-1/2 blur-xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/8 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center flex-shrink-0 shadow-md shadow-accent/10">
                <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  15분 무료 멘토링 체험
                </h3>
                <p className="text-sm text-muted">
                  첫 멘토링이 고민되시나요? 무료로 먼저 체험해 보세요!
                </p>
              </div>
            </div>
            <Link
              href={mentorId ? `/free-trial/${mentorId}` : "/mentors"}
              className="shine-effect px-7 py-3 bg-gradient-to-r from-accent to-primary text-white font-semibold rounded-full hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-300 whitespace-nowrap"
            >
              무료 체험 신청
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
