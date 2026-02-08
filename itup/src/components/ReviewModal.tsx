"use client";

import { useState, useCallback } from "react";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";
import { useToast } from "@/contexts/ToastContext";
import { createClient } from "@/lib/supabase/client";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  mentorId: string;
  mentorName: string;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export default function ReviewModal({
  isOpen,
  onClose,
  consultationId,
  mentorId,
  mentorName,
  userId,
  userName,
  onSuccess,
}: ReviewModalProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleClose = useCallback(() => {
    setRating(5);
    setContent("");
    setHoveredRating(0);
    onClose();
  }, [onClose]);

  useModalClose(isOpen, handleClose);
  useBodyScrollLock(isOpen);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (content.length < 10) {
      showToast("리뷰는 최소 10자 이상 작성해주세요.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // 리뷰 저장
      const { error: reviewError } = await supabase.from("reviews").insert({
        consultation_id: consultationId,
        mentor_id: mentorId,
        user_id: userId,
        user_name: userName,
        rating,
        content,
      });

      if (reviewError) {
        if (reviewError.code === "23505") {
          showToast("이미 이 커피챗에 대한 리뷰를 작성했어요.", "error");
        } else {
          throw reviewError;
        }
        setIsSubmitting(false);
        return;
      }

      // 상담에 리뷰 작성 표시
      await supabase
        .from("consultations")
        .update({ has_review: true })
        .eq("id", consultationId);

      showToast("리뷰가 등록되었어요.", "success");
      onSuccess?.();
      handleClose();
    } catch (error) {
      showToast("리뷰 등록 중 오류가 발생했어요.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(160,113,79,0.25)] animate-[modalIn_0.3s_ease-out]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-foreground transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold mb-2">리뷰 작성</h2>
          <p className="text-muted text-sm mb-6">
            {mentorName} 멘토님과의 상담은 어떠셨나요?
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 별점 */}
            <div>
              <label className="block text-sm font-medium mb-3">만족도</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110 cursor-pointer"
                    aria-label={`${star}점`}
                  >
                    <svg
                      className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-600"
                      }`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                      />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted mt-2">
                {rating === 1 && "별로예요"}
                {rating === 2 && "그저 그래요"}
                {rating === 3 && "보통이에요"}
                {rating === 4 && "좋아요"}
                {rating === 5 && "최고예요!"}
              </p>
            </div>

            {/* 리뷰 내용 */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                리뷰 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="멘토링 경험을 자세히 공유해주세요 (최소 10자)"
                rows={4}
                required
                minLength={10}
                maxLength={500}
                className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <p className="text-xs text-muted mt-1 text-right">
                {content.length}/500
              </p>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isSubmitting || content.length < 10}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  등록 중...
                </span>
              ) : (
                "리뷰 등록"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
