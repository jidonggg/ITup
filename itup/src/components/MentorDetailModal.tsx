"use client";

import { useState, useEffect } from "react";
import { ConsultType, consultTypeLabels } from "@/data/mentors";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Review, MentorSchedule } from "@/lib/supabase/types";
import { getTierInfo } from "@/lib/pricing/tiers";
import { ProductIcon } from "@/components/icons";

export interface MentorData {
  id?: string;
  name: string;
  role: string;
  company: string;
  previousCompanies?: string[];
  experience: string;
  skills: string[];
  rating: number;
  sessions: number;
  bio: string;
  availableTimes: string[];
  reviews: number;
  consultTypes: ConsultType[];
  price?: number;
}

interface MentorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: MentorData | null;
  onConsultClick: () => void;
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const PRODUCT_DETAIL_MAP: Record<string, { icon: string; duration: string; description: string; features: string[] }> = {
  coffee_chat: {
    icon: "coffee",
    duration: "30분",
    description: "커리어, 회사, 업계 전반에 대해 편하게 이야기해요",
    features: ["1:1 온라인 화상 상담", "커리어 방향 상담", "자유 Q&A"],
  },
  document_review: {
    icon: "document",
    duration: "45분",
    description: "이력서와 포트폴리오를 꼼꼼히 피드백해요",
    features: ["서류 분석 + 첨삭 상담", "개선 포인트 피드백", "첨삭 후 1회 추가 확인"],
  },
  mock_interview: {
    icon: "target",
    duration: "60분",
    description: "실전처럼 모의면접을 진행하고 피드백해요",
    features: ["실전형 모의면접", "직무별 예상 질문 제공", "상세 피드백 리포트"],
  },
  free_trial: {
    icon: "gift",
    duration: "15분",
    description: "결제 없이 먼저 체험해 보세요",
    features: ["15분 무료 멘토링", "부담 없는 첫 만남"],
  },
};

function formatTime(time: string): string {
  // "HH:mm:ss" → "HH:mm"
  return time.slice(0, 5);
}

