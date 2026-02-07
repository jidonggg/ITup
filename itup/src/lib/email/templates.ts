// 이메일 템플릿

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// HTML 이스케이프 — XSS 방지
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 상담 신청 알림 (멘토에게)
export function consultationRequestTemplate(data: {
  mentorName: string;
  menteeName: string;
  menteeEmail: string;
  menteePhone: string;
  interest: string;
  preferredTime?: string;
  message?: string;
  siteUrl: string;
}): EmailTemplate {
  const interestLabels: Record<string, string> = {
    programming: "프로그래밍",
    planning: "기획",
    art: "아트",
    qa: "QA",
  };

  return {
    subject: `[커피챗] 새로운 상담 신청이 도착했습니다`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #A0714F, #7D5636); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">새로운 상담 신청</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.mentorName)}</strong> 멘토님!</p>
          <p style="margin-bottom: 20px;">새로운 상담 신청이 도착했습니다.</p>

          <div style="background: #F0E8E0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #A0714F; margin-top: 0;">신청자 정보</h3>
            <p><strong>이름:</strong> ${escapeHtml(data.menteeName)}</p>
            <p><strong>이메일:</strong> ${escapeHtml(data.menteeEmail)}</p>
            <p><strong>연락처:</strong> ${escapeHtml(data.menteePhone)}</p>
            <p><strong>관심 분야:</strong> ${escapeHtml(interestLabels[data.interest] || data.interest || "미지정")}</p>
            ${data.preferredTime ? `<p><strong>희망 시간:</strong> ${escapeHtml(data.preferredTime)}</p>` : ""}
            ${data.message ? `<p><strong>문의 내용:</strong> ${escapeHtml(data.message)}</p>` : ""}
          </div>

          <a href="${data.siteUrl}/mentor/dashboard"
             style="display: inline-block; background: linear-gradient(135deg, #A0714F, #7D5636); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            대시보드에서 확인하기
          </a>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 새로운 상담 신청

안녕하세요, ${data.mentorName} 멘토님!

새로운 상담 신청이 도착했습니다.

신청자 정보:
- 이름: ${data.menteeName}
- 이메일: ${data.menteeEmail}
- 연락처: ${data.menteePhone}
- 관심 분야: ${interestLabels[data.interest] || data.interest || "미지정"}
${data.preferredTime ? `- 희망 시간: ${data.preferredTime}` : ""}
${data.message ? `- 문의 내용: ${data.message}` : ""}

대시보드에서 확인: ${data.siteUrl}/mentor/dashboard
    `.trim(),
  };
}

// 상담 확정 알림 (멘티에게)
export function consultationConfirmedTemplate(data: {
  menteeName: string;
  mentorName: string;
  mentorCompany: string;
  siteUrl: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] 상담이 확정되었습니다!`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">상담 확정!</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.menteeName)}</strong>님!</p>
          <p style="margin-bottom: 20px;">축하합니다! 멘토링 상담이 확정되었습니다.</p>

          <div style="background: #F0E8E0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #10B981; margin-top: 0;">멘토 정보</h3>
            <p><strong>멘토:</strong> ${escapeHtml(data.mentorName)}</p>
            <p><strong>소속:</strong> ${escapeHtml(data.mentorCompany)}</p>
          </div>

          <p style="margin-bottom: 20px;">
            멘토님이 곧 연락드릴 예정입니다.<br/>
            마이페이지에서 상담 상태를 확인할 수 있습니다.
          </p>

          <a href="${data.siteUrl}/mypage"
             style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            마이페이지에서 확인하기
          </a>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 상담 확정!

안녕하세요, ${data.menteeName}님!

축하합니다! 멘토링 상담이 확정되었습니다.

멘토 정보:
- 멘토: ${data.mentorName}
- 소속: ${data.mentorCompany}

멘토님이 곧 연락드릴 예정입니다.
마이페이지에서 확인: ${data.siteUrl}/mypage
    `.trim(),
  };
}

// 기업 문의 알림 (관리자에게)
export function businessInquiryTemplate(data: {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  employeeCount?: string;
  message?: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] 새로운 기업 문의 - ${data.companyName}`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #A0714F, #7D5636); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">새로운 기업 문의</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">새로운 기업 도입 문의가 접수되었습니다.</p>
          <div style="background: #F0E8E0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #A0714F; margin-top: 0;">문의 정보</h3>
            <p><strong>회사명:</strong> ${escapeHtml(data.companyName)}</p>
            <p><strong>담당자:</strong> ${escapeHtml(data.contactName)}</p>
            <p><strong>이메일:</strong> ${escapeHtml(data.email)}</p>
            ${data.phone ? `<p><strong>연락처:</strong> ${escapeHtml(data.phone)}</p>` : ""}
            ${data.employeeCount ? `<p><strong>임직원 규모:</strong> ${escapeHtml(data.employeeCount)}</p>` : ""}
            ${data.message ? `<p><strong>문의 내용:</strong> ${escapeHtml(data.message)}</p>` : ""}
          </div>
          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 기업 문의 시스템에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 새로운 기업 문의

회사명: ${data.companyName}
담당자: ${data.contactName}
이메일: ${data.email}
${data.phone ? `연락처: ${data.phone}` : ""}
${data.employeeCount ? `임직원 규모: ${data.employeeCount}` : ""}
${data.message ? `문의 내용: ${data.message}` : ""}
    `.trim(),
  };
}

// 정산 완료 알림 (멘토에게)
export function settlementCompletedTemplate(data: {
  mentorName: string;
  periodStart: string;
  periodEnd: string;
  totalAmount: number;
  platformFee: number;
  settlementAmount: number;
  bankName: string;
  siteUrl: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] 정산이 완료되었습니다`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">정산 완료</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.mentorName)}</strong> 멘토님!</p>
          <p style="margin-bottom: 20px;">정산이 완료되어 입금이 진행됩니다.</p>

          <div style="background: #F0E8E0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #10B981; margin-top: 0;">정산 내역</h3>
            <p><strong>정산 기간:</strong> ${escapeHtml(data.periodStart)} ~ ${escapeHtml(data.periodEnd)}</p>
            <p><strong>총 매출:</strong> ${data.totalAmount.toLocaleString("ko-KR")}원</p>
            <p><strong>플랫폼 수수료:</strong> -${data.platformFee.toLocaleString("ko-KR")}원</p>
            <p style="font-size: 18px; font-weight: bold; color: #10B981;"><strong>입금 금액:</strong> ${data.settlementAmount.toLocaleString("ko-KR")}원</p>
            <p><strong>입금 은행:</strong> ${escapeHtml(data.bankName)}</p>
          </div>

          <p style="margin-bottom: 20px;">3영업일 이내에 등록하신 계좌로 입금될 예정입니다.</p>

          <a href="${data.siteUrl}/mentor/settlement"
             style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            정산 내역 확인하기
          </a>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 정산 완료

안녕하세요, ${data.mentorName} 멘토님!

정산이 완료되어 입금이 진행됩니다.

정산 내역:
- 정산 기간: ${data.periodStart} ~ ${data.periodEnd}
- 총 매출: ${data.totalAmount.toLocaleString("ko-KR")}원
- 플랫폼 수수료: -${data.platformFee.toLocaleString("ko-KR")}원
- 입금 금액: ${data.settlementAmount.toLocaleString("ko-KR")}원
- 입금 은행: ${data.bankName}

3영업일 이내에 등록하신 계좌로 입금될 예정입니다.

정산 내역 확인: ${data.siteUrl}/mentor/settlement
    `.trim(),
  };
}

// 멘토 검증 거절 알림
export function mentorRejectedTemplate(data: {
  mentorName: string;
  reason?: string;
  siteUrl: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] 멘토 검증 결과 안내`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6B7280, #4B5563); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">멘토 검증 결과 안내</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.mentorName)}</strong>님!</p>
          <p style="margin-bottom: 20px;">
            멘토 검증 신청을 검토한 결과, 아쉽게도 현재 기준에 부합하지 않아 승인이 어렵게 되었습니다.
          </p>

          ${data.reason ? `
          <div style="background: #FEF3C7; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #FCD34D;">
            <h3 style="color: #D97706; margin-top: 0;">검토 결과</h3>
            <p style="margin: 0; color: #92400E;">${escapeHtml(data.reason)}</p>
          </div>
          ` : ""}

          <p style="margin-bottom: 20px;">
            더 자세한 내용이 궁금하시면 고객센터로 문의해 주세요.<br/>
            추후 다시 신청하실 수 있으며, 기준을 충족하시면 언제든 재신청 가능합니다.
          </p>

          <a href="${data.siteUrl}/mentor/apply"
             style="display: inline-block; background: linear-gradient(135deg, #A0714F, #7D5636); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            다시 신청하기
          </a>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 멘토 검증 결과 안내

안녕하세요, ${data.mentorName}님!

멘토 검증 신청을 검토한 결과, 아쉽게도 현재 기준에 부합하지 않아 승인이 어렵게 되었습니다.
${data.reason ? `\n검토 결과: ${data.reason}\n` : ""}
더 자세한 내용이 궁금하시면 고객센터로 문의해 주세요.
추후 다시 신청하실 수 있으며, 기준을 충족하시면 언제든 재신청 가능합니다.

다시 신청하기: ${data.siteUrl}/mentor/apply
    `.trim(),
  };
}

// 멘토 승인 알림
export function mentorApprovedTemplate(data: {
  mentorName: string;
  siteUrl: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] 멘토 등록이 승인되었습니다!`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #A0714F, #7D5636); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">멘토 승인 완료!</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.mentorName)}</strong>님!</p>
          <p style="margin-bottom: 20px;">
            축하합니다! 커피챗 멘토 등록이 승인되었습니다.<br/>
            이제 멘토 목록에서 프로필이 공개되며, 멘티들의 상담 신청을 받을 수 있습니다.
          </p>

          <a href="${data.siteUrl}/mentor/dashboard"
             style="display: inline-block; background: linear-gradient(135deg, #A0714F, #7D5636); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            멘토 대시보드로 이동
          </a>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 멘토 승인 완료!

안녕하세요, ${data.mentorName}님!

축하합니다! 커피챗 멘토 등록이 승인되었습니다.
이제 멘토 목록에서 프로필이 공개되며, 멘티들의 상담 신청을 받을 수 있습니다.

멘토 대시보드: ${data.siteUrl}/mentor/dashboard
    `.trim(),
  };
}

// ============================================================
// 예약 관련 이메일 템플릿 (6종)
// ============================================================

// 1. 새 예약 알림 (멘토용) - 멘티가 예약 생성 시
export function newBookingForMentorTemplate(data: {
  mentorName: string;
  menteeName: string;
  productName: string;
  scheduledAt: string;
  duration: number;
  price: number;
  bookingId: string;
  siteUrl: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] 새로운 예약이 도착했습니다 - ${data.menteeName}님`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #A0714F, #7D5636); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">새로운 예약 요청</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.mentorName)}</strong> 멘토님!</p>
          <p style="margin-bottom: 20px;">새로운 멘토링 예약이 도착했습니다. 확인 후 확정해 주세요.</p>

          <div style="background: #F0E8E0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #A0714F; margin-top: 0;">예약 정보</h3>
            <p style="margin: 8px 0;"><strong>멘티:</strong> ${escapeHtml(data.menteeName)}</p>
            <p style="margin: 8px 0;"><strong>상품:</strong> ${escapeHtml(data.productName)}</p>
            <p style="margin: 8px 0;"><strong>일시:</strong> ${escapeHtml(data.scheduledAt)}</p>
            <p style="margin: 8px 0;"><strong>시간:</strong> ${data.duration}분</p>
            <p style="margin: 8px 0;"><strong>금액:</strong> ${data.price.toLocaleString("ko-KR")}원</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.siteUrl}/mentor/dashboard?booking=${escapeHtml(data.bookingId)}"
               style="display: inline-block; background: linear-gradient(135deg, #A0714F, #7D5636); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              예약 확인 및 확정하기
            </a>
          </div>

          <p style="color: #9CA3AF; font-size: 13px; margin-bottom: 10px;">
            * 24시간 이내에 확정하지 않으면 예약이 자동 취소됩니다.
          </p>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 새로운 예약 요청

안녕하세요, ${data.mentorName} 멘토님!

새로운 멘토링 예약이 도착했습니다.

예약 정보:
- 멘티: ${data.menteeName}
- 상품: ${data.productName}
- 일시: ${data.scheduledAt}
- 시간: ${data.duration}분
- 금액: ${data.price.toLocaleString("ko-KR")}원

예약 확인 및 확정: ${data.siteUrl}/mentor/dashboard?booking=${data.bookingId}

* 24시간 이내에 확정하지 않으면 예약이 자동 취소됩니다.
    `.trim(),
  };
}

// 2. 예약 확정 알림 (멘티용) - 멘토가 예약 확정 시
export function bookingConfirmedForMenteeTemplate(data: {
  menteeName: string;
  mentorName: string;
  mentorCompany: string;
  mentorPosition: string;
  productName: string;
  scheduledAt: string;
  duration: number;
  meetingLink?: string;
  bookingId: string;
  siteUrl: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] 예약이 확정되었습니다 - ${data.mentorName} 멘토님`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">예약 확정!</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.menteeName)}</strong>님!</p>
          <p style="margin-bottom: 20px;">멘토링 예약이 확정되었습니다! 아래 일정에 맞춰 준비해 주세요.</p>

          <div style="background: #ECFDF5; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #A7F3D0;">
            <h3 style="color: #059669; margin-top: 0;">멘토 정보</h3>
            <p style="margin: 8px 0;"><strong>멘토:</strong> ${escapeHtml(data.mentorName)}</p>
            <p style="margin: 8px 0;"><strong>소속:</strong> ${escapeHtml(data.mentorCompany)}</p>
            <p style="margin: 8px 0;"><strong>직책:</strong> ${escapeHtml(data.mentorPosition)}</p>
          </div>

          <div style="background: #F0E8E0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #A0714F; margin-top: 0;">세션 정보</h3>
            <p style="margin: 8px 0;"><strong>상품:</strong> ${escapeHtml(data.productName)}</p>
            <p style="margin: 8px 0;"><strong>일시:</strong> ${escapeHtml(data.scheduledAt)}</p>
            <p style="margin: 8px 0;"><strong>시간:</strong> ${data.duration}분</p>
            ${data.meetingLink ? `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #E8DED4;">
              <p style="margin: 8px 0;"><strong>미팅 링크:</strong></p>
              <a href="${escapeHtml(data.meetingLink)}" style="color: #A0714F; word-break: break-all;">${escapeHtml(data.meetingLink)}</a>
            </div>
            ` : ""}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.siteUrl}/mypage/bookings/${escapeHtml(data.bookingId)}"
               style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              예약 상세 보기
            </a>
          </div>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 예약 확정!

