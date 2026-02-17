import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const missingEnvMessage =
  'Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Vercel Project → Settings → Environment Variables), then redeploy.'

// Avoid failing the build when env vars aren't present (common on deploy previews).
// If env vars are actually missing at runtime, we fail loudly on first usage.
export const supabase: SupabaseClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (new Proxy({} as SupabaseClient, {
        get() {
          throw new Error(missingEnvMessage)
        },
      }) as SupabaseClient)