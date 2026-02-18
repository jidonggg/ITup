import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_CONFIG } from "@/lib/site-config";

interface ReferralPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: ReferralPageProps) {
  const { code } = await params;
  return {
    title: `친구 추천 초대 | ${SITE_CONFIG.name}`,
    description: `${SITE_CONFIG.name}에 초대받았어요! 가입하면 첫 결제 20% 할인 혜택을 받을 수 있어요.`,
    openGraph: {
      title: `${SITE_CONFIG.name} - 친구 추천 초대`,
      description: "게임 업계 현직자 멘토링, 지금 가입하면 20% 할인!",
      url: `${SITE_CONFIG.url}/refer/${code}`,
    },
  };
}

export default async function ReferralLandingPage({ params }: ReferralPageProps) {
  const { code } = await params;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />

          <div className="relative max-w-2xl mx-auto px-4 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                />
              </svg>
              친구 추천 초대
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 leading-tight tracking-tight">
              게임 업계 현직자에게
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                직접 멘토링
              </span>
              을 받아보세요
            </h1>

            {/* Description */}
            <p className="text-muted text-lg max-w-xl mx-auto leading-relaxed mb-8">
              친구가 {SITE_CONFIG.name}을 추천했어요.
              <br />
              지금 가입하면 첫 결제 시 특별 할인 혜택을 드려요.
            </p>

            {/* Discount Highlight */}
            <div className="inline-block mb-10">
              <div className="relative px-8 py-5 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-primary to-accent rounded-full text-white text-xs font-bold">
                  특별 혜택
                </div>
                <p className="text-sm text-muted mb-2 mt-1">할인 코드</p>
                <p className="text-3xl font-bold font-mono tracking-widest text-primary">
                  WELCOME20
                </p>
                <p className="text-sm text-muted mt-2">
                  첫 결제 시 <span className="font-semibold text-foreground">20% 할인</span> 적용
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/signup?ref=${encodeURIComponent(code)}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold text-base hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                무료로 가입하기
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-card-border text-foreground rounded-full font-medium hover:border-primary/40 hover:text-primary transition-all duration-300"
              >
                서비스 알아보기
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12">
              {SITE_CONFIG.name}이 특별한 이유
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-card-bg border border-card-border rounded-2xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">현직자 멘토</h3>
                <p className="text-sm text-muted leading-relaxed">
                  회사 이메일 인증을 거친 대기업 현직자가 직접 멘토링해요.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-card-bg border border-card-border rounded-2xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">1:1 맞춤 상담</h3>
                <p className="text-sm text-muted leading-relaxed">
                  커리어 상담, 서류 리뷰, 모의 면접까지 원하는 서비스를 선택하세요.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-card-bg border border-card-border rounded-2xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">합리적인 가격</h3>
                <p className="text-sm text-muted leading-relaxed">
                  구독 없이 1회 단위 결제. 부담 없이 딱 필요한 만큼만 이용하세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-secondary/10 to-transparent">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-10">이용 방법</h2>

            <div className="space-y-6 text-left">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">무료 회원가입</h3>
                  <p className="text-sm text-muted">이메일로 간단하게 가입하세요. 1분이면 충분해요.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">멘토 선택</h3>
                  <p className="text-sm text-muted">원하는 분야와 경력의 멘토를 선택하세요.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">할인 코드 적용 후 결제</h3>
                  <p className="text-sm text-muted">
                    결제 시 <span className="font-semibold text-primary">WELCOME20</span> 코드를 입력하면 20% 할인이 적용돼요.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0 text-white text-sm font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">1:1 멘토링 진행</h3>
                  <p className="text-sm text-muted">온라인으로 편하게 멘토링을 받으세요.</p>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="mt-12">
              <Link
                href={`/signup?ref=${encodeURIComponent(code)}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-300"
              >
                지금 가입하고 20% 할인받기
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