안녕하세요, ${data.menteeName}님!

멘토링 예약이 확정되었습니다!

멘토 정보:
- 멘토: ${data.mentorName}
- 소속: ${data.mentorCompany}
- 직책: ${data.mentorPosition}

세션 정보:
- 상품: ${data.productName}
- 일시: ${data.scheduledAt}
- 시간: ${data.duration}분
${data.meetingLink ? `- 미팅 링크: ${data.meetingLink}` : ""}

예약 상세 보기: ${data.siteUrl}/mypage/bookings/${data.bookingId}
    `.trim(),
  };
}

// 3. 24시간 전 리마인더 (멘토, 멘티 모두)
export function sessionReminder24hTemplate(data: {
  recipientName: string;
  recipientRole: "mentor" | "mentee";
  counterpartName: string;
  productName: string;
  scheduledAt: string;
  duration: number;
  meetingLink?: string;
  preparationTips?: string[];
  bookingId: string;
  siteUrl: string;
}): EmailTemplate {
  const roleLabel = data.recipientRole === "mentor" ? "멘티" : "멘토";
  const defaultTips =
    data.recipientRole === "mentee"
      ? [
          "질문하고 싶은 내용을 미리 정리해 보세요",
          "조용하고 안정적인 인터넷 환경을 준비해 주세요",
          "카메라와 마이크 테스트를 해보세요",
        ]
      : [
          "멘티의 프로필과 관심사를 다시 확인해 주세요",
          "조용한 환경에서 진행해 주세요",
          "카메라와 마이크 테스트를 해보세요",
        ];
  const tips = data.preparationTips || defaultTips;

  return {
    subject: `[커피챗] 내일 멘토링이 예정되어 있습니다 - ${data.counterpartName}님`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #F59E0B, #D97706); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">내일 멘토링이 있습니다!</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.recipientName)}</strong>님!</p>
          <p style="margin-bottom: 20px;">내일 예정된 멘토링 세션을 알려드립니다. 미리 준비해 주세요!</p>

          <div style="background: #FEF3C7; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #FCD34D;">
            <h3 style="color: #D97706; margin-top: 0;">세션 정보</h3>
            <p style="margin: 8px 0;"><strong>${roleLabel}:</strong> ${escapeHtml(data.counterpartName)}</p>
            <p style="margin: 8px 0;"><strong>상품:</strong> ${escapeHtml(data.productName)}</p>
            <p style="margin: 8px 0;"><strong>일시:</strong> ${escapeHtml(data.scheduledAt)}</p>
            <p style="margin: 8px 0;"><strong>시간:</strong> ${data.duration}분</p>
          </div>

          ${data.meetingLink ? `
          <div style="background: #EFF6FF; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #BFDBFE;">
            <h3 style="color: #2563EB; margin-top: 0;">미팅 링크</h3>
            <a href="${escapeHtml(data.meetingLink)}"
               style="display: inline-block; background: linear-gradient(135deg, #2563EB, #1D4ED8); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              미팅 참여하기
            </a>
          </div>
          ` : ""}

          <div style="background: #F0E8E0; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #A0714F; margin-top: 0;">준비사항</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${tips.map((tip) => `<li style="margin: 8px 0;">${escapeHtml(tip)}</li>`).join("")}
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.siteUrl}/${data.recipientRole === "mentor" ? "mentor/dashboard" : "mypage/bookings"}/${escapeHtml(data.bookingId)}"
               style="display: inline-block; background: linear-gradient(135deg, #A0714F, #7D5636); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              예약 상세 보기
            </a>
          </div>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 내일 멘토링이 있습니다!

안녕하세요, ${data.recipientName}님!

내일 예정된 멘토링 세션을 알려드립니다.

세션 정보:
- ${roleLabel}: ${data.counterpartName}
- 상품: ${data.productName}
- 일시: ${data.scheduledAt}
- 시간: ${data.duration}분
${data.meetingLink ? `- 미팅 링크: ${data.meetingLink}` : ""}

준비사항:
${tips.map((tip) => `- ${tip}`).join("\n")}

예약 상세 보기: ${data.siteUrl}/${data.recipientRole === "mentor" ? "mentor/dashboard" : "mypage/bookings"}/${data.bookingId}
    `.trim(),
  };
}

