import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_CONFIG } from "@/lib/site-config";

export default function MentorRecruitPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />

          <div className="relative max-w-3xl mx-auto px-4 text-center">
            <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6">
              멘토 모집
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
              게임 업계 경력,
              <br />
              후배들과 나눠보세요.
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto mb-4 leading-relaxed">
              내가 정한 시간에, 내가 정한 가격으로.
              <br />
              경험을 나누면서 수익도 만들 수 있어요.
            </p>
            <p className="text-sm text-muted mb-8">
              지금 파운딩 멘토로 합류하면 3개월간 수수료 0%
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mentor/apply"
                className="px-8 py-3.5 bg-primary text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                멘토 지원하기
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-3.5 border border-card-border text-foreground rounded-full font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                자세히 알아보기
              </a>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-20 bg-card-bg border-y border-card-border">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-3">왜 커피챗 멘토인가요?</h2>
            <p className="text-muted mb-10">게임 업계 유일의 멘토링 플랫폼에서 활동하세요.</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="bg-background border border-card-border rounded-xl p-6 animate-fade-in-up [animation-delay:100ms]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">수익 창출</h3>
                <p className="text-sm text-muted leading-relaxed">
                  가격을 직접 설정하고, 수익의 85% 이상을 가져가요.
                  커피챗 한 번에 5만원부터, 모의면접은 10만원 이상도 가능해요.
                </p>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6 animate-fade-in-up [animation-delay:200ms]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">시간 자율</h3>
                <p className="text-sm text-muted leading-relaxed">
                  가능한 시간대를 직접 설정하세요.
                  퇴근 후 30분, 주말 오전 1시간 등 여유 있는 시간만 활용하면 돼요.
                </p>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6 animate-fade-in-up [animation-delay:300ms]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">인증된 현직자</h3>
                <p className="text-sm text-muted leading-relaxed">
                  회사 이메일 인증으로 &quot;진짜 현직자&quot;임을 증명해요.
                  무료 플랫폼과는 다른 신뢰도를 제공합니다.
                </p>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6 animate-fade-in-up [animation-delay:400ms]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">의미 있는 영향력</h3>
                <p className="text-sm text-muted leading-relaxed">
                  게임 업계에 들어오고 싶은 후배들에게 실질적인 도움을 줄 수 있어요.
                  5분 조언이 누군가의 커리어를 바꿀 수도 있습니다.
                </p>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6 animate-fade-in-up [animation-delay:500ms]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">간편한 운영</h3>
                <p className="text-sm text-muted leading-relaxed">
                  예약 관리, 결제, 정산까지 플랫폼이 다 처리해요.
                  멘토는 대화에만 집중하면 됩니다.
                </p>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6 animate-fade-in-up [animation-delay:600ms]">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">멘토 대시보드</h3>
                <p className="text-sm text-muted leading-relaxed">
                  예약 현황, 수익 통계, 리뷰를 한눈에 확인하세요.
                  정산도 투명하게 관리됩니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founding Mentor Section */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-8 md:p-10">
              <div className="inline-block px-3 py-1 bg-primary/15 border border-primary/25 rounded-full text-primary text-xs font-semibold mb-5">
                FOUNDING MENTOR
              </div>
              <h2 className="text-2xl font-bold mb-3">파운딩 멘토 프로그램</h2>
              <p className="text-muted mb-8">초기에 합류하는 멘토에게 특별한 혜택을 드려요.</p>

              <div className="grid sm:grid-cols-2 gap-5 mb-8">
                <div className="bg-background/80 border border-card-border rounded-xl p-5">
                  <div className="text-2xl font-bold text-primary mb-1">0%</div>
                  <div className="text-sm font-medium mb-1">첫 3개월 수수료</div>
                  <p className="text-xs text-muted">
                    수익의 100%를 가져가세요.
                    일반 멘토는 15% 수수료가 있지만, 파운딩 멘토는 3개월간 면제됩니다.
                  </p>
                </div>
                <div className="bg-background/80 border border-card-border rounded-xl p-5">
                  <div className="text-2xl font-bold text-primary mb-1">우선 노출</div>
                  <div className="text-sm font-medium mb-1">프로필 상위 배치</div>
                  <p className="text-xs text-muted">
                    파운딩 멘토 뱃지와 함께 멘토 목록 상단에 노출돼요.
                    초기 멘티들의 눈에 먼저 띄게 됩니다.
                  </p>
                </div>
                <div className="bg-background/80 border border-card-border rounded-xl p-5">
                  <div className="text-2xl font-bold text-primary mb-1">직접 참여</div>
                  <div className="text-sm font-medium mb-1">서비스 방향 결정</div>
                  <p className="text-xs text-muted">
                    파운딩 멘토의 피드백은 서비스 개선에 직접 반영돼요.
                    함께 만들어가는 플랫폼입니다.
                  </p>
                </div>
                <div className="bg-background/80 border border-card-border rounded-xl p-5">
                  <div className="text-2xl font-bold text-primary mb-1">영구 혜택</div>
                  <div className="text-sm font-medium mb-1">파운딩 멘토 뱃지</div>
                  <p className="text-xs text-muted">
                    초기 멤버임을 나타내는 파운딩 뱃지가 영구적으로 유지돼요.
                    멘티들에게 신뢰감을 줍니다.
                  </p>
                </div>
              </div>

              <Link
                href="/mentor/apply"
                className="inline-block px-8 py-3.5 bg-primary text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                파운딩 멘토로 지원하기
              </Link>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="py-16 md:py-20 bg-card-bg border-y border-card-border">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-3">제공 가능한 멘토링</h2>
            <p className="text-muted mb-10">원하는 상품을 선택해서 등록하면 돼요. 가격도 직접 설정할 수 있어요.</p>

            <div className="space-y-4">
              <div className="bg-background border border-card-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">커피챗</h3>
                  <p className="text-sm text-muted">30분 | 커리어, 회사, 업계 전반에 대한 가벼운 상담</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">1만원 ~ 10만원</p>
                  <p className="text-xs text-muted">권장 5만원</p>
                </div>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">서류 리뷰</h3>
                  <p className="text-sm text-muted">30분 | 이력서, 포트폴리오에 대한 구체적인 피드백</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">2만원 ~ 20만원</p>
                  <p className="text-xs text-muted">권장 7만원</p>
                </div>
              </div>

              <div className="bg-background border border-card-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">모의 면접</h3>
                  <p className="text-sm text-muted">60분 | 실전 면접 시뮬레이션 + 즉석 피드백</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">3만원 ~ 30만원</p>
                  <p className="text-xs text-muted">권장 10만원</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">멘토가 되는 방법</h2>

            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "지원서 작성",
                  desc: "회사 이메일 인증, 경력 정보, 제공할 멘토링 상품과 가격을 설정해요. 3분이면 충분해요.",
                },
                {
                  step: "2",
                  title: "관리자 검토",
                  desc: "이메일 인증과 경력을 확인한 뒤 승인해요. 보통 1~2영업일 내에 결과를 안내드려요.",
                },
                {
                  step: "3",
                  title: "멘토 활동 시작",
                  desc: "승인되면 바로 멘토 대시보드가 활성화돼요. 예약이 들어오면 알림을 받고, 일정에 맞춰 멘토링을 진행하세요.",
                },
              ].map((item, index) => (
                <div key={item.step} className="flex gap-4 items-start animate-fade-in-up" style={{ animationDelay: `${(index + 1) * 100}ms` }}>
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

        {/* Commission Structure */}
        <section className="py-16 md:py-20 bg-card-bg border-y border-card-border">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-3">수수료 구조</h2>
            <p className="text-muted mb-8">활동이 많아질수록 수수료가 낮아져요.</p>

            <div className="overflow-x-auto -mx-4 px-4">
              <div className="bg-background border border-card-border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="text-left px-5 py-3.5 font-semibold">구간</th>
                      <th className="text-right px-5 py-3.5 font-semibold">멘토 수취</th>
                      <th className="text-right px-5 py-3.5 font-semibold">플랫폼</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-card-border bg-primary/5">
                      <td className="px-5 py-3.5">
                        <span className="font-medium">파운딩 멘토</span>
                        <span className="text-xs text-muted ml-1.5">(첫 3개월)</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-primary">100%</td>
                      <td className="px-5 py-3.5 text-right text-muted">0%</td>
                    </tr>
                    <tr className="border-b border-card-border">
                      <td className="px-5 py-3.5">기본</td>
                      <td className="px-5 py-3.5 text-right font-medium">85%</td>
                      <td className="px-5 py-3.5 text-right text-muted">15%</td>
                    </tr>
                    <tr className="border-b border-card-border">
                      <td className="px-5 py-3.5">
                        누적 정산 100만원+
                        <span className="text-xs text-muted ml-1.5">(실버)</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">88%</td>
                      <td className="px-5 py-3.5 text-right text-muted">12%</td>
                    </tr>
                    <tr className="border-b border-card-border">
                      <td className="px-5 py-3.5">
                        누적 정산 500만원+
                        <span className="text-xs text-muted ml-1.5">(골드)</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">90%</td>
                      <td className="px-5 py-3.5 text-right text-muted">10%</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3.5">
                        누적 정산 2,000만원+
                        <span className="text-xs text-muted ml-1.5">(플래티넘)</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium">92%</td>
                      <td className="px-5 py-3.5 text-right text-muted">8%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-xs text-muted mt-4">
              정산은 매주 월요일 기준으로 처리되며, 3영업일 내에 등록된 계좌로 입금됩니다.
            </p>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">자주 묻는 질문</h2>

            <div className="space-y-5">
              {[
                {
                  q: "어떤 사람이 멘토가 될 수 있나요?",
                  a: "게임 업계 현직자로 경력 3년 이상이면 누구나 지원할 수 있어요. 기획, 프로그래밍, 아트, QA, 마케팅 등 직군은 상관없어요. 회사 이메일 인증이 필요합니다.",
                },
                {
                  q: "얼마나 시간을 투자해야 하나요?",
                  a: "전혀 부담 없어요. 한 달에 커피챗 1~2번만 해도 괜찮고, 여유가 있으면 더 많이 할 수도 있어요. 가능한 시간대를 직접 설정하니까 본업에 지장이 없어요.",
                },
                {
                  q: "수익은 얼마나 되나요?",
                  a: "가격을 직접 설정할 수 있어요. 커피챗 기준 권장가 5만원으로, 한 달에 4번이면 약 20만원 정도예요. 서류 리뷰나 모의면접은 더 높은 가격을 설정할 수 있어요.",
                },
                {
                  q: "정산은 어떻게 되나요?",
                  a: "매주 월요일에 정산이 처리되고, 3영업일 내에 등록한 은행 계좌로 입금돼요. 멘토 대시보드에서 수익과 정산 내역을 실시간으로 확인할 수 있어요.",
                },
                {
                  q: "회사에서 알게 되면 문제가 되지 않나요?",
                  a: "커피챗은 강의나 외부 활동이 아니라 \"커리어 멘토링\"이에요. 대부분의 회사에서 허용하지만, 회사 겸업 정책을 확인해보시는 걸 권장해요.",
                },
                {
                  q: "멘토링은 어떤 방식으로 진행하나요?",
                  a: "온라인(줌, 구글미트 등) 또는 오프라인 모두 가능해요. 멘토가 선호하는 방식을 직접 선택할 수 있어요.",
                },
              ].map((item, i) => (
                <div key={i} className="bg-card-bg border border-card-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">{item.q}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-card-bg border-y border-card-border">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-3">
              게임 업계 후배들이 기다리고 있어요
            </h2>
            <p className="text-muted mb-8">
              경험을 나누면서 수익도 만들어보세요.
              <br />
              파운딩 멘토 모집은 선착순으로 마감될 수 있어요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/mentor/apply"
                className="px-8 py-3.5 bg-primary text-white rounded-full font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
              >
                멘토 지원하기
              </Link>
              <Link
                href="/mentor/guidelines"
                className="px-8 py-3.5 border border-card-border text-foreground rounded-full font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                멘토 가이드라인
              </Link>
            </div>

            <div className="mt-10 text-sm text-muted">
              궁금한 점이 있으면{" "}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail.support}`}
                className="text-primary hover:underline"
              >
                {SITE_CONFIG.contactEmail.support}
              </a>
              으로 편하게 문의해주세요.
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
