"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function PaymentFailContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">결제에 실패했어요</h1>
        <p className="text-muted mb-6">
          {message || "결제 처리 중 문제가 발생했어요."}
          <br />
          다시 시도해 주세요.
        </p>

        {(code || orderId) && (
          <div className="bg-card-bg border border-card-border rounded-xl p-4 mb-6 text-left">
            <h3 className="font-medium mb-3 text-sm text-muted">오류 정보</h3>
            <div className="space-y-2 text-sm">
              {code && (
                <div className="flex justify-between">
                  <span className="text-muted">에러 코드</span>
                  <span className="font-mono text-red-500">{code}</span>
                </div>
              )}
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-muted">주문번호</span>
                  <span className="font-mono">{orderId}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/#pricing"
            className="px-6 py-3 bg-primary text-white rounded-full font-medium"
          >
            다시 시도하기
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-card-border text-foreground rounded-full font-medium"
          >
            홈으로 이동
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted">
          문제가 계속되면{" "}
          <a href="mailto:support@itup.kr" className="text-primary hover:underline">
            고객센터
          </a>
          로 문의해 주세요.
        </p>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}
