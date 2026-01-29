"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  const teamMembers = [
    {
      name: "김철수",
      role: "CEO / Co-founder",
      description: "게임 업계 15년 경력. 전 넥슨 프로듀서",
      image: "/team/ceo.jpg",
    },
    {
      name: "이영희",
      role: "CTO / Co-founder",
      description: "개발 리드 10년. 전 크래프톤 테크 리드",
      image: "/team/cto.jpg",
    },
    {
      name: "박지민",
      role: "Head of Operations",
      description: "커피챗 운영 전문가",
      image: "/team/coo.jpg",
    },
  ];

  const values = [
    {
      icon: "🎯",
      title: "실전 중심",
      description: "현업에서 바로 적용할 수 있는 실질적인 조언을 제공해요.",
    },
    {
      icon: "🤝",
      title: "신뢰와 연결",
      description: "검증된 멘토와 멘티 간의 진정한 연결을 만들어가요.",
    },
    {
      icon: "🚀",
      title: "성장 지원",
      description: "개인의 커리어 성장을 위한 최적의 환경을 제공해요.",
    },
    {
      icon: "💡",
      title: "업계 인사이트",
      description: "게임 업계의 최신 트렌드와 인사이트를 공유해요.",
    },
  ];

  const milestones = [
    { year: "2023", event: "커피챗 서비스 런칭" },
    { year: "2023", event: "멘토 50명 돌파" },
    { year: "2024", event: "누적 상담 500건 달성" },
    { year: "2024", event: "기업 파트너십 프로그램 시작" },
    { year: "2025", event: "멘토 100명 돌파" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              게임 업계의 성장을
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                함께 만들어갑니다
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto">
              커피챗은 게임 업계 현직자와 예비 개발자를 연결하여
              <br className="hidden md:block" />
              실질적인 커리어 성장을 돕는 커피챗이에요.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 md:py-24 bg-card-bg border-y border-card-border">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">우리의 미션</h2>
                <p className="text-muted leading-relaxed mb-6">
                  게임 업계 취업과 커리어 성장은 혼자 준비하기 어려워요.
                  인터넷에 있는 정보는 오래되었거나 실무와 동떨어진 경우가 많아요.
                </p>
                <p className="text-muted leading-relaxed mb-6">
                  커피챗은 현업에서 직접 일하고 있는 게임 개발자, 기획자, 아티스트들과
                  1:1 대화를 통해 실질적인 조언을 받을 수 있는 기회를 제공해요.
                </p>
                <p className="text-foreground font-medium">
                  한 잔의 커피처럼 가볍게, 하지만 진정성 있는 대화를 통해
                  여러분의 꿈에 한 걸음 더 다가갈 수 있도록 도울게요.
                </p>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl mb-4">☕</div>
                    <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Coffee Chat
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">핵심 가치</h2>
              <p className="text-muted">우리가 중요하게 생각하는 것들</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="bg-card-bg border border-card-border rounded-xl p-6 hover:border-primary/50 transition-colors"
                >
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 md:py-24 bg-card-bg border-y border-card-border">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">우리의 여정</h2>
              <p className="text-muted">커피챗이 걸어온 길</p>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-card-border" />
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className={`relative flex items-center ${
                      index % 2 === 0 ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`w-5/12 ${
                        index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"
                      }`}
                    >
                      <div className="bg-background border border-card-border rounded-xl p-4">
                        <span className="text-primary font-bold">{milestone.year}</span>
                        <p className="text-sm mt-1">{milestone.event}</p>
                      </div>
                    </div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-primary rounded-full border-4 border-background" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">팀 소개</h2>
              <p className="text-muted">커피챗을 만들어가는 사람들</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-card-bg border border-card-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {member.name[0]}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                  <p className="text-primary text-sm mb-3">{member.role}</p>
                  <p className="text-sm text-muted">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 to-accent/10">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">함께 성장할 준비가 되셨나요?</h2>
            <p className="text-muted mb-8">
              지금 바로 커피챗에서 나에게 맞는 멘토를 찾아보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mentors"
                className="px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all"
              >
                멘토 찾아보기
              </Link>
              <Link
                href="/mentor/register"
                className="px-8 py-4 border border-card-border text-foreground rounded-full font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                멘토로 참여하기
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
