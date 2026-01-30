import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/sender";
import { businessInquiryTemplate } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
  try {
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
      console.error("Business inquiry DB error:", dbError);
      return NextResponse.json(
        { error: "문의 저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // Send admin notification email
    const adminEmail = process.env.ADMIN_EMAIL || "support@itup.kr";
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
    console.error("Business inquiry error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
