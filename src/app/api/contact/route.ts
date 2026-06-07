import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(200).trim(),
  email: z.string().email().max(254).trim().toLowerCase(),
  subject: z.string().max(200).trim().default("Contact Inquiry"),
  message: z.string().min(10).max(5000).trim(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Server configuration error." },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from("contact_inquiries").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (error) {
    console.error("[/api/contact]", error.message);
    return NextResponse.json(
      { error: "Failed to submit. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
