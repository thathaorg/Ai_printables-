import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminToken } from "@/lib/admin-auth";

/**
 * No Kinde — public product is open.
 * /admin* requires admin password cookie (set via /admin-login).
 */
export default function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (
    pathname === "/admin-login" ||
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/api/admin/logout")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // CMS APIs live under /app/admin/.../api — not /api/admin/*
    // Also match app/admin/cms/api
  }

  // Protect all /admin UI routes
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!verifyAdminToken(token)) {
      const url = new URL("/admin-login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Protect nested admin CMS API under /admin/*/api if any go through proxy
  if (pathname.includes("/admin/") && pathname.includes("/api/")) {
    const token = req.cookies.get(ADMIN_COOKIE)?.value;
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (/^\/(fr|es|de)(\/|$)/.test(pathname)) {
    const newPath = pathname.replace(/^\/(fr|es|de)/, "") || "/";
    return NextResponse.redirect(new URL(newPath, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)",
  ],
};
