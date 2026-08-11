import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  checkAdminPassword,
  signAdminToken,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** POST { password } → sets admin cookie if ADMIN_PASSWORD matches. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body?.password ?? "");

    if (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: "Admin password is not configured (set ADMIN_PASSWORD in .env)." },
        { status: 503 }
      );
    }

    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = signAdminToken();
    if (!token) {
      return NextResponse.json({ error: "Could not sign session" }, { status: 500 });
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day (token is day-bound)
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
