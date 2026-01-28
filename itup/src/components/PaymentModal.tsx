"use client";

import { useState, useEffect } from "react";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";
import { useAuth } from "@/contexts/AuthContext";
import { PlanInfo } from "@/lib/payment/types";
import { loadTossPayments, TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";

// 테스트용 클라이언트 키 (실제 배포 시 환경변수로 변경)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanInfo | null;
}

export default function PaymentModal({ isOpen, onClose, plan }: PaymentModalProps) {
  const { user, profile } = useAuth();
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen || !plan) return;

    const initPayment = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        const customerKey = user?.id || `guest_${Date.now()}`;

        const widgetsInstance = tossPayments.widgets({
          customerKey,
        });

        await widgetsInstance.setAmount({
          currency: "KRW",
          value: plan.price,
        });

        setWidgets(widgetsInstance);
        setIsLoading(false);

        // 위젯 렌더링
        await widgetsInstance.renderPaymentMethods({
          selector: "#payment-methods",
          variantKey: "DEFAULT",
        });

        await widgetsInstance.renderAgreement({
          selector: "#payment-agreement",
          variantKey: "AGREEMENT",
        });

      } catch (err) {
        console.error("Payment init error:", err);
        setError("결제 시스템을 불러오는데 실패했습니다.");
        setIsLoading(false);
      }
    };

    initPayment();

    return () => {
      setWidgets(null);
    };
  }, [isOpen, plan, user]);

  const handlePayment = async () => {
    if (!widgets || !plan) return;

    if (!agreedToTerms) {
      alert("결제 약관에 동의해주세요.");
      return;
    }

    try {
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await widgets.requestPayment({
        orderId,
        orderName: `ITup ${plan.name} 플랜`,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: user?.email || undefined,
        customerName: profile?.name || undefined,
      });
    } catch (err) {
      console.error("Payment error:", err);
      alert("결제 요청 중 오류가 발생했습니다.");
    }
  };

  const handleClose = () => {
    setAgreedToTerms(false);
    setError(null);
    onClose();
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(139,92,246,0.4)]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-foreground transition-colors cursor-pointer z-10"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {/* Plan Info */}
          <div className="mb-6 pb-6 border-b border-card-border">
            <h2 className="text-2xl font-bold mb-2">결제하기</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{plan.name} 플랜</p>
                <p className="text-sm text-muted">{plan.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {plan.price.toLocaleString()}원
                </p>
                <p className="text-sm text-muted">/{plan.period}</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center">
              <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-muted">결제 시스템 로딩중...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm cursor-pointer"
              >
                다시 시도
              </button>
            </div>
          ) : (
            <>
              {/* 결제 수단 선택 */}
              <div id="payment-methods" className="mb-4" />

              {/* 약관 동의 */}
              <div id="payment-agreement" className="mb-4" />

              {/* 추가 약관 동의 */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-primary"
                />
                <span className="text-sm text-muted">
                  위 상품의 구매 조건을 확인하였으며,{" "}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    이용약관
                  </a>
                  {" "}및{" "}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    개인정보처리방침
                  </a>
                  에 동의합니다.
                </span>
              </label>

              {/* 결제 버튼 */}
              <button
                onClick={handlePayment}
                disabled={!agreedToTerms}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {plan.price.toLocaleString()}원 결제하기
              </button>

              <p className="mt-4 text-xs text-muted text-center">
                결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
