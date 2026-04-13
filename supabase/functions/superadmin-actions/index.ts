
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
    console.log('[Superadmin] New request received')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // 1. Verify Superadmin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('[Superadmin] Auth error:', userError)
      throw new Error('Unauthorized')
    }

    console.log('[Superadmin] Verifying role for user:', user.email)

    // Verify Superadmin status (Strict: ignore user_metadata)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const role = profile?.role || user.app_metadata?.role
    if (role !== 'super_admin') {
      console.warn('[Superadmin] Unauthorized attempt. User role:', role)
      throw new Error(`Forbidden: Superadmin access required.`)
    }

    // 2. Parse Body
    const { action, payload } = await req.json()
    if (!action) throw new Error('action is required')
    
    console.log(`[Superadmin] Action: ${action}`, payload)

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    let result: any = { success: true }

    // 3. Handle Actions
    switch (action) {
      case 'toggle-restaurant-status': {
        const { restaurant_id, set_active } = payload
        const { error: rErr } = await supabaseAdmin
          .from('restaurants')
          .update({ is_active: set_active })
          .eq('id', restaurant_id)
        if (rErr) throw rErr

        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, email, role')
          .eq('restaurant_id', restaurant_id)
        
        const isDisabled = !set_active
        if (profiles) {
          for (const p of profiles) {
            if (p.role === 'super_admin') continue
            await supabaseAdmin.auth.admin.updateUserById(p.id, {
              ban_duration: set_active ? 'none' : '876000h',
            })
            await supabaseAdmin.from('profiles').update({ is_disabled: isDisabled }).eq('id', p.id)
          }
        }
        break
      }

      case 'delete-restaurant': {
        const { restaurant_id } = payload
        if (!restaurant_id) throw new Error('restaurant_id required')
        
        await supabaseAdmin.from('menu').delete().eq('restaurant_id', restaurant_id)
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('restaurant_id', restaurant_id)
        
        if (profiles) {
          for (const p of profiles) {
            await supabaseAdmin.from('profiles').delete().eq('id', p.id)
            await supabaseAdmin.auth.admin.deleteUser(p.id)
          }
        }

        const { error: dErr } = await supabaseAdmin.from('restaurants').delete().eq('id', restaurant_id)
        if (dErr) throw dErr
        break
      }

      case 'toggle-user-status': {
        const { user_id, disable } = payload
        const { error: aErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: disable ? '876000h' : 'none',
        })
        if (aErr) throw aErr
        await supabaseAdmin.from('profiles').update({ is_disabled: !!disable }).eq('id', user_id)
        break
      }

      case 'delete-user': {
        const { user_id } = payload
        await supabaseAdmin.from('profiles').delete().eq('id', user_id)
        const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user_id)
        if (delErr) throw delErr
        break
      }

      case 'reset-password': {
        const { user_id, new_password } = payload
        const { error: passErr } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password: new_password,
        })
        if (passErr) throw passErr
        break
      }

      case 'create-user': {
        const { email, password, role, restaurant_id } = payload
        const { data: newUser, error: cErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { role, restaurant_id }
        })
        if (cErr) throw cErr
        
        await supabaseAdmin.from('profiles').upsert({
          id: newUser.user.id,
          email,
          role,
          restaurant_id
        }, { onConflict: 'id' })
        
        result.user_id = newUser.user.id
        break
      }

      case 'force-logout': {
        const { user_id, restaurant_id } = payload
        if (user_id) {
          await supabaseAdmin.auth.admin.updateUserById(user_id, {
            app_metadata: { force_logout_at: Date.now() }
          })
        } else if (restaurant_id) {
          const { data: ps } = await supabaseAdmin.from('profiles').select('id').eq('restaurant_id', restaurant_id)
          if (ps) {
            for (const p of ps) {
              await supabaseAdmin.auth.admin.updateUserById(p.id, {
                app_metadata: { force_logout_at: Date.now() }
              })
            }
          }
        }
        break
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    console.log('[Superadmin] Action completed successfully')
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('[Superadmin] Critical error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
