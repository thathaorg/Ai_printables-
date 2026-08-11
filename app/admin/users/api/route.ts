// app/admin/users/api/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const result = await requireAdmin();
    if ("response" in result) {
      return result.response;
    }

    const { prisma } = result.context;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const result = await requireAdmin();
    if ("response" in result) {
      return result.response;
    }

    const { prisma } = result.context;

    const body = await req.json();
    const { email, name, image, plan, isAdmin } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Legacy unique field (was Kinde subject). Not used for login anymore.
    const externalId = `manual_${crypto.randomUUID()}`;

    const newUser = await prisma.user.create({
      data: {
        kindeId: externalId,
        email,
        name,
        image,
        plan: plan || "FREE",
        isAdmin: isAdmin ?? false,
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
