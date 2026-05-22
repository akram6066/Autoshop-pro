import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSubscription, isActive, daysLeft } from "@/lib/subscription";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sub = await getSubscription(user.id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    status: sub.status,
    isActive: isActive(sub),
    daysLeft: daysLeft(sub),
    plan: sub.plan.display_name,
    isAdminOverride: sub.is_admin_override,
  });
}
