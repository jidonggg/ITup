"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Booking,
  Mentor,
  Product,
  SessionConfirmation,
} from "@/lib/supabase/types";
import { PRODUCT_INFO, AUTO_COMPLETE_HOURS } from "@/lib/constants";
import FreeTrialConversionCTA from "@/components/FreeTrialConversionCTA";
import { trackFreeTrialCompleted } from "@/lib/analytics/conversion";

// =============================================
// Types
// =============================================

type UserRole = "mentor" | "mentee";

type MentorConfirmOption = "completed" | "mentee_noshow" | "issue";
type MenteeConfirmOption = "completed" | "mentor_noshow" | "issue";

interface ConfirmOption {
  value: string;
  label: string;
  description: string;
  icon: string;
}

// =============================================
// Constants
// =============================================

const MENTOR_OPTIONS: ConfirmOption[] = [
  {
    value: "completed",
    label: "완료",
    description: "세션이 정상적으로 완료되었습니다.",
    icon: "check-circle",
  },
  {
    value: "mentee_noshow",
    label: "멘티 노쇼",
    description: "멘티가 약속 시간에 나타나지 않았습니다.",
    icon: "user-x",
  },
  {
    value: "issue",
    label: "문제 발생",
    description: "세션 진행 중 문제가 발생했습니다.",
    icon: "alert-triangle",
  },
];

const MENTEE_OPTIONS: ConfirmOption[] = [
  {
    value: "completed",
    label: "완료",
    description: "세션이 정상적으로 완료되었습니다.",
    icon: "check-circle",
  },
  {
    value: "mentor_noshow",
    label: "멘토 노쇼",
    description: "멘토가 약속 시간에 나타나지 않았습니다.",
    icon: "user-x",
  },
  {
    value: "issue",
    label: "문제 발생",
    description: "세션 진행 중 문제가 발생했습니다.",
    icon: "alert-triangle",
  },
];

// =============================================
// Icon Components
// =============================================

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UserXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12l4-4m0 4l-4-4" />
    </svg>
  );
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function getOptionIcon(icon: string, className?: string) {
  switch (icon) {
    case "check-circle":
      return <CheckCircleIcon className={className} />;
    case "user-x":
      return <UserXIcon className={className} />;
    case "alert-triangle":
      return <AlertTriangleIcon className={className} />;
    default:
      return null;
  }
}

// =============================================
// Confirmation Status Display
// =============================================

