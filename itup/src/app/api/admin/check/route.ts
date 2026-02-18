import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function GET(request: NextRequest) {
  try {
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
