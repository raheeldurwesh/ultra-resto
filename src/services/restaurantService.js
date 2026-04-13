// src/services/restaurantService.js
// Restaurant CRUD + user management RPCs

import { supabase } from '../supabase/client'
import { deleteMenuImage } from './menuService'

const TABLE = 'restaurants'

// ── Fetch all restaurants ─────────────────────────────────────────────────────
export async function fetchRestaurants() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── Fetch restaurant by slug ──────────────────────────────────────────────────
export async function fetchRestaurantBySlug(slug) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

// ── Fetch restaurant by ID ────────────────────────────────────────────────────
export async function getRestaurantById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ── Check if slug is taken ────────────────────────────────────────────────────
export async function isSlugAvailable(slug) {
  if (!slug) return true
  const target = slug.toLowerCase().trim()
  
  // Use standard client for slug checks
  const client = supabase
  
  const { data, error } = await client
    .from(TABLE)
    .select('id, name, slug')
    .eq('slug', target)
    .limit(1)
  
  if (error) {
    console.error('[isSlugAvailable] DB Error:', error)
    return false // Assume taken on error for safety
  }
  
  const isAvailable = !data || data.length === 0
  console.log(`[isSlugAvailable] Slug "${target}" Check: ${isAvailable ? 'AVAILABLE' : 'TAKEN'}`)
  return isAvailable
}

// ── Check if email is already registered ──────────────────────────────────────
export async function checkEmailAvailability(email) {
  if (!email || !email.includes('@')) return true
  const target = email.toLowerCase().trim()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', target)
    .limit(1)
  
  if (error) {
    console.error('[checkEmailAvailability] DB Error:', error)
    return false
  }
  
  return !data || data.length === 0
}

// ── Create restaurant ─────────────────────────────────────────────────────────
export async function createRestaurant({ name, slug }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, slug: slug.toLowerCase().trim() })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Toggle restaurant active/inactive ─────────────────────────────────────────
// When disabling: bans ALL users (admin + waiter) and force-logs them out
// When enabling: unbans ALL users so they can log back in
export async function toggleRestaurantStatus(restaurantId, setActive) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be logged in to perform this action')

  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { 
      action: 'toggle-restaurant-status', 
      payload: { restaurant_id: restaurantId, set_active: setActive } 
    },
    headers: { Authorization: `Bearer ${token}` }
  })
  if (error || data?.error) throw new Error(error?.message || data?.error)


  // 4. Broadcast real-time force-logout signal (instant kick)
  if (!setActive) {
    await broadcastForceLogout(null, restaurantId)
  }
}


// ── Create user (admin/waiter) via GoTrue Admin API ───────────────────────────
export async function createUser({ email, password, role, restaurantId }) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be logged in to perform this action')

  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { 
      action: 'create-user', 
      payload: { email, password, role, restaurant_id: restaurantId } 
    },
    headers: { Authorization: `Bearer ${token}` }
  })
  if (error || data?.error) throw new Error(error?.message || data?.error)
  return data.user_id
}

// ── Get users for a restaurant ────────────────────────────────────────────────
export async function getRestaurantUsers(restaurantId = null) {
  const { data, error } = await supabase.rpc('get_restaurant_users', {
    p_restaurant_id: restaurantId,
  })
  if (error) throw error
  return data || []
}

// ── Reset password ────────────────────────────────────────────────────────────
export async function resetUserPassword(userId, newPassword) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be logged in to perform this action')

  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { 
      action: 'reset-password', 
      payload: { user_id: userId, new_password: newPassword } 
    },
    headers: { Authorization: `Bearer ${token}` }
  })
  if (error || data?.error) throw new Error(error?.message || data?.error)
}