function ConfirmationStatusCard({
  confirmation,
  userRole,
}: {
  confirmation: SessionConfirmation;
  userRole: UserRole;
}) {
  const mentorDone = confirmation.mentor_confirmed !== null;
  const menteeDone = confirmation.mentee_confirmed !== null;

  const getStatusLabel = (value: string | null): string => {
    if (!value) return "미확인";
    switch (value) {
      case "completed":
        return "완료";
      case "mentee_noshow":
        return "멘티 노쇼";
      case "mentor_noshow":
        return "멘토 노쇼";
      case "issue":
        return "문제 발생";
      default:
        return value;
    }
  };

  const getStatusColor = (value: string | null): string => {
    if (!value) return "bg-gray-500/20 text-gray-500";
    switch (value) {
      case "completed":
        return "bg-green-500/20 text-green-500";
      case "mentee_noshow":
      case "mentor_noshow":
        return "bg-red-500/20 text-red-500";
      case "issue":
        return "bg-yellow-500/20 text-yellow-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6">
      <h3 className="font-semibold text-lg mb-4">확인 현황</h3>

      <div className="space-y-4">
        {/* Mentor status */}
        <div className="flex items-center justify-between p-3 bg-background rounded-xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                mentorDone ? "bg-green-500/20" : "bg-gray-500/20"
              }`}
            >
              {mentorDone ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <ClockIcon className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                멘토 확인
                {userRole === "mentor" && <span className="text-primary ml-1">(나)</span>}
              </p>
              {mentorDone && confirmation.mentor_confirmed_at && (
                <p className="text-xs text-muted">
                  {format(new Date(confirmation.mentor_confirmed_at), "M월 d일 HH:mm", {
                    locale: ko,
                  })}
                </p>
              )}
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
              confirmation.mentor_confirmed
            )}`}
          >
            {getStatusLabel(confirmation.mentor_confirmed)}
          </span>
        </div>

        {/* Mentee status */}
        <div className="flex items-center justify-between p-3 bg-background rounded-xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                menteeDone ? "bg-green-500/20" : "bg-gray-500/20"
              }`}
            >
              {menteeDone ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <ClockIcon className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                멘티 확인
                {userRole === "mentee" && <span className="text-primary ml-1">(나)</span>}
              </p>
              {menteeDone && confirmation.mentee_confirmed_at && (
                <p className="text-xs text-muted">
                  {format(new Date(confirmation.mentee_confirmed_at), "M월 d일 HH:mm", {
                    locale: ko,
                  })}
                </p>
              )}
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
              confirmation.mentee_confirmed
            )}`}
          >
            {getStatusLabel(confirmation.mentee_confirmed)}
          </span>
        </div>
      </div>

      {/* Notes */}
      {confirmation.mentor_note && (
        <div className="mt-4 p-3 bg-background rounded-xl">
          <p className="text-xs text-muted mb-1">멘토 메모</p>
          <p className="text-sm">{confirmation.mentor_note}</p>
        </div>
      )}
      {confirmation.mentee_note && (
        <div className="mt-3 p-3 bg-background rounded-xl">
          <p className="text-xs text-muted mb-1">멘티 메모</p>
          <p className="text-sm">{confirmation.mentee_note}</p>
        </div>
      )}
    </div>
  );
}

// =============================================
// Success State
// =============================================

function BothConfirmedSuccess({ confirmation }: { confirmation: SessionConfirmation }) {
  return (
    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-green-600 mb-2">세션 완료 확인!</h3>
      <p className="text-sm text-muted">
        양측 모두 세션 완료를 확인했습니다. 정산이 진행될 예정입니다.
      </p>
      {confirmation.resolved_at && (
        <p className="text-xs text-muted mt-2">
          확정일: {format(new Date(confirmation.resolved_at), "yyyy년 M월 d일 HH:mm", { locale: ko })}
        </p>
      )}
    </div>
  );
}

// =============================================
// Dispute Notice
// =============================================

