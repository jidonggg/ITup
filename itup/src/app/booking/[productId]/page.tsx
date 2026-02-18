"use client";

import { use, useEffect, useState, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";
import {
  format,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  getDay,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";
import { ko } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Product, Mentor, MentorSchedule, ProductType } from "@/lib/supabase/types";
import { PLATFORM_FEE_RATE, PRODUCT_INFO, REFUND_POLICY, PREDEFINED_MENTEE_QUESTIONS, VALIDATION } from "@/lib/constants";
import { ProductIcon, LogoIcon } from "@/components/icons";
import { MobileStepIndicator, StickyBottomCTA } from "@/components/mobile";

// =============================================
// Types
// =============================================

interface TimeSlot {
  time: string; // "HH:mm"
  available: boolean;
}

interface BookingFormData {
  menteeIntro: string;
  menteeGoal: string;
  files: File[];
  selectedQuestions: string[];
  customQuestions: string[];
}

// =============================================
// Session Storage keys for progress saving
// =============================================
const STORAGE_KEY_PREFIX = "booking_progress_";

function saveProgress(productId: string, data: {
  step: number;
  selectedDate: string | null;
  selectedTime: string | null;
  formData: BookingFormData;
}) {
  try {
    sessionStorage.setItem(STORAGE_KEY_PREFIX + productId, JSON.stringify(data));
  } catch {
    // sessionStorage not available
  }
}

function loadProgress(productId: string): {
  step: number;
  selectedDate: string | null;
  selectedTime: string | null;
  formData: BookingFormData;
} | null {
  try {
    const data = sessionStorage.getItem(STORAGE_KEY_PREFIX + productId);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function clearProgress(productId: string) {
  try {
    sessionStorage.removeItem(STORAGE_KEY_PREFIX + productId);
  } catch {
    // sessionStorage not available
  }
}

// =============================================
// Step Indicator
// =============================================

const STEPS = [
  { number: 1, label: "상품 확인" },
  { number: 2, label: "일정 선택" },
  { number: 3, label: "신청 정보" },
  { number: 4, label: "결제 확인" },
];

function DesktopStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="hidden md:flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {STEPS.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step.number < currentStep
                  ? "bg-primary text-white"
                  : step.number === currentStep
                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg"
                    : "bg-secondary text-muted"
              }`}
            >
              {step.number < currentStep ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-xs mt-1.5 whitespace-nowrap ${
                step.number === currentStep ? "text-primary font-semibold" : "text-muted"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`w-8 sm:w-14 h-0.5 mx-1 sm:mx-2 mb-5 transition-colors ${
                step.number < currentStep ? "bg-primary" : "bg-card-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// =============================================
// Step 1: Product Confirmation
// =============================================

function StepProductConfirm({
  product,
  mentor,
  onNext,
}: {
  product: Product;
  mentor: Mentor;
  onNext: () => void;
}) {
  const productInfo = PRODUCT_INFO[product.type];

  return (
    <div className="max-w-lg mx-auto pb-24 md:pb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">상품 확인</h2>

      <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-6 mb-6">
        {/* Product Info */}
        <div className="flex items-start gap-3 md:gap-4 mb-5 md:mb-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
            <ProductIcon name={productInfo.icon} className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-bold mb-1">{product.title}</h3>
            <p className="text-xs md:text-sm text-muted mb-2">{productInfo.description}</p>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm">
              <span className="px-2 md:px-2.5 py-1 bg-primary/10 text-primary rounded-lg font-medium text-xs md:text-sm">
                {product.duration_minutes}분
              </span>
              <span className="font-bold text-primary text-base md:text-lg">
                {product.price.toLocaleString()}원
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-card-border my-4 md:my-5" />

        {/* Mentor Info */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-base md:text-lg shrink-0">
            {mentor.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-sm md:text-base">{mentor.name}</span>
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
            <p className="text-xs md:text-sm text-muted">{mentor.company} &middot; {mentor.role}</p>
          </div>
        </div>

        {/* Product Description */}
        {product.description && (
          <>
            <div className="border-t border-card-border my-4 md:my-5" />
            <div>
              <p className="text-xs md:text-sm text-muted mb-1.5">상품 설명</p>
              <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>
          </>
        )}
      </div>

      {/* Desktop button */}
      <button
        onClick={onNext}
        className="hidden md:block w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-lg cursor-pointer hover:opacity-90 transition-opacity min-h-[48px]"
      >
        다음
      </button>

      {/* Mobile sticky CTA */}
      <StickyBottomCTA>
        <button
          onClick={onNext}
          className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold text-base cursor-pointer hover:opacity-90 transition-opacity min-h-[48px] active:scale-[0.98]"
        >
          다음
        </button>
      </StickyBottomCTA>
    </div>
  );
}

// =============================================
// Step 2: Date & Time Selection
// =============================================

function StepDateTimeSelect({
  mentor,
  product,
  schedules,
  onNext,
  onBack,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
}: {
  mentor: Mentor;
  product: Product;
  schedules: MentorSchedule[];
  onNext: () => void;
  onBack: () => void;
  selectedDate: Date | null;
  setSelectedDate: (d: Date | null) => void;
  selectedTime: string | null;
  setSelectedTime: (t: string | null) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [existingBookings, setExistingBookings] = useState<string[]>([]);

  // Available day_of_week numbers from schedules
  const availableDays = useMemo(() => {
    const days = new Set<number>();
    schedules.forEach((s) => {
      if (s.is_active) days.add(s.day_of_week);
    });
    return days;
  }, [schedules]);

  // Fetch existing bookings for the mentor for the displayed months
  useEffect(() => {
    const fetchBookings = async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();
      const monthStart = format(currentMonth, "yyyy-MM-dd");
      const nextMonthEnd = format(endOfMonth(addMonths(currentMonth, 1)), "yyyy-MM-dd");

      const { data } = await supabase
        .from("bookings")
        .select("scheduled_at")
        .eq("mentor_id", mentor.id)
        .gte("scheduled_at", monthStart)
        .lte("scheduled_at", nextMonthEnd + "T23:59:59")
        .in("status", ["pending", "paid", "confirmed"]);

      if (data) {
        setExistingBookings(data.map((b) => b.scheduled_at));
      }
    };
    fetchBookings();
  }, [currentMonth, mentor.id]);

  // Build calendar days for a given month
  const getMonthDays = useCallback(
    (month: Date) => {
      const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end });
    },
    []
  );

  // Check if a date has available schedule
  const isDateAvailable = useCallback(
    (date: Date): boolean => {
      if (isBefore(date, new Date()) && !isToday(date)) return false;
      const dayOfWeek = getDay(date);
      return availableDays.has(dayOfWeek);
    },
    [availableDays]
  );

  // Generate time slots for a selected date
  const timeSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate) return [];
    const dayOfWeek = getDay(selectedDate);
    const daySchedules = schedules.filter(
      (s) => s.is_active && s.day_of_week === dayOfWeek
    );
    if (daySchedules.length === 0) return [];

    const slots: TimeSlot[] = [];
    const duration = product.duration_minutes;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    daySchedules.forEach((schedule) => {
      const [startH, startM] = schedule.start_time.split(":").map(Number);
      const [endH, endM] = schedule.end_time.split(":").map(Number);
      const startTotalMin = startH * 60 + startM;
      const endTotalMin = endH * 60 + endM;

      for (let min = startTotalMin; min + duration <= endTotalMin; min += 30) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        // Check if this slot overlaps with any existing booking
        const isBooked = existingBookings.some((booking) => {
          const bookingTime = parseISO(booking);
          const slotTime = setMinutes(setHours(selectedDate, h), m);
          const bookingEnd = new Date(bookingTime.getTime() + duration * 60 * 1000);
          const slotEnd = new Date(slotTime.getTime() + duration * 60 * 1000);
          return slotTime < bookingEnd && slotEnd > bookingTime;
        });

        // Check if this slot is in the past
        const now = new Date();
        const slotDateTime = new Date(`${dateStr}T${timeStr}:00`);
        const isPast = slotDateTime <= now;

        if (!slots.find((s) => s.time === timeStr)) {
          slots.push({
            time: timeStr,
            available: !isBooked && !isPast,
          });
        }
      }
    });

    slots.sort((a, b) => a.time.localeCompare(b.time));
    return slots;
  }, [selectedDate, schedules, existingBookings, product.duration_minutes]);

  const nextMonth = addMonths(currentMonth, 1);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const renderCalendar = (month: Date) => {
    const days = getMonthDays(month);
    return (
      <div>
        <h4 className="text-center font-semibold mb-3 text-sm md:text-base">
          {format(month, "yyyy년 M월", { locale: ko })}
        </h4>
        <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-xs text-muted font-medium py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 md:gap-1">
          {days.map((day, i) => {
            const inMonth = isSameMonth(day, month);
            const available = inMonth && isDateAvailable(day);
            const selected = selectedDate && isSameDay(day, selectedDate);
            const today = isToday(day);

            return (
              <button
                key={i}
                onClick={() => {
                  if (available) {
                    setSelectedDate(day);
                    setSelectedTime(null);
                  }
                }}
                disabled={!available}
                className={`
                  relative aspect-square flex items-center justify-center text-xs md:text-sm rounded-lg transition-all cursor-pointer
                  min-h-[40px] md:min-h-[44px]
                  ${!inMonth ? "invisible" : ""}
                  ${available ? "hover:bg-primary/10 active:bg-primary/20" : "text-muted/40 cursor-not-allowed"}
                  ${selected ? "bg-primary text-white font-bold shadow-md hover:bg-primary" : ""}
                  ${today && !selected ? "ring-1 ring-primary font-semibold" : ""}
                `}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto pb-28 md:pb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">일정 선택</h2>

      {/* Calendar */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-3 md:p-6 mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            disabled={isSameMonth(currentMonth, new Date()) || isBefore(currentMonth, new Date())}
            className="p-2.5 md:p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold text-base md:text-lg">
            {format(currentMonth, "yyyy년", { locale: ko })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2.5 md:p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Single calendar on mobile, two on desktop */}
        <div className="md:hidden">
          {renderCalendar(currentMonth)}
        </div>
        <div className="hidden md:grid md:grid-cols-2 gap-6">
          {renderCalendar(currentMonth)}
          {renderCalendar(nextMonth)}
        </div>

        {schedules.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
            <p className="text-sm text-yellow-700">
              멘토의 가용 일정이 아직 등록되지 않았어요.
            </p>
          </div>
        )}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
          <h3 className="font-semibold mb-1 text-sm md:text-base">
            {format(selectedDate, "M월 d일 (EEEE)", { locale: ko })}
          </h3>
          <p className="text-xs md:text-sm text-muted mb-3 md:mb-4">시간을 선택해주세요</p>

          {timeSlots.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-wrap gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => {
                    if (slot.available) setSelectedTime(slot.time);
                  }}
                  disabled={!slot.available}
                  className={`
                    px-3 md:px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer
                    min-h-[44px]
                    ${
                      selectedTime === slot.time
                        ? "bg-primary text-white shadow-md"
                        : slot.available
                          ? "bg-secondary hover:bg-primary/10 active:bg-primary/20 text-foreground"
                          : "bg-secondary/50 text-muted/40 cursor-not-allowed line-through"
                    }
                  `}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-4">
              선택한 날짜에 가능한 시간이 없어요.
            </p>
          )}
        </div>
      )}

      {/* Selected Summary */}
      {selectedDate && selectedTime && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 md:p-4 mb-4 md:mb-6 flex items-center gap-3">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm md:text-base">
              {format(selectedDate, "yyyy년 M월 d일 (EEEE)", { locale: ko })}
            </p>
            <p className="text-xs md:text-sm text-primary font-medium">{selectedTime} 시작</p>
          </div>
        </div>
      )}

      {/* Desktop Buttons */}
      <div className="hidden md:flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 border border-card-border text-foreground rounded-xl font-semibold cursor-pointer hover:bg-secondary transition-colors min-h-[48px]"
        >
          이전
        </button>
        <button
          onClick={onNext}
          disabled={!selectedDate || !selectedTime}
          className="flex-1 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
        >
          다음
        </button>
      </div>

      {/* Mobile sticky CTA */}
      <StickyBottomCTA>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-card-border text-foreground rounded-xl font-semibold cursor-pointer hover:bg-secondary transition-colors min-h-[48px] active:scale-[0.98]"
          >
            이전
          </button>
          <button
            onClick={onNext}
            disabled={!selectedDate || !selectedTime}
            className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] active:scale-[0.98]"
          >
            다음
          </button>
        </div>
      </StickyBottomCTA>
    </div>
  );
}

