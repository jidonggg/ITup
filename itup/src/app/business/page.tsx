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

  const services = [
    {
      icon: "🎓",
      title: "기업 맞춤 멘토링",
      description: "임직원 대상 1:1 또는 그룹 멘토링 프로그램을 구성해드려요.",
      features: ["맞춤형 멘토 매칭", "정기 멘토링 세션", "성과 리포트 제공"],
    },
    {
      icon: "💼",
      title: "채용 연계 서비스",
      description: "커피챗 멘티 풀에서 우수 인재를 발굴하고 채용 연계해드려요.",
      features: ["인재 풀 접근", "채용 브랜딩", "온보딩 멘토링"],
    },
    {
      icon: "📚",
      title: "사내 교육 프로그램",
      description: "게임 업계 전문가가 진행하는 사내 교육 및 워크샵을 제공해요.",
      features: ["기술 세미나", "커리어 워크샵", "리더십 교육"],
    },
    {
      icon: "🤝",
      title: "파트너십 프로그램",
      description: "게임 스타트업과 대기업 간의 연결을 통해 시너지를 만들어요.",
      features: ["네트워킹 이벤트", "협업 기회 발굴", "인사이트 공유"],
    },
  ];

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
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/10" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <div className="inline-block px-4 py-2 bg-accent/10 border border-accent/30 rounded-full text-accent text-sm font-medium mb-6">
              For Business
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              기업의 성장을 위한
              <br />
              <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                맞춤 멘토링 솔루션
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-8">
              게임 업계 최고의 멘토 네트워크를 활용하여
              <br className="hidden md:block" />
              조직의 역량 강화와 인재 육성을 지원해요.
            </p>
            <a
              href="#contact"
              className="inline-block px-8 py-4 bg-gradient-to-r from-accent to-primary text-white rounded-full font-semibold hover:shadow-lg hover:shadow-accent/30 transition-all"
            >
              도입 문의하기
            </a>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="py-8 bg-card-bg border-y border-card-border">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-muted">
              게임 업계 현직자 멘토 네트워크 · 맞춤형 프로그램 설계 · 토스페이먼츠 안전 결제
            </p>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">기업 서비스</h2>
              <p className="text-muted">조직의 니즈에 맞는 다양한 프로그램을 제공해요</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-card-bg border border-card-border rounded-xl p-8 hover:border-accent/50 transition-colors"
                >
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-muted mb-4">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 md:py-24 bg-card-bg border-y border-card-border">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">도입 프로세스</h2>
              <p className="text-muted">간단한 4단계로 시작하세요</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: 1, title: "문의 접수", desc: "필요한 서비스에 대해 알려주세요" },
                { step: 2, title: "니즈 분석", desc: "담당자가 연락드려 상세하게 이야기해요" },
                { step: 3, title: "프로그램 설계", desc: "맞춤형 프로그램을 설계해요" },
                { step: 4, title: "서비스 시작", desc: "멘토링 프로그램을 시작해요" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                    <span className="text-white font-bold">{item.step}</span>
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact" className="py-16 md:py-24 bg-gradient-to-br from-accent/10 to-primary/10">
          <div className="max-w-2xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">도입 문의</h2>
              <p className="text-muted">
                아래 양식을 작성해주시면 담당자가 빠르게 연락드릴게요.
              </p>
            </div>

            {isSubmitted ? (
              <div className="bg-card-bg border border-card-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">문의가 접수되었어요!</h3>
                <p className="text-muted mb-6">
                  담당자가 영업일 기준 1-2일 내에 연락드릴게요.
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 border border-card-border rounded-full hover:border-primary hover:text-primary transition-colors"
                >
                  홈으로 돌아가기
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card-bg border border-card-border rounded-2xl p-8 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      회사명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl focus:outline-none focus:border-accent transition-colors"
                      placeholder="(주) 회사명"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      담당자명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl focus:outline-none focus:border-accent transition-colors"
                      placeholder="홍길동"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl focus:outline-none focus:border-accent transition-colors"
                      placeholder="email@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">연락처</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl focus:outline-none focus:border-accent transition-colors"
                      placeholder="010-1234-5678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">임직원 규모</label>
                  <select
                    name="employeeCount"
                    value={formData.employeeCount}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl focus:outline-none focus:border-accent transition-colors cursor-pointer"
                  >
                    <option value="">선택해주세요</option>
                    <option value="1-10">1-10명</option>
                    <option value="11-50">11-50명</option>
                    <option value="51-200">51-200명</option>
                    <option value="201-500">201-500명</option>
                    <option value="500+">500명 이상</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">문의 내용</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-secondary border border-card-border rounded-xl focus:outline-none focus:border-accent transition-colors resize-none"
                    placeholder="도입하고 싶은 서비스나 궁금한 점을 자유롭게 적어주세요"
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
                  className="w-full py-4 bg-gradient-to-r from-accent to-primary text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      처리 중...
                    </span>
                  ) : (
                    "문의하기"
                  )}
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
