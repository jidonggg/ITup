"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAnalytics } from "@/contexts/AnalyticsContext";

export default function BusinessPage() {
  const { trackEvent } = useAnalytics();
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    employeeCount: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError(null);

    trackEvent("submit", "기업문의_제출", { company: formData.companyName });

    try {
      const response = await fetch("/api/business/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || "문의 제출에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      setIsSubmitted(true);
    } catch {
      setSubmitError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-background to-primary/5" />

          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <div className="inline-block px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-sm font-medium mb-6">
              기업 서비스
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              게임 업계 인재 육성,
              <br />
              함께 고민해드려요.
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto mb-8">
              현직 게임 개발자 멘토 네트워크를 활용한
              <br className="hidden md:block" />
              기업 맞춤 멘토링 프로그램을 제공합니다.
            </p>
            <a
              href="#contact"
              className="inline-block px-8 py-3.5 bg-primary text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              도입 문의하기
            </a>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 md:py-20 bg-card-bg border-y border-card-border">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-3">제공 서비스</h2>
            <p className="text-muted mb-10">기업 규모와 목적에 맞게 프로그램을 설계해드려요.</p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-background border border-card-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">임직원 멘토링</h3>
                <p className="text-sm text-muted mb-4">
                  신입/주니어 개발자를 위한 1:1 또는 소그룹 멘토링.
                  실무 적응과 역량 강화를 돕습니다.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    경력/직무 기반 멘토 매칭
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    월/분기 단위 정기 세션
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    진행 현황 리포트 제공
                  </li>
                </ul>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">채용 연계</h3>
                <p className="text-sm text-muted mb-4">
                  커피챗 멘티 중 우수 인재를 발굴하고 채용 과정을 연계합니다.
                  자연스러운 채용 브랜딩 효과도 있어요.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    멘티 인재 풀 접근
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    기업 소개 페이지 노출
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    입사 후 온보딩 멘토링
                  </li>
                </ul>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">사내 교육</h3>
                <p className="text-sm text-muted mb-4">
                  게임 업계 전문가가 진행하는 세미나, 워크샵을 기업 내부에서 운영합니다.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    직무별 기술 세미나
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    커리어 성장 워크샵
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    리더십/매니지먼트 교육
                  </li>
                </ul>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-3">맞춤 프로그램</h3>
                <p className="text-sm text-muted mb-4">
                  위 서비스를 조합하거나, 기업 상황에 맞는 별도 프로그램을 설계해드려요.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    니즈 분석 후 설계
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    전담 담당자 배정
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    프로그램 종료 후 성과 리포트
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">도입 절차</h2>

            <div className="space-y-6">
              {[
                { step: "1", title: "문의", desc: "아래 양식으로 필요한 서비스를 알려주세요." },
                { step: "2", title: "상담", desc: "담당자가 연락드려서 구체적인 니즈를 파악해요." },
                { step: "3", title: "설계", desc: "기업 상황에 맞는 프로그램을 제안드려요." },
                { step: "4", title: "운영", desc: "프로그램을 시작하고, 진행 상황을 함께 관리해요." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact" className="py-16 md:py-20 bg-card-bg border-y border-card-border">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-2">도입 문의</h2>
            <p className="text-muted mb-8">
              양식을 작성해주시면 영업일 기준 1~2일 내에 연락드립니다.
            </p>

            {isSubmitted ? (
              <div className="bg-background border border-card-border rounded-xl p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/15 flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">문의가 접수되었습니다.</h3>
                <p className="text-muted text-sm mb-6">
                  담당자가 확인 후 빠르게 연락드리겠습니다.
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-2.5 border border-card-border rounded-full text-sm hover:border-primary hover:text-primary transition-colors"
                >
                  홈으로 돌아가기
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-background border border-card-border rounded-xl p-6 md:p-8 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      회사명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="회사명"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      담당자명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="성함"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="email@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">연락처</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">임직원 규모</label>
                  <select
                    name="employeeCount"
                    value={formData.employeeCount}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="">선택</option>
                    <option value="1-10">1~10명</option>
                    <option value="11-50">11~50명</option>
                    <option value="51-200">51~200명</option>
                    <option value="201-500">201~500명</option>
                    <option value="500+">500명 이상</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">문의 내용</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-secondary border border-card-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                    placeholder="관심 있는 서비스나 궁금한 점을 적어주세요"
                  />
                </div>

                {submitError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? "처리 중..." : "문의하기"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
