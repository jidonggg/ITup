import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bankAccountLimiter } from "@/lib/rate-limit";

async function getMentorFromToken(request: NextRequest) {
  const supabase = await createClient();
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { error: "Invalid token", status: 401 };
  }

  const { data: mentor } = await supabase
    .from("mentors")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!mentor) {
    return { error: "Mentor not found", status: 404 };
  }

  // Rate limiting
  const { success: allowed } = bankAccountLimiter.check(user.id);
  if (!allowed) {
    return { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요.", status: 429 };
  }

  return { user, mentor, supabase };
}

// GET: Fetch mentor's bank accounts
export async function GET(request: NextRequest) {
  try {
    const result = await getMentorFromToken(request);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { mentor, supabase } = result;

    const { data, error } = await supabase
      .from("mentor_bank_accounts")
      .select("*")
      .eq("mentor_id", mentor.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "계좌 조회에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ accounts: data || [] });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// POST: Create or update bank account
export async function POST(request: NextRequest) {
  try {
    const result = await getMentorFromToken(request);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { mentor, supabase } = result;
    const body = await request.json();
    const { bank_name, account_number, account_holder, id } = body;

    if (!bank_name || !account_number || !account_holder) {
      return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    // bank_name 길이 및 형식 검증
    if (typeof bank_name !== "string" || bank_name.length > 20) {
      return NextResponse.json({ error: "은행명은 20자 이내여야 합니다." }, { status: 400 });
    }

    // 계좌번호 유효성 검사: 숫자만 허용, 10~16자리
    const cleanAccountNumber = account_number.replace(/[\s-]/g, "");
    if (!/^\d{10,16}$/.test(cleanAccountNumber)) {
      return NextResponse.json(
        { error: "계좌번호는 10~16자리 숫자여야 합니다." },
        { status: 400 }
      );
    }

    // 예금주명 유효성 검사: 2~20자
    const trimmedHolder = account_holder.trim();
    if (trimmedHolder.length < 2 || trimmedHolder.length > 20) {
      return NextResponse.json(
        { error: "예금주명은 2~20자여야 합니다." },
        { status: 400 }
      );
    }

    if (id) {
      // Update - 정제된 값 사용
      const { data, error } = await supabase
        .from("mentor_bank_accounts")
        .update({
          bank_name,
          account_number: cleanAccountNumber,
          account_holder: trimmedHolder,
        })
        .eq("id", id)
        .eq("mentor_id", mentor.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "계좌 수정에 실패했습니다." }, { status: 500 });
      }

      return NextResponse.json({ account: data });
    } else {
      // Create — set all other accounts to non-default first
      await supabase
        .from("mentor_bank_accounts")
        .update({ is_default: false })
        .eq("mentor_id", mentor.id);

      // 정제된 값 사용
      const { data, error } = await supabase
        .from("mentor_bank_accounts")
        .insert({
          mentor_id: mentor.id,
          bank_name,
          account_number: cleanAccountNumber,
          account_holder: trimmedHolder,
          is_default: true,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: "계좌 등록에 실패했습니다." }, { status: 500 });
      }

      return NextResponse.json({ account: data });
    }
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

// DELETE: Remove bank account
export async function DELETE(request: NextRequest) {
  try {
    const result = await getMentorFromToken(request);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { mentor, supabase } = result;
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("id");

    if (!accountId) {
      return NextResponse.json({ error: "계좌 ID가 필요합니다." }, { status: 400 });
    }

    const { error } = await supabase
      .from("mentor_bank_accounts")
      .delete()
      .eq("id", accountId)
      .eq("mentor_id", mentor.id);

    if (error) {
      return NextResponse.json({ error: "계좌 삭제에 실패했습니다." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
