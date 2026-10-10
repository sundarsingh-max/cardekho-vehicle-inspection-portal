// Supabase Edge Function: admin-create-user
// Deploy with: supabase functions deploy admin-create-user
// Set secret: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
// Never expose the service-role key to Vite/browser code.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors })

  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon || !service) return json({ error: 'Server auth configuration missing.' }, 500)

  const authHeader = req.headers.get('Authorization') || ''
  const callerClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
  const { data: callerData, error: callerError } = await callerClient.auth.getUser()
  if (callerError || !callerData.user) return json({ error: 'Authentication required.' }, 401)

  // Verify role from trusted app_metadata only. Never trust a role sent in request body.
  if (callerData.user.app_metadata?.role !== 'Admin') return json({ error: 'Admin access required.' }, 403)

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON body.' }, 400) }

  const fullName = String(body.full_name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.temporary_password || '')
  const role = String(body.role || '')
  if (!fullName || !email || !password || password.length < 12) {
    return json({ error: 'Full name, email and a temporary password of at least 12 characters are required.' }, 400)
  }
  if (!['Admin', 'Coordinator', 'Pricing', 'QC', 'TPA'].includes(role)) {
    return json({ error: 'Invalid role.' }, 400)
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: fullName },
  })
  if (createError || !created.user) return json({ error: createError?.message || 'Account creation failed.' }, 400)

  const { error: profileError } = await admin.from('user_profiles').upsert({
    user_id: created.user.id,
    full_name: fullName,
    email,
    role,
    must_change_password: true,
    is_active: true,
  }, { onConflict: 'user_id' })

  if (profileError) {
    // Avoid leaving an orphan Auth account if profile mapping fails.
    await admin.auth.admin.deleteUser(created.user.id)
    return json({ error: 'Profile mapping failed; account creation was rolled back.' }, 500)
  }
  return json({ user_id: created.user.id, email, role, must_change_password: true }, 201)
})

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