// =============================================
// Step 3: Booking Info
// =============================================

function StepBookingInfo({
  product,
  formData,
  setFormData,
  onNext,
  onBack,
}: {
  product: Product;
  formData: BookingFormData;
  setFormData: (data: BookingFormData) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const introValid = formData.menteeIntro.trim().length >= 10;
  const goalValid = formData.menteeGoal.trim().length >= 10;
  const canProceed = introValid && goalValid;

  const showFileUpload = product.type === "mock_interview";

  const predefinedQuestions = product.type !== "free_trial"
    ? (PREDEFINED_MENTEE_QUESTIONS[product.type as Exclude<ProductType, "free_trial">] ?? [])
    : [];

  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">신청 정보</h2>

      <div className="space-y-4 md:space-y-5">
        {/* Intro */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-5">
          <label className="block mb-2">
            <span className="font-semibold text-sm md:text-base">간단 자기소개</span>
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={formData.menteeIntro}
            onChange={(e) =>
              setFormData({ ...formData, menteeIntro: e.target.value })
            }
            placeholder="현재 직무, 경력 등을 간단히 소개해주세요 (최소 10자)"
            rows={4}
            className="w-full p-3 md:p-3.5 bg-secondary/50 border border-card-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-h-[100px]"
          />
          <div className="flex justify-between mt-1.5">
            <p
              className={`text-xs ${
                formData.menteeIntro.length > 0 && !introValid
                  ? "text-red-500"
                  : "text-muted"
              }`}
            >
              {formData.menteeIntro.length > 0 && !introValid
                ? "최소 10자 이상 입력해주세요"
                : "최소 10자"}
            </p>
            <p className="text-xs text-muted">{formData.menteeIntro.length}자</p>
          </div>
        </div>

        {/* Goal */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-5">
          <label className="block mb-2">
            <span className="font-semibold text-sm md:text-base">상담에서 얻고 싶은 것</span>
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={formData.menteeGoal}
            onChange={(e) =>
              setFormData({ ...formData, menteeGoal: e.target.value })
            }
            placeholder="멘토에게 궁금한 점이나 얻고 싶은 조언을 작성해주세요 (최소 10자)"
            rows={4}
            className="w-full p-3 md:p-3.5 bg-secondary/50 border border-card-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all min-h-[100px]"
          />
          <div className="flex justify-between mt-1.5">
            <p
              className={`text-xs ${
                formData.menteeGoal.length > 0 && !goalValid
                  ? "text-red-500"
                  : "text-muted"
              }`}
            >
              {formData.menteeGoal.length > 0 && !goalValid
                ? "최소 10자 이상 입력해주세요"
                : "최소 10자"}
            </p>
            <p className="text-xs text-muted">{formData.menteeGoal.length}자</p>
          </div>
        </div>

        {/* Pre-Session Questions */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-5">
          <label className="block mb-2">
            <span className="font-semibold text-sm md:text-base">멘토에게 질문하고 싶은 내용</span>
            <span className="text-xs text-muted ml-2">(선택사항)</span>
          </label>
          <p className="text-xs text-muted mb-3">
            궁금한 질문을 선택하거나 직접 추가해주세요. 멘토가 세션 전에 미리 확인해요.
          </p>

          {/* Predefined questions as checkboxes */}
          {predefinedQuestions.length > 0 && (
            <div className="space-y-2 mb-4">
              {predefinedQuestions.map((q, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl cursor-pointer hover:bg-secondary transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.selectedQuestions.includes(q)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, selectedQuestions: [...formData.selectedQuestions, q] });
                      } else {
                        setFormData({ ...formData, selectedQuestions: formData.selectedQuestions.filter(s => s !== q) });
                      }
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-card-border accent-primary cursor-pointer shrink-0"
                  />
                  <span className="text-sm text-foreground">{q}</span>
                </label>
              ))}
            </div>
          )}

          {/* Custom questions */}
          {formData.customQuestions.map((cq, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={cq}
                onChange={(e) => {
                  const updated = [...formData.customQuestions];
                  updated[i] = e.target.value;
                  setFormData({ ...formData, customQuestions: updated });
                }}
                maxLength={VALIDATION.MAX_CUSTOM_QUESTION_LENGTH}
                placeholder="직접 질문을 입력하세요"
                className="flex-1 p-2.5 bg-secondary/50 border border-card-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, customQuestions: formData.customQuestions.filter((_, idx) => idx !== i) });
                }}
                className="p-2 text-muted hover:text-red-500 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add custom question button */}
          {formData.customQuestions.length < VALIDATION.MAX_CUSTOM_QUESTIONS && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, customQuestions: [...formData.customQuestions, ""] })}
              className="mt-2 flex items-center gap-2 text-sm text-primary hover:text-primary-dark cursor-pointer transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>질문 추가</span>
            </button>
          )}
        </div>

        {/* File Attachment (UI only) */}
        {showFileUpload && (
          <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-5">
            <label className="block mb-2">
              <span className="font-semibold text-sm md:text-base">
                면접 관련 자료
              </span>
              <span className="text-xs text-muted ml-2">(선택사항)</span>
            </label>
            <div className="border-2 border-dashed border-card-border rounded-xl p-6 md:p-8 text-center hover:border-primary/40 transition-colors active:bg-secondary/30">
              <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 text-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p className="text-xs md:text-sm text-muted mb-1">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-muted/60">
                PDF, DOC, DOCX (최대 10MB) &middot; 추후 지원 예정
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Buttons */}
      <div className="hidden md:flex gap-3 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 border border-card-border text-foreground rounded-xl font-semibold cursor-pointer hover:bg-secondary transition-colors min-h-[48px]"
        >
          이전
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
        >
          다음
        </button>
      </div>

      {/* Mobile sticky CTA */}
      <StickyBottomCTA>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-card-border text-foreground rounded-xl font-semibold cursor-pointer hover:bg-secondary transition-colors min-h-[48px] active:scale-[0.98]"
          >
            이전
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] active:scale-[0.98]"
          >
            다음
          </button>
        </div>
      </StickyBottomCTA>
    </div>
  );
}

