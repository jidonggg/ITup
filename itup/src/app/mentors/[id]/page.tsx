import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_INFO } from "@/lib/constants";
import { JOB_TYPES, ENGINE_TYPES } from "@/lib/constants";
import type { Mentor, Product, Review, ProductType } from "@/lib/supabase/types";
import MentorDetailClient from "./MentorDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mentor } = await supabase
    .from("mentors")
    .select("name, company, position, bio, job_type")
    .eq("id", id)
    .eq("is_approved", true)
    .single();

  if (!mentor) {
    return { title: "멘토를 찾을 수 없습니다" };
  }

  const jobLabel = mentor.job_type
    ? JOB_TYPES.find((j) => j.value === mentor.job_type)?.label || mentor.job_type
    : "";
  const description = mentor.bio
    ? mentor.bio.slice(0, 155) + (mentor.bio.length > 155 ? "..." : "")
    : `${mentor.company} ${mentor.position || ""} ${jobLabel} 멘토와 1:1 커피챗을 신청하세요.`;

  return {
    title: `${mentor.name} 멘토 - ${mentor.company}`,
    description,
    openGraph: {
      title: `${mentor.name} 멘토 - ${mentor.company} | 커피챗`,
      description,
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

  const minPrice = products.length > 0 ? Math.min(...products.map((p) => p.price)) : null;

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-secondary/90 backdrop-blur-md border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white text-lg md:text-xl">☕</span>
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

                    {/* Company & Position */}
                    <p className="text-foreground font-medium text-sm md:text-base mb-1">
                      {typedMentor.company}
                      {typedMentor.position && (
                        <span className="text-muted font-normal"> · {typedMentor.position}</span>
                      )}
                    </p>

                    {/* Years */}
                    {typedMentor.years && (
                      <p className="text-muted text-xs md:text-sm mb-2 md:mb-3">
                        경력 {typedMentor.years}년
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                      {typedMentor.job_type && (
                        <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                          {getJobTypeLabel(typedMentor.job_type)}
                        </span>
                      )}
                      {typedMentor.engine && (
                        <span className="px-2.5 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full">
                          {getEngineLabel(typedMentor.engine)}
                        </span>
                      )}
                      {typedMentor.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-secondary text-muted text-xs rounded-full hidden sm:inline-block"
                        >
                          {skill}
                        </span>
                      ))}
                      {typedMentor.skills.length > 3 && (
                        <span className="px-2.5 py-1 bg-secondary text-muted text-xs rounded-full">
                          +{typedMentor.skills.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Previous Companies */}
                    {typedMentor.previous_companies_detail &&
                      typedMentor.previous_companies_detail.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                          {typedMentor.previous_companies_detail.slice(0, 2).map((prev, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-muted bg-secondary px-2 py-0.5 md:px-2.5 md:py-1 rounded-full"
                            >
                              전) {prev.company_name}
                              {prev.years ? ` (${prev.years}년)` : ""}
                            </span>
                          ))}
                          {typedMentor.previous_companies_detail.length > 2 && (
                            <span className="text-xs text-muted bg-secondary px-2 py-0.5 rounded-full">
                              +{typedMentor.previous_companies_detail.length - 2}
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
                  </div>
                </div>
              </div>
            </section>

            {/* Free Trial Banner */}
            <section className="mb-4 md:mb-8">
              <div className="bg-gradient-to-r from-accent/20 via-primary/10 to-accent/20 border border-accent/30 rounded-2xl p-4 md:p-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-center sm:text-left">
                    <span className="text-xl md:text-2xl">🎁</span>
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
                <div className="space-y-3 md:space-y-4">
                  {products.map((product) => {
                    const productInfo = PRODUCT_INFO[product.type as ProductType];
                    return (
                      <div
                        key={product.id}
                        className="border border-card-border rounded-xl p-4 md:p-5 hover:border-primary/50 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2">
                              <span className="text-xl md:text-2xl">{productInfo?.icon || "📦"}</span>
                              <div>
                                <h3 className="font-semibold text-foreground text-sm md:text-base">
                                  {product.title}
                                </h3>
                                <p className="text-xs text-muted">
                                  {product.duration_minutes}분
                                </p>
                              </div>
                            </div>
                            <p className="text-xs md:text-sm text-muted ml-8 md:ml-10">
                              {product.description || productInfo?.description || ""}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 md:gap-3 ml-8 sm:ml-0">
                            <p className="text-base md:text-lg font-bold text-primary">
                              {product.price.toLocaleString("ko-KR")}원
                            </p>
                            <Link
                              href={`/booking/${product.id}`}
                              className="inline-flex items-center justify-center px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all cursor-pointer whitespace-nowrap min-h-[40px] md:min-h-[44px]"
                            >
                              예약하기
                            </Link>
                          </div>
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
                            <span className="text-base">{productInfo?.icon || "📦"}</span>
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