function DisputeNotice({ confirmation }: { confirmation: SessionConfirmation }) {
  const isResolved = confirmation.resolved_at !== null;

  const getMentorStatusLabel = (value: string | null): string => {
    switch (value) {
      case "completed":
        return "완료";
      case "mentee_noshow":
        return "멘티 노쇼";
      case "issue":
        return "문제 발생";
      default:
        return value || "미확인";
    }
  };

  const getMenteeStatusLabel = (value: string | null): string => {
    switch (value) {
      case "completed":
        return "완료";
      case "mentor_noshow":
        return "멘토 노쇼";
      case "issue":
        return "문제 발생";
      default:
        return value || "미확인";
    }
  };

  return (
    <div className={`${isResolved ? "bg-gray-500/5 border-gray-500/20" : "bg-red-500/5 border-red-500/20"} border rounded-2xl p-6`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full ${isResolved ? "bg-gray-500/20" : "bg-red-500/20"} flex items-center justify-center shrink-0`}>
          <AlertTriangleIcon className={`w-6 h-6 ${isResolved ? "text-gray-500" : "text-red-500"}`} />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${isResolved ? "text-gray-600" : "text-red-600"} mb-1`}>
            {isResolved ? "분쟁 처리 완료" : "확인 내용 불일치"}
          </h3>
          <p className="text-sm text-muted mb-3">
            {isResolved
              ? "관리자가 분쟁을 검토하고 처리를 완료했습니다."
              : "멘토와 멘티의 세션 확인 내용이 일치하지 않습니다. 관리자가 확인 후 처리할 예정입니다."}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted w-16">멘토:</span>
              <span className="font-medium">
                {getMentorStatusLabel(confirmation.mentor_confirmed)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted w-16">멘티:</span>
              <span className="font-medium">
                {getMenteeStatusLabel(confirmation.mentee_confirmed)}
              </span>
            </div>
            {isResolved && confirmation.final_status && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-card-border">
                <span className="text-muted w-16">최종:</span>
                <span className="font-medium text-primary">
                  {confirmation.final_status === "completed"
                    ? "완료"
                    : confirmation.final_status === "mentee_noshow"
                      ? "멘티 노쇼"
                      : confirmation.final_status === "mentor_noshow"
                        ? "멘토 노쇼"
                        : "분쟁"}
                </span>
              </div>
            )}
          </div>
          {!isResolved && (
            <p className="text-xs text-muted mt-3">
              문의 사항이 있으시면 고객센터로 연락해주세요.
            </p>
          )}
          {isResolved && confirmation.resolved_at && (
            <p className="text-xs text-muted mt-3">
              처리일: {format(new Date(confirmation.resolved_at), "yyyy년 M월 d일 HH:mm", { locale: ko })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// Auto-Complete Notice
// =============================================

function AutoCompleteNotice({ scheduledAt }: { scheduledAt: string }) {
  const deadline = new Date(
    new Date(scheduledAt).getTime() + AUTO_COMPLETE_HOURS * 60 * 60 * 1000
  );
  const now = new Date();
  const remaining = deadline.getTime() - now.getTime();
  const remainingHours = Math.ceil(remaining / (1000 * 60 * 60));
  const isExpired = remaining <= 0;

  // 자동 완료 시간이 지났으면 다른 메시지 표시
  if (isExpired) {
    return (
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <ClockIcon className="w-4.5 h-4.5 text-yellow-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-yellow-600 mb-0.5">자동 완료 대기 중</p>
          <p className="text-xs text-muted leading-relaxed">
            자동 완료 기한이 지났습니다. 곧 자동으로 &quot;완료&quot; 처리될 예정입니다.
            <br />
            문제가 있다면 빠르게 확인을 제출해주세요.
          </p>
          <p className="text-xs text-muted mt-1">
            자동 완료 예정:{" "}
            {format(deadline, "yyyy년 M월 d일 HH:mm", { locale: ko })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
        <ClockIcon className="w-4.5 h-4.5 text-blue-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-blue-600 mb-0.5">자동 완료 안내</p>
        <p className="text-xs text-muted leading-relaxed">
          세션 종료 후 {AUTO_COMPLETE_HOURS}시간 내 응답이 없으면 자동으로 &quot;완료&quot;
          처리됩니다.
          {remainingHours > 0 && (
            <span className="font-medium text-blue-600">
              {" "}
              (남은 시간: 약 {remainingHours}시간)
            </span>
          )}
        </p>
        <p className="text-xs text-muted mt-1">
          자동 완료 기한:{" "}
          {format(deadline, "yyyy년 M월 d일 HH:mm", { locale: ko })}
        </p>
      </div>
    </div>
  );
}

// =============================================
// Confirmation Form
// =============================================

function ConfirmationForm({
  userRole,
  onSubmit,
  isSubmitting,
}: {
  userRole: UserRole;
  onSubmit: (status: string, note: string) => void;
  isSubmitting: boolean;
}) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const options = userRole === "mentor" ? MENTOR_OPTIONS : MENTEE_OPTIONS;

  const handleSubmit = () => {
    if (!selectedStatus) return;
    onSubmit(selectedStatus, note.trim());
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-6">
      <h3 className="font-semibold text-lg mb-2">세션 확인</h3>
      <p className="text-sm text-muted mb-5">
        세션이 어떻게 진행되었는지 선택해주세요.
      </p>

      {/* Options */}
      <div className="space-y-3 mb-5">
        {options.map((option) => {
          const isSelected = selectedStatus === option.value;
          return (
            <button
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                isSelected
                  ? option.value === "completed"
                    ? "border-green-500 bg-green-500/5"
                    : option.value === "issue"
                      ? "border-yellow-500 bg-yellow-500/5"
                      : "border-red-500 bg-red-500/5"
                  : "border-card-border hover:border-primary/30 bg-background"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected
                      ? option.value === "completed"
                        ? "bg-green-500/20"
                        : option.value === "issue"
                          ? "bg-yellow-500/20"
                          : "bg-red-500/20"
                      : "bg-secondary"
                  }`}
                >
                  {getOptionIcon(
                    option.icon,
                    `w-5 h-5 ${
                      isSelected
                        ? option.value === "completed"
                          ? "text-green-500"
                          : option.value === "issue"
                            ? "text-yellow-500"
                            : "text-red-500"
                        : "text-muted"
                    }`
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium ${
                      isSelected ? "text-foreground" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{option.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-primary bg-primary" : "border-card-border"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Note */}
      <div className="mb-5">
        <label className="block text-sm font-medium mb-2">
          메모 <span className="text-muted font-normal">(선택사항)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="추가 내용이 있다면 작성해주세요..."
          rows={3}
          className="w-full p-3.5 bg-background border border-card-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!selectedStatus || isSubmitting}
        className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-lg cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            제출 중...
          </>
        ) : (
          "확인 제출"
        )}
      </button>
    </div>
  );
}

// =============================================
// Main Page
// =============================================

export default function SessionConfirmPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const { showToast } = useToast();

  // Data states
  const [booking, setBooking] = useState<Booking | null>(null);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [confirmation, setConfirmation] = useState<SessionConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isFreeTrial, setIsFreeTrial] = useState(false);
  const [showConversionCTA, setShowConversionCTA] = useState(false);

  // Determine whether both sides confirmed and check for disputes
  const bothConfirmed =
    confirmation?.mentor_confirmed !== null &&
    confirmation?.mentor_confirmed !== undefined &&
    confirmation?.mentee_confirmed !== null &&
    confirmation?.mentee_confirmed !== undefined;

  const bothCompleted =
    bothConfirmed &&
    confirmation?.mentor_confirmed === "completed" &&
    confirmation?.mentee_confirmed === "completed";

  const hasDispute =
    bothConfirmed &&
    !bothCompleted &&
    confirmation !== null;

  // Check if current user already confirmed
  const alreadyConfirmed =
    (userRole === "mentor" && confirmation?.mentor_confirmed !== null && confirmation?.mentor_confirmed !== undefined) ||
    (userRole === "mentee" && confirmation?.mentee_confirmed !== null && confirmation?.mentee_confirmed !== undefined);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("데이터베이스 연결이 필요해요.");
      setIsLoading(false);
      return;
    }

    if (!user) return;

    const supabase = createClient();

    try {
      // 1. Fetch booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bookingError || !bookingData) {
        setError("예약 정보를 찾을 수 없어요.");
        setIsLoading(false);
        return;
      }

      // 예약 상태 검증: confirmed 또는 paid 상태만 세션 확인 가능
      const validStatuses = ["confirmed", "paid", "completed"];
      if (!validStatuses.includes(bookingData.status)) {
        if (bookingData.status === "cancelled" || bookingData.status === "refunded") {
          setError("취소되었거나 환불된 예약은 세션 확인이 불가능해요.");
        } else if (bookingData.status === "pending") {
          setError("결제가 완료되지 않은 예약이에요. 결제 후 다시 시도해주세요.");
        } else {
          setError("세션 확인이 불가능한 예약 상태에요.");
        }
        setIsLoading(false);
        return;
      }

      setBooking(bookingData);

      // Check if this is a free trial booking
      const isFreeTrialBooking = bookingData.payment_method === "free_trial";
      setIsFreeTrial(isFreeTrialBooking);

      // 2. Fetch mentor data first (always needed)
      const { data: mentorData, error: mentorError } = await supabase
        .from("mentors")
        .select("*")
        .eq("id", bookingData.mentor_id)
        .single();

      if (mentorError || !mentorData) {
        setError("멘토 정보를 찾을 수 없어요.");
        setIsLoading(false);
        return;
      }
      setMentor(mentorData);

      // 3. Determine user role
      if (user.id === bookingData.mentee_id) {
        setUserRole("mentee");
      } else if (mentorData.user_id === user.id) {
        setUserRole("mentor");
      } else {
        setError("이 예약에 대한 접근 권한이 없어요.");
        setIsLoading(false);
        return;
      }

      // 4. Fetch product (numbering adjusted)
      if (bookingData.product_id) {
        const { data: productData } = await supabase
          .from("products")
          .select("*")
          .eq("id", bookingData.product_id)
          .single();

        if (productData) {
          setProduct(productData);
        }
      }

      // 5. Fetch session_confirmations
      const { data: confirmData } = await supabase
        .from("session_confirmations")
        .select("*")
        .eq("booking_id", bookingId)
        .single();

      if (confirmData) {
        setConfirmation(confirmData);
      }
      // If no confirmation record exists yet, that's fine - we'll create one on submit
    } catch {
      setError("데이터를 불러오는 중 오류가 발생했어요.");
    } finally {
      setIsLoading(false);
    }
  }, [user, bookingId]);

  useEffect(() => {
    if (!isInitialized || authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [isInitialized, authLoading, user, fetchData]);

  // Handle confirmation submission
  const handleConfirmSubmit = async (status: string, note: string) => {
    if (!user || !booking || !userRole) return;
    if (!isSupabaseConfigured()) {
      showToast("데이터베이스 연결이 필요해요.", "error");
      return;
    }

    // 세션 시작 시간 이후에만 확인 가능
    const sessionTime = new Date(booking.scheduled_at);
    const now = new Date();
    if (now < sessionTime) {
      showToast("세션 시작 시간 이후에 확인할 수 있어요.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const now = new Date().toISOString();

      if (confirmation) {
        // Update existing confirmation record
        const updateData: Record<string, unknown> = {};

        if (userRole === "mentor") {
          updateData.mentor_confirmed = status as MentorConfirmOption;
          updateData.mentor_confirmed_at = now;
          updateData.mentor_note = note || null;
        } else {
          updateData.mentee_confirmed = status as MenteeConfirmOption;
          updateData.mentee_confirmed_at = now;
          updateData.mentee_note = note || null;
        }

        // Determine final_status if both sides will have confirmed
        const otherSideConfirmed =
          userRole === "mentor"
            ? confirmation.mentee_confirmed
            : confirmation.mentor_confirmed;

        if (otherSideConfirmed !== null && otherSideConfirmed !== undefined) {
          const mentorStatus =
            userRole === "mentor" ? status : confirmation.mentor_confirmed;
          const menteeStatus =
            userRole === "mentee" ? status : confirmation.mentee_confirmed;

          let shouldUpdateBookingToCompleted = false;

          // 양측이 서로 노쇼를 주장하는 경우 → 분쟁으로 처리
          if (mentorStatus === "mentee_noshow" && menteeStatus === "mentor_noshow") {
            updateData.final_status = "disputed";
          } else if (mentorStatus === "completed" && menteeStatus === "completed") {
            updateData.final_status = "completed";
            updateData.resolved_at = now;
            shouldUpdateBookingToCompleted = true;
          } else if (mentorStatus === "issue" || menteeStatus === "issue") {
            // Any "issue" response → dispute for admin review
            updateData.final_status = "disputed";
          } else if (
            mentorStatus === "mentee_noshow" ||
            menteeStatus === "mentor_noshow"
          ) {
            // Check for dispute vs. agreement on noshow
            if (mentorStatus === "mentee_noshow" && menteeStatus === "completed") {
              updateData.final_status = "disputed";
            } else if (menteeStatus === "mentor_noshow" && mentorStatus === "completed") {
              updateData.final_status = "disputed";
            } else if (mentorStatus === "mentee_noshow") {
              updateData.final_status = "mentee_noshow";
              updateData.resolved_at = now;
              shouldUpdateBookingToCompleted = true; // noshow도 세션은 "완료" 처리
            } else if (menteeStatus === "mentor_noshow") {
              updateData.final_status = "mentor_noshow";
              updateData.resolved_at = now;
              shouldUpdateBookingToCompleted = true; // noshow도 세션은 "완료" 처리
            } else {
              updateData.final_status = "disputed";
            }
          } else {
            updateData.final_status = "disputed";
          }

          // 양측 모두 확인 완료 시 booking 상태도 completed로 업데이트
          if (shouldUpdateBookingToCompleted) {
            await supabase
              .from("bookings")
              .update({ status: "completed" })
              .eq("id", bookingId);
          }
        }

        updateData.updated_at = now;

        const { error: updateError } = await supabase
          .from("session_confirmations")
          .update(updateData)
          .eq("id", confirmation.id);

        if (updateError) {
          showToast("확인 제출에 실패했어요. 다시 시도해주세요.", "error");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new confirmation record
        const insertData: Record<string, unknown> = {
          booking_id: bookingId,
          mentor_confirmed: null,
          mentor_confirmed_at: null,
          mentor_note: null,
          mentee_confirmed: null,
          mentee_confirmed_at: null,
          mentee_note: null,
          final_status: null,
          resolved_at: null,
          resolved_by: null,
        };

        if (userRole === "mentor") {
          insertData.mentor_confirmed = status as MentorConfirmOption;
          insertData.mentor_confirmed_at = now;
          insertData.mentor_note = note || null;
        } else {
          insertData.mentee_confirmed = status as MenteeConfirmOption;
          insertData.mentee_confirmed_at = now;
          insertData.mentee_note = note || null;
        }

        const { error: insertError } = await supabase
          .from("session_confirmations")
          .insert(insertData);

        if (insertError) {
          showToast("확인 제출에 실패했어요. 다시 시도해주세요.", "error");
          setIsSubmitting(false);
          return;
        }
      }

      showToast("세션 확인이 제출되었어요!", "success");

      // Re-fetch the data to reflect the changes
      setIsLoading(true);
      await fetchData();

      // Track free trial completion and show conversion CTA
      if (isFreeTrial && userRole === "mentee" && status === "completed") {
        trackFreeTrialCompleted(user.id, booking.mentor_id, bookingId);
        setShowConversionCTA(true);
      }
    } catch {
      showToast("확인 제출 중 오류가 발생했어요.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================
  // Render: Loading
  // =============================================

  if (!isInitialized || authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-muted">불러오는 중...</p>
        </div>
      </div>
    );
  }

  // =============================================
  // Render: Auth Required
  // =============================================

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">로그인이 필요해요</h2>
          <p className="text-muted mb-6">세션 확인을 위해 로그인해주세요.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
            >
              로그인하기
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 border border-card-border text-foreground rounded-full font-medium"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =============================================
  // Render: Error
  // =============================================

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">오류가 발생했어요</h2>
          <p className="text-muted mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mypage"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
            >
              마이페이지로
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 border border-card-border text-foreground rounded-full font-medium"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Must have booking, mentor, and userRole at this point
  if (!booking || !mentor || !userRole) return null;

  const productInfo = product ? PRODUCT_INFO[product.type] : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-sm">☕</span>
              </div>
              <span className="font-bold">커피챗</span>
            </Link>
            <span className="text-muted">/</span>
            <span className="font-medium text-sm sm:text-base">세션 확인</span>
          </div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            돌아가기
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Page Title */}
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold mb-1">세션 완료 확인</h1>
          <p className="text-sm text-muted">
            {userRole === "mentor" ? "멘토" : "멘티"}로 접속 중
          </p>
        </div>

        {/* Meeting Link */}
        {booking.meeting_link ? (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              미팅 링크
            </h3>
            <a
              href={booking.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              세션 참여하기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <p className="mt-3 text-xs text-muted">
              {booking.meeting_link}
            </p>
          </div>
        ) : (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-semibold text-yellow-700 mb-1">미팅 링크 미등록</h3>
                <p className="text-sm text-yellow-600">
                  {userRole === "mentor"
                    ? "세션 시작 전 대시보드에서 미팅 링크를 등록해주세요."
                    : "멘토가 미팅 링크를 아직 등록하지 않았습니다. 잠시 후 다시 확인해주세요."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Booking Details */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-6">
          <h3 className="font-semibold text-lg mb-4">예약 정보</h3>

          <div className="space-y-3">
            {/* Mentor */}
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">멘토</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{mentor.name}</span>
                {mentor.is_verified && (
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>

            {/* Product */}
            {product && productInfo && (
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">상품</span>
                <span className="font-medium">
                  {productInfo.icon} {product.title}
                </span>
              </div>
            )}

            {/* Scheduled Time */}
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">예약 일시</span>
              <span className="font-medium">
                {format(new Date(booking.scheduled_at), "yyyy년 M월 d일 (EEEE) HH:mm", {
                  locale: ko,
                })}
              </span>
            </div>

            {/* Duration */}
            {product && (
              <div className="flex justify-between items-center">
                <span className="text-muted text-sm">진행 시간</span>
                <span className="font-medium">{product.duration_minutes}분</span>
              </div>
            )}

            {/* Amount */}
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">결제 금액</span>
              <span className="font-bold text-primary">
                {booking.amount.toLocaleString()}원
              </span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center">
              <span className="text-muted text-sm">예약 상태</span>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  booking.status === "completed"
                    ? "bg-green-500/20 text-green-500"
                    : booking.status === "confirmed" || booking.status === "paid"
                      ? "bg-blue-500/20 text-blue-500"
                      : booking.status === "cancelled"
                        ? "bg-red-500/20 text-red-500"
                        : "bg-yellow-500/20 text-yellow-500"
                }`}
              >
                {booking.status === "pending"
                  ? "대기중"
                  : booking.status === "paid"
                    ? "결제완료"
                    : booking.status === "confirmed"
                      ? "확정"
                      : booking.status === "completed"
                        ? "완료"
                        : booking.status === "cancelled"
                          ? "취소"
                          : booking.status === "refunded"
                            ? "환불"
                            : booking.status}
              </span>
            </div>
          </div>
        </div>

        {/* Auto-Complete Notice (show when not yet fully confirmed) */}
        {!bothConfirmed && <AutoCompleteNotice scheduledAt={booking.scheduled_at} />}

        {/* Both Completed Success */}
        {bothCompleted && confirmation && <BothConfirmedSuccess confirmation={confirmation} />}

        {/* Dispute Notice */}
        {hasDispute && confirmation && <DisputeNotice confirmation={confirmation} />}

        {/* Confirmation Status (show if confirmation record exists) */}
        {confirmation && (
          <ConfirmationStatusCard confirmation={confirmation} userRole={userRole} />
        )}

        {/* Confirmation Form (show if user hasn't confirmed yet) */}
        {!alreadyConfirmed && (
          <ConfirmationForm
            userRole={userRole}
            onSubmit={handleConfirmSubmit}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Already confirmed message */}
        {alreadyConfirmed && !bothConfirmed && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
            <CheckCircleIcon className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium mb-1">확인 완료!</p>
            <p className="text-sm text-muted">
              상대방의 확인을 기다리고 있어요.
            </p>
          </div>
        )}

        {/* Free Trial Conversion CTA - show for mentees after completing free trial */}
        {isFreeTrial && userRole === "mentee" && (bothCompleted || showConversionCTA) && (
          <FreeTrialConversionCTA
            mentorId={mentor.id}
            mentorName={mentor.name}
            variant="full"
            onDismiss={() => setShowConversionCTA(false)}
          />
        )}

        {/* Back Link */}
        <div className="pt-4">
          <Link
            href="/mypage"
            className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            마이페이지로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
