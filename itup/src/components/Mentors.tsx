"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { MentorData } from "@/components/MentorDetailModal";
import { mentorsData } from "@/data/mentors";

interface MentorsProps {
  onMentorClick: (mentor: MentorData) => void;
}

export default function Mentors({ onMentorClick }: MentorsProps) {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <section id="mentors" className="py-24 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={titleRef}
          className={`text-center mb-16 scroll-animate ${titleVisible ? "visible" : ""}`}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Mentors
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary">현직자</span> 멘토를 만나보세요
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            국내 유명 게임사에서 활약 중인 현직자들이 여러분의 성장을 도와드립니다
          </p>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mentorsData.map((mentor, index) => (
            <MentorCard
              key={mentor.name}
              mentor={mentor}
              index={index}
              onClick={() => onMentorClick(mentor)}
            />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="group inline-flex items-center gap-2 px-8 py-4 border border-card-border rounded-full text-foreground hover:border-primary hover:text-primary transition-all duration-300 cursor-pointer">
            모든 멘토 보기
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

interface MentorCardProps {
  mentor: MentorData;
  index: number;
  onClick: () => void;
}

function MentorCard({ mentor, index, onClick }: MentorCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`scroll-animate ${isVisible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        onClick={onClick}
        className="group relative bg-card-bg border border-card-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer"
      >
        {/* Avatar Section */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold transform group-hover:scale-110 transition-transform duration-300">
            {mentor.name[0]}
          </div>
          {/* Company Badge */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium text-primary">
            {mentor.company}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
            {mentor.name}
          </h3>
          <p className="text-muted text-sm mb-4">{mentor.role}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
              {mentor.experience} 경력
            </span>
            {mentor.skills.slice(0, 2).map((skill) => (
              <span key={skill} className="px-2 py-1 bg-secondary text-muted text-xs rounded-md">
                {skill}
              </span>
            ))}
            {mentor.skills.length > 2 && (
              <span className="px-2 py-1 bg-secondary text-muted text-xs rounded-md">
                +{mentor.skills.length - 2}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-card-border">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-medium">{mentor.rating}</span>
            </div>
            <span className="text-xs text-muted">{mentor.sessions}회 멘토링</span>
          </div>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    </div>
  );
}