// 4. 1시간 전 리마인더 (멘토, 멘티 모두)
export function sessionReminder1hTemplate(data: {
  recipientName: string;
  recipientRole: "mentor" | "mentee";
  counterpartName: string;
  scheduledAt: string;
  meetingLink?: string;
  siteUrl: string;
}): EmailTemplate {
  const roleLabel = data.recipientRole === "mentor" ? "멘티" : "멘토";

  return {
    subject: `[커피챗] 1시간 후 멘토링이 시작됩니다!`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #EF4444, #DC2626); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">1시간 후 멘토링 시작!</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.recipientName)}</strong>님!</p>
          <p style="margin-bottom: 20px; font-size: 18px; color: #EF4444; font-weight: bold;">
            1시간 후에 멘토링이 시작됩니다!
          </p>

          <div style="background: #FEF2F2; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #FECACA;">
            <p style="margin: 8px 0;"><strong>${roleLabel}:</strong> ${escapeHtml(data.counterpartName)}</p>
            <p style="margin: 8px 0;"><strong>시작 시간:</strong> ${escapeHtml(data.scheduledAt)}</p>
          </div>

          ${data.meetingLink ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${escapeHtml(data.meetingLink)}"
               style="display: inline-block; background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 18px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">
              미팅 참여하기
            </a>
          </div>
          ` : `
          <p style="text-align: center; color: #9CA3AF;">
            미팅 링크는 예약 상세 페이지에서 확인하세요.
          </p>
          `}

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 1시간 후 멘토링 시작!

안녕하세요, ${data.recipientName}님!

1시간 후에 멘토링이 시작됩니다!

- ${roleLabel}: ${data.counterpartName}
- 시작 시간: ${data.scheduledAt}
${data.meetingLink ? `- 미팅 참여: ${data.meetingLink}` : ""}
    `.trim(),
  };
}

// 5. 세션 완료 후 리뷰 요청 (멘티용)
export function reviewRequestTemplate(data: {
  menteeName: string;
  mentorName: string;
  mentorCompany: string;
  productName: string;
  completedAt: string;
  bookingId: string;
  siteUrl: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] ${data.mentorName} 멘토님과의 세션은 어떠셨나요?`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">멘토링은 어떠셨나요?</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.menteeName)}</strong>님!</p>
          <p style="margin-bottom: 20px;">
            <strong>${escapeHtml(data.mentorName)}</strong> 멘토님과의 멘토링이 완료되었습니다.<br/>
            소중한 후기를 남겨주시면 다른 멘티분들께 큰 도움이 됩니다!
          </p>

          <div style="background: #F5F3FF; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #DDD6FE;">
            <h3 style="color: #7C3AED; margin-top: 0;">완료된 세션</h3>
            <p style="margin: 8px 0;"><strong>멘토:</strong> ${escapeHtml(data.mentorName)}</p>
            <p style="margin: 8px 0;"><strong>소속:</strong> ${escapeHtml(data.mentorCompany)}</p>
            <p style="margin: 8px 0;"><strong>상품:</strong> ${escapeHtml(data.productName)}</p>
            <p style="margin: 8px 0;"><strong>완료일:</strong> ${escapeHtml(data.completedAt)}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.siteUrl}/mypage/bookings/${escapeHtml(data.bookingId)}/review"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              리뷰 작성하기
            </a>
          </div>

          <p style="color: #9CA3AF; font-size: 13px; text-align: center;">
            리뷰 작성은 2~3분이면 충분합니다!
          </p>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 멘토링은 어떠셨나요?

안녕하세요, ${data.menteeName}님!

${data.mentorName} 멘토님과의 멘토링이 완료되었습니다.
소중한 후기를 남겨주시면 다른 멘티분들께 큰 도움이 됩니다!

완료된 세션:
- 멘토: ${data.mentorName}
- 소속: ${data.mentorCompany}
- 상품: ${data.productName}
- 완료일: ${data.completedAt}

리뷰 작성하기: ${data.siteUrl}/mypage/bookings/${data.bookingId}/review
    `.trim(),
  };
}

