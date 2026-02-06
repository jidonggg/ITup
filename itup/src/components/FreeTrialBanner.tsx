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
        <div className="relative overflow-hidden bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 border border-accent/30 rounded-2xl p-6 md:p-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🎁</span>
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
              className="px-6 py-3 bg-gradient-to-r from-accent to-primary text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-accent/30 transition-all whitespace-nowrap"
            >
              무료 체험 신청
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
