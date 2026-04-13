import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchRestaurantBySlug } from '../services/restaurantService'
import Spinner from './Spinner'

/**
 * TenantGuard
 * Ensures that the current logged-in user belongs to the restaurant 
 * specified in the URL slug. Prevents "URL Jumping" between restaurants.
 */
export default function TenantGuard({ children, allowWaiter = false }) {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, role, restaurantId, impersonating, signOut, loading: authLoading } = useAuth()
  const [resolving, setResolving] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return

    // 1. Not logged in? Go to login
    if (!user) {
      navigate(`/login/${allowWaiter ? 'waiter' : 'admin'}`)
      return
    }

    // 2. Super Admin? They have global access, no need to check tenant matching
    if (role === 'super_admin') {
      setResolving(false)
      return
    }

    // 3. Resolve slug to restaurant ID and verify ownership
    const verifyTenant = async () => {
      try {
        const restaurant = await fetchRestaurantBySlug(slug)
        if (!restaurant) {
          setError('Restaurant not found.')
          return
        }

        // Check if the user belongs to this restaurant
        // (impersonating is handled by useAuth giving us the temporary restaurantId)
        if (restaurant.id !== restaurantId) {
          console.warn('[TenantGuard] Access denied: Restaurant ID mismatch.')
          setError('Access Denied: You do not have permission to manage this restaurant.')
          return
        }

        setResolving(false)
      } catch (err) {
        console.error('[TenantGuard] Verification failed:', err)
        setError('Verification failed. Please try again.')
      }
    }

    verifyTenant()
  }, [slug, user, role, restaurantId, authLoading, navigate, allowWaiter])

  if (authLoading || resolving) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-mid text-sm font-body animate-pulse">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-bright text-2xl font-display font-bold">Access Denied</h1>
          <p className="text-mid text-sm font-body leading-relaxed">{error}</p>
          <div className="flex gap-3 pt-4 justify-center">
            <button onClick={() => navigate('/superadmin')} className="btn-amber">Go to Dashboard</button>
            <button onClick={signOut} className="btn-ghost">Sign Out</button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
