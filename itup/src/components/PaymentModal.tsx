"use client";

import { useState, useEffect } from "react";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { BundleInfo, BundleType } from "@/lib/payment/types";
import { loadTossPayments, TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { ProductIcon } from "@/components/icons";

// 토스페이먼츠 클라이언트 키 (환경변수 필수)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

const BUNDLE_PREFIX_MAP: Record<BundleType, string> = {
  starter: "BUNDLE_STARTER",
  allinone: "BUNDLE_ALLINONE",
  full: "BUNDLE_FULL",
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: BundleInfo | null;
}

export default function PaymentModal({ isOpen, onClose, bundle }: PaymentModalProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen || !bundle) return;

    const initPayment = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!TOSS_CLIENT_KEY) {
          setError("결제 시스템이 설정되지 않았어요.");
          setIsLoading(false);
          return;
        }

        const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
        const customerKey = user?.id || `guest_${Date.now()}`;

        const widgetsInstance = tossPayments.widgets({
          customerKey,
        });

        await widgetsInstance.setAmount({
          currency: "KRW",
          value: bundle.price,
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
        setError("결제 시스템을 불러오는데 실패했어요.");
        setIsLoading(false);
      }
    };

    initPayment();

    return () => {
      setWidgets(null);
    };
  }, [isOpen, bundle, user]);

  const handlePayment = async () => {
    if (!widgets || !bundle || isProcessing) return;

    setIsProcessing(true);
    try {
      const prefix = BUNDLE_PREFIX_MAP[bundle.id];
      const uid = user?.id || "guest";
      const orderId = `${prefix}_${uid}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

      await widgets.requestPayment({
        orderId,
        orderName: `커피챗 ${bundle.name}`,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: user?.email || undefined,
        customerName: profile?.name || undefined,
      });
    } catch (err) {
      showToast("결제 요청 중 오류가 발생했어요.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!isOpen || !bundle) return null;

  const discountPercent = Math.round((1 - bundle.price / bundle.originalPrice) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="결제">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(160,113,79,0.25)]">
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
          {/* Bundle Info */}
          <div className="mb-6 pb-6 border-b border-card-border">
            <h2 className="text-2xl font-bold mb-2">번들 결제</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold"><ProductIcon name={bundle.icon} className="w-5 h-5 inline-block" /> {bundle.name}</p>
                <p className="text-sm text-muted">{bundle.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {bundle.includes.map((item, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-2xl font-bold text-primary">
                  {bundle.price.toLocaleString()}원
                </p>
                <p className="text-xs text-muted line-through">
                  {bundle.originalPrice.toLocaleString()}원
                </p>
                <span className="text-xs font-bold text-red-500">{discountPercent}% 할인</span>
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
                onClick={handleClose}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm cursor-pointer"
              >
                닫기
              </button>
            </div>
          ) : (
            <>
              {/* 결제 수단 선택 */}
              <div id="payment-methods" className="mb-4" />

              {/* 약관 동의 (토스페이먼츠 제공) */}
              <div id="payment-agreement" className="mb-4" />

              {/* 서비스 약관 안내 */}
              <p className="text-xs text-muted mb-6">
                결제 진행 시{" "}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  이용약관
                </a>
                {" "}및{" "}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  개인정보처리방침
                </a>
                에 동의한 것으로 간주돼요.
              </p>

              {/* 결제 버튼 */}
              <button
                onClick={handlePayment}
                disabled={isLoading || isProcessing}
                className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    결제 처리 중...
                  </span>
                ) : (
                  `${bundle.price.toLocaleString()}원 결제하기`
                )}
              </button>

              <p className="mt-4 text-xs text-muted text-center">
                결제는 토스페이먼츠를 통해 안전하게 처리돼요.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
