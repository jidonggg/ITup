"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Mentor, ConsultType } from "@/lib/supabase/types";
import { mentorsData as fallbackMentors, consultTypeLabels, skillCategories } from "@/data/mentors";
import { MentorData } from "@/components/MentorDetailModal";
import MentorDetailModal from "@/components/MentorDetailModal";
import ConsultModal from "@/components/ConsultModal";

function convertToMentorData(mentor: Mentor): MentorData & { id: string } {
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
  };
}

const companies = ["전체", "넥슨", "넷마블", "크래프톤", "스마일게이트", "펄어비스", "기타"];
const consultTypes: { value: ConsultType | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "coffee", label: "커피챗" },
  { value: "resume", label: "이력서/포트폴리오" },
  { value: "interview", label: "모의면접" },
];

// Initial fallback data with IDs
const initialMentors = fallbackMentors.map((m, i) => ({
  ...m,
  id: `fallback-${i}`,
}));

const MENTORS_PER_PAGE = 9;

export default function MentorsPage() {
  const [mentors, setMentors] = useState<(MentorData & { id: string })[]>(initialMentors);
  const [filteredMentors, setFilteredMentors] = useState<(MentorData & { id: string })[]>(initialMentors);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [selectedCompany, setSelectedCompany] = useState("전체");
  const [selectedConsultType, setSelectedConsultType] = useState<ConsultType | "all">("all");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedMentor, setSelectedMentor] = useState<(MentorData & { id: string }) | null>(null);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultMentorId, setConsultMentorId] = useState<string | undefined>();

  useEffect(() => {
    const fetchMentors = async () => {
      if (!isSupabaseConfigured()) {
        // Already have initial data, no need to fetch
        return;
      }

      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("mentors")
          .select("*")
          .eq("is_approved", true)
          .order("rating", { ascending: false });

        if (error) {
          console.error("Error fetching mentors:", error);
          // Keep initial fallback data
          return;
        }

        if (data && data.length > 0) {
          const converted = data.map(convertToMentorData);
          setMentors(converted);
          setFilteredMentors(converted);
        }
        // If no data, keep the initial fallback data
      } catch (error) {
        console.error("Error fetching mentors:", error);
        // Keep initial fallback data
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentors();
  }, []);

  // Filter logic
  useEffect(() => {
    let result = [...mentors];

    // Company filter
    if (selectedCompany !== "전체") {
      if (selectedCompany === "기타") {
        const majorCompanies = companies.filter(c => c !== "전체" && c !== "기타");
        result = result.filter(m => !majorCompanies.includes(m.company));
      } else {
        result = result.filter(m => m.company === selectedCompany);
      }
    }

    // Consult type filter
    if (selectedConsultType !== "all") {
      result = result.filter(m => m.consultTypes.includes(selectedConsultType));
    }

    // Skills filter
    if (selectedSkills.length > 0) {
      result = result.filter(m =>
        selectedSkills.some(skill => m.skills.includes(skill))
      );
    }

    setFilteredMentors(result);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [mentors, selectedCompany, selectedConsultType, selectedSkills]);

  // Pagination
  const totalPages = Math.ceil(filteredMentors.length / MENTORS_PER_PAGE);
  const paginatedMentors = filteredMentors.slice(
    (currentPage - 1) * MENTORS_PER_PAGE,
    currentPage * MENTORS_PER_PAGE
  );

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSelectedCompany("전체");
    setSelectedConsultType("all");
    setSelectedSkills([]);
  };

  const openMentorModal = (mentor: MentorData & { id: string }) => {
    setSelectedMentor(mentor);
    setIsMentorModalOpen(true);
  };

  const closeMentorModal = () => {
    setIsMentorModalOpen(false);
    // selectedMentor는 ConsultModal에서 사용하므로 여기서 null로 설정하지 않음
  };

  const openConsultModal = () => {
    if (selectedMentor) {
      setConsultMentorId(selectedMentor.id);
    }
    setIsMentorModalOpen(false);
    setIsConsultModalOpen(true);
  };

  const closeConsultModal = () => {
    setIsConsultModalOpen(false);
    setConsultMentorId(undefined);
    setSelectedMentor(null); // ConsultModal 닫을 때 selectedMentor 초기화
  };

  const hasActiveFilters = selectedCompany !== "전체" || selectedConsultType !== "all" || selectedSkills.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-secondary/90 backdrop-blur-md border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-xl">☕</span>
              </div>
              <span className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                커피챗
              </span>
            </Link>
            <Link
              href="/"
              className="text-muted hover:text-foreground transition-colors"
            >
              홈으로
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">멘토 찾기</h1>
          <p className="text-muted">
            {filteredMentors.length}명의 현직자 멘토가 당신을 기다리고 있습니다
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-card-bg border border-card-border rounded-2xl p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold">필터</h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:underline cursor-pointer"
                  >
                    초기화
                  </button>
                )}
              </div>

              {/* Company Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted mb-3">회사</h3>
                <div className="flex flex-wrap gap-2">
                  {companies.map(company => (
                    <button
                      key={company}
                      onClick={() => setSelectedCompany(company)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                        selectedCompany === company
                          ? "bg-primary text-white"
                          : "bg-secondary text-muted hover:bg-secondary/80"
                      }`}
                    >
                      {company}
                    </button>
                  ))}
                </div>
              </div>

              {/* Consult Type Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted mb-3">상담 유형</h3>
                <div className="flex flex-wrap gap-2">
                  {consultTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedConsultType(type.value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                        selectedConsultType === type.value
                          ? "bg-accent text-white"
                          : "bg-secondary text-muted hover:bg-secondary/80"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills Filter */}
              <div>
                <h3 className="text-sm font-medium text-muted mb-3">기술 스택</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(skillCategories).map(([key, category]) => (
                    <div key={key}>
                      <p className="text-xs text-muted mb-1.5">{category.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {category.skills.slice(0, 4).map(skill => (
                          <button
                            key={skill}
                            onClick={() => handleSkillToggle(skill)}
                            className={`px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                              selectedSkills.includes(skill)
                                ? "bg-primary text-white"
                                : "bg-secondary text-muted hover:bg-secondary/80"
                            }`}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Mentors Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <MentorCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
                <p className="text-muted mb-4">다른 필터 조건을 시도해보세요</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-primary text-white rounded-full text-sm cursor-pointer"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedMentors.map(mentor => (
                    <MentorCard
                      key={mentor.id}
                      mentor={mentor}
                      onClick={() => openMentorModal(mentor)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-card-border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                          currentPage === page
                            ? "bg-primary text-white"
                            : "border border-card-border hover:border-primary hover:text-primary"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-card-border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <MentorDetailModal
        isOpen={isMentorModalOpen}
        onClose={closeMentorModal}
        mentor={selectedMentor}
        onConsultClick={openConsultModal}
      />
      <ConsultModal
        isOpen={isConsultModalOpen}
        onClose={closeConsultModal}
        mentorId={consultMentorId}
        mentorName={selectedMentor?.name}
        mentorAvailableTimes={selectedMentor?.availableTimes}
        mentorPrice={selectedMentor?.price}
      />
    </div>
  );
}

function MentorCardSkeleton() {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl overflow-hidden animate-pulse">
      <div className="h-32 bg-secondary" />
      <div className="p-5">
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

interface MentorCardProps {
  mentor: MentorData & { id: string };
  onClick: () => void;
}

function MentorCard({ mentor, onClick }: MentorCardProps) {
  return (
    <div
      onClick={onClick}
      className="group bg-card-bg border border-card-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer"
    >
      {/* Avatar Section */}
      <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold transform group-hover:scale-110 transition-transform duration-300">
          {mentor.name[0]}
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-background/80 backdrop-blur-sm rounded-full text-xs font-medium text-primary">
          {mentor.company}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
          {mentor.name}
        </h3>
        <p className="text-muted text-sm mb-3">{mentor.role}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md">
            {mentor.experience} 경력
          </span>
          {mentor.skills.slice(0, 2).map(skill => (
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

        {/* Consult Types */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {mentor.consultTypes.map(type => (
            <span key={type} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded">
              {consultTypeLabels[type]}
            </span>
          ))}
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
    </div>
  );
}
