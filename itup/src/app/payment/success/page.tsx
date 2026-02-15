"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mentorContact, setMentorContact] = useState<{ name: string; contactMethod: string } | null>(null);
  const isProcessedRef = useRef(false);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");
  const consultationId = searchParams.get("consultationId");
  const discountCode = searchParams.get("discountCode");

  useEffect(() => {
    // ref로 중복 호출 방지 (StrictMode 재실행에도 유지)
    if (isProcessedRef.current) return;
    isProcessedRef.current = true;

    let isMounted = true;

    const verifyPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        if (isMounted) {
          setError("결제 정보가 올바르지 않아요.");
          setIsVerifying(false);
        }
        return;
      }

      try {
        // Supabase 세션에서 JWT 토큰 가져오기
        let accessToken = "";
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          accessToken = session?.access_token || "";
        }

        // 서버 API 호출하여 결제 검증 및 승인 (consultationId, discountCode 전달)
        const confirmParams = new URLSearchParams();
        if (consultationId) confirmParams.set("consultationId", consultationId);
        if (discountCode) confirmParams.set("discountCode", discountCode);
        const confirmQs = confirmParams.toString();
        const confirmUrl = `/api/payment/confirm${confirmQs ? `?${confirmQs}` : ""}`;

        const response = await fetch(confirmUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        if (!isMounted) return;

        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "결제 검증에 실패했어요.");
          setIsVerifying(false);
          return;
        }

        setIsVerified(true);

        // Fetch mentor contact method if consultationId exists
        if (consultationId && isSupabaseConfigured()) {
          try {
            const supabase = createClient();
            const { data: consultation } = await supabase
              .from("consultations")
              .select("mentor_id")
              .eq("id", consultationId)
              .single();

            if (consultation?.mentor_id && isMounted) {
              const { data: mentor } = await supabase
                .from("mentors")
                .select("name, contact_method")
                .eq("id", consultation.mentor_id)
                .single();

              if (mentor?.contact_method && isMounted) {
                setMentorContact({
                  name: mentor.name,
                  contactMethod: mentor.contact_method,
                });
              }
            }
          } catch {
            // Non-critical: mentor contact fetch failure doesn't block success
          }
        }

        if (isMounted) setIsVerifying(false);
      } catch {
        if (isMounted) {
          setError("결제 검증 중 오류가 발생했어요.");
          setIsVerifying(false);
        }
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [paymentKey, orderId, amount, consultationId]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 mx-auto mb-4 border-3 border-primary border-t-transparent rounded-full" />
          <h1 className="text-xl font-semibold mb-2">결제 확인 중...</h1>
          <p className="text-muted">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">결제 오류</h1>
          <p className="text-muted mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-full font-medium"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">결제가 완료되었어요!</h1>
          <p className="text-muted mb-6">
            커피챗을 이용해 주셔서 감사해요.
            <br />
            곧 확인 이메일을 보내드릴게요.
          </p>

          <div className="bg-white/60 backdrop-blur-sm border border-card-border/50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium mb-3">결제 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">주문번호</span>
                <span className="font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">결제금액</span>
                <span className="font-semibold text-primary">
                  {amount ? `${Number(amount).toLocaleString()}원` : "금액 확인 중"}
                </span>
              </div>
            </div>
          </div>

          {mentorContact && (
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4 mb-6 text-left">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                멘토 연락 방법
              </h3>
              <p className="text-sm text-muted mb-1">{mentorContact.name} 멘토님</p>
              <p className="text-sm text-foreground">{mentorContact.contactMethod}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mypage"
              className="px-6 py-3 bg-primary text-white rounded-full font-medium"
            >
              마이페이지로 이동
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-card-border text-foreground rounded-full font-medium"
            >
              홈으로 이동
            </Link>
          </div>

          {/* Upsell CTA Section */}
          <div className="mt-8 pt-8 border-t border-card-border space-y-4">
            <Link
              href="/mentors"
              className="block bg-card-bg border border-card-border rounded-xl p-4 text-left transition-all hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                <div>
                  <p className="font-semibold text-foreground">다음 세션도 예약하기</p>
                  <p className="text-sm text-muted">다른 멘토도 만나보세요</p>
                </div>
                <svg className="w-5 h-5 text-primary ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
