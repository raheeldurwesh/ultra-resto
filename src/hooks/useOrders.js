// src/hooks/useOrders.js
// Real-time orders hook — supports restaurant_id filtering

import { useState, useEffect, useCallback } from 'react'
import {
  fetchOrders, placeOrder as svcPlace, fetchOrderByOrderId,
  updateOrderStatus, updateOrderItems as svcUpdateItems,
  deleteOrder as svcDelete,
  deleteAllOrders as svcDeleteAll,
  subscribeToOrders,
  normalise,
} from '../services/orderService'

export function useOrders(restaurantId, timeRange = '24h') {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!restaurantId) {
      setOrders([])
      setLoading(false)
      return
    }
    try {
      const data = await fetchOrders(restaurantId, timeRange)
      setOrders(data)
    } catch (err) {
      console.error('useOrders fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [restaurantId, timeRange])

  useEffect(() => {
    if (!restaurantId) {
      setOrders([])
      setLoading(false)
      return
    }
    
    // Clear old data instantly when ID changes to prevent visual leak
    setOrders([])
    setLoading(true)
    
    load()
    
    // ── Instant Real-time ────────────────────────────────────────────
    const unsub = subscribeToOrders((payload) => {
      console.log('[useOrders] Change detected, refreshing instantly...')
      load() 
    }, restaurantId)

    return unsub
  }, [load, restaurantId])

  // ── Actions ────────────────────────────────────────────────────────────────
  const placeOrder = async (payload) => {
    const id = await svcPlace({ ...payload, restaurantId })
    load()
    return id
  }

  const getOrderByOrderId = (orderId) => fetchOrderByOrderId(orderId)

  const updateStatus = async (id, status) => {
    await updateOrderStatus(id, status)
    load()
  }

  const updateItems = async (id, items, subtotal, tax) => {
    await svcUpdateItems(id, items, subtotal, tax)
    load()
  }

  const deleteOrder = async (id) => {
    await svcDelete(id)
    load()
  }

  const deleteAllOrderHistory = async () => {
    await svcDeleteAll(restaurantId)
    load()
  }

  // ── Derived filter helpers (Fixed to India Timezone) ───────────────────────
  const todayOrders = orders.filter(o => {
    if (!o.createdAt) return false
    const options = { timeZone: 'Asia/Kolkata' }
    const orderDate = o.createdAt.toLocaleDateString('en-IN', options)
    const todayDate = new Date().toLocaleDateString('en-IN', options)
    return orderDate === todayDate
  })

  const monthOrders = orders.filter(o => {
    if (!o.createdAt) return false
    const options = { timeZone: 'Asia/Kolkata', month: 'numeric', year: 'numeric' }
    const orderMonth = o.createdAt.toLocaleDateString('en-IN', options)
    const currentMonth = new Date().toLocaleDateString('en-IN', options)
    return orderMonth === currentMonth
  })

  return {
    orders, todayOrders, monthOrders, loading,
    placeOrder, getOrderByOrderId, updateStatus, updateItems, deleteOrder, deleteAllOrderHistory,
  }
}
