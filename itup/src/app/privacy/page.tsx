"use client";

import Link from "next/link";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2">개인정보처리방침</h1>
        <p className="text-muted mb-8">최종 수정일: 2025년 1월 28일</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground/90">
          {/* 개요 */}
          <section>
            <p className="leading-relaxed">
              ITup(이하 &quot;회사&quot;)은 회원의 개인정보를 중요시하며, 「개인정보 보호법」을 준수합니다.
              회사는 개인정보처리방침을 통하여 회원이 제공하는 개인정보가 어떠한 용도와 방식으로
              이용되고 있으며, 개인정보보호를 위해 어떠한 조치가 취해지고 있는지 알려드립니다.
            </p>
          </section>

          {/* 제1조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제1조 (수집하는 개인정보 항목)</h2>
            <p className="mb-4">회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>

            <h3 className="font-medium mb-2 text-foreground">1. 회원가입 시</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>필수: 이메일, 비밀번호, 이름</li>
              <li>선택: 연락처, 프로필 이미지</li>
            </ul>

            <h3 className="font-medium mb-2 text-foreground">2. 멘토링 신청 시</h3>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>필수: 이름, 연락처, 이메일</li>
              <li>선택: 관심 분야, 문의 내용</li>
            </ul>

            <h3 className="font-medium mb-2 text-foreground">3. 서비스 이용 과정에서 자동 수집</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>IP 주소, 쿠키, 방문 일시, 서비스 이용 기록</li>
            </ul>
          </section>

          {/* 제2조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제2조 (개인정보의 수집 및 이용목적)</h2>
            <p className="mb-4">수집한 개인정보는 다음의 목적으로 이용됩니다:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>서비스 제공:</strong> 멘토-멘티 매칭, 멘토링 예약 및 진행, 결제 처리</li>
              <li><strong>회원 관리:</strong> 본인 확인, 서비스 부정 이용 방지, 고객 상담</li>
              <li><strong>마케팅 활용:</strong> 이벤트 안내, 맞춤 서비스 제공 (동의 시)</li>
              <li><strong>서비스 개선:</strong> 서비스 이용 통계 분석, 신규 서비스 개발</li>
            </ol>
          </section>

          {/* 제3조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제3조 (개인정보의 보유 및 이용기간)</h2>
            <p className="mb-4">회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령에 따라 보존할 필요가 있는 경우 아래와 같이 보관합니다:</p>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <p><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 (전자상거래법)</p>
              <p><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래법)</p>
              <p><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래법)</p>
              <p><strong>웹사이트 방문기록:</strong> 3개월 (통신비밀보호법)</p>
            </div>
          </section>

          {/* 제4조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제4조 (개인정보의 제3자 제공)</h2>
            <p className="mb-4">회사는 회원의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>회원이 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              <li>멘토링 서비스 제공을 위해 멘토에게 멘티의 연락처를 제공하는 경우 (사전 동의)</li>
            </ol>
          </section>

          {/* 제5조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제5조 (개인정보의 파기)</h2>
            <p className="mb-4">회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.</p>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>파기 절차:</strong> 회원이 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져 내부 방침 및 관련 법령에 따라 일정기간 저장된 후 파기됩니다.</li>
              <li><strong>파기 방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
            </ol>
          </section>

          {/* 제6조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제6조 (회원의 권리와 행사방법)</h2>
            <p className="mb-4">회원은 언제든지 다음의 권리를 행사할 수 있습니다:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리정지 요구</li>
            </ol>
            <p className="mt-4">위 권리 행사는 서비스 내 설정 또는 고객센터를 통해 가능합니다.</p>
          </section>

          {/* 제7조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제7조 (개인정보의 안전성 확보조치)</h2>
            <p className="mb-4">회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>관리적 조치:</strong> 개인정보 취급 직원의 최소화 및 교육</li>
              <li><strong>기술적 조치:</strong> 개인정보 암호화, 보안 프로그램 설치, 접근 통제</li>
              <li><strong>물리적 조치:</strong> 전산실 및 자료 보관실의 접근 통제</li>
            </ol>
          </section>

          {/* 제8조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제8조 (쿠키의 사용)</h2>
            <p className="mb-4">회사는 회원에게 개별적인 맞춤서비스를 제공하기 위해 쿠키(cookie)를 사용합니다.</p>
            <ol className="list-decimal list-inside space-y-2">
              <li><strong>쿠키 사용 목적:</strong> 회원의 접속 빈도나 방문 시간 등 분석, 맞춤형 서비스 제공</li>
              <li><strong>쿠키 설정 거부:</strong> 브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.</li>
            </ol>
          </section>

          {/* 제9조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제9조 (개인정보 보호책임자)</h2>
            <p className="mb-4">회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>

            <div className="bg-secondary/50 rounded-lg p-4">
              <p><strong>개인정보 보호책임자</strong></p>
              <p>이메일: privacy@coffeechat.kr</p>
            </div>

            <p className="mt-4">
              기타 개인정보침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하시기 바랍니다:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
              <li>대검찰청 사이버범죄수사단 (www.spo.go.kr / 02-3480-3573)</li>
              <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)</li>
            </ul>
          </section>

          {/* 제10조 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">제10조 (개인정보처리방침의 변경)</h2>
            <p>이 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 수 있으며, 변경 시 최소 7일 전에 공지사항을 통해 고지합니다.</p>
          </section>

          {/* 부칙 */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-foreground">부칙</h2>
            <p>이 개인정보처리방침은 2025년 1월 28일부터 시행합니다.</p>
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
