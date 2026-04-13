-- SECURE ORDERS RLS FIX
-- Prevents unauthorized insertion of orders into inactive or non-existent restaurants.

-- 1. Tighten 'orders' INSERT policy
DROP POLICY IF EXISTS "Public insert orders" ON orders;
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.restaurants 
    WHERE id = orders.restaurant_id AND is_active = true
  )
);

-- 2. Tighten 'order_items' INSERT policy
DROP POLICY IF EXISTS "Public insert order_items" ON order_items;
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders 
    JOIN public.restaurants ON restaurants.id = orders.restaurant_id
    WHERE orders.id = order_items.order_id AND restaurants.is_active = true
  )
);

-- 3. Verify 'delete' cascading (Safety check)
-- Handled by table references (ON DELETE CASCADE), but ensuring indexes exist for performance.
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
