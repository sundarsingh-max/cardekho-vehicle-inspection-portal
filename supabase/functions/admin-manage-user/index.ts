// Supabase Edge Function: admin-manage-user
// Deploy: supabase functions deploy admin-manage-user
// Requires SUPABASE_SERVICE_ROLE_KEY as a server-side Supabase secret only.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const allowedRoles = ['Admin', 'Coordinator', 'Pricing', 'QC', 'TPA']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon || !service) return json({ error: 'Server auth configuration missing.' }, 500)

  const authHeader = req.headers.get('Authorization') || ''
  const callerClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
  const { data: auth, error: authError } = await callerClient.auth.getUser()
  if (authError || !auth.user) return json({ error: 'Authentication required.' }, 401)

  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: callerProfile, error: callerProfileError } = await admin.from('user_profiles').select('role,is_active').eq('user_id', auth.user.id).maybeSingle()
  if (callerProfileError) return json({ error: 'Unable to verify Admin permissions.' }, 500)
  if (!callerProfile || callerProfile.role !== 'Admin' || callerProfile.is_active !== true) return json({ error: 'Active Admin access required.' }, 403)
  let body: any
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON body.' }, 400) }

  const action = String(body.action || '')
  const userId = String(body.user_id || '').trim()
  if (!userId) return json({ error: 'user_id is required.' }, 400)
  if (userId === auth.user.id && ['deactivate','delete'].includes(action)) {
    return json({ error: 'You cannot deactivate or delete your own Admin account.' }, 400)
  }

  const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId)
  if (targetError || !target.user) return json({ error: 'Target account not found.' }, 404)
  if (target.user.app_metadata?.role === 'Admin' && action === 'delete') {
    return json({ error: 'Deleting an Admin account is blocked. Deactivate it through an approved process.' }, 400)
  }

  if (action === 'set_role') {
    const role = String(body.role || '')
    if (!allowedRoles.includes(role)) return json({ error: 'Invalid role.' }, 400)
    const { error } = await admin.auth.admin.updateUserById(userId, {
      app_metadata: { ...(target.user.app_metadata || {}), role },
    })
    if (error) return json({ error: error.message }, 400)
    const { error: profileError } = await admin.from('user_profiles').update({ role, updated_at: new Date().toISOString() }).eq('user_id', userId)
    if (profileError) return json({ error: 'Auth role updated, but profile update failed. Contact an administrator.' }, 500)
    return json({ user_id: userId, role, message: 'Role updated. The user must refresh/re-authenticate to receive a new JWT.' })
  }

  if (action === 'deactivate' || action === 'activate') {
    const active = action === 'activate'
    const { error } = await admin.from('user_profiles').update({ is_active: active, updated_at: new Date().toISOString() }).eq('user_id', userId)
    if (error) return json({ error: error.message }, 400)
    if (!active) {
      const { error: banError } = await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
      if (banError) return json({ error: 'Profile deactivated, but Auth ban failed: ' + banError.message }, 500)
    } else {
      const { error: unbanError } = await admin.auth.admin.updateUserById(userId, { ban_duration: 'none' })
      if (unbanError) return json({ error: 'Profile activated, but Auth unban failed: ' + unbanError.message }, 500)
    }
    return json({ user_id: userId, is_active: active })
  }

  if (action === 'delete') {
    const { error } = await admin.auth.admin.deleteUser(userId)
    if (error) return json({ error: error.message }, 400)
    return json({ user_id: userId, deleted: true })
  }

  if (action === 'force_password_change') {
    const { error } = await admin.from('user_profiles').update({ must_change_password: true, updated_at: new Date().toISOString() }).eq('user_id', userId)
    if (error) return json({ error: error.message }, 400)
    return json({ user_id: userId, must_change_password: true })
  }

  return json({ error: 'Unsupported action. Use set_role, activate, deactivate, delete, or force_password_change.' }, 400)
})

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