// ── Broadcast a force-logout signal via Supabase Realtime ─────────────────────
// Target clients listen on this channel and sign out when they receive the signal
async function broadcastForceLogout(targetUserId, targetRestaurantId) {
  const channel = supabase.channel('force-logout-signals')
  await channel.subscribe()
  await channel.send({
    type: 'broadcast',
    event: 'force-logout',
    payload: {
      user_id: targetUserId || null,
      restaurant_id: targetRestaurantId || null,
      timestamp: Date.now(),
    },
  })
  // Small delay to ensure delivery, then cleanup
  setTimeout(() => supabase.removeChannel(channel), 2000)
}

// ── Disable / Enable individual user ──────────────────────────────────────────
export async function toggleUserStatus(userId, disable) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be logged in to perform this action')

  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { 
      action: 'toggle-user-status', 
      payload: { user_id: userId, disable } 
    },
    headers: { Authorization: `Bearer ${token}` }
  })
  if (error || data?.error) throw new Error(error?.message || data?.error)

  // 3. Broadcast as backup for real-time kick
  if (disable) {
    await broadcastForceLogout(userId, null)
  }
}

// ── Force logout ──────────────────────────────────────────────────────────────
// Invalidates sessions by rotating the user's password internally (then resetting it)
// This forces all existing refresh tokens to become invalid
export async function forceLogout({ userId, restaurantId }) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be logged in to perform this action')

  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { 
      action: 'force-logout', 
      payload: { user_id: userId, restaurant_id: restaurantId } 
    },
    headers: { Authorization: `Bearer ${token}` }
  })
  if (error || data?.error) throw new Error(error?.message || data?.error)

  // Broadcast real-time signal for instant client-side logout
  await broadcastForceLogout(userId, restaurantId)
  return 1 // Approx count
}

// ── Delete user (auth + profiles table) ───────────────────────────────────────
export async function deleteUser(userId) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be logged in to perform this action')

  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { 
      action: 'delete-user', 
      payload: { user_id: userId } 
    },
    headers: { Authorization: `Bearer ${token}` }
  })
  if (error || data?.error) throw new Error(error?.message || data?.error)
}

// ── Delete restaurant (full cascade) ──────────────────────────────────────────
// Removes all associated data: menu items + images, orders, config, users, then restaurant
export async function deleteRestaurant(restaurantId) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be logged in to perform this action')

  const { data, error } = await supabase.functions.invoke('superadmin-actions', {
    body: { 
      action: 'delete-restaurant', 
      payload: { restaurant_id: restaurantId } 
    },
    headers: { Authorization: `Bearer ${token}` }
  })
  if (error || data?.error) throw new Error(error?.message || data?.error)
}

/**
 * ── Real-time subscription to Restaurants ─────────────────────────────────────
 * Listens for INSERT, UPDATE, DELETE on the 'restaurants' table.
 */
export function subscribeToRestaurants(onChange) {
  const channelName = `realtime-restaurants-${Date.now()}`
  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
      console.log('[Supabase] REALTIME restaurant change:', payload)
      onChange(payload)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

/**
 * ── Real-time subscription to Profiles (Users) ────────────────────────────────
 * Useful for Super Admin to see instant changes in user roles or status.
 */
export function subscribeToProfiles(onChange, restaurantId = null) {
  const channelName = `realtime-profiles-${Date.now()}`
  const filter = restaurantId 
    ? { event: '*', schema: 'public', table: 'profiles', filter: `restaurant_id=eq.${restaurantId}` }
    : { event: '*', schema: 'public', table: 'profiles' }

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', filter, (payload) => {
      console.log('[Supabase] REALTIME profile change:', payload)
      onChange(payload)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}

/**
 * ── Get Impersonation Link (Edge Function Call) ────────────────────────────────
 * Calls the backend to generate a secure magic link for a restaurant admin.
 */
export async function getImpersonationLink(restaurantId) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('You must be logged in to perform this action')

  const { data, error } = await supabase.functions.invoke('impersonate-admin', {
    body: { restaurant_id: restaurantId },
    headers: { Authorization: `Bearer ${token}` }
  })
  
  if (error) throw error
  if (data.error) throw new Error(data.error)
  
  return data.url
}
