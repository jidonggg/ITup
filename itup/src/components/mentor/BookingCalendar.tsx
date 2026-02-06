"use client";

import { useState, useMemo } from "react";
import { Booking, Product, Profile } from "@/lib/supabase/types";
import { PRODUCT_INFO } from "@/lib/constants";

// Booking status types and labels
type BookingStatusType = "pending" | "paid" | "confirmed" | "completed" | "cancelled" | "refunded";

const bookingStatusLabels: Record<BookingStatusType, string> = {
  pending: "대기중",
  paid: "결제완료",
  confirmed: "확정",
  completed: "완료",
  cancelled: "취소",
  refunded: "환불",
};

// Color coding by status (calendar-specific, more subtle)
const calendarStatusColors: Record<BookingStatusType, { bg: string; text: string; border: string }> = {
  pending: { bg: "bg-yellow-500/20", text: "text-yellow-500", border: "border-yellow-500/30" },
  paid: { bg: "bg-orange-500/20", text: "text-orange-500", border: "border-orange-500/30" },
  confirmed: { bg: "bg-blue-500/20", text: "text-blue-500", border: "border-blue-500/30" },
  completed: { bg: "bg-green-500/20", text: "text-green-500", border: "border-green-500/30" },
  cancelled: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
  refunded: { bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-500/30" },
};

// Korean day labels
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

// Korean month labels
const MONTH_LABELS = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월",
];

interface BookingCalendarProps {
  bookings: Booking[];
  bookingProfiles: Record<string, Profile>;
  bookingProducts: Record<string, Product>;
  onBookingClick?: (booking: Booking) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  bookings: Booking[];
}

