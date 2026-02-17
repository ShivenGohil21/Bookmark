import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session to ensure it's valid
  await supabase.auth.getSession()

  const { data: { session } } = await supabase.auth.getSession()

  // Route protection logic
  const isLoginPage = req.nextUrl.pathname === '/login'
  const isDashboard = req.nextUrl.pathname === '/'

  // If no session and trying to access dashboard, redirect to login
  if (!session && isDashboard) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If session exists and on login page, redirect to dashboard
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}