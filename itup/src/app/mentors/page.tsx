"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/track";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { LogoIcon, ProductIcon } from "@/components/icons";
import { Mentor, ConsultType, JobType, EngineType } from "@/lib/supabase/types";
import { consultTypeLabels, skillCategories } from "@/data/mentors";
import { MentorData } from "@/components/MentorDetailModal";
import MentorDetailModal from "@/components/MentorDetailModal";
import ConsultModal from "@/components/ConsultModal";
import { getTierInfo } from "@/lib/pricing/tiers";
import { JOB_TYPES, ENGINE_TYPES } from "@/lib/constants";
import { BottomSheet } from "@/components/mobile";

type SortOption = "recommended" | "rating" | "reviews" | "sessions";
const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "추천순" },
  { value: "rating", label: "평점 높은순" },
  { value: "reviews", label: "리뷰 많은순" },
  { value: "sessions", label: "세션 많은순" },
];

function convertToMentorData(mentor: Mentor & { minPrice?: number }): MentorData & { id: string } {
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
    price: mentor.minPrice,
  };
}

const companies = [
  "전체",
  "넥슨", "넷마블", "크래프톤", "스마일게이트", "펄어비스",
  "NC소프트", "카카오게임즈", "위메이드", "컴투스",
  "데브시스터즈", "시프트업", "네오위즈", "NHN",
  "기타",
];
const consultTypes: { value: ConsultType | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "coffee", label: "커피챗" },
  { value: "resume", label: "이력서/포폴 첨삭" },
  { value: "interview", label: "모의면접" },
];

const MENTORS_PER_PAGE = 9;

export default function MentorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <MentorsContent />
    </Suspense>
  );
}

