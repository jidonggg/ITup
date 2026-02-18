import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_INFO, MENTORING_STYLES } from "@/lib/constants";
import { JOB_TYPES, ENGINE_TYPES } from "@/lib/constants";
import { ProductIcon, LogoIcon } from "@/components/icons";
import type { Mentor, Product, Review, ProductType, MentorSchedule } from "@/lib/supabase/types";
import MentorDetailClient from "./MentorDetailClient";
import JsonLd from "@/components/JsonLd";
import ShareButtons from "@/components/share/ShareButtons";
import { SITE_CONFIG } from "@/lib/site-config";

// 시간 표시 유틸: ["mon 09:00", "mon 10:00", ...] → ["월 9~12시", "화 20시 이후~"]
function formatAvailableTimes(times: string[]): string[] {
  const DAY_LABELS: Record<string, string> = {
    mon: "월", tue: "화", wed: "수", thu: "목",
    fri: "금", sat: "토", sun: "일",
  };
  const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const LAST_SLOT_HOUR = 22;

  // Group by day
  const grouped: Record<string, number[]> = {};
  for (const t of times) {
    const parts = t.split(" ");
    if (parts.length < 2) continue;
    const day = parts[0];
    const hour = parseInt(parts[1].split(":")[0]);
    if (isNaN(hour)) continue;
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(hour);
  }

  const result: string[] = [];
  for (const day of DAY_ORDER) {
    if (!grouped[day] || grouped[day].length === 0) continue;
    const hours = [...grouped[day]].sort((a, b) => a - b);

    // Find consecutive ranges
    const ranges: string[] = [];
    let start = hours[0];
    let prev = hours[0];

    for (let i = 1; i < hours.length; i++) {
      if (hours[i] === prev + 1) {
        prev = hours[i];
      } else {
        ranges.push(fmtRange(start, prev, LAST_SLOT_HOUR));
        start = hours[i];
        prev = hours[i];
      }
    }
    ranges.push(fmtRange(start, prev, LAST_SLOT_HOUR));

    result.push(`${DAY_LABELS[day] || day} ${ranges.join(", ")}`);
  }

  return result;
}

function fmtRange(start: number, end: number, lastHour: number): string {
  if (start === end) return `${start}시`;
  if (end >= lastHour) return `${start}시 이후~`;
  return `${start}~${end}시`;
}

const PRODUCT_FEATURES: Record<string, string[]> = {
  coffee_chat: ["1:1 온라인 화상 상담", "커리어 방향 상담", "업계 현황 이야기", "자유 Q&A"],
  document_review: ["서류 분석 + 첨삭 상담", "개선 포인트 피드백", "업계 맞춤 어필 포인트", "첨삭 후 1회 추가 확인"],
  mock_interview: ["실전형 모의면접", "직무별 예상 질문 제공", "상세 피드백 리포트", "면접 태도/답변 코칭"],
  free_trial: ["15분 무료 멘토링 체험", "부담 없는 첫 만남"],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("name, company, role, bio")
    .eq("id", id)
    .eq("is_approved", true)
    .single();

  if (!mentor) {
    return { title: "멘토를 찾을 수 없습니다" };
  }

  const description = mentor.bio
    ? mentor.bio.slice(0, 155) + (mentor.bio.length > 155 ? "..." : "")
    : `${mentor.company} ${mentor.role || ""} 멘토와 1:1 커피챗을 신청하세요.`;

  return {
    title: `${mentor.name} 멘토 - ${mentor.company}`,
    description,
    alternates: {
      canonical: `${SITE_CONFIG.url}/mentors/${id}`,
    },
    openGraph: {
      title: `${mentor.name} 멘토 - ${mentor.company} | 커피챗`,
      description,
      url: `${SITE_CONFIG.url}/mentors/${id}`,
      type: "profile",
    },
  };
}

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= Math.round(rating) ? "text-yellow-500" : "text-secondary"}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

function getJobTypeLabel(value: string | null): string {
  if (!value) return "";
  const found = JOB_TYPES.find((j) => j.value === value);
  return found ? found.label : value;
}

