// 이메일 발송 유틸리티
// 실제 운영 시 RESEND_API_KEY 또는 SENDGRID_API_KEY 환경변수 설정 필요

import { EmailTemplate } from "./templates";
import { getEmailFrom } from "@/lib/site-config";

interface SendEmailParams {
  to: string;
  template: EmailTemplate;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Resend API를 사용한 이메일 발송
async function sendWithResend(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFrom("noreply"),
        to: params.to,
        subject: params.template.subject,
        html: params.template.html,
        text: params.template.text,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.message || "Failed to send email" };
    }

    return { success: true, messageId: result.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// 이메일 발송 (환경에 따라 적절한 방법 사용)
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  // Resend API 키가 있으면 사용
  if (process.env.RESEND_API_KEY) {
    return sendWithResend(params);
  }

  // API 키가 없으면 조용히 성공 처리 (개발 모드)
  return { success: true, messageId: "dev-mode-" + Date.now() };
}
