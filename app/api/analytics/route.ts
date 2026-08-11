import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Legacy endpoint — authentication removed. */
export async function GET() {
  return NextResponse.json(
    {
      coloringCount: 0,
      tracingCount: 0,
      totalHours: 0,
      recentActivities: [],
      plan: "FREE",
      remainingGenerations: null,
      auth: false,
    },
    { status: 200 }
  );
}
