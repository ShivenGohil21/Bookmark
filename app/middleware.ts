import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Skip middleware for public routes
  if (req.nextUrl.pathname.startsWith('/login') || 
      req.nextUrl.pathname.startsWith('/auth') ||
      req.nextUrl.pathname.startsWith('/_next') ||
      req.nextUrl.pathname.startsWith('/public')) {
    return response
  }

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables')
    return response
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
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

    // Refresh session to keep it valid
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Session check error:', error)
    }

    // Route protection logic
    const isProtectedRoute = req.nextUrl.pathname === '/'
    const isLoginPage = req.nextUrl.pathname === '/login'

    // If no session and trying to access dashboard, redirect to login
    if (!session && isProtectedRoute) {
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('redirected', 'true')
      return NextResponse.redirect(loginUrl.toString())
    }

    // If session exists and on login page, redirect to dashboard
    if (session && isLoginPage) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  } catch (error) {
    console.error('Middleware error:', error)
    // Continue with the request if there's an error
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}