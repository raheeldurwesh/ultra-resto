// src/components/Skeleton.jsx
import React from 'react'

/**
 * Base shimmering block
 */
export function Skeleton({ className = '', variant = 'rect' }) {
  const baseClass = "relative overflow-hidden bg-white/5"
  const roundedClass = variant === 'circle' ? 'rounded-full' : 'rounded-xl'
  
  return (
    <div className={`${baseClass} ${roundedClass} ${className}`}>
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer" />
    </div>
  )
}

/**
 * Skeleton for MenuItem.jsx
 */
export function MenuSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden h-full">
      {/* Image area */}
      <Skeleton className="h-44 rounded-none border-b border-border/10" />
      
      {/* Body */}
      <div className="p-4 space-y-3 flex-1">
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for OrderCard.jsx
 */
export function OrderSkeleton() {
  return (
    <div className="card p-5 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      
      <div className="space-y-2 bg-white/5 p-3 rounded-xl">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <div className="pt-3 border-t border-border/50 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 w-12 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/**
 * Generic row skeleton for tables/dashboards
 */
export function DashboardSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
          <Skeleton className="h-10 w-10 flex-shrink-0" variant="circle" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  )
}