export default function BookingCalendar({
  bookings,
  bookingProfiles,
  bookingProducts,
  onBookingClick,
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Get calendar data for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End at the Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDateIterator = new Date(startDate);
    while (currentDateIterator <= endDate) {
      const dateStr = currentDateIterator.toISOString().split("T")[0];
      const dayBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.scheduled_at).toISOString().split("T")[0];
        return bookingDate === dateStr;
      });

      days.push({
        date: new Date(currentDateIterator),
        isCurrentMonth: currentDateIterator.getMonth() === month,
        isToday: currentDateIterator.getTime() === today.getTime(),
        bookings: dayBookings,
      });

      currentDateIterator.setDate(currentDateIterator.getDate() + 1);
    }

    return days;
  }, [currentDate, bookings]);

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
    setSelectedBooking(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
    setSelectedBooking(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setSelectedBooking(null);
  };

  // Handle date click
  const handleDateClick = (day: CalendarDay) => {
    if (day.bookings.length > 0) {
      setSelectedDate(day.date);
      setSelectedBooking(null);
    } else {
      setSelectedDate(null);
      setSelectedBooking(null);
    }
  };

  // Handle booking click
  const handleBookingClick = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    if (onBookingClick) {
      onBookingClick(booking);
    }
  };

  // Get bookings for selected date
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return bookings.filter((b) => {
      const bookingDate = new Date(b.scheduled_at).toISOString().split("T")[0];
      return bookingDate === dateStr;
    });
  }, [selectedDate, bookings]);

  // Format time from Date
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 border-b border-card-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold">
              {currentDate.getFullYear()}년 {MONTH_LABELS[currentDate.getMonth()]}
            </h3>
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors cursor-pointer"
            >
              오늘
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevMonth}
              className="p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              aria-label="이전 달"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              aria-label="다음 달"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-orange-500/40"></span>
            <span className="text-muted">결제완료</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500/40"></span>
            <span className="text-muted">확정</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-green-500/40"></span>
            <span className="text-muted">완료</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-500/40"></span>
            <span className="text-muted">취소/환불</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_LABELS.map((day, index) => (
            <div
              key={day}
              className={`text-center text-sm font-medium py-2 ${
                index === 0 ? "text-red-400" : index === 6 ? "text-blue-400" : "text-muted"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isSelected = selectedDate &&
              day.date.toISOString().split("T")[0] === selectedDate.toISOString().split("T")[0];
            const dayOfWeek = day.date.getDay();

            return (
              <div
                key={index}
                onClick={() => handleDateClick(day)}
                className={`
                  min-h-[80px] md:min-h-[100px] p-1 rounded-lg border transition-all
                  ${day.isCurrentMonth ? "bg-secondary/30" : "bg-secondary/10"}
                  ${day.isToday ? "border-primary" : "border-transparent"}
                  ${isSelected ? "ring-2 ring-primary bg-primary/10" : ""}
                  ${day.bookings.length > 0 ? "cursor-pointer hover:bg-secondary/50" : ""}
                `}
              >
                {/* Date Number */}
                <div className={`
                  text-sm font-medium mb-1
                  ${!day.isCurrentMonth ? "text-muted/50" : ""}
                  ${day.isToday ? "text-primary font-bold" : ""}
                  ${dayOfWeek === 0 && day.isCurrentMonth ? "text-red-400" : ""}
                  ${dayOfWeek === 6 && day.isCurrentMonth ? "text-blue-400" : ""}
                `}>
                  {day.date.getDate()}
                  {day.isToday && (
                    <span className="ml-1 text-[10px] text-primary">오늘</span>
                  )}
                </div>

                {/* Bookings for this day - Desktop */}
                <div className="hidden md:block space-y-1">
                  {day.bookings.slice(0, 2).map((booking) => {
                    const colors = calendarStatusColors[booking.status];
                    return (
                      <div
                        key={booking.id}
                        onClick={(e) => handleBookingClick(booking, e)}
                        className={`
                          px-1.5 py-0.5 rounded text-[10px] truncate
                          ${colors.bg} ${colors.text} ${colors.border} border
                          hover:opacity-80 cursor-pointer transition-opacity
                        `}
                        title={`${formatTime(booking.scheduled_at)} - ${bookingStatusLabels[booking.status]}`}
                      >
                        {formatTime(booking.scheduled_at)}
                      </div>
                    );
                  })}
                  {day.bookings.length > 2 && (
                    <div className="text-[10px] text-muted text-center">
                      +{day.bookings.length - 2}개 더
                    </div>
                  )}
                </div>

                {/* Bookings for this day - Mobile (just dots) */}
                <div className="md:hidden flex flex-wrap gap-0.5">
                  {day.bookings.slice(0, 3).map((booking) => {
                    const colors = calendarStatusColors[booking.status];
                    return (
                      <div
                        key={booking.id}
                        className={`w-2 h-2 rounded-full ${colors.bg.replace("/20", "/60")}`}
                        title={bookingStatusLabels[booking.status]}
                      />
                    );
                  })}
                  {day.bookings.length > 3 && (
                    <div className="text-[8px] text-muted">+{day.bookings.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Bookings Panel */}
      {selectedDate && selectedDateBookings.length > 0 && (
        <div className="border-t border-card-border p-4">
          <h4 className="font-semibold mb-3">
            {selectedDate.toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "short",
            })} 예약 ({selectedDateBookings.length}건)
          </h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {selectedDateBookings.map((booking) => {
              const menteeProfile = booking.mentee_id ? bookingProfiles[booking.mentee_id] : null;
              const product = booking.product_id ? bookingProducts[booking.product_id] : null;
              const productInfo = product ? PRODUCT_INFO[product.type] : null;
              const colors = calendarStatusColors[booking.status];
              const isSelectedBooking = selectedBooking?.id === booking.id;

              return (
                <div
                  key={booking.id}
                  onClick={(e) => handleBookingClick(booking, e)}
                  className={`
                    p-3 rounded-lg border transition-all cursor-pointer
                    ${colors.border} ${isSelectedBooking ? colors.bg : "bg-secondary/30 hover:bg-secondary/50"}
                  `}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">
                          {menteeProfile?.name || "멘티 정보 없음"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                          {bookingStatusLabels[booking.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                        <span className="font-medium text-foreground">
                          {formatTime(booking.scheduled_at)}
                        </span>
                        {productInfo && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                            {productInfo.icon} {productInfo.name}
                          </span>
                        )}
                        {product && (
                          <span className="text-xs">
                            {product.duration_minutes}분
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">
                        {booking.amount.toLocaleString()}원
                      </p>
                    </div>
                  </div>

                  {/* Expanded details for selected booking */}
                  {isSelectedBooking && (
                    <div className="mt-3 pt-3 border-t border-card-border space-y-2">
                      {booking.mentee_intro && (
                        <div>
                          <p className="text-xs text-muted mb-1">멘티 소개</p>
                          <p className="text-sm bg-secondary/50 rounded p-2">{booking.mentee_intro}</p>
                        </div>
                      )}
                      {booking.mentee_goal && (
                        <div>
                          <p className="text-xs text-muted mb-1">상담 목표</p>
                          <p className="text-sm bg-secondary/50 rounded p-2">{booking.mentee_goal}</p>
                        </div>
                      )}
                      {booking.meeting_link && (
                        <div>
                          <p className="text-xs text-muted mb-1">미팅 링크</p>
                          <a
                            href={booking.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline break-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {booking.meeting_link}
                          </a>
                        </div>
                      )}
                      {menteeProfile?.email && (
                        <div>
                          <p className="text-xs text-muted mb-1">멘티 이메일</p>
                          <p className="text-sm">{menteeProfile.email}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile List View Toggle Hint */}
      <div className="md:hidden p-3 bg-secondary/30 border-t border-card-border">
        <p className="text-xs text-muted text-center">
          날짜를 탭하면 해당 날짜의 예약을 확인할 수 있어요
        </p>
      </div>
    </div>
  );
}
