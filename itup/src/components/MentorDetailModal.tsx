"use client";

import { ConsultType, consultTypeLabels } from "@/data/mentors";
import { useModalClose, useBodyScrollLock } from "@/hooks/useModal";

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
  useModalClose(isOpen, onClose);
  useBodyScrollLock(isOpen);

  if (!isOpen || !mentor) return null;

  const handleConsultClick = () => {
    onClose();
    onConsultClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card-bg border border-card-border rounded-2xl shadow-[0_25px_80px_-12px_rgba(139,92,246,0.4)] animate-[modalIn_0.3s_ease-out] max-h-[85vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-foreground transition-colors cursor-pointer z-10"
          aria-label="닫기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header - Profile */}
        <div className="relative h-32 bg-gradient-to-br from-primary/30 to-accent/30">
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold border-4 border-card-bg shadow-lg">
              {mentor.name[0]}
            </div>
          </div>
        </div>

        <div className="pt-16 px-6 pb-6">
          {/* Name & Role */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="text-2xl font-bold">{mentor.name}</h2>
              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">
                {mentor.company}
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
          <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/50 rounded-xl mb-6">
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

          {/* CTA Button */}
          <button
            onClick={handleConsultClick}
            className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 cursor-pointer"
          >
            이 멘토에게 상담 신청
          </button>
        </div>
      </div>
    </div>
  );
}
