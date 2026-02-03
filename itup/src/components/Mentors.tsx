"use client";

import { useEffect, useState } from "react";
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
          console.error("Error fetching mentors:", error);
          return;
        }

        if (data && data.length > 0) {
          setMentors(data.map(convertToMentorData));
        }
      } catch (error) {
        console.error("Error fetching mentors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, []);

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
            이런 <span className="text-primary">멘토</span>들이 기다리고 있어요
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            국내 유명 게임사 현직자들과 이야기 나눠요
          </p>
        </div>

        {/* Mentors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <MentorCardSkeleton key={index} />
            ))
          ) : (
            mentors.map((mentor, index) => (
              <MentorCard
                key={`mentor-${index}`}
                mentor={mentor}
                index={index}
                onClick={() => onMentorClick(mentor)}
              />
            ))
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <a
            href="/mentors"
            className="group inline-flex items-center gap-2 px-8 py-4 border border-card-border text-foreground hover:border-primary hover:text-primary transition-all duration-300 cursor-pointer rounded-full"
          >
            모든 멘토 보기
            <svg
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
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
    <div className="bg-card-bg border border-card-border rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-secondary" />
      <div className="p-6">
        <div className="h-6 bg-secondary rounded w-2/3 mb-2" />
        <div className="h-4 bg-secondary rounded w-1/2 mb-4" />
        <div className="flex gap-2 mb-4">
          <div className="h-6 bg-secondary rounded w-16" />
          <div className="h-6 bg-secondary rounded w-12" />
        </div>
        <div className="pt-4 border-t border-card-border flex justify-between">
          <div className="h-4 bg-secondary rounded w-12" />
          <div className="h-4 bg-secondary rounded w-16" />
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
