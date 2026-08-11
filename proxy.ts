import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { locales } from './i18n';

// Note: Full i18n routing is disabled for now. 
// To enable URL-based locale routing (e.g., /fr, /es, /de),
// you need to restructure app directory with [locale] folder.
// Current implementation: Translations available, but all routes use default locale.

export default withAuth(
  async function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Skip i18n for API routes, auth routes, and static files
    if (
      pathname.startsWith('/api') ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/_next') ||
      pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)
    ) {
      // For API routes, check if it's a public endpoint
      if (pathname.startsWith('/api')) {
        const isPublicAPI =
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/generate') ||
          pathname.startsWith('/api/presets') ||
          pathname.startsWith('/api/lead') ||
          pathname.startsWith('/api/deliver') ||
          pathname.startsWith('/api/analytics/track') ||
          pathname.startsWith('/api/newsletter/subscribe');

        if (isPublicAPI) {
          return NextResponse.next();
        }
        
        // Protected API routes need auth
        const user = req.kindeAuth?.user;
        if (!user) {
          return new NextResponse(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401, headers: { 'content-type': 'application/json' } }
          );
        }
      }
      
      return NextResponse.next();
    }

    // Redirect locale-prefixed URLs to default (since app structure doesn't support them yet)
    const pathnameHasLocale = locales.some(
      (locale) => locale !== 'en' && (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)
    );
    
    if (pathnameHasLocale) {
      // Remove locale prefix and redirect to base path
      const newPathname = pathname.replace(/^\/(fr|es|de)(\/|$)/, '/');
      return NextResponse.redirect(new URL(newPathname || '/', req.url));
    }

    // ✅ Allow all public paths below (no login required)
    const isPublicPath =
      pathname === "/" ||
      pathname.startsWith("/create") ||
      pathname.startsWith("/free") ||
      pathname.startsWith("/thank-you") ||
      pathname.startsWith("/how-to-use") ||
      pathname.startsWith("/about-us") ||
      pathname.startsWith("/contact-us") ||
      pathname.startsWith("/parenting-newsletter");

    if (isPublicPath) {
      return NextResponse.next();
    }

    // ✅ Get authenticated user info from Kinde session
    const user = req.kindeAuth?.user;

    // 🔒 Not logged in → redirect to login page
    if (!user) {
      return NextResponse.redirect(new URL("/api/auth/login", req.url));
    }

    // ✅ Restrict admin-only routes
    if (pathname.startsWith("/admin")) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email },
        select: { isAdmin: true },
      });

      if (!dbUser?.isAdmin) {
        // Non-admins → redirect to home
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // ✅ For protected routes, don't apply i18n (keep them simple)
    // Just allow access if authenticated
    return NextResponse.next();
  },
  {
    isReturnToCurrentPage: true,
    publicPaths: [
      "/",
      "/create",
      "/free",
      "/thank-you",
      "/api/auth/health",
      "/api/generate",
      "/api/presets",
      "/api/lead",
      "/api/deliver",
      "/api/analytics/track",
      "/api/newsletter/subscribe",
      "/how-to-use",
      "/about-us",
      "/contact-us",
      "/parenting-newsletter",
      // Add locale prefixed paths
      "/en",
      "/fr",
      "/es",
      "/de",
      "/en/:path*",
      "/fr/:path*",
      "/es/:path*",
      "/de/:path*",
    ],
    loginPage: "/api/auth/login",
  }
);

// ✅ Matcher config
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
