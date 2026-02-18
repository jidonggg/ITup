"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { SITE_CONFIG } from "@/lib/site-config";
import ShareButtons from "@/components/share/ShareButtons";

interface ReferralData {
  code: string;
  referralUrl: string;
  stats: {
    invited: number;
    approved: number;
  };
}

export default function ReferralShareCard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    const fetchReferralCode = async () => {
      try {
        const supabase = createClient();
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;

        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        const res = await fetch("/api/referral/mentor/invite", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          setIsLoading(false);
          return;
        }

        const data: ReferralData = await res.json();
        setReferral(data);
      } catch {
        // Silently fail — card will show loading/empty state
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferralCode();
  }, [user]);

  const handleCopyLink = useCallback(async () => {
    if (!referral) return;

    try {
      await navigator.clipboard.writeText(referral.referralUrl);
      setCopied(true);
      showToast("추천 링크가 복사되었어요.", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = referral.referralUrl;
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
  }, [referral, showToast]);

  // Don't render if not logged in
  if (!user) return null;

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">멘토 추천 프로그램</h3>
          <p className="text-sm text-muted">
            동료 멘토를 추천하면 수수료 2% 감면 3개월
          </p>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Content — after loading */}
      {!isLoading && referral && (
        <>
          {/* Benefit description */}
          <div className="mb-5 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <p className="text-sm leading-relaxed">
              아래 링크를 동료에게 공유하세요. 추천받은 동료가 멘토로
              승인되면, <span className="font-semibold text-primary">나와 동료 모두</span> 플랫폼
              수수료가 <span className="font-semibold text-primary">3개월간 2% 감면</span>됩니다.
            </p>
          </div>

          {/* Referral code */}
          <div className="mb-4">
            <label className="block text-xs text-muted mb-1.5">
              내 추천 코드
            </label>
            <div className="inline-block px-3 py-1.5 bg-secondary rounded-lg text-sm font-mono font-semibold tracking-wider">
              {referral.code}
            </div>
          </div>

          {/* Referral link + Copy button */}
          <div className="mb-5">
            <label className="block text-xs text-muted mb-1.5">
              추천 링크
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={referral.referralUrl}
                className="flex-1 px-3 py-2 bg-secondary border border-card-border rounded-lg text-sm text-muted truncate focus:outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors cursor-pointer whitespace-nowrap"
              >
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="mb-5">
            <label className="block text-xs text-muted mb-1.5">
              공유하기
            </label>
            <ShareButtons
              url={referral.referralUrl}
              title={`${SITE_CONFIG.name} 멘토로 함께해요!`}
              description="게임 업계 멘토링 플랫폼에서 멘토로 활동해 보세요. 추천 링크로 가입하면 수수료 혜택을 받을 수 있어요."
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {referral.stats.invited}
              </p>
              <p className="text-xs text-muted mt-1">추천한 동료 수</p>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-500">
                {referral.stats.approved}
              </p>
              <p className="text-xs text-muted mt-1">승인된 멘토 수</p>
            </div>
          </div>
        </>
      )}

      {/* Error / fallback state — not loading, no referral data */}
      {!isLoading && !referral && (
        <div className="text-center py-6">
          <p className="text-sm text-muted">
            추천 코드를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
