"use client";

import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-card-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="flex items-center gap-2 group w-fit">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white text-sm">☕</span>
            </div>
            <span className="font-bold text-foreground group-hover:text-primary transition-colors">
              커피챗
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">이용약관</h1>
        <p className="text-muted mb-8">최종 수정일: 2025년 1월 28일</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
          {/* 제1조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제1조 (목적)</h2>
            <p className="leading-relaxed">
              이 약관은 커피챗(이하 &quot;회사&quot;)이 제공하는 멘토링 플랫폼 서비스(이하 &quot;서비스&quot;)의
              이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제2조 (정의)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>&quot;서비스&quot;란 회사가 제공하는 게임 업계 멘토링 연결 플랫폼을 의미합니다.</li>
              <li>&quot;회원&quot;이란 이 약관에 동의하고 서비스를 이용하는 자를 의미합니다.</li>
              <li>&quot;멘토&quot;란 회사의 심사를 거쳐 멘토링을 제공하는 자를 의미합니다.</li>
              <li>&quot;멘티&quot;란 멘토링을 신청하고 제공받는 회원을 의미합니다.</li>
            </ol>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.</li>
              <li>변경된 약관은 공지 후 7일이 경과한 날부터 효력이 발생합니다.</li>
            </ol>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제4조 (서비스의 제공)</h2>
            <p className="mb-4">회사는 다음과 같은 서비스를 제공합니다:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>멘토-멘티 매칭 서비스</li>
              <li>1:1 멘토링 상담 서비스</li>
              <li>포트폴리오 리뷰 서비스</li>
              <li>모의 면접 서비스</li>
              <li>기타 회사가 정하는 서비스</li>
            </ol>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제5조 (회원가입)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>서비스 이용을 원하는 자는 회사가 정한 절차에 따라 회원가입을 신청합니다.</li>
              <li>회사는 다음 각 호에 해당하는 경우 회원가입을 거부할 수 있습니다:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>타인의 정보를 도용한 경우</li>
                  <li>허위 정보를 기재한 경우</li>
                  <li>기타 회원으로 등록하는 것이 부적절하다고 판단되는 경우</li>
                </ul>
              </li>
            </ol>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제6조 (회원의 의무)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>회원은 서비스 이용 시 관련 법령과 이 약관을 준수해야 합니다.</li>
              <li>회원은 타인의 권리를 침해하거나 명예를 훼손하는 행위를 해서는 안 됩니다.</li>
              <li>회원은 서비스를 통해 얻은 정보를 회사의 사전 동의 없이 상업적으로 이용할 수 없습니다.</li>
            </ol>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제7조 (결제 및 환불)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>유료 서비스의 결제는 회사가 정한 방법에 따릅니다.</li>
              <li>멘토링 시작 48시간 전까지 취소 시 전액 환불됩니다.</li>
              <li>멘토링 시작 24~48시간 전 취소 시 50% 환불됩니다.</li>
              <li>멘토링 시작 24시간 이내 취소 시 환불이 불가합니다.</li>
              <li>멘토의 귀책사유(노쇼 등)인 경우 전액 환불됩니다.</li>
            </ol>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제8조 (면책조항)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>회사는 멘토와 멘티 간의 멘토링 내용에 대해 책임지지 않습니다.</li>
              <li>회사는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.</li>
              <li>회사는 회원이 서비스를 통해 얻은 정보의 정확성, 신뢰성에 대해 보증하지 않습니다.</li>
            </ol>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제9조 (분쟁해결)</h2>
            <ol className="list-decimal list-inside space-y-2">
              <li>이 약관에 관한 분쟁은 대한민국 법령에 따라 해결합니다.</li>
              <li>서비스 이용과 관련하여 분쟁이 발생한 경우, 회사의 본사 소재지를 관할하는 법원을 전속관할법원으로 합니다.</li>
            </ol>
          </section>

          {/* 부칙 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">부칙</h2>
            <p>이 약관은 2025년 1월 28일부터 시행합니다.</p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-card-border">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
