import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_CONFIG } from "@/lib/site-config";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />

          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              게임 업계 취업,
              <br />
              혼자 준비하기 막막하잖아요.
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto leading-relaxed">
              그래서 만들었어요.
              <br />
              현직자한테 직접 물어볼 수 있는 곳.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 md:py-20 bg-card-bg border-y border-card-border">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">왜 커피챗을 만들었나</h2>

            <div className="space-y-6 text-foreground/80 leading-relaxed">
              <p>
                게임 업계에 들어가고 싶은데 어디서부터 준비해야 할지 모르겠다는 이야기를 정말 많이 들었어요.
                인터넷에서 찾아보면 몇 년 전 정보거나, &quot;열심히 하세요&quot; 같은 뜬구름 잡는 답변뿐이고요.
              </p>
              <p>
                실제로 게임사에서 일하는 사람한테 물어보면 5분이면 알 수 있는 건데,
                그 5분짜리 대화를 할 기회가 없는 거예요.
                주변에 게임 업계 아는 사람이 없으면 더더욱요.
              </p>
              <p>
                커피챗은 그 간단한 문제를 해결하려고 시작했어요.
                넥슨, 넷마블, 크래프톤 같은 곳에서 실제로 일하고 있는 기획자, 개발자, 아티스트한테
                궁금한 걸 직접 물어볼 수 있는 자리를 만드는 거죠.
              </p>
              <p className="text-foreground font-medium">
                거창한 멘토링이 아니라, 커피 한 잔 하면서 나누는 솔직한 대화.
                그게 커피챗이 하고 싶은 거예요.
              </p>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">이런 걸 해요</h2>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="bg-card-bg border border-card-border rounded-xl p-6">
                <div className="text-2xl mb-3">☕</div>
                <h3 className="font-semibold mb-2">커피챗</h3>
                <p className="text-sm text-muted leading-relaxed">
                  현직자와 15분~30분 가볍게 이야기해요.
                  면접 준비, 회사 분위기, 직무 궁금증 등 뭐든 물어볼 수 있어요.
                </p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-6">
                <div className="text-2xl mb-3">📄</div>
                <h3 className="font-semibold mb-2">이력서 & 포폴 리뷰</h3>
                <p className="text-sm text-muted leading-relaxed">
                  실제 채용에 관여했던 분들이 이력서와 포트폴리오를 봐줘요.
                  어디를 어떻게 고치면 좋을지 구체적으로 알려줘요.
                </p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-6">
                <div className="text-2xl mb-3">🎤</div>
                <h3 className="font-semibold mb-2">모의면접</h3>
                <p className="text-sm text-muted leading-relaxed">
                  실전처럼 면접을 연습하고, 바로 피드백을 받아요.
                  실제 면접관 출신 멘토도 있어요.
                </p>
              </div>
              <div className="bg-card-bg border border-card-border rounded-xl p-6">
                <div className="text-2xl mb-3">🎮</div>
                <h3 className="font-semibold mb-2">게임 업계 전문</h3>
                <p className="text-sm text-muted leading-relaxed">
                  기획, 프로그래밍, 아트, QA, 마케팅까지.
                  게임 업계 전 직군의 현직자를 만날 수 있어요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - Simple */}
        <section className="py-16 md:py-20 bg-card-bg border-y border-card-border">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">이용 방법</h2>

            <div className="space-y-6">
              {[
                { step: "1", title: "멘토 고르기", desc: "회사, 직무, 경력을 보고 나한테 맞는 멘토를 선택해요." },
                { step: "2", title: "신청하기", desc: "궁금한 점을 적고 신청하면 돼요. 결제도 간편해요." },
                { step: "3", title: "대화하기", desc: "온라인 또는 오프라인으로 만나서 궁금한 걸 다 물어보세요." },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
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

        {/* CTA Section */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">궁금한 거 있으면 물어보세요</h2>
            <p className="text-muted mb-8">
              첫 커피챗, 부담 없이 시작해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mentors"
                className="px-8 py-3.5 bg-primary text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                멘토 찾아보기
              </Link>
              <Link
                href="/faq"
                className="px-8 py-3.5 border border-card-border text-foreground rounded-full font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                자주 묻는 질문
              </Link>
            </div>

            {/* Contact */}
            <div className="mt-10 text-sm text-muted">
              다른 궁금한 점이 있으면{" "}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail.support}`}
                className="text-primary hover:underline"
              >
                {SITE_CONFIG.contactEmail.support}
              </a>
              으로 편하게 메일 주세요.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
