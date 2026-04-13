// src/components/MenuItemModal.jsx
// Full-screen modal showing menu item details with image, description, price, and add-to-cart.

import { useState, useEffect } from 'react'
import { fmt } from '../utils/helpers'
import { fetchRecommendations, fetchTrendingItems } from '../services/menuService'
import { Skeleton } from './Skeleton'

export default function MenuItemModal({ item, qty, getQty, onAdd, onRemove, onSelect, onClose }) {
  const [imgErr, setImgErr] = useState(false)
  const [recs, setRecs] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // ── Scroll Lock ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = 'unset' }
    }
  }, [item])

  // ── Recommendations ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!item?.id) return
    let active = true
    const load = async () => {
      setLoadingRecs(true)
      try {
        const rid = item.restaurantId || item.restaurant_id
        const data = await fetchRecommendations(item.id, rid)
        if (!active) return

        if (data && data.length > 0) {
          // Only show items that have been paired at least once
          const validRecs = data.filter(r => (r.frequency || 0) > 0)
          setRecs(validRecs)
        } else {
          // Fallback to trending, but only if they have actual orders
          const trending = await fetchTrendingItems(rid, 3)
          if (active) {
            const validTrending = trending.filter(r => r.id !== item.id && (r.order_count || 0) > 0)
            setRecs(validTrending)
          }
        }
      } catch (err) {
        console.warn('Could not load recommendations', err)
      } finally {
        if (active) setLoadingRecs(false)
      }
    }
    load()
    return () => { active = false }
  }, [item?.id])

  if (!item) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="bg-surface rounded-t-3xl sm:rounded-2xl border-t sm:border border-border
                        shadow-lifted w-full sm:max-w-md max-h-[90vh] flex flex-col
                        animate-slide-up overflow-hidden">

          {/* Image */}
          <div className="relative h-56 sm:h-64 bg-raised flex-shrink-0 overflow-hidden">
            {(!imgErr && (item.imageUrl || item.image_url)) ? (
              <img
                src={item.imageUrl || item.image_url}
                alt={item.name}
                onError={() => setImgErr(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl bg-raised">
                🍽️
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-base/70
                         backdrop-blur-sm flex items-center justify-center text-bright
                         hover:bg-base/90 transition-all text-lg"
            >
              ×
            </button>

            {/* Category + food type badges */}
            <div className="absolute bottom-3 left-3 flex gap-2">
              <span className="px-2.5 py-1 rounded-full bg-base/70 backdrop-blur-sm
                               text-mid text-[10px] font-semibold uppercase tracking-wider">
                {item.category}
              </span>
              {item.foodType && (
                <span className={`px-2.5 py-1 rounded-full backdrop-blur-sm text-[10px]
                                  font-bold uppercase tracking-wider
                                  ${item.foodType === 'veg'
                    ? 'bg-done/20 text-done border border-done/30'
                    : 'bg-danger/20 text-danger border border-danger/30'
                  }`}>
                  {item.foodType === 'veg' || item.food_type === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 space-y-4">
            <div>
              <h2 className="font-display font-bold text-bright text-2xl mb-1">{item.name}</h2>
              <span className="font-display font-semibold text-amber text-xl">{fmt(item.price)}</span>
            </div>

            {item.description && (
              <div className="space-y-1">
                <p className={`text-mid text-sm font-body leading-relaxed break-words transition-all duration-300
                              ${!isExpanded ? 'line-clamp-1' : ''}`}>
                  {item.description}
                </p>
                {item.description.length > 50 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-amber text-xs font-semibold hover:underline bg-amber/5 px-2 py-1 rounded-md mt-1"
                  >
                    {isExpanded ? 'Show less' : 'See more'}
                  </button>
                )}
              </div>
            )}

            {/* Recommendations Section */}
            {(loadingRecs || recs.length > 0) && (
              <div className="pt-4 border-t border-border/50">
                <h3 className="text-[10px] uppercase tracking-wider text-faint font-bold mb-3 flex items-center gap-2">
                  ✨ Frequently Ordered With
                </h3>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {loadingRecs ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex-shrink-0 w-32 space-y-2">
                        <Skeleton className="aspect-square rounded-xl" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))
                  ) : (
                    recs.map(rec => {
                      const recQty = getQty?.(rec.id) || 0
                      return (
                        <div key={rec.id} className="flex-shrink-0 w-32 text-left space-y-1.5 animate-fade-in group">
                          {/* Navigation Layer - Tap Image or Name to Navigate */}
                          <div 
                            onClick={() => onSelect?.(rec)}
                            className="cursor-pointer space-y-1"
                          >
                            <div className="relative aspect-square rounded-xl bg-raised overflow-hidden border border-border/50">
                              {(rec.imageUrl || rec.image_url) ? (
                                <img src={rec.imageUrl || rec.image_url} alt={rec.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                              )}
                              <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                            </div>
                            
                            <p className="text-[11px] font-semibold text-bright truncate leading-tight group-hover:text-amber transition-colors">
                              {rec.name}
                            </p>
                          </div>

                          <div className="flex items-center justify-between px-0.5">
                            <p className="text-[10px] text-amber font-medium">
                              {fmt(rec.price)}
                            </p>

                              {/* Quantity Controls Below Image */}
                              {recQty === 0 ? (
                                <button
                                  onClick={() => onAdd({ ...rec, restaurant_id: item.restaurant_id })}
                                  className="w-7 h-7 rounded-full bg-amber text-base flex items-center justify-center 
                                             text-xs font-bold shadow-soft transform active:scale-95 transition-all
                                             hover:bg-amber-dim"
                                >
                                  +
                                </button>
                              ) : (
                                <div className="flex items-center bg-raised rounded-full px-1 py-0.5 border border-border flex-shrink-0">
                                  <button
                                    onClick={() => onRemove(rec.id)}
                                    className="w-4 h-4 flex items-center justify-center text-amber font-bold text-[10px]"
                                  >
                                    −
                                  </button>
                                  <span className="text-[9px] font-bold !text-bright min-w-[14px] text-center">{recQty}</span>
                                  <button
                                    onClick={() => onAdd({ ...rec, restaurant_id: item.restaurant_id })}
                                    className="w-4 h-4 flex items-center justify-center text-amber font-bold text-[10px]"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Add to cart controls */}
          <div className="px-5 py-4 border-t border-border flex-shrink-0">
            {qty === 0 ? (
              <button
                onClick={() => { onAdd(item); onClose() }}
                className="btn-amber w-full py-3.5 text-base rounded-2xl shadow-amber"
              >
                + Add to Cart — {fmt(item.price)}
              </button>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={onClose}
                    className="btn-amber px-6 py-2 text-sm rounded-xl shadow-amber transform active:scale-95 transition-transform font-bold"
                  >
                    Add to Cart
                  </button>

                  <div className="flex items-center gap-3 bg-raised rounded-full px-2 py-1 border border-border">
                    <button
                      onClick={() => onRemove(item.id)}
                      className="w-8 h-8 rounded-full text-amber flex items-center justify-center text-lg font-bold hover:bg-amber/10 transition-all"
                    >
                      −
                    </button>
                    <span className="font-display font-bold !text-bright text-lg w-6 text-center">{qty}</span>
                    <button
                      onClick={() => onAdd(item)}
                      className="w-8 h-8 rounded-full text-amber flex items-center justify-center text-lg font-bold hover:bg-amber/10 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="font-display font-bold text-bright text-lg">
                  {fmt(item.price * qty)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
