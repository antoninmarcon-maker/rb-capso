import createMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;

  // Admin routes: auth gate with Supabase
  if (url.pathname.startsWith("/admin") || url.pathname.match(/^\/(en|es)\/admin/)) {
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return response;
  }

  // Everything else: i18n middleware
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except the ones with dots (files), api, _next, etc.
  matcher: [
    "/((?!api|_next|_vercel|studio|.*\\..*).*)",
  ],
};