// 6. 피드백 도착 알림 (멘티용)
export function feedbackReceivedTemplate(data: {
  menteeName: string;
  mentorName: string;
  mentorCompany: string;
  productName: string;
  feedbackPreview: string;
  bookingId: string;
  siteUrl: string;
}): EmailTemplate {
  // 피드백 미리보기를 100자로 제한
  const preview =
    data.feedbackPreview.length > 100
      ? data.feedbackPreview.substring(0, 100) + "..."
      : data.feedbackPreview;

  return {
    subject: `[커피챗] ${data.mentorName} 멘토님이 피드백을 보내셨습니다!`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">새로운 피드백이 도착했습니다!</h1>
        </div>
        <div style="background: #FFFFFF; padding: 30px; border-radius: 0 0 16px 16px; color: #374151; border: 1px solid #E8DED4; border-top: none;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${escapeHtml(data.menteeName)}</strong>님!</p>
          <p style="margin-bottom: 20px;">
            <strong>${escapeHtml(data.mentorName)}</strong> 멘토님이 멘토링 피드백을 보내셨습니다!
          </p>

          <div style="background: #ECFDF5; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #A7F3D0;">
            <h3 style="color: #059669; margin-top: 0;">세션 정보</h3>
            <p style="margin: 8px 0;"><strong>멘토:</strong> ${escapeHtml(data.mentorName)}</p>
            <p style="margin: 8px 0;"><strong>소속:</strong> ${escapeHtml(data.mentorCompany)}</p>
            <p style="margin: 8px 0;"><strong>상품:</strong> ${escapeHtml(data.productName)}</p>
          </div>

          <div style="background: #F9FAFB; padding: 20px; border-radius: 12px; margin-bottom: 20px; border-left: 4px solid #10B981;">
            <h3 style="color: #374151; margin-top: 0; font-size: 14px;">피드백 미리보기</h3>
            <p style="margin: 0; color: #4B5563; font-style: italic; line-height: 1.6;">
              "${escapeHtml(preview)}"
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.siteUrl}/mypage/bookings/${escapeHtml(data.bookingId)}/feedback"
               style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              전체 피드백 보기
            </a>
          </div>

          <p style="margin-top: 30px; color: #9CA3AF; font-size: 12px;">
            이 이메일은 커피챗 멘토링 서비스에서 발송되었습니다.
          </p>
        </div>
      </div>
    `,
    text: `
커피챗 - 새로운 피드백이 도착했습니다!

안녕하세요, ${data.menteeName}님!

${data.mentorName} 멘토님이 멘토링 피드백을 보내셨습니다!

세션 정보:
- 멘토: ${data.mentorName}
- 소속: ${data.mentorCompany}
- 상품: ${data.productName}

피드백 미리보기:
"${preview}"

전체 피드백 보기: ${data.siteUrl}/mypage/bookings/${data.bookingId}/feedback
    `.trim(),
  };
}
