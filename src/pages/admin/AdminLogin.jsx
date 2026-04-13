// src/pages/admin/AdminLogin.jsx
// Premium sign-in page — context-aware for Admin, Waiter, and Super Admin

import { useState } from 'react'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../contexts/AuthContext'
import { MiniSpinner } from '../../components/Spinner'
import { useLocation } from 'react-router-dom'

// Role config based on URL path
function useLoginContext() {
  const { pathname } = useLocation()
  const path = pathname.toLowerCase()

  if (path.includes('superadmin')) {
    return {
      role: 'super_admin',
      icon: '🛡️',
      title: 'Command Center',
      subtitle: 'Super Admin Access',
      accent: '#8b5cf6', // purple
      accentLight: 'rgba(139, 92, 246, 0.1)',
      accentBorder: 'rgba(139, 92, 246, 0.3)',
      placeholder: 'superadmin@tableserve.com',
      gradient: 'from-violet-500/20 via-purple-500/10 to-transparent',
      ringColor: 'ring-violet-500/20',
      btnClass: 'login-btn-purple',
      footerText: 'Platform-level management console',
    }
  }

  if (path.includes('waiter')) {
    return {
      role: 'waiter',
      icon: '👨‍🍳',
      title: 'Waiter Dashboard',
      subtitle: 'Staff Access',
      accent: '#10b981', // emerald
      accentLight: 'rgba(16, 185, 129, 0.1)',
      accentBorder: 'rgba(16, 185, 129, 0.3)',
      placeholder: 'waiter@restaurant.com',
      gradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
      ringColor: 'ring-emerald-500/20',
      btnClass: 'login-btn-green',
      footerText: 'Contact your admin for login credentials',
    }
  }

  return {
    role: 'admin',
    icon: '⚙️',
    title: 'Admin Panel',
    subtitle: 'Restaurant Management',
    accent: '#f59e0b', // amber
    accentLight: 'rgba(245, 158, 11, 0.1)',
    accentBorder: 'rgba(245, 158, 11, 0.3)',
    placeholder: 'admin@yourrestaurant.com',
    gradient: 'from-amber-500/20 via-yellow-500/10 to-transparent',
    ringColor: 'ring-amber-500/20',
    btnClass: 'login-btn-amber',
    footerText: 'Manage your restaurant menu, orders & settings',
  }
}

export default function AdminLogin() {
  const { kicked, dismissKicked } = useAuth()
  const ctx = useLoginContext()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (kicked) dismissKicked()
    setLoading(true)
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr
    } catch (err) {
      setError(
        err.message?.includes('Invalid login')
          ? 'Invalid email or password.'
          : err.message?.includes('banned')
          ? 'Account has been disabled. Contact your administrator.'
          : err.message || 'Login failed. Check your credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradient orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[120px] opacity-30"
          style={{
            background: `radial-gradient(circle, ${ctx.accent}33 0%, transparent 70%)`,
            top: '-200px',
            right: '-100px',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
          style={{
            background: `radial-gradient(circle, ${ctx.accent}22 0%, transparent 70%)`,
            bottom: '-150px',
            left: '-100px',
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(${ctx.accent}44 1px, transparent 1px),
              linear-gradient(90deg, ${ctx.accent}44 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Login card */}
      <div className="w-full max-w-[420px] relative z-10">
        {/* Floating badge */}
        <div className="flex justify-center mb-6 animate-scale-in">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl
                        border-2 shadow-2xl"
            style={{
              background: ctx.accentLight,
              borderColor: ctx.accentBorder,
              boxShadow: `0 8px 32px ${ctx.accent}22, 0 0 0 1px ${ctx.accent}11`,
            }}
          >
            {ctx.icon}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6 animate-scale-in" style={{ animationDelay: '0.05s' }}>
          <h1 className="font-display italic text-4xl mb-1" style={{ color: ctx.accent }}>
            TableServe
          </h1>
          <p className="text-bright text-lg font-body font-semibold">{ctx.title}</p>
          <p className="text-mid text-xs font-body mt-1">{ctx.subtitle}</p>
        </div>

        {/* Force-logout notification */}
        {kicked && (
          <div className="mb-4 px-4 py-3.5 bg-danger/10 border border-danger/30 rounded-2xl
                          flex items-start gap-3 animate-slide-up">
            <div className="w-10 h-10 rounded-xl bg-danger/15 flex items-center justify-center
                            text-lg flex-shrink-0 border border-danger/20">
              🔒
            </div>
            <div>
              <p className="text-danger text-sm font-body font-semibold">
                Session Terminated
              </p>
              <p className="text-danger/70 text-xs font-body mt-0.5 leading-relaxed">
                Your session was ended by an administrator. Please sign in again or contact your manager.
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div
          className="rounded-2xl border shadow-2xl p-8 space-y-6 animate-scale-in"
          style={{
            background: 'rgba(22, 22, 26, 0.85)',
            borderColor: `${ctx.accent}15`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px ${ctx.accent}08`,
            animationDelay: '0.1s',
          }}
        >
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-mid text-xs font-semibold uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint text-sm pointer-events-none">
                  ✉️
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={ctx.placeholder}
                  className="w-full bg-raised/80 border border-border rounded-xl
                             text-bright placeholder-faint font-body text-sm
                             pl-10 pr-4 py-3 outline-none
                             transition-all duration-300
                             focus:border-opacity-50 focus:ring-2 focus:ring-opacity-15"
                  style={{
                    '--tw-ring-color': ctx.accent,
                    borderColor: error ? 'rgba(239,68,68,0.5)' : undefined,
                  }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-mid text-xs font-semibold uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint text-sm pointer-events-none">
                  🔑
                </div>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-raised/80 border border-border rounded-xl
                             text-bright placeholder-faint font-body text-sm
                             pl-10 pr-12 py-3 outline-none
                             transition-all duration-300
                             focus:border-opacity-50 focus:ring-2 focus:ring-opacity-15"
                  style={{
                    '--tw-ring-color': ctx.accent,
                    borderColor: error ? 'rgba(239,68,68,0.5)' : undefined,
                  }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-faint hover:text-bright text-sm
                             transition-colors duration-200 p-1"
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-danger/8 border border-danger/25 rounded-xl
                              text-danger text-sm font-body flex items-start gap-2 animate-slide-up">
                <span className="flex-shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-base font-body font-bold
                         transition-all duration-300 active:scale-[0.98]
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${ctx.accent}, ${ctx.accent}cc)`,
                color: '#0e0e10',
                boxShadow: `0 4px 15px ${ctx.accent}33, 0 1px 3px ${ctx.accent}22`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 6px 25px ${ctx.accent}55, 0 2px 5px ${ctx.accent}33`
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = `0 4px 15px ${ctx.accent}33, 0 1px 3px ${ctx.accent}22`
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {loading ? (
                <>
                  <MiniSpinner /> Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <span className="text-lg">→</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-5 space-y-2 animate-scale-in" style={{ animationDelay: '0.15s' }}>
          <p className="text-faint text-xs font-body">{ctx.footerText}</p>
          <div className="flex items-center justify-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: ctx.accent, opacity: 0.6 }}
            />
            <p className="text-faint/60 text-[10px] font-body tracking-wide uppercase">
              Secured by Supabase
            </p>
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: ctx.accent, opacity: 0.6 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
