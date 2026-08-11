import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Legacy user profile endpoint — no user accounts after Kinde removal. */
export async function GET() {
  return NextResponse.json(
    { user: null, auth: false, message: "No user accounts — anonymous credits only." },
    { status: 200 }
  );
}
