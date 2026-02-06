import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sender";
import { businessInquiryTemplate } from "@/lib/email/templates";
import { inquiryLimiter, getClientIp } from "@/lib/rate-limit";
import { SITE_CONFIG } from "@/lib/site-config";

export async function POST(request: NextRequest) {
  try {
    // Rate limit — 5 req / 60s per IP
    const ip = getClientIp(request);
    const { success: allowed, retryAfterMs } = inquiryLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const body = await request.json();
    const { companyName, contactName, email, phone, employeeCount, message } = body;

    // Validate required fields
    if (!companyName || !contactName || !email) {
      return NextResponse.json(
        { error: "회사명, 담당자명, 이메일은 필수입니다." },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 }
      );
    }

    // Save to Supabase
    const supabase = await createClient();
    const { error: dbError } = await supabase
      .from("business_inquiries")
      .insert({
        company_name: companyName,
        contact_name: contactName,
        email,
        phone: phone || null,
        employee_count: employeeCount || null,
        message: message || null,
      });

    if (dbError) {
      return NextResponse.json(
        { error: "문의 저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // Send admin notification email
    const adminEmail = SITE_CONFIG.email.admin;
    await sendEmail({
      to: adminEmail,
      template: businessInquiryTemplate({
        companyName,
        contactName,
        email,
        phone,
        employeeCount,
        message,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
