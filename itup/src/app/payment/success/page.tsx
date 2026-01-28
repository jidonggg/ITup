"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentKey = searchParams.get("paymentKey");
  const orderId = searchParams.get("orderId");
  const amount = searchParams.get("amount");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentKey || !orderId || !amount) {
        setError("결제 정보가 올바르지 않습니다.");
        setIsVerifying(false);
        return;
      }

      try {
        // 실제 운영 환경에서는 서버에서 결제 검증 API를 호출해야 합니다.
        // 여기서는 클라이언트에서 간단히 처리합니다.

        // TODO: 서버 API 호출하여 결제 검증
        // const response = await fetch('/api/payment/verify', {
        //   method: 'POST',
        //   body: JSON.stringify({ paymentKey, orderId, amount }),
        // });

        // 테스트 모드에서는 바로 성공 처리
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsVerified(true);
        setIsVerifying(false);
      } catch {
        setError("결제 검증 중 오류가 발생했습니다.");
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [paymentKey, orderId, amount]);

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
          <h1 className="text-2xl font-bold mb-2">결제가 완료되었습니다!</h1>
          <p className="text-muted mb-6">
            커피챗 멘토링 서비스를 이용해 주셔서 감사합니다.
            <br />
            결제 확인 이메일이 발송되었습니다.
          </p>

          <div className="bg-card-bg border border-card-border rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium mb-3">결제 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">주문번호</span>
                <span className="font-mono">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">결제금액</span>
                <span className="font-semibold text-primary">
                  {Number(amount).toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

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