export default function MentorDetailModal({
  isOpen,
  onClose,
  mentor,
  onConsultClick,
}: MentorDetailModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [totalReviewCount, setTotalReviewCount] = useState(0);
  const [dbProducts, setDbProducts] = useState<{ type: string; price: number; title: string }[]>([]);
  const [schedules, setSchedules] = useState<MentorSchedule[]>([]);

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  // Fetch reviews, products, and schedules when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !mentor?.id || !isSupabaseConfigured()) return;

      setReviews([]);
      setReviewsError(false);
      setIsLoadingReviews(true);
      setSchedules([]);

      try {
        const supabase = createClient();
        const [reviewsRes, productsRes] = await Promise.all([
          supabase
            .from("reviews")
            .select("*", { count: "exact" })
            .eq("mentor_id", mentor.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("products")
            .select("type, price, title")
            .eq("mentor_id", mentor.id)
            .eq("is_active", true)
            .order("price", { ascending: true }),
        ]);

        if (reviewsRes.data) {
          setReviews(reviewsRes.data);
          setTotalReviewCount(reviewsRes.count ?? reviewsRes.data.length);
        }
        if (productsRes.data) {
          setDbProducts(productsRes.data);
        }

        // Fetch schedules (table may not exist)
        try {
          const { data: schedulesData } = await supabase
            .from("mentor_schedules")
            .select("*")
            .eq("mentor_id", mentor.id)
            .eq("is_active", true)
            .order("day_of_week", { ascending: true });
          if (schedulesData) {
            setSchedules(schedulesData);
          }
        } catch {
          // mentor_schedules table might not exist
        }
      } catch {
        setReviewsError(true);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchData();
  }, [isOpen, mentor?.id]);

  if (!isOpen || !mentor) return null;

  const handleConsultClick = () => {
    onClose();
    onConsultClick();
  };

  const tierInfo = getTierInfo(mentor.experience);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mentor-detail-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xl animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card-bg/95 backdrop-blur-2xl border border-card-border/40 rounded-3xl shadow-[0_25px_80px_-12px_rgba(160,113,79,0.2)] animate-[modalIn_0.3s_ease-out] max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-foreground hover:bg-secondary/60 rounded-full transition-all cursor-pointer z-10"
          aria-label="닫기"
          type="button"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header - Profile */}
        <div className="relative h-32 bg-gradient-to-br from-primary/20 via-accent/15 to-primary-light/20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_var(--accent)_0%,_transparent_50%)] opacity-20" />
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold border-4 border-card-bg shadow-xl shadow-primary/20">
              {mentor.name[0]}
            </div>
          </div>
        </div>

        <div className="pt-14 px-6 pb-6">
          {/* Name & Role */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 id="mentor-detail-modal-title" className="text-xl font-bold">{mentor.name}</h2>
              <span className="px-2 py-0.5 bg-primary/15 text-primary text-xs font-semibold rounded-full">
                {mentor.company}
              </span>
              <span className="px-2 py-0.5 bg-accent/15 text-accent text-xs font-medium rounded-full flex items-center gap-1">
                <ProductIcon name={tierInfo.badge} className="w-3.5 h-3.5" /> {tierInfo.name}
              </span>
            </div>
            <p className="text-muted text-sm">{mentor.role} · {mentor.experience} 경력</p>
            {mentor.previousCompanies && mentor.previousCompanies.length > 0 && (
              <p className="text-xs text-muted/70 mt-1">
                이전: {mentor.previousCompanies.join(", ")}
              </p>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-5 mb-6 pb-5 border-b border-card-border/40">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-bold">{mentor.rating}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {mentor.reviews}개 리뷰
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {mentor.sessions}회
            </div>
          </div>

          {/* Bio */}
          {mentor.bio && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold mb-2">소개</h3>
              <p className="text-foreground/85 text-sm leading-relaxed">{mentor.bio}</p>
            </div>
          )}

          {/* Skills / Tech Stack */}
          {mentor.skills.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                기술 스택
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {mentor.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 bg-gradient-to-r from-primary/8 to-accent/8 text-foreground/85 text-xs font-medium rounded-lg border border-primary/10"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Consult Types */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              상담 유형
            </h3>
            <div className="flex flex-wrap gap-2">
              {mentor.consultTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1.5 bg-accent/12 text-accent text-xs font-medium rounded-lg"
                >
                  {consultTypeLabels[type]}
                </span>
              ))}
            </div>
          </div>

          {/* Schedule - Weekly Grid */}
          <div className="mb-5">
            <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              멘토링 가능 시간
            </h3>

            {schedules.length > 0 ? (
              /* Weekly grid view */
              <div className="bg-secondary/30 rounded-xl p-3">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAY_LABELS.map((day, i) => {
                    const schedule = schedules.find((s) => s.day_of_week === i);
                    return (
                      <div key={i} className="text-center">
                        <span className={`block text-[10px] font-bold mb-1 ${schedule ? "text-primary" : "text-muted/40"}`}>
                          {day}
                        </span>
                        <div className={`rounded-lg py-1.5 px-0.5 text-[10px] leading-tight ${
                          schedule
                            ? "bg-primary/12 text-primary font-medium border border-primary/20"
                            : "bg-secondary/50 text-muted/30"
                        }`}>
                          {schedule ? (
                            <>
                              <span className="block">{formatTime(schedule.start_time)}</span>
                              <span className="block text-[8px] text-muted/60">~</span>
                              <span className="block">{formatTime(schedule.end_time)}</span>
                            </>
                          ) : (
                            <span className="block py-1">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted text-center mt-1">
                  상품 선택 후 날짜/시간을 예약할 수 있어요
                </p>
              </div>
            ) : mentor.availableTimes.length > 0 ? (
              /* Fallback: plain text available times */
              <div className="bg-secondary/30 rounded-xl p-3 space-y-1.5">
                {mentor.availableTimes.map((time, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-2">
                    <svg className="w-3.5 h-3.5 text-primary/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm text-foreground/80">{time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted bg-secondary/30 rounded-xl p-3 text-center">
                등록된 가능 시간이 없어요
              </p>
            )}
          </div>

          {/* Products - Detailed Cards */}
          {dbProducts.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                멘토링 상품
              </h3>
              <div className="space-y-3">
                {dbProducts.map((product) => {
                  const typeKey = product.type as string;
                  const info = PRODUCT_DETAIL_MAP[typeKey];
                  return (
                    <div
                      key={product.type}
                      className="p-4 rounded-xl border border-card-border hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <ProductIcon name={info?.icon || "coffee"} className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{product.title}</p>
                            <p className="text-xs text-muted">{info?.duration || ""}</p>
                          </div>
                        </div>
                        <p className="text-base font-bold text-primary whitespace-nowrap">
                          {product.price.toLocaleString()}원
                        </p>
                      </div>
                      {info && (
                        <>
                          <p className="text-xs text-muted mb-2 ml-[46px]">{info.description}</p>
                          <div className="ml-[46px] space-y-1">
                            {info.features.slice(0, 3).map((f, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-foreground/70">
                                <svg className="w-3 h-3 text-primary/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {f}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {mentor.reviews > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                멘티 후기 ({mentor.reviews}개)
              </h3>
              {isLoadingReviews ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : reviewsError ? (
                <p className="text-sm text-red-400 text-center py-4">
                  리뷰를 불러오지 못했어요.
                </p>
              ) : reviews.length > 0 ? (
                <div className="space-y-2.5">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-3 bg-secondary/40 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{review.user_name}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-muted"
                                }`}
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted">
                          {new Date(review.created_at).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80">{review.content}</p>
                    </div>
                  ))}
                  {totalReviewCount > 5 && (
                    <p className="text-xs text-muted text-center pt-1">
                      최신 리뷰 5개 표시 중 (전체 {totalReviewCount}개)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted text-center py-4">
                  아직 작성된 리뷰가 없어요.
                </p>
              )}
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={handleConsultClick}
            className="shine-effect w-full py-4 bg-gradient-to-r from-primary via-primary-dark to-primary text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
          >
            상품 선택 후 신청하기
          </button>
        </div>
      </div>
    </div>
  );
}
