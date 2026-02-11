"use client";

import { useState, useEffect } from "react";
import { ConsultType, consultTypeLabels } from "@/data/mentors";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Review } from "@/lib/supabase/types";
import { products } from "@/lib/payment/types";
import { getTierInfo, getTieredPrice } from "@/lib/pricing/tiers";

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

  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  // Fetch reviews when modal opens
  useEffect(() => {
    const fetchReviews = async () => {
      if (!isOpen || !mentor?.id || !isSupabaseConfigured()) return;

      setReviews([]);
      setReviewsError(false);
      setIsLoadingReviews(true);
      try {
        const supabase = createClient();
        const { data, count } = await supabase
          .from("reviews")
          .select("*", { count: "exact" })
          .eq("mentor_id", mentor.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (data) {
          setReviews(data);
          setTotalReviewCount(count ?? data.length);
        }
      } catch (error) {
        setReviewsError(true);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [isOpen, mentor?.id]);

  if (!isOpen || !mentor) return null;

  const handleConsultClick = () => {
    onClose();
    onConsultClick();
  };

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
      <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-card-border/40 rounded-3xl shadow-[0_25px_80px_-12px_rgba(160,113,79,0.2)] animate-[modalIn_0.3s_ease-out] max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-foreground hover:bg-white/60 rounded-full transition-all cursor-pointer z-10"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header - Profile */}
        <div className="relative h-36 bg-gradient-to-br from-primary/20 via-accent/15 to-primary-light/20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_var(--accent)_0%,_transparent_50%)] opacity-20" />
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-xl shadow-primary/20">
              {mentor.name[0]}
            </div>
          </div>
        </div>

        <div className="pt-16 px-6 pb-6">
          {/* Name & Role */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 id="mentor-detail-modal-title" className="text-2xl font-bold">{mentor.name}</h2>
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                {mentor.company}
              </span>
              <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded-full">
                {getTierInfo(mentor.experience).badge} {getTierInfo(mentor.experience).name}
              </span>
            </div>
            <p className="text-muted">{mentor.role}</p>
            {/* Previous Companies */}
            {mentor.previousCompanies && mentor.previousCompanies.length > 0 && (
              <p className="text-xs text-muted mt-1">
                이전: {mentor.previousCompanies.join(", ")}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-secondary/40 to-secondary/20 backdrop-blur-sm rounded-2xl mb-6 border border-card-border/30">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                {mentor.rating}
              </div>
              <p className="text-xs text-muted">평점</p>
            </div>
            <div className="text-center border-x border-card-border">
              <div className="text-lg font-bold text-primary">{mentor.sessions}회</div>
              <p className="text-xs text-muted">멘토링</p>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{mentor.reviews}개</div>
              <p className="text-xs text-muted">리뷰</p>
            </div>
          </div>

          {/* Consult Types */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted mb-2">상담 가능 유형</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.consultTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1.5 bg-accent/20 text-accent text-xs font-medium rounded-full"
                >
                  {consultTypeLabels[type]}
                </span>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted mb-2">소개</h3>
            <p className="text-foreground/90 text-sm leading-relaxed">{mentor.bio}</p>
          </div>

          {/* Experience */}
          <div className="mb-6">
            <div className="p-3 bg-secondary/50 rounded-xl">
              <h3 className="text-xs font-semibold text-muted mb-1">경력</h3>
              <p className="text-sm font-medium">{mentor.experience}</p>
            </div>
          </div>

          {/* Skills */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted mb-2">기술 스택</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-secondary text-foreground/80 text-xs font-medium rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Available Times */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted mb-2">멘토링 가능 시간</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.availableTimes.map((time, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full"
                >
                  {time}
                </span>
              ))}
            </div>
          </div>

          {/* Product Prices */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted mb-3">상품별 가격</h3>
            <div className="space-y-2">
              {products
                .filter((p) => mentor.consultTypes.includes(p.id as ConsultType))
                .map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/10"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{product.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted">{product.duration}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {getTieredPrice(product.id, mentor.experience).toLocaleString()}원
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Reviews Section */}
          {mentor.reviews > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted mb-3">
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
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-3 bg-secondary/50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{review.user_name}</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-600"
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
                    <p className="text-xs text-muted text-center pt-2">
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
