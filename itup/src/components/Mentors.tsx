"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { MentorData } from "@/components/MentorDetailModal";
import { mentorsData as fallbackMentors } from "@/data/mentors";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mentor, ConsultType } from "@/lib/supabase/types";

interface MentorsProps {
  onMentorClick: (mentor: MentorData) => void;
}

function convertToMentorData(mentor: Mentor): MentorData {
  return {
    id: mentor.id,
    name: mentor.name,
    role: mentor.role,
    company: mentor.company,
    previousCompanies: mentor.previous_companies || [],
    experience: mentor.experience,
    skills: mentor.skills,
    rating: mentor.rating,
    sessions: mentor.sessions,
    reviews: mentor.reviews,
    bio: mentor.bio || "",
    availableTimes: mentor.available_times || [],
    consultTypes: mentor.consult_types as ConsultType[],
    price: mentor.price || undefined,
  };
}

export default function Mentors({ onMentorClick }: MentorsProps) {
  const { ref: titleRef, isVisible: titleVisible } = useScrollAnimation<HTMLDivElement>();
  const [mentors, setMentors] = useState<MentorData[]>(fallbackMentors);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      if (!isSupabaseConfigured()) {
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("mentors")
          .select("*")
          .eq("is_approved", true)
          .order("rating", { ascending: false });

        if (error) {
          return;
        }

        if (data && data.length > 0) {
          setMentors(data.map(convertToMentorData));
        }
      } catch {
        // 멘토 목록 로드 실패 시 폴백 데이터 유지
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, []);

  return (
    <section id="mentors" className="py-28 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.03] rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          ref={titleRef}
          className={`text-center mb-16 scroll-animate ${titleVisible ? "visible" : ""}`}
        >
          <span className="inline-block px-4 py-1.5 bg-primary/8 text-primary text-xs font-semibold tracking-widest uppercase rounded-full mb-5 border border-primary/10">
            Mentors
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 tracking-tight">
            이런 <span className="text-primary">멘토</span>들이 기다리고 있어요
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            국내 유명 게임사 현직자들과 이야기 나눠요
          </p>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <MentorCardSkeleton key={index} />
            ))
          ) : (
            mentors.map((mentor, index) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                index={index}
                onClick={() => onMentorClick(mentor)}
              />
            ))
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-14">
          <Link
            href="/mentors"
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-card-bg/60 backdrop-blur-sm border border-card-border/60 text-foreground hover:border-primary/40 hover:text-primary hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer rounded-full font-medium"
          >
            모든 멘토 보기
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
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

function MentorCardSkeleton() {
  return (
    <div className="premium-card rounded-2xl overflow-hidden">
      <div className="h-44 bg-gradient-to-br from-secondary/80 to-secondary/40 animate-pulse" />
      <div className="p-6">
        <div className="h-5 bg-secondary/80 rounded-lg w-2/3 mb-2" />
        <div className="h-4 bg-secondary/60 rounded-lg w-1/2 mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-secondary/60 rounded-full w-16" />
          <div className="h-6 bg-secondary/60 rounded-full w-12" />
        </div>
        <div className="pt-4 border-t border-card-border/40 flex justify-between">
          <div className="h-4 bg-secondary/60 rounded-lg w-12" />
          <div className="h-4 bg-secondary/60 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
}

function MentorCard({ mentor, index, onClick }: MentorCardProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`scroll-animate ${isVisible ? "visible" : ""}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${mentor.name} 멘토 상세 정보 보기`}
        className="group relative premium-card rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        {/* Avatar Section */}
        <div className="relative h-44 bg-gradient-to-br from-primary/8 via-accent/6 to-primary-light/8 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_var(--accent)_0%,_transparent_60%)] opacity-15" />
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold transform group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/20">
            {mentor.name[0]}
          </div>
          {/* Company Badge */}
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-card-bg/80 backdrop-blur-md rounded-full text-xs font-semibold text-primary-dark border border-primary/10">
            {mentor.company}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-5">
          <h3 className="text-base font-bold mb-1 group-hover:text-primary transition-colors duration-300">
            {mentor.name}
          </h3>
          <p className="text-muted text-sm mb-3">{mentor.role}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="px-2.5 py-1 bg-primary/8 text-primary text-xs font-medium rounded-full">
              {mentor.experience} 경력
            </span>
            {mentor.skills.slice(0, 3).map((skill) => (
              <span key={skill} className="px-2.5 py-1 bg-gradient-to-r from-primary/6 to-accent/6 text-foreground/70 text-xs font-medium rounded-full border border-primary/8">
                {skill}
              </span>
            ))}
            {mentor.skills.length > 3 && (
              <span className="px-2.5 py-1 bg-secondary/80 text-muted text-xs rounded-full">
                +{mentor.skills.length - 3}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3.5 border-t border-card-border/40">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-bold text-foreground">{mentor.rating}</span>
            </div>
            <span className="text-xs text-muted font-medium">{mentor.sessions}회 멘토링</span>
          </div>
        </div>
      </div>
    </div>
  );
}
