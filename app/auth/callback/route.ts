import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  // Handle errors from OAuth provider
  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(new URL(`/login?error=${error}`, requestUrl.origin))
  }

  if (code) {
    try {
      const cookieStore = await cookies()
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options)
                })
              } catch (error) {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing
                // user sessions.
              }
            },
          },
        }
      )
      
      // Exchange code for session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('Session exchange error:', exchangeError)
        return NextResponse.redirect(new URL(`/login?error=session_exchange_failed`, requestUrl.origin))
      }

      // Verify session was created
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('No session after exchange')
        return NextResponse.redirect(new URL(`/login?error=no_session`, requestUrl.origin))
      }

      console.log('Session created successfully for user:', session.user.email)
    } catch (err) {
      console.error('Callback error:', err)
      return NextResponse.redirect(new URL(`/login?error=callback_failed`, requestUrl.origin))
    }
  }

  // Always redirect to home after successful auth
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}