import { NextResponse } from "next/server";

// Legacy endpoint — new callbacks go to /api/mpesa/callback/[token].
// Returns 200 so any in-flight Daraja requests don't keep retrying.
export async function POST() {
  return NextResponse.json({ ResultCode: 0 });
}
