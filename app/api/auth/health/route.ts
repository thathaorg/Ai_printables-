import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    auth: "removed",
    message: "Kinde auth has been removed. Admin uses ADMIN_PASSWORD at /admin-login.",
  });
}
