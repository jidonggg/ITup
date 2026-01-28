// 이메일 템플릿

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
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
        <div style="background: linear-gradient(135deg, #8B5CF6, #6366F1); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">새로운 상담 신청</h1>
        </div>
        <div style="background: #1a1a2e; padding: 30px; border-radius: 0 0 16px 16px; color: #e0e0e0;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${data.mentorName}</strong> 멘토님!</p>
          <p style="margin-bottom: 20px;">새로운 상담 신청이 도착했습니다.</p>

          <div style="background: #252542; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #8B5CF6; margin-top: 0;">신청자 정보</h3>
            <p><strong>이름:</strong> ${data.menteeName}</p>
            <p><strong>이메일:</strong> ${data.menteeEmail}</p>
            <p><strong>연락처:</strong> ${data.menteePhone}</p>
            <p><strong>관심 분야:</strong> ${interestLabels[data.interest] || data.interest || "미지정"}</p>
            ${data.preferredTime ? `<p><strong>희망 시간:</strong> ${data.preferredTime}</p>` : ""}
            ${data.message ? `<p><strong>문의 내용:</strong> ${data.message}</p>` : ""}
          </div>

          <a href="https://itup.vercel.app/mentor/dashboard"
             style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            대시보드에서 확인하기
          </a>

          <p style="margin-top: 30px; color: #888; font-size: 12px;">
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

대시보드에서 확인: https://itup.vercel.app/mentor/dashboard
    `.trim(),
  };
}

// 상담 확정 알림 (멘티에게)
export function consultationConfirmedTemplate(data: {
  menteeName: string;
  mentorName: string;
  mentorCompany: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] 상담이 확정되었습니다!`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">상담 확정!</h1>
        </div>
        <div style="background: #1a1a2e; padding: 30px; border-radius: 0 0 16px 16px; color: #e0e0e0;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${data.menteeName}</strong>님!</p>
          <p style="margin-bottom: 20px;">축하합니다! 멘토링 상담이 확정되었습니다.</p>

          <div style="background: #252542; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
            <h3 style="color: #10B981; margin-top: 0;">멘토 정보</h3>
            <p><strong>멘토:</strong> ${data.mentorName}</p>
            <p><strong>소속:</strong> ${data.mentorCompany}</p>
          </div>

          <p style="margin-bottom: 20px;">
            멘토님이 곧 연락드릴 예정입니다.<br/>
            마이페이지에서 상담 상태를 확인할 수 있습니다.
          </p>

          <a href="https://itup.vercel.app/mypage"
             style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            마이페이지에서 확인하기
          </a>

          <p style="margin-top: 30px; color: #888; font-size: 12px;">
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
마이페이지에서 확인: https://itup.vercel.app/mypage
    `.trim(),
  };
}

// 멘토 승인 알림
export function mentorApprovedTemplate(data: {
  mentorName: string;
}): EmailTemplate {
  return {
    subject: `[커피챗] 멘토 등록이 승인되었습니다!`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8B5CF6, #6366F1); padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">멘토 승인 완료!</h1>
        </div>
        <div style="background: #1a1a2e; padding: 30px; border-radius: 0 0 16px 16px; color: #e0e0e0;">
          <p style="margin-bottom: 20px;">안녕하세요, <strong>${data.mentorName}</strong>님!</p>
          <p style="margin-bottom: 20px;">
            축하합니다! 커피챗 멘토 등록이 승인되었습니다.<br/>
            이제 멘토 목록에서 프로필이 공개되며, 멘티들의 상담 신청을 받을 수 있습니다.
          </p>

          <a href="https://itup.vercel.app/mentor/dashboard"
             style="display: inline-block; background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">
            멘토 대시보드로 이동
          </a>

          <p style="margin-top: 30px; color: #888; font-size: 12px;">
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

멘토 대시보드: https://itup.vercel.app/mentor/dashboard
    `.trim(),
  };
}