function getEngineLabel(value: string | null): string {
  if (!value) return "";
  const found = ENGINE_TYPES.find((e) => e.value === value);
  return found ? found.label : value;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function MentorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch mentor
  const { data: mentor } = await supabase
    .from("mentors")
    .select("*")
    .eq("id", id)
    .eq("is_approved", true)
    .single();

  if (!mentor) {
    notFound();
  }

  const typedMentor = mentor as Mentor;

  // Fetch products and reviews in parallel
  const [productsResult, reviewsResult] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("mentor_id", id)
      .eq("is_active", true)
      .order("price", { ascending: true }),
    supabase
      .from("reviews")
      .select("*")
      .eq("mentor_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const products = (productsResult.data || []) as Product[];
  const reviews = (reviewsResult.data || []) as Review[];

  // Fetch schedules separately (table may not exist)
  let schedules: MentorSchedule[] = [];
  try {
    const { data: schedulesData } = await supabase
      .from("mentor_schedules")
      .select("*")
      .eq("mentor_id", id)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true });
    if (schedulesData) {
      schedules = schedulesData as MentorSchedule[];
    }
  } catch {
    // mentor_schedules table might not exist yet
  }

  const minPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : null;

  const jobLabel = typedMentor.role || "게임 개발";

  const mentorJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: typedMentor.name,
      jobTitle: typedMentor.role || jobLabel,
      worksFor: {
        "@type": "Organization",
        name: typedMentor.company,
      },
      description: typedMentor.bio?.slice(0, 200) || `${typedMentor.company} ${typedMentor.role || ""} 멘토`,
      knowsAbout: typedMentor.skills,
      ...(typedMentor.rating > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: typedMentor.rating.toFixed(1),
          reviewCount: typedMentor.reviews,
          bestRating: 5,
          worstRating: 1,
        },
      }),
    },
  };

  const productJsonLd = products.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: products.map((product, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Service",
            name: product.title,
            description: product.description || PRODUCT_INFO[product.type as ProductType]?.description || "",
            offers: {
              "@type": "Offer",
              price: product.price,
              priceCurrency: "KRW",
              availability: "https://schema.org/InStock",
            },
            provider: {
              "@type": "Person",
              name: typedMentor.name,
            },
          },
        })),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "홈",
        item: SITE_CONFIG.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "멘토 찾기",
        item: `${SITE_CONFIG.url}/mentors`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${typedMentor.name} 멘토`,
        item: `${SITE_CONFIG.url}/mentors/${id}`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <JsonLd data={mentorJsonLd} />
      {productJsonLd && <JsonLd data={productJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card-bg/70 backdrop-blur-2xl border-b border-card-border/50 shadow-sm shadow-black/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <LogoIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <span className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors hidden sm:inline">
                커피챗
              </span>
            </Link>
            <div className="flex items-center gap-2 md:gap-4">
              <Link
                href="/mentors"
                className="text-muted hover:text-foreground transition-colors text-sm min-h-[44px] flex items-center px-2"
              >
                멘토 찾기
              </Link>
              <Link
                href="/"
                className="text-muted hover:text-foreground transition-colors text-sm min-h-[44px] flex items-center px-2 hidden sm:flex"
              >
                홈으로
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 lg:pb-8">
        {/* Breadcrumb - Hidden on mobile */}
        <nav className="hidden md:block mb-6">
          <ol className="flex items-center gap-2 text-sm text-muted">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                홈
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li>
              <Link href="/mentors" className="hover:text-primary transition-colors">
                멘토 찾기
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
            <li className="text-foreground font-medium">{typedMentor.name}</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mentor Profile Header */}
            <section className="bg-card-bg border border-card-border rounded-2xl overflow-hidden mb-4 md:mb-8">
              {/* Gradient Banner */}
              <div className="h-24 md:h-32 bg-gradient-to-r from-primary to-primary-dark relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              <div className="px-4 md:px-6 pb-5 md:pb-6 -mt-12 md:-mt-14 relative">
                {/* Avatar */}
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl md:text-4xl font-bold border-4 border-card-bg shadow-lg mb-3 md:mb-4">
                  {typedMentor.name.charAt(0)}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
                  <div className="flex-1">
                    {/* Name and Verification */}
                    <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2 flex-wrap">
                      <h1 className="text-xl md:text-2xl font-bold text-foreground">
                        {typedMentor.name}
                      </h1>
                      {typedMentor.is_verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
                          <span>✓</span>
                          인증됨
                        </span>
                      )}
                    </div>

                    {/* Company & Role */}
                    <p className="text-foreground font-medium text-sm md:text-base mb-1">
                      {typedMentor.company}
                      {typedMentor.role && (
                        <span className="text-muted font-normal"> · {typedMentor.role}</span>
                      )}
                    </p>

                    {/* Experience */}
                    {typedMentor.experience && (
                      <p className="text-muted text-xs md:text-sm mb-2 md:mb-3">
                        경력 {typedMentor.experience}
                      </p>
                    )}

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                      {typedMentor.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-gradient-to-r from-primary/8 to-accent/8 text-foreground/80 text-xs font-medium rounded-lg border border-primary/10"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Mentoring Styles */}
                    {typedMentor.mentoring_styles && typedMentor.mentoring_styles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 md:mb-3">
                        {typedMentor.mentoring_styles.map((style: string) => {
                          const styleInfo = MENTORING_STYLES.find(s => s.value === style);
                          return styleInfo ? (
                            <span
                              key={style}
                              title={styleInfo.description}
                              className="px-3 py-1 bg-accent/10 text-accent border border-accent/20 rounded-full text-xs font-medium"
                            >
                              {styleInfo.label}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Previous Companies */}
                    {typedMentor.previous_companies &&
                      typedMentor.previous_companies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                          {typedMentor.previous_companies.slice(0, 2).map((company, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-muted bg-secondary px-2 py-0.5 md:px-2.5 md:py-1 rounded-full"
                            >
                              전) {company}
                            </span>
                          ))}
                          {typedMentor.previous_companies.length > 2 && (
                            <span className="text-xs text-muted bg-secondary px-2 py-0.5 rounded-full">
                              +{typedMentor.previous_companies.length - 2}
                            </span>
                          )}
                        </div>
                      )}

                    {/* Rating & Stats */}
                    <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                      <div className="flex items-center gap-1 md:gap-2">
                        <StarRating rating={typedMentor.rating} size="sm" />
                        <span className="text-sm font-semibold text-foreground">
                          {typedMentor.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs md:text-sm text-muted">
                        리뷰 {typedMentor.reviews}개
                      </span>
                      <span className="text-xs md:text-sm text-muted">
                        세션 {typedMentor.sessions}회
                      </span>
                    </div>

                    {/* Share */}
                    <div className="mt-3">
                      <ShareButtons
                        url={`${SITE_CONFIG.url}/mentors/${id}`}
                        title={`${typedMentor.name} 멘토 - ${typedMentor.company}`}
                        description={typedMentor.bio?.slice(0, 100) || `${typedMentor.company} 현직자 멘토와 1:1 커피챗`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Free Trial Banner */}
            <section className="mb-4 md:mb-8">
              <div className="bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 border border-accent/30 rounded-2xl p-4 md:p-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                    <div>
                      <p className="font-semibold text-sm md:text-base">15분 무료 멘토링 체험</p>
                      <p className="text-xs md:text-sm text-muted">결제 없이 먼저 체험해 보세요!</p>
                    </div>
                  </div>
                  <Link
                    href={`/free-trial/${id}`}
                    className="px-5 py-2.5 bg-gradient-to-r from-accent to-primary text-white font-medium rounded-xl hover:shadow-lg transition-all whitespace-nowrap text-sm min-h-[44px] flex items-center"
                  >
                    무료 체험 신청
                  </Link>
                </div>
              </div>
            </section>

            {/* Bio Section - Collapsible on mobile */}
            {typedMentor.bio && (
              <MentorDetailClient
                sectionType="bio"
                title="자기소개"
                icon={
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                <p className="text-foreground text-sm md:text-base leading-relaxed whitespace-pre-line">
                  {typedMentor.bio}
                </p>
              </MentorDetailClient>
            )}

            {/* Schedule Section - Weekly Grid */}
            {(schedules.length > 0 || (typedMentor.available_times && typedMentor.available_times.length > 0)) && (
              <MentorDetailClient
                sectionType="schedule"
                title="멘토링 가능 시간"
                icon={
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                defaultExpanded
              >
                {schedules.length > 0 ? (
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                      {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => {
                        const schedule = schedules.find((s) => s.day_of_week === i);
                        return (
                          <div key={i} className="text-center">
                            <span className={`block text-xs font-bold mb-1.5 ${schedule ? "text-primary" : "text-muted/40"}`}>
                              {day}
                            </span>
                            <div className={`rounded-lg py-2 md:py-2.5 px-1 text-xs leading-snug ${
                              schedule
                                ? "bg-primary/12 text-primary font-medium border border-primary/20"
                                : "bg-secondary/50 text-muted/30"
                            }`}>
                              {schedule ? (
                                <>
                                  <span className="block">{schedule.start_time.slice(0, 5)}</span>
                                  <span className="block text-[10px] text-muted/60 my-0.5">~</span>
                                  <span className="block">{schedule.end_time.slice(0, 5)}</span>
                                </>
                              ) : (
                                <span className="block py-2">-</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted text-center mt-3">
                      아래 상품을 선택하면 날짜와 시간을 예약할 수 있어요
                    </p>
                  </div>
                ) : (
                  <div className="bg-secondary/30 rounded-xl p-4 space-y-2">
                    {formatAvailableTimes(typedMentor.available_times!).map((line, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-2 px-3">
                        <svg className="w-4 h-4 text-primary/60 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm md:text-base text-foreground/80">{line}</span>
                      </div>
                    ))}
                  </div>
                )}
              </MentorDetailClient>
            )}

            {/* Products Section */}
            <MentorDetailClient
              sectionType="products"
              title="멘토링 상품"
              badge={products.length > 0 ? products.length : undefined}
              icon={
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              defaultExpanded
            >
              {products.length > 0 ? (
                <div className="space-y-4">
                  {products.map((product) => {
                    const productInfo = PRODUCT_INFO[product.type as ProductType];
                    const features = PRODUCT_FEATURES[product.type as ProductType];
                    return (
                      <div
                        key={product.id}
                        className="border border-card-border rounded-xl p-4 md:p-5 hover:border-primary/30 transition-all"
                      >
                        {/* Header: Icon + Title + Price */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <ProductIcon name={productInfo?.icon || "coffee"} className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground text-sm md:text-base">
                                {product.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="inline-flex items-center gap-1 text-xs text-muted">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {product.duration_minutes}분
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-lg md:text-xl font-bold text-primary whitespace-nowrap">
                            {product.price.toLocaleString("ko-KR")}원
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-xs md:text-sm text-muted mb-3 ml-[52px] md:ml-[56px]">
                          {product.description || productInfo?.description || ""}
                        </p>

                        {/* Features */}
                        {features && features.length > 0 && (
                          <div className="ml-[52px] md:ml-[56px] mb-4 space-y-1.5">
                            {features.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs md:text-sm text-foreground/75">
                                <svg className="w-3.5 h-3.5 text-primary/50 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {f}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* CTA */}
                        <div className="ml-[52px] md:ml-[56px]">
                          <Link
                            href={`/booking/${product.id}`}
                            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all cursor-pointer whitespace-nowrap min-h-[44px]"
                          >
                            예약하기
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 md:py-10">
                  <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
                    <svg className="w-6 h-6 md:w-7 md:h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-muted text-sm">아직 등록된 상품이 없습니다</p>
                </div>
              )}
            </MentorDetailClient>

            {/* Reviews Section */}
            <MentorDetailClient
              sectionType="reviews"
              title="리뷰"
              badge={reviews.length > 0 ? reviews.length : undefined}
              icon={
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            >
              {reviews.length > 0 ? (
                <div className="space-y-4 md:space-y-5">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-card-border last:border-b-0 pb-4 md:pb-5 last:pb-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-secondary flex items-center justify-center text-xs md:text-sm font-medium text-muted">
                            {review.user_name.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground text-xs md:text-sm">
                            {review.user_name}
                          </span>
                        </div>
                        <span className="text-xs text-muted">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      <div className="ml-9 md:ml-11 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="ml-9 md:ml-11 text-xs md:text-sm text-foreground leading-relaxed">
                        {review.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-10">
                  <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
                    <svg className="w-6 h-6 md:w-7 md:h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-muted text-sm">아직 리뷰가 없습니다</p>
                </div>
              )}
            </MentorDetailClient>
          </div>

          {/* Sidebar (sticky on desktop) */}
          <aside className="hidden lg:block lg:w-80 flex-shrink-0">
            <div className="bg-card-bg border border-card-border rounded-2xl p-6 sticky top-24">
              {/* Quick Summary */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-lg font-bold">
                  {typedMentor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{typedMentor.name}</h3>
                  <p className="text-sm text-muted">{typedMentor.company}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-5">
                <StarRating rating={typedMentor.rating} size="sm" />
                <span className="text-sm font-semibold text-foreground">
                  {typedMentor.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted">
                  ({typedMentor.reviews}개 리뷰)
                </span>
              </div>

              {/* Skills in sidebar */}
              {typedMentor.skills.length > 0 && (
                <div className="border-t border-card-border pt-4 mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">기술 스택</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {typedMentor.skills.map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-primary/8 text-foreground/75 text-xs rounded-md border border-primary/10">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule in sidebar - compact grid */}
              {(schedules.length > 0 || (typedMentor.available_times && typedMentor.available_times.length > 0)) && (
                <div className="border-t border-card-border pt-4 mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">가능 시간</h4>
                  {schedules.length > 0 ? (
                    <div className="grid grid-cols-7 gap-1">
                      {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => {
                        const s = schedules.find((sc) => sc.day_of_week === i);
                        return (
                          <div key={i} className="text-center">
                            <span className={`block text-[10px] font-bold mb-0.5 ${s ? "text-primary" : "text-muted/30"}`}>{day}</span>
                            <div className={`rounded py-1 text-[9px] leading-tight ${
                              s ? "bg-primary/10 text-primary font-medium" : "text-muted/20"
                            }`}>
                              {s ? (
                                <>
                                  <span className="block">{s.start_time.slice(0, 5)}</span>
                                  <span className="block">{s.end_time.slice(0, 5)}</span>
                                </>
                              ) : "-"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {formatAvailableTimes(typedMentor.available_times!).map((line, i) => (
                        <p key={i} className="text-sm text-muted">{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-card-border pt-5 mb-5">
                <h4 className="text-sm font-semibold text-foreground mb-3">멘토링 상품</h4>
                {products.length > 0 ? (
                  <div className="space-y-3">
                    {products.map((product) => {
                      const productInfo = PRODUCT_INFO[product.type as ProductType];
                      return (
                        <Link
                          key={product.id}
                          href={`/booking/${product.id}`}
                          className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <ProductIcon name={productInfo?.icon || "coffee"} className="w-5 h-5" />
                            <div>
                              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                {product.title}
                              </p>
                              <p className="text-xs text-muted">{product.duration_minutes}분</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-primary whitespace-nowrap">
                            {product.price.toLocaleString("ko-KR")}원
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted">등록된 상품이 없습니다</p>
                )}
              </div>

              {/* CTA Button */}
              {products.length > 0 && (
                <Link
                  href={`/booking/${products[0].id}`}
                  className="block w-full text-center px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg transition-all cursor-pointer"
                >
                  {minPrice !== null
                    ? `${minPrice.toLocaleString("ko-KR")}원부터 시작하기`
                    : "멘토링 신청하기"}
                </Link>
              )}

              {/* Minimum Price Hint */}
              {products.length > 1 && minPrice !== null && (
                <p className="text-xs text-muted text-center mt-2">
                  {products.length}개 상품 중 최저가 기준
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Sticky Bottom CTA */}
      {products.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-card-bg/95 backdrop-blur-md border-t border-card-border lg:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{typedMentor.name}</p>
                <p className="text-xs text-muted">
                  {minPrice !== null && (
                    <span className="text-primary font-semibold">{minPrice.toLocaleString("ko-KR")}원</span>
                  )}
                  {minPrice !== null && " 부터"}
                </p>
              </div>
              <Link
                href={`/booking/${products[0].id}`}
                className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg transition-all cursor-pointer whitespace-nowrap min-h-[48px] flex items-center"
              >
                예약하기
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
