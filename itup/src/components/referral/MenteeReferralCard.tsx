"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { SITE_CONFIG } from "@/lib/site-config";
import ShareButtons from "@/components/share/ShareButtons";

interface ReferralData {
  code: string;
  referralUrl: string;
  invitedCount: number;
  earnedCredits: number;
}

const LOCALSTORAGE_KEY = "mentee_referral_data";

export default function MenteeReferralCard() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const generateReferralCode = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Try API first if Supabase is configured
      if (isSupabaseConfigured()) {
        const res = await fetch("/api/referral/mentee/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          const newData: ReferralData = {
            code: data.code,
            referralUrl: data.referralUrl,
            invitedCount: data.invitedCount ?? 0,
            earnedCredits: data.earnedCredits ?? 0,
          };
          setReferralData(newData);

          // Cache in localStorage as backup
          try {
            localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newData));
          } catch { /* ignore */ }

          setIsLoading(false);
          return;
        }
      }

      // Fallback: localStorage-based code generation
      try {
        const cached = localStorage.getItem(LOCALSTORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as ReferralData;
          if (parsed.code) {
            setReferralData(parsed);
            setIsLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }

      // Generate a new code locally
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let randomPart = "";
      for (let i = 0; i < 6; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const code = `REF${randomPart}`;
      const baseUrl = SITE_CONFIG.url.replace(/\/$/, "");
      const referralUrl = `${baseUrl}/refer/${code}`;

      const newData: ReferralData = {
        code,
        referralUrl,
        invitedCount: 0,
        earnedCredits: 0,
      };

      try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newData));
      } catch { /* ignore */ }

      setReferralData(newData);
    } catch {
      // Last resort: try localStorage
      try {
        const cached = localStorage.getItem(LOCALSTORAGE_KEY);
        if (cached) {
          setReferralData(JSON.parse(cached) as ReferralData);
        }
      } catch { /* ignore */ }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    generateReferralCode();
  }, [generateReferralCode]);

  const handleCopyCode = useCallback(async () => {
    if (!referralData) return;

    try {
      await navigator.clipboard.writeText(referralData.referralUrl);
      setCopied(true);
      showToast("추천 링크가 복사되었어요.", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = referralData.referralUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      showToast("추천 링크가 복사되었어요.", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralData, showToast]);

  if (!user) return null;

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">친구 추천 프로그램</h3>
          <p className="text-xs text-muted">
            친구를 초대하고 크레딧을 받으세요
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : referralData ? (
        <>
          {/* Referral Code Display */}
          <div className="mb-5 p-4 bg-background border border-card-border rounded-xl">
            <p className="text-xs text-muted mb-2">내 추천 코드</p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono font-bold text-lg text-primary tracking-wider">
                {referralData.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    복사됨
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    링크 복사
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Referral Link (truncated) */}
          <div className="mb-5">
            <p className="text-xs text-muted mb-2">추천 링크</p>
            <div className="p-3 bg-background border border-card-border rounded-lg text-xs text-muted font-mono truncate">
              {referralData.referralUrl}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="mb-6">
            <p className="text-xs text-muted mb-2">공유하기</p>
            <ShareButtons
              url={referralData.referralUrl}
              title="커피챗 - 게임 업계 멘토링 추천"
              description={`${profile?.name || "친구"}님이 커피챗을 추천했어요. 가입하면 20% 할인 혜택을 받을 수 있어요!`}
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-primary">
                {referralData.invitedCount}
              </p>
              <p className="text-xs text-muted mt-1">추천한 친구 수</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-primary">
                {referralData.earnedCredits.toLocaleString()}
              </p>
              <p className="text-xs text-muted mt-1">적립된 크레딧 (원)</p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-5 pt-5 border-t border-card-border">
            <p className="text-xs font-medium text-foreground mb-3">추천 프로그램 안내</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">1</span>
                </div>
                <p className="text-xs text-muted">추천 링크를 친구에게 공유하세요</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">2</span>
                </div>
                <p className="text-xs text-muted">친구가 가입하면 첫 결제 20% 할인 (WELCOME20)</p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-primary">3</span>
                </div>
                <p className="text-xs text-muted">친구가 첫 결제를 완료하면 5,000원 크레딧 적립</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-muted mb-3">추천 코드를 생성할 수 없어요.</p>
          <button
            onClick={() => {
              setIsLoading(true);
              generateReferralCode();
            }}
            className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
