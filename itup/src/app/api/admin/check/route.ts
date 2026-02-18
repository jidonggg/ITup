import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { adminLimiter, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const { success: allowed } = adminLimiter.check(ip);
    if (!allowed) {
      return NextResponse.json(
        { isAdmin: false, error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const supabase = await createClient();

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ isAdmin: false });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ isAdmin: false });
    }

    return NextResponse.json({ isAdmin: isAdmin(user.email) });
  } catch {
    return NextResponse.json({ isAdmin: false });
  }
}