function MentorsContent() {
  const searchParams = useSearchParams();
  const [mentors, setMentors] = useState<(MentorData & { id: string })[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<(MentorData & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCompany, setSelectedCompany] = useState("전체");
  const [selectedConsultType, setSelectedConsultType] = useState<ConsultType | "all">("all");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedJobType, setSelectedJobType] = useState<JobType | "all">("all");
  const [selectedEngineType, setSelectedEngineType] = useState<EngineType | "all">("all");

  // Search & Sort
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Analytics: page view on mount
  const didTrackPageView = useRef(false);
  useEffect(() => {
    if (!didTrackPageView.current) {
      didTrackPageView.current = true;
      trackEvent({ category: "page_view", action: "mentors_view" });
    }
  }, []);

  // Mobile detection (responsive)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Mobile filter bottom sheet
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Read initial filters from URL searchParams
  useEffect(() => {
    const jobType = searchParams.get("job_type");
    const engine = searchParams.get("engine");
    const product = searchParams.get("product");

    if (jobType && JOB_TYPES.some(j => j.value === jobType)) {
      setSelectedJobType(jobType as JobType);
    }
    if (engine && ENGINE_TYPES.some(e => e.value === engine)) {
      setSelectedEngineType(engine as EngineType);
    }
    // ProductType → ConsultType 매핑
    const productToConsult: Record<string, ConsultType> = {
      coffee_chat: "coffee",
      document_review: "resume",
      mock_interview: "interview",
    };
    if (product && productToConsult[product]) {
      setSelectedConsultType(productToConsult[product]);
    }
  }, [searchParams]);

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
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const supabase = createClient();
        const [mentorsResult, productsResult] = await Promise.all([
          supabase
            .from("mentors")
            .select("*")
            .eq("is_approved", true)
            .order("rating", { ascending: false }),
          supabase
            .from("products")
            .select("mentor_id, price")
            .eq("is_active", true),
        ]);

        if (mentorsResult.error) {
          return;
        }

        if (mentorsResult.data && mentorsResult.data.length > 0) {
          // Build min price map from products
          const minPriceMap: Record<string, number> = {};
          if (productsResult.data) {
            for (const p of productsResult.data) {
              if (!minPriceMap[p.mentor_id] || p.price < minPriceMap[p.mentor_id]) {
                minPriceMap[p.mentor_id] = p.price;
              }
            }
          }

          const converted = mentorsResult.data.map((m: Mentor) =>
            convertToMentorData({ ...m, minPrice: minPriceMap[m.id] })
          );
          setMentors(converted);
          setFilteredMentors(converted);
        }
        // If no data, keep the initial fallback data
      } catch (error) {
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

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.skills.some(s => s.toLowerCase().includes(q)) ||
        (m.bio && m.bio.toLowerCase().includes(q))
      );
    }

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

    // Job type filter (not available in DB yet, skip)
    // Engine filter (not available in DB yet, skip)

    // Sort
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        result.sort((a, b) => b.reviews - a.reviews);
        break;
      case "sessions":
        result.sort((a, b) => b.sessions - a.sessions);
        break;
      case "recommended":
      default:
        // Default order from DB (already sorted by rating desc)
        break;
    }

    setFilteredMentors(result);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로
  }, [mentors, searchQuery, sortBy, selectedCompany, selectedConsultType, selectedSkills, selectedJobType, selectedEngineType]);

  // Analytics: track filter changes (skip initial render)
  const filterMountRef = useRef(true);
  useEffect(() => {
    if (filterMountRef.current) {
      filterMountRef.current = false;
      return;
    }
    trackEvent({
      category: "button_click",
      action: "mentors_filter_change",
      metadata: {
        company: selectedCompany,
        consultType: selectedConsultType,
        jobType: selectedJobType,
        engineType: selectedEngineType,
        skillCount: selectedSkills.length,
        sortBy,
      },
    });
  }, [selectedCompany, selectedConsultType, selectedJobType, selectedEngineType, selectedSkills, sortBy]);

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
    setSelectedJobType("all");
    setSelectedEngineType("all");
    setSearchInput("");
    setSearchQuery("");
    setSortBy("recommended");
    trackEvent({ category: "button_click", action: "mentors_clear_filters" });
  };

  const openMentorModal = (mentor: MentorData & { id: string }) => {
    setSelectedMentor(mentor);
    setIsMentorModalOpen(true);
    trackEvent({
      category: "button_click",
      action: "mentor_card_click",
      label: mentor.name,
      metadata: { mentorId: mentor.id, company: mentor.company },
    });
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

  const hasActiveFilters = selectedCompany !== "전체" || selectedConsultType !== "all" || selectedSkills.length > 0 || selectedJobType !== "all" || selectedEngineType !== "all" || searchQuery.trim() !== "" || sortBy !== "recommended";
  const activeFilterCount = [
    selectedCompany !== "전체",
    selectedConsultType !== "all",
    selectedSkills.length > 0,
    selectedJobType !== "all",
    selectedEngineType !== "all",
    searchQuery.trim() !== "",
    sortBy !== "recommended",
  ].filter(Boolean).length;

  // Filter content component (shared between sidebar and bottom sheet)
  const FilterContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Company Filter */}
      <div className={isMobile ? "mb-5" : "mb-6"}>
        <h3 className="text-sm font-medium text-muted mb-3">회사</h3>
        <div className="flex flex-wrap gap-2">
          {companies.map(company => (
            <button
              key={company}
              onClick={() => setSelectedCompany(company)}
              className={`px-3 py-2 rounded-full text-sm transition-all cursor-pointer min-h-[40px] ${
                selectedCompany === company
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted hover:bg-secondary/80 active:bg-secondary"
              }`}
            >
              {company}
            </button>
          ))}
        </div>
      </div>

      {/* Job Type Filter */}
      <div className={isMobile ? "mb-5" : "mb-6"}>
        <h3 className="text-sm font-medium text-muted mb-3">직군</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedJobType("all")}
            className={`px-3 py-2 rounded-full text-sm transition-all cursor-pointer min-h-[40px] ${
              selectedJobType === "all"
                ? "bg-primary text-white"
                : "bg-secondary text-muted hover:bg-secondary/80 active:bg-secondary"
            }`}
          >
            전체
          </button>
          {JOB_TYPES.map(job => (
            <button
              key={job.value}
              onClick={() => setSelectedJobType(job.value as JobType)}
              className={`px-3 py-2 rounded-full text-sm transition-all cursor-pointer min-h-[40px] ${
                selectedJobType === job.value
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted hover:bg-secondary/80 active:bg-secondary"
              }`}
            >
              {job.label}
            </button>
          ))}
        </div>
      </div>

      {/* Engine Filter */}
      <div className={isMobile ? "mb-5" : "mb-6"}>
        <h3 className="text-sm font-medium text-muted mb-3">엔진</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedEngineType("all")}
            className={`px-3 py-2 rounded-full text-sm transition-all cursor-pointer min-h-[40px] ${
              selectedEngineType === "all"
                ? "bg-accent text-white"
                : "bg-secondary text-muted hover:bg-secondary/80 active:bg-secondary"
            }`}
          >
            전체
          </button>
          {ENGINE_TYPES.map(engine => (
            <button
              key={engine.value}
              onClick={() => setSelectedEngineType(engine.value as EngineType)}
              className={`px-3 py-2 rounded-full text-sm transition-all cursor-pointer min-h-[40px] ${
                selectedEngineType === engine.value
                  ? "bg-accent text-white"
                  : "bg-secondary text-muted hover:bg-secondary/80 active:bg-secondary"
              }`}
            >
              {engine.label}
            </button>
          ))}
        </div>
      </div>

      {/* Consult Type Filter */}
      <div className={isMobile ? "mb-5" : "mb-6"}>
        <h3 className="text-sm font-medium text-muted mb-3">상담 유형</h3>
        <div className="flex flex-wrap gap-2">
          {consultTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedConsultType(type.value)}
              className={`px-3 py-2 rounded-full text-sm transition-all cursor-pointer min-h-[40px] ${
                selectedConsultType === type.value
                  ? "bg-accent text-white"
                  : "bg-secondary text-muted hover:bg-secondary/80 active:bg-secondary"
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
        <div className={`space-y-3 ${isMobile ? "" : "max-h-64 overflow-y-auto"}`}>
          {Object.entries(skillCategories).map(([key, category]) => (
            <div key={key}>
              <p className="text-xs text-muted mb-1.5">{category.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {category.skills.slice(0, isMobile ? 6 : 4).map(skill => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-2.5 py-1.5 rounded text-xs transition-all cursor-pointer min-h-[32px] ${
                      selectedSkills.includes(skill)
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted hover:bg-secondary/80 active:bg-secondary"
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
    </>
  );

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card-bg/70 backdrop-blur-2xl border-b border-card-border/50 shadow-sm shadow-black/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/15">
                <LogoIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors hidden sm:inline">
                커피챗
              </span>
            </Link>
            <Link
              href="/"
              className="text-muted hover:text-primary font-medium text-sm transition-colors min-h-[44px] flex items-center px-2"
            >
              홈으로
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Page Title */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">멘토 찾기</h1>
          <p className="text-muted text-sm md:text-base">
            {filteredMentors.length}명의 현직자 멘토가 기다리고 있어요
          </p>
        </div>

        {/* Search & Sort Bar */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="멘토 이름, 회사, 스킬로 검색..."
              className="w-full pl-11 pr-4 py-3 bg-card-bg/60 backdrop-blur-sm border border-card-border/50 rounded-xl text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all min-h-[48px] shadow-sm"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative sm:w-48">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="w-full appearance-none px-4 py-3 pr-10 bg-card-bg/60 backdrop-blur-sm border border-card-border/50 rounded-xl text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all min-h-[48px] cursor-pointer shadow-sm"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <svg
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="w-full flex items-center justify-between px-4 py-3 bg-card-bg/60 backdrop-blur-sm border border-card-border/50 rounded-xl min-h-[48px] active:bg-secondary/50 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-medium">필터</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-white text-xs font-medium rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Active filter chips (mobile) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {searchQuery.trim() !== "" && (
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center gap-1">
                  &quot;{searchQuery}&quot;
                  <button
                    onClick={() => { setSearchInput(""); setSearchQuery(""); }}
                    className="ml-1 hover:text-primary-dark"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {selectedCompany !== "전체" && (
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center gap-1">
                  {selectedCompany}
                  <button
                    onClick={() => setSelectedCompany("전체")}
                    className="ml-1 hover:text-primary-dark"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {selectedJobType !== "all" && (
                <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full flex items-center gap-1">
                  {JOB_TYPES.find(j => j.value === selectedJobType)?.label}
                  <button
                    onClick={() => setSelectedJobType("all")}
                    className="ml-1 hover:text-primary-dark"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              {selectedEngineType !== "all" && (
                <span className="px-3 py-1.5 bg-accent/10 text-accent text-xs font-medium rounded-full flex items-center gap-1">
                  {ENGINE_TYPES.find(e => e.value === selectedEngineType)?.label}
                  <button
                    onClick={() => setSelectedEngineType("all")}
                    className="ml-1 hover:text-accent"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-muted text-xs font-medium underline"
              >
                모두 초기화
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* Filters Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="bg-card-bg/60 backdrop-blur-sm border border-card-border/40 rounded-2xl p-6 sticky top-24 shadow-sm shadow-primary/[0.02]">
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
              <FilterContent />
            </div>
          </aside>

          {/* Mentors Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <MentorCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <svg className="w-7 h-7 md:w-8 md:h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">검색 결과가 없어요</h3>
                <p className="text-muted mb-4 text-sm md:text-base">다른 필터 조건을 시도해보세요</p>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 bg-primary text-white rounded-full text-sm cursor-pointer min-h-[44px]"
                >
                  필터 초기화
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
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
                  <div className="flex justify-center items-center gap-1 md:gap-2 mt-6 md:mt-8">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2.5 rounded-xl border border-card-border/50 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Show fewer page numbers on mobile */}
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          // On mobile, show current page, first, last, and adjacent pages
                          if (!isMobile || totalPages <= 5) return true;
                          return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, idx, arr) => {
                          // Add ellipsis
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && (
                                <span className="px-2 text-muted">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`w-10 h-10 md:w-10 md:h-10 rounded-xl text-sm font-medium transition-all cursor-pointer min-w-[40px] min-h-[40px] ${
                                  currentPage === page
                                    ? "bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20"
                                    : "border border-card-border/50 hover:border-primary/50 hover:text-primary hover:bg-primary/5"
                                }`}
                              >
                                {page}
                              </button>
                            </div>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2.5 rounded-xl border border-card-border/50 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
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

      {/* Mobile Filter Bottom Sheet */}
      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="필터"
        height="full"
      >
        <div className="px-5 py-4">
          <FilterContent isMobile />

          {/* Apply button */}
          <div className="sticky bottom-0 pt-4 pb-2 bg-card-bg border-t border-card-border mt-6 -mx-5 px-5">
            <div className="flex gap-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3 border border-card-border text-foreground rounded-xl font-semibold cursor-pointer hover:bg-secondary transition-colors min-h-[48px]"
                >
                  초기화
                </button>
              )}
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className={`py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-semibold cursor-pointer hover:opacity-90 transition-opacity min-h-[48px] ${hasActiveFilters ? 'flex-1' : 'w-full'}`}
              >
                {filteredMentors.length}명 보기
              </button>
            </div>
          </div>
        </div>
      </BottomSheet>

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
        mentorExperience={selectedMentor?.experience}
      />
    </div>
  );
}

function MentorCardSkeleton() {
  return (
    <div className="bg-card-bg/60 backdrop-blur-sm border border-card-border/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-24 md:h-32 bg-gradient-to-br from-secondary/80 to-secondary/40" />
      <div className="p-4 md:p-5">
        <div className="h-5 md:h-6 bg-secondary/80 rounded-lg w-2/3 mb-2" />
        <div className="h-4 bg-secondary/60 rounded-lg w-1/2 mb-3 md:mb-4" />
        <div className="flex gap-2 mb-3 md:mb-4">
          <div className="h-6 bg-secondary/60 rounded-full w-16" />
          <div className="h-6 bg-secondary/60 rounded-full w-12" />
        </div>
        <div className="pt-3 md:pt-4 border-t border-card-border/50 flex justify-between">
          <div className="h-4 bg-secondary/60 rounded-lg w-12" />
          <div className="h-4 bg-secondary/60 rounded-lg w-16" />
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
      className="group bg-card-bg/60 backdrop-blur-sm border border-card-border/50 rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-[0_12px_40px_-8px_rgba(139,115,85,0.18)] hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer active:scale-[0.98]"
    >
      {/* Avatar Section */}
      <div className="relative h-24 md:h-32 bg-gradient-to-br from-primary/10 via-accent/10 to-primary-light/10 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,_var(--accent)_0%,_transparent_60%)] opacity-15" />
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xl md:text-2xl font-bold transform group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/20">
          {mentor.name?.charAt(0) || "?"}
        </div>
        <div className="absolute top-2 right-2 md:top-3 md:right-3 px-2.5 py-1 bg-card-bg/80 backdrop-blur-md rounded-full text-xs font-semibold text-primary-dark border border-primary/10">
          {mentor.company}
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 md:p-5">
        <h3 className="text-base md:text-lg font-bold mb-0.5 md:mb-1 group-hover:text-primary transition-colors duration-300 line-clamp-1">
          {mentor.name}
        </h3>
        <p className="text-muted text-xs md:text-sm mb-2 md:mb-3 line-clamp-1">{mentor.role}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 md:gap-1.5 mb-2 md:mb-4">
          <span className="px-2.5 py-0.5 md:py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {mentor.experience} 경력
          </span>
          <span className="px-2.5 py-0.5 md:py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
            <ProductIcon name={getTierInfo(mentor.experience).badge} className="w-3.5 h-3.5 inline-block" /> {getTierInfo(mentor.experience).name}
          </span>
          {mentor.skills.slice(0, 3).map(skill => (
            <span key={skill} className="px-2.5 py-0.5 md:py-1 bg-gradient-to-r from-primary/6 to-accent/6 text-foreground/70 text-xs font-medium rounded-full border border-primary/8">
              {skill}
            </span>
          ))}
          {mentor.skills.length > 3 && (
            <span className="px-2.5 py-0.5 md:py-1 bg-secondary/80 text-muted text-xs rounded-full">
              +{mentor.skills.length - 3}
            </span>
          )}
        </div>

        {/* Consult Types */}
        <div className="flex flex-wrap gap-1 md:gap-1.5 mb-3 md:mb-4">
          {mentor.consultTypes.slice(0, 2).map(type => (
            <span key={type} className="px-2 py-0.5 bg-accent/10 text-accent text-xs font-medium rounded-full">
              {consultTypeLabels[type]}
            </span>
          ))}
          {mentor.consultTypes.length > 2 && (
            <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
              +{mentor.consultTypes.length - 2}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-card-border/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-sm font-bold text-foreground">{mentor.rating}</span>
            </div>
            <span className="text-xs text-muted font-medium">{mentor.sessions}회</span>
          </div>
          <span className="text-sm font-bold text-primary">
            {mentor.price ? `${mentor.price.toLocaleString()}원~` : "가격 미정"}
          </span>
        </div>
      </div>
    </div>
  );
}
