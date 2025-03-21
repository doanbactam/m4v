import { type NextRequest, NextResponse } from "next/server"
import wretch from "wretch"
import type { auth } from "~/lib/auth"

export const config = {
  matcher: ["/admin/:path*", "/auth/:path*"],
}

export default async function ({ nextUrl, headers }: NextRequest) {
  const baseUrl = nextUrl.toString()
  const { pathname, origin, search } = nextUrl

  const session = await wretch(`${origin}/api/auth/get-session`)
    .headers({ cookie: headers.get("cookie") || "" })
    .get()
    .json<typeof auth.$Infer.Session>()

  if (session && pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", baseUrl))
  }

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL(`/auth/login?next=${pathname}${search}`, baseUrl))
    }

    if (session.user.role !== "admin") {
      return NextResponse.redirect(new URL("/", baseUrl))
    }
  }

  return NextResponse.next()
}

export function errorHandler(error: any) {
  if (error.response?.status === 429) {
    return new Response('Too many requests, please try again later', { status: 429 });
  }
  
  if (error.code === 'ECONNABORTED') {
    return new Response('Request timeout', { status: 408 });
  }

  return new Response('Internal server error', { status: 500 });
}
