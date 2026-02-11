"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/site-config";

// TossPayments 에러 코드 -> 사용자 친화적 메시지 매핑
const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: "결제가 취소되었어요.",
  PAY_PROCESS_ABORTED: "결제가 중단되었어요.",
  REJECT_CARD_COMPANY: "카드사에서 결제를 거부했어요. 다른 카드로 시도해주세요.",
  EXCEED_MAX_DAILY_PAYMENT_COUNT: "일일 결제 횟수를 초과했어요. 내일 다시 시도해주세요.",
  EXCEED_MAX_PAYMENT_AMOUNT: "결제 한도를 초과했어요. 한도를 확인해주세요.",
  INVALID_CARD_EXPIRATION: "카드 유효기간이 올바르지 않아요.",
  INVALID_STOPPED_CARD: "정지된 카드예요. 다른 카드로 시도해주세요.",
  INVALID_CARD_LOST: "분실 신고된 카드예요. 다른 카드로 시도해주세요.",
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: "할부가 지원되지 않는 카드예요.",
  INVALID_CARD_NUMBER: "카드 번호가 올바르지 않아요.",
  BELOW_MINIMUM_AMOUNT: "최소 결제 금액 미만이에요.",
  DUPLICATED_ORDER_ID: "이미 처리된 주문이에요.",
  UNAUTHORIZED_KEY: "결제 시스템 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
  FORBIDDEN_REQUEST: "결제 요청이 거부되었어요.",
  NOT_FOUND_PAYMENT: "결제 정보를 찾을 수 없어요.",
  NOT_FOUND_PAYMENT_SESSION: "결제 세션이 만료되었어요. 다시 시도해주세요.",
  FAILED_PAYMENT_INTERNAL_SYSTEM_PROCESSING: "결제 시스템 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
  FAILED_INTERNAL_SYSTEM_PROCESSING: "결제 시스템 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
  UNKNOWN_PAYMENT_ERROR: "알 수 없는 결제 오류가 발생했어요.",
};

function PaymentFailContent() {
  const searchParams = useSearchParams();

  const code = searchParams.get("code");
  const message = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  // 사용자 친화적 에러 메시지 결정
  const userFriendlyMessage = useMemo(() => {
    if (code && ERROR_MESSAGES[code]) {
      return ERROR_MESSAGES[code];
    }
    // URL 디코딩된 메시지가 있으면 사용
    if (message) {
      try {
        return decodeURIComponent(message);
      } catch {
        return message;
      }
    }
    return "결제 처리 중 문제가 발생했어요.";
  }, [code, message]);

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
          {userFriendlyMessage}
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
          <a href={`mailto:${SITE_CONFIG.contactEmail.support}`} className="text-primary hover:underline">
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
