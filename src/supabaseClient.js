import { createClient } from '@supabase/supabase-js'

// Supabase JS adds /rest/v1 automatically. Normalize the project URL so
// a value accidentally saved with /rest/v1 does not create a doubled path.
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseUrl = rawSupabaseUrl
  ? rawSupabaseUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
  : ''

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase configuration missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the Vite build environment.'
  )
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)