// =============================================
// Step 4: Payment Confirmation
// =============================================

function StepPaymentConfirm({
  product,
  mentor,
  selectedDate,
  selectedTime,
  onBack,
  onSubmit,
  isSubmitting,
}: {
  product: Product;
  mentor: Mentor;
  selectedDate: Date;
  selectedTime: string;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);

  const totalAmount = product.price;
  const productInfo = PRODUCT_INFO[product.type];

  return (
    <div className="max-w-lg mx-auto pb-28 md:pb-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">결제 확인</h2>

      {/* Booking Summary */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-6 mb-4 md:mb-5">
        <h3 className="font-semibold mb-3 md:mb-4 text-base md:text-lg">예약 정보</h3>

        <div className="space-y-2.5 md:space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted text-xs md:text-sm">멘토</span>
            <span className="font-medium text-sm md:text-base">{mentor.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-xs md:text-sm">상품</span>
            <span className="font-medium text-sm md:text-base">
              <ProductIcon name={productInfo.icon} className="w-4 h-4 inline-block" /> {product.title}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-xs md:text-sm">시간</span>
            <span className="font-medium text-sm md:text-base">{product.duration_minutes}분</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-xs md:text-sm">일정</span>
            <span className="font-medium text-sm md:text-base">
              {format(selectedDate, "yyyy.MM.dd (EEEE)", { locale: ko })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-xs md:text-sm">시작 시간</span>
            <span className="font-medium text-primary text-sm md:text-base">{selectedTime}</span>
          </div>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-6 mb-4 md:mb-5">
        <h3 className="font-semibold mb-3 md:mb-4 text-base md:text-lg">결제 금액</h3>

        <div className="space-y-2.5 md:space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted text-xs md:text-sm">상품 가격</span>
            <span className="font-medium text-sm md:text-base">{product.price.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted text-xs md:text-sm">플랫폼 수수료 ({Math.round(PLATFORM_FEE_RATE * 100)}%)</span>
            <span className="text-xs text-muted">(가격에 포함)</span>
          </div>
          <div className="border-t border-card-border my-2" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-base md:text-lg">총 결제 금액</span>
            <span className="font-bold text-lg md:text-xl text-primary">
              {totalAmount.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* Refund Policy Agreement */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-5 mb-4 md:mb-6">
        <label className="flex items-start gap-3 cursor-pointer min-h-[44px] py-1">
          <input
            type="checkbox"
            checked={agreedToPolicy}
            onChange={(e) => setAgreedToPolicy(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-card-border text-primary focus:ring-primary/30 cursor-pointer accent-primary"
          />
          <span className="text-xs md:text-sm leading-relaxed">
            <span className="font-medium">취소/환불 규정</span>에 동의합니다.
          </span>
        </label>

        <button
          onClick={() => setShowRefundPolicy(!showRefundPolicy)}
          className="mt-2 ml-8 text-xs text-primary hover:underline cursor-pointer min-h-[32px] flex items-center"
        >
          {showRefundPolicy ? "환불 규정 닫기" : "환불 규정 보기"}
        </button>

        {showRefundPolicy && (
          <div className="mt-3 ml-8 p-3 md:p-4 bg-secondary/50 rounded-xl text-xs space-y-2 text-muted">
            <p className="font-semibold text-foreground mb-2">멘티 취소/환불 규정</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span>상담 48시간 전 취소</span>
                <span className="font-medium text-foreground">
                  {REFUND_POLICY.mentee.before_48h.description}
                </span>
              </div>
              <div className="flex justify-between">
                <span>상담 24시간 전 취소</span>
                <span className="font-medium text-foreground">
                  {REFUND_POLICY.mentee.before_24h.description}
                </span>
              </div>
              <div className="flex justify-between">
                <span>상담 24시간 이내 취소</span>
                <span className="font-medium text-red-500">
                  {REFUND_POLICY.mentee.within_24h.description}
                </span>
              </div>
              <div className="flex justify-between">
                <span>노쇼 (불참)</span>
                <span className="font-medium text-red-500">
                  {REFUND_POLICY.mentee.noshow.description}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Buttons */}
      <div className="hidden md:flex gap-3">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-3.5 border border-card-border text-foreground rounded-xl font-semibold cursor-pointer hover:bg-secondary transition-colors disabled:opacity-40 min-h-[48px]"
        >
          이전
        </button>
        <button
          onClick={onSubmit}
          disabled={!agreedToPolicy || isSubmitting}
          className="flex-1 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              처리 중...
            </>
          ) : (
            "결제하기"
          )}
        </button>
      </div>

      {/* Mobile sticky CTA */}
      <StickyBottomCTA>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 py-3 border border-card-border text-foreground rounded-xl font-semibold cursor-pointer hover:bg-secondary transition-colors disabled:opacity-40 min-h-[48px] active:scale-[0.98]"
          >
            이전
          </button>
          <button
            onClick={onSubmit}
            disabled={!agreedToPolicy || isSubmitting}
            className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                처리 중...
              </>
            ) : (
              "결제하기"
            )}
          </button>
        </div>
      </StickyBottomCTA>
    </div>
  );
}

// =============================================
// Success Screen
// =============================================

function BookingSuccess({
  product,
  mentor,
  selectedDate,
  selectedTime,
  bookingId,
}: {
  product: Product;
  mentor: Mentor;
  selectedDate: Date;
  selectedTime: string;
  bookingId: string;
}) {
  const productInfo = PRODUCT_INFO[product.type];

  return (
    <div className="max-w-lg mx-auto text-center px-4">
      {/* Success Icon */}
      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg className="w-8 h-8 md:w-10 md:h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-xl md:text-2xl font-bold mb-2">예약이 완료되었어요!</h2>
      <p className="text-muted text-sm md:text-base mb-4 md:mb-6">
        멘토님의 확인 후 결제가 진행돼요.
      </p>

      {/* Booking Details */}
      <div className="bg-card-bg border border-card-border rounded-2xl p-4 md:p-6 mb-4 md:mb-6 text-left">
        <h3 className="font-semibold mb-3 md:mb-4 text-center text-sm md:text-base">예약 상세</h3>
        <div className="space-y-2.5 md:space-y-3 text-xs md:text-sm">
          <div className="flex justify-between">
            <span className="text-muted">예약 번호</span>
            <span className="font-mono text-xs">{bookingId.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">멘토</span>
            <span className="font-medium">{mentor.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">상품</span>
            <span className="font-medium">
              <ProductIcon name={productInfo.icon} className="w-4 h-4 inline-block" /> {product.title}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">일정</span>
            <span className="font-medium">
              {format(selectedDate, "yyyy.MM.dd (EEEE)", { locale: ko })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">시간</span>
            <span className="font-medium text-primary">{selectedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">금액</span>
            <span className="font-bold text-primary">{product.price.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">상태</span>
            <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-600 rounded-full text-xs font-medium">
              대기중
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/mypage"
          className="flex-1 inline-flex items-center justify-center py-3 md:py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:opacity-90 transition-opacity min-h-[48px]"
        >
          마이페이지로 이동
        </Link>
        <Link
          href="/"
          className="flex-1 inline-flex items-center justify-center py-3 md:py-3.5 border border-card-border text-foreground rounded-xl font-semibold hover:bg-secondary transition-colors min-h-[48px]"
        >
          홈으로 이동
        </Link>
      </div>
    </div>
  );
}

// =============================================
// Main Booking Page
// =============================================

export default function BookingPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const { showToast } = useToast();

  // Data states
  const [product, setProduct] = useState<Product | null>(null);
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [schedules, setSchedules] = useState<MentorSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Step states
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    menteeIntro: "",
    menteeGoal: "",
    files: [],
    selectedQuestions: [],
    customQuestions: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const didTrackPageView = useRef(false);

  // Analytics: page view on mount
  useEffect(() => {
    if (!didTrackPageView.current) {
      didTrackPageView.current = true;
      trackEvent({
        category: "page_view",
        action: "booking_view",
        metadata: { productId },
      });
    }
  }, [productId]);

  // Load saved progress on mount
  useEffect(() => {
    const saved = loadProgress(productId);
    if (saved) {
      setCurrentStep(saved.step);
      setSelectedDate(saved.selectedDate ? new Date(saved.selectedDate) : null);
      setSelectedTime(saved.selectedTime);
      setFormData({
        ...saved.formData,
        selectedQuestions: saved.formData.selectedQuestions ?? [],
        customQuestions: saved.formData.customQuestions ?? [],
      });
    }
  }, [productId]);

  // Save progress when state changes
  useEffect(() => {
    if (!isLoading && product) {
      saveProgress(productId, {
        step: currentStep,
        selectedDate: selectedDate ? selectedDate.toISOString() : null,
        selectedTime,
        formData,
      });
    }
  }, [currentStep, selectedDate, selectedTime, formData, productId, isLoading, product]);

  // 진행 중 페이지 이탈 방지
  useEffect(() => {
    const hasProgress = currentStep > 1 || selectedDate || selectedTime || formData.menteeIntro || formData.menteeGoal;
    if (!hasProgress || isSuccess) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentStep, selectedDate, selectedTime, formData, isSuccess]);

  // Fetch product, mentor, and schedules
  useEffect(() => {
    if (!isInitialized) return;

    const fetchData = async () => {
      if (!isSupabaseConfigured()) {
        setError("데이터베이스 연결이 필요해요.");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      try {
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .eq("is_active", true)
          .single();

        if (productError || !productData) {
          setError("상품을 찾을 수 없어요.");
          setIsLoading(false);
          return;
        }
        setProduct(productData);

        // Fetch mentor
        const { data: mentorData, error: mentorError } = await supabase
          .from("mentors")
          .select("*")
          .eq("id", productData.mentor_id)
          .single();

        if (mentorError || !mentorData) {
          setError("멘토 정보를 찾을 수 없어요.");
          setIsLoading(false);
          return;
        }

        // 자기 자신 예약 방지
        if (user && mentorData.user_id === user.id) {
          setError("자신의 멘토링 상품은 예약할 수 없어요.");
          setIsLoading(false);
          return;
        }

        setMentor(mentorData);

        // Fetch schedules (mentor_schedules table may not exist yet)
        try {
          const { data: scheduleData, error: scheduleError } = await supabase
            .from("mentor_schedules")
            .select("*")
            .eq("mentor_id", productData.mentor_id)
            .eq("is_active", true);

          if (!scheduleError && scheduleData) {
            setSchedules(scheduleData);
          }
        } catch {
          // mentor_schedules table does not exist — fall back to empty schedules
          console.warn("[booking] mentor_schedules table not available, using empty schedule list");
        }
      } catch {
        setError("데이터를 불러오는 중 오류가 발생했어요.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isInitialized, productId, user]);

  // Submit booking
  const handleSubmit = async () => {
    if (!user || !product || !mentor || !selectedDate || !selectedTime) return;
    if (isSubmitting) return; // 중복 제출 방지
    if (!isSupabaseConfigured()) {
      showToast("데이터베이스 연결이 필요해요.", "error");
      return;
    }

    setIsSubmitting(true);
    trackEvent({
      category: "booking",
      action: "booking_submit",
      metadata: { productId, mentorId: mentor.id },
    });

    try {
      const supabase = createClient();
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const scheduledAt = `${dateStr}T${selectedTime}:00`;
      const platformFee = Math.round(product.price * PLATFORM_FEE_RATE);
      const mentorAmount = product.price - platformFee;

      const { data, error: insertError } = await supabase
        .from("bookings")
        .insert({
          mentee_id: user.id,
          mentor_id: mentor.id,
          product_id: product.id,
          scheduled_at: scheduledAt,
          mentee_intro: formData.menteeIntro.trim().replace(/[<>]/g, (c) => c === "<" ? "&lt;" : "&gt;"),
          mentee_goal: formData.menteeGoal.trim().replace(/[<>]/g, (c) => c === "<" ? "&lt;" : "&gt;"),
          mentee_questions: (formData.selectedQuestions.length > 0 || formData.customQuestions.filter(q => q.trim()).length > 0)
            ? {
                predefined: formData.selectedQuestions,
                custom: formData.customQuestions.filter(q => q.trim()),
              }
            : null,
          amount: product.price,
          platform_fee: platformFee,
          mentor_amount: mentorAmount,
          meeting_link: null,
          attached_files: [],
          payment_key: null,
          order_id: null,
          payment_method: null,
          paid_at: null,
          cancelled_at: null,
          cancelled_by: null,
          cancel_reason: null,
          refunded_at: null,
        })
        .select("id")
        .single();

      if (insertError) {
        showToast("예약 중 오류가 발생했어요. 다시 시도해주세요.", "error");
        setIsSubmitting(false);
        return;
      }

      // 멘토에게 새 예약 이메일 알림 발송 (비동기, 에러 무시)
      const bookingSession = await supabase.auth.getSession();
      const bookingToken = bookingSession.data.session?.access_token;
      fetch("/api/email/booking-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(bookingToken ? { "Authorization": `Bearer ${bookingToken}` } : {}),
        },
        body: JSON.stringify({
          type: "new_booking",
          bookingId: data.id,
        }),
      }).catch(() => {});

      // Clear saved progress on success
      clearProgress(productId);

      setBookingId(data.id);
      setIsSuccess(true);
      showToast("예약이 완료되었어요!", "success");
    } catch {
      showToast("예약 중 오류가 발생했어요.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
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

  // Auth check
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-6 md:p-8 text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 md:w-8 md:h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">로그인이 필요해요</h2>
          <p className="text-muted text-sm md:text-base mb-4 md:mb-6">예약을 진행하려면 로그인해주세요.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/login?redirect=/booking/${productId}`}
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium min-h-[44px] flex items-center justify-center"
            >
              로그인하기
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 border border-card-border text-foreground rounded-full font-medium min-h-[44px] flex items-center justify-center"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-6 md:p-8 text-center">
          <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-7 h-7 md:w-8 md:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">오류가 발생했어요</h2>
          <p className="text-muted text-sm md:text-base mb-4 md:mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/mentors"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium min-h-[44px] flex items-center justify-center"
            >
              멘토 목록으로
            </Link>
            <Link
              href="/"
              className="px-6 py-2.5 border border-card-border text-foreground rounded-full font-medium min-h-[44px] flex items-center justify-center"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Must have product and mentor at this point
  if (!product || !mentor) return null;

  // Success screen
  if (isSuccess && bookingId && selectedDate && selectedTime) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-card-border bg-card-bg">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <LogoIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">커피챗</span>
            </Link>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 md:py-10">
          <BookingSuccess
            product={product}
            mentor={mentor}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            bookingId={bookingId}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <LogoIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold hidden sm:inline">커피챗</span>
            </Link>
            <span className="text-muted hidden sm:inline">/</span>
            <span className="font-medium text-sm sm:text-base">예약하기</span>
          </div>
          <button
            onClick={() => router.back()}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            취소
          </button>
        </div>
      </header>

      {/* Mobile Step Indicator */}
      <div className="md:hidden">
        <MobileStepIndicator steps={STEPS} currentStep={currentStep} />
      </div>

      <main className="max-w-3xl mx-auto px-4 py-4 md:py-8">
        {/* Desktop Step Indicator */}
        <DesktopStepIndicator currentStep={currentStep} />

        {/* Step Content */}
        {currentStep === 1 && (
          <StepProductConfirm
            product={product}
            mentor={mentor}
            onNext={() => {
              setCurrentStep(2);
              trackEvent({ category: "form_step", action: "booking_step", label: "step_2", metadata: { step: 2, productId } });
            }}
          />
        )}

        {currentStep === 2 && (
          <StepDateTimeSelect
            mentor={mentor}
            product={product}
            schedules={schedules}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            onNext={() => {
              setCurrentStep(3);
              trackEvent({ category: "form_step", action: "booking_step", label: "step_3", metadata: { step: 3, productId } });
            }}
            onBack={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <StepBookingInfo
            product={product}
            formData={formData}
            setFormData={setFormData}
            onNext={() => {
              setCurrentStep(4);
              trackEvent({ category: "form_step", action: "booking_step", label: "step_4", metadata: { step: 4, productId } });
            }}
            onBack={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 4 && selectedDate && selectedTime && (
          <StepPaymentConfirm
            product={product}
            mentor={mentor}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onBack={() => setCurrentStep(3)}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  );
}
