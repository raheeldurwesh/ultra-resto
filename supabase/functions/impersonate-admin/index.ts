
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    console.log('[Impersonation] Starting session generation')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 1. Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('[Impersonation] Auth error:', userError)
      throw new Error('Unauthorized')
    }

    console.log('[Impersonation] Verifying role for user:', user.email)

    // 2. Verify Superadmin status (Strict check: ignore user_metadata for security)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // Trust DB profile first, then internal app_metadata. NEVER trust user_metadata for roles.
    const role = profile?.role || user.app_metadata?.role
    if (role !== 'super_admin') {
      console.warn('[Impersonation] Unauthorized attempt. User role:', role)
      throw new Error(`Forbidden: Superadmin access required.`)
    }

    // 3. Get target restaurant_id from request
    const { restaurant_id } = await req.json()
    if (!restaurant_id) throw new Error('restaurant_id is required')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Find an admin for this restaurant
    const { data: adminProfile, error: adminErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('restaurant_id', restaurant_id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()

    if (adminErr || !adminProfile) {
      console.error('[Impersonation] Admin lookup failed:', adminErr)
      throw new Error(`Target restaurant (ID: ${restaurant_id}) has no registered admin user.`)
    }

    // 5. Fetch the restaurant details for redirect URL
    const { data: restaurant, error: restErr } = await supabaseAdmin
      .from('restaurants')
      .select('slug')
      .eq('id', restaurant_id)
      .single()

    if (restErr || !restaurant) {
      throw new Error('Could not find restaurant details for redirection.')
    }

    // Origin for redirect (default to the production URL if not provided)
    const origin = req.headers.get('origin') || 'https://ultra-resto.vercel.app'
    const redirectTo = `${origin}/${restaurant.slug}/admin`
    
    console.log(`[Impersonation] Generating link for ${adminProfile.email}`)
    console.log(`[Impersonation] Target Redirect: ${redirectTo}`)

    // 6. Generate Magic Link session
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: adminProfile.email,
      options: { redirectTo }
    })

    if (linkErr) {
      console.error('[Impersonation] Link generation error:', linkErr)
      throw linkErr
    }

    console.log('[Impersonation] Success')
    return new Response(
      JSON.stringify({ 
        url: linkData.properties.action_link,
        email: adminProfile.email 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('[Impersonation] Critical error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 so the client can read the custom error message
      }
    )
  }
})
