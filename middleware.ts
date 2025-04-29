import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  const publicRoutes = ["/", "/login"];
  const pathname = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  // Se der erro, deixa passar (não barra a navegação)
  if (error) {
    return res;
  }

  // Se NÃO tem sessão e NÃO é rota pública, manda pro login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Se TEM sessão e está tentando acessar rota pública (ex: login), manda para dashboard
  if (session && isPublicRoute) {
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)",
  ],
};
