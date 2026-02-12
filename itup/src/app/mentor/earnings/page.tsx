"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Mentor, Booking, Product, Profile } from "@/lib/supabase/types";
import { PRODUCT_INFO } from "@/lib/constants";
import { ProductIcon, LogoIcon } from "@/components/icons";
import { formatKRW } from "@/lib/settlement/calculate";

interface MonthlyEarnings {
  month: string;
  label: string;
  amount: number;
}

interface TransactionItem {
  id: string;
  scheduledAt: string;
  menteeName: string;
  productType: string;
  productIcon: string;
  amount: number;
  mentorAmount: number;
  status: string;
}

export default function MentorEarningsPage() {
  const { user, isInitialized } = useAuth();
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [bookingProfiles, setBookingProfiles] = useState<Record<string, Profile>>({});
  const [bookingProducts, setBookingProducts] = useState<Record<string, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check mentor authorization: user has a mentor record (not relying on profile.role,
  // because role is only set to "mentor" after admin approval)
  const isAuthorized = !!mentor;

  useEffect(() => {
    if (!isInitialized) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      if (!isSupabaseConfigured()) {
        setError("데이터베이스 연결이 필요해요.");
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      try {
        // Fetch mentor info
        const { data: mentorData, error: mentorError } = await supabase
          .from("mentors")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (mentorError || !mentorData) {
          setError("멘토 정보를 찾을 수 없어요.");
          setIsLoading(false);
          return;
        }

        // Check if mentor is approved
        if (!mentorData.is_approved) {
          setError("승인된 멘토만 수익 현황을 확인할 수 있어요.");
          setIsLoading(false);
          return;
        }

        setMentor(mentorData);

        // Fetch completed bookings for this mentor
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("*")
          .eq("mentor_id", mentorData.id)
          .eq("status", "completed")
          .order("scheduled_at", { ascending: false });

        if (bookingData && bookingData.length > 0) {
          setCompletedBookings(bookingData);

          // Fetch mentee profiles
          const menteeIds = [...new Set(bookingData.map((b: Booking) => b.mentee_id).filter(Boolean))] as string[];
          if (menteeIds.length > 0) {
            const { data: profilesData } = await supabase
              .from("profiles")
              .select("*")
              .in("id", menteeIds);
            if (profilesData) {
              const profileMap: Record<string, Profile> = {};
              profilesData.forEach((p: Profile) => { profileMap[p.id] = p; });
              setBookingProfiles(profileMap);
            }
          }

          // Fetch products
          const productIds = [...new Set(bookingData.map((b: Booking) => b.product_id).filter(Boolean))] as string[];
          if (productIds.length > 0) {
            const { data: productsData } = await supabase
              .from("products")
              .select("*")
              .in("id", productIds);
            if (productsData) {
              const productMap: Record<string, Product> = {};
              productsData.forEach((p: Product) => { productMap[p.id] = p; });
              setBookingProducts(productMap);
            }
          }
        }
      } catch {
        setError("데이터를 불러오는 중 오류가 발생했어요.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isInitialized, user]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total earnings (all time) - mentor_amount is the actual payout after fees
    const totalEarnings = completedBookings.reduce(
      (sum, b) => sum + (b.mentor_amount || 0),
      0
    );

    // This month's earnings
    const thisMonthEarnings = completedBookings
      .filter((b) => new Date(b.scheduled_at) >= thisMonth)
      .reduce((sum, b) => sum + (b.mentor_amount || 0), 0);

    // Pending settlement (completed but not yet settled)
    // For simplicity, we consider all mentor_amount from completed bookings as potentially pending
    // In a real system, this would check against the settlements table
    const pendingSettlement = totalEarnings;

    // Total completed sessions
    const completedSessions = completedBookings.length;

    return {
      totalEarnings,
      thisMonthEarnings,
      pendingSettlement,
      completedSessions,
    };
  }, [completedBookings]);

  // Calculate monthly earnings for the last 6 months
  const monthlyEarnings = useMemo((): MonthlyEarnings[] => {
    const now = new Date();
    const months: MonthlyEarnings[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const monthAmount = completedBookings
        .filter((b) => {
          const bookingDate = new Date(b.scheduled_at);
          return bookingDate >= date && bookingDate < nextMonth;
        })
        .reduce((sum, b) => sum + (b.mentor_amount || 0), 0);

      months.push({
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: `${date.getMonth() + 1}월`,
        amount: monthAmount,
      });
    }

    return months;
  }, [completedBookings]);

  // Get max amount for chart scaling
  const maxMonthlyAmount = useMemo(() => {
    const max = Math.max(...monthlyEarnings.map((m) => m.amount));
    return max > 0 ? max : 100000; // Default scale if no data
  }, [monthlyEarnings]);

  // Transform bookings to transaction items
  const transactions = useMemo((): TransactionItem[] => {
    return completedBookings.slice(0, 10).map((booking) => {
      const menteeProfile = booking.mentee_id ? bookingProfiles[booking.mentee_id] : null;
      const product = booking.product_id ? bookingProducts[booking.product_id] : null;
      const productInfo = product ? PRODUCT_INFO[product.type] : null;

      return {
        id: booking.id,
        scheduledAt: booking.scheduled_at,
        menteeName: menteeProfile?.name || "멘티",
        productType: productInfo?.name || "멘토링",
        productIcon: productInfo?.icon || "coffee",
        amount: booking.amount,
        mentorAmount: booking.mentor_amount || 0,
        status: "completed",
      };
    });
  }, [completedBookings, bookingProfiles, bookingProducts]);

  // Loading state
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">로그인이 필요해요</h2>
          <p className="text-muted mb-6">수익 현황은 로그인 후 이용할 수 있어요.</p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-medium"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // Error state (mentor not found, not approved, etc.)
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">멘토 전용 페이지</h1>
          <p className="text-muted mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/mentor/apply"
              className="px-6 py-3 bg-primary text-white rounded-full font-medium"
            >
              멘토 지원하기
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

  // Not authorized (no mentor record found)
  if (!isAuthorized && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card-bg border border-card-border rounded-2xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">접근 권한이 없어요</h2>
          <p className="text-muted mb-6">멘토 전용 페이지입니다.</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/mentor/apply"
              className="px-6 py-3 bg-primary text-white rounded-full font-medium"
            >
              멘토 지원하기
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <LogoIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">커피챗</span>
            </Link>
            <span className="text-muted">/</span>
            <Link href="/mentor/dashboard" className="text-muted hover:text-foreground transition-colors text-sm">
              대시보드
            </Link>
            <span className="text-muted">/</span>
            <span className="font-medium">수익 현황</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted">{mentor?.name} 멘토</span>
            <Link href="/mentor/settlement" className="text-sm text-green-500 hover:underline">
              정산
            </Link>
            <Link href="/mentor/dashboard" className="text-sm text-primary hover:underline">
              대시보드
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">수익 현황</h1>
          <p className="text-muted">완료된 멘토링 수익을 한눈에 확인하세요.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-card-bg border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-muted">총 수익</p>
            </div>
            <p className="text-2xl font-bold text-primary">{formatKRW(stats.totalEarnings)}</p>
            <p className="text-xs text-muted mt-1">누적 기준</p>
          </div>

          <div className="bg-card-bg border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-muted">이번 달 수익</p>
            </div>
            <p className="text-2xl font-bold text-blue-500">{formatKRW(stats.thisMonthEarnings)}</p>
            <p className="text-xs text-muted mt-1">{new Date().getMonth() + 1}월</p>
          </div>

          <div className="bg-card-bg border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-muted">정산 대기</p>
            </div>
            <p className="text-2xl font-bold text-yellow-500">{formatKRW(stats.pendingSettlement)}</p>
            <p className="text-xs text-muted mt-1">
              <Link href="/mentor/settlement" className="hover:text-primary transition-colors">
                정산 페이지 바로가기 →
              </Link>
            </p>
          </div>

          <div className="bg-card-bg border border-card-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-muted">완료 세션</p>
            </div>
            <p className="text-2xl font-bold text-green-500">{stats.completedSessions}건</p>
            <p className="text-xs text-muted mt-1">누적 기준</p>
          </div>
        </div>

        {/* Monthly Earnings Chart */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-6">월별 수익 추이</h2>

          {stats.totalEarnings === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-muted">아직 완료된 세션이 없어요.</p>
              <p className="text-sm text-muted mt-1">멘토링을 완료하면 수익 추이가 표시됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chart Bars */}
              <div className="flex items-end justify-between gap-2 h-48">
                {monthlyEarnings.map((month) => {
                  const heightPercent = maxMonthlyAmount > 0
                    ? (month.amount / maxMonthlyAmount) * 100
                    : 0;

                  return (
                    <div key={month.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center justify-end h-40">
                        {month.amount > 0 && (
                          <span className="text-xs text-muted mb-1">
                            {(month.amount / 10000).toFixed(0)}만
                          </span>
                        )}
                        <div
                          className="w-full max-w-12 bg-gradient-to-t from-primary to-primary/70 rounded-t-lg transition-all duration-500"
                          style={{
                            height: `${Math.max(heightPercent, month.amount > 0 ? 8 : 0)}%`,
                            minHeight: month.amount > 0 ? "8px" : "0"
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted">{month.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="flex justify-between items-center pt-4 border-t border-card-border">
                <span className="text-sm text-muted">최근 6개월 총계</span>
                <span className="font-bold text-primary">
                  {formatKRW(monthlyEarnings.reduce((sum, m) => sum + m.amount, 0))}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">최근 완료 세션</h2>
            {transactions.length > 0 && (
              <Link
                href="/mentor/dashboard"
                className="text-sm text-primary hover:underline"
              >
                전체 보기 →
              </Link>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-muted">아직 완료된 세션이 없어요.</p>
              <p className="text-sm text-muted mt-1">멘토링이 완료되면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted">일시</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted">멘티</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted">상품</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted">결제금액</th>
                    <th className="text-right py-3 px-2 text-xs font-medium text-muted">수익</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-card-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-2">
                        <span className="text-sm">
                          {new Date(tx.scheduledAt).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span className="text-xs text-muted ml-1">
                          {new Date(tx.scheduledAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-sm font-medium">{tx.menteeName}</span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          <ProductIcon name={tx.productIcon} className="w-3.5 h-3.5 inline-block" /> {tx.productType}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="text-sm text-muted">{formatKRW(tx.amount)}</span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        <span className="text-sm font-semibold text-green-500">{formatKRW(tx.mentorAmount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link
            href="/mentor/settlement"
            className="block bg-card-bg border border-card-border rounded-2xl p-6 hover:border-green-500/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold group-hover:text-green-500 transition-colors">정산 관리</p>
                <p className="text-sm text-muted">정산 내역 확인 및 계좌 등록</p>
              </div>
              <svg className="w-5 h-5 text-muted group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/mentor/dashboard"
            className="block bg-card-bg border border-card-border rounded-2xl p-6 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold group-hover:text-primary transition-colors">대시보드</p>
                <p className="text-sm text-muted">예약 관리 및 스케줄 설정</p>
              </div>
              <svg className="w-5 h-5 text-muted group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
