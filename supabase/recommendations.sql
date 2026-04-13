-- AI Menu Recommendations logic
-- Analyzes order history to find frequent pairings within a specific restaurant

-- 1. Get Recommendations for a specific item
-- This function finds items frequently ordered together with the target item
CREATE OR REPLACE FUNCTION get_menu_recommendations(
  p_menu_item_id  UUID,
  p_restaurant_id UUID,
  p_limit         INT DEFAULT 3
)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  price        NUMERIC,
  image_url    TEXT,
  food_type    TEXT,
  frequency    BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH matching_orders AS (
    -- Get all orders that contained the target item
    SELECT oi.order_id 
    FROM public.order_items oi
    JOIN public.orders o ON oi.order_id = o.id
    WHERE oi.menu_item_id = p_menu_item_id
      AND o.restaurant_id = p_restaurant_id
  ),
  paired_items AS (
    -- Find all OTHER items in those same orders within the same restaurant
    SELECT 
      oi.menu_item_id,
      count(*) as pair_count
    FROM public.order_items oi
    JOIN matching_orders mo ON oi.order_id = mo.order_id
    WHERE oi.menu_item_id != p_menu_item_id
    GROUP BY oi.menu_item_id
  )
  SELECT 
    m.id,
    m.name,
    m.price,
    m.image_url,
    m.food_type,
    pi.pair_count as frequency
  FROM paired_items pi
  JOIN public.menu m ON pi.menu_item_id = m.id
  WHERE m.available = true
    AND m.restaurant_id = p_restaurant_id
  ORDER BY pi.pair_count DESC
  LIMIT p_limit;
END;
$$;

-- 2. Get Trending Items (Fallback if no history exists for a specific pairing)
-- This function identifies the most popular items within a specific restaurant
CREATE OR REPLACE FUNCTION get_trending_items(
  p_restaurant_id UUID,
  p_limit         INT DEFAULT 5
)
RETURNS TABLE (
  id           UUID,
  name         TEXT,
  price        NUMERIC,
  image_url    TEXT,
  food_type    TEXT,
  order_count  BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.price,
    m.image_url,
    m.food_type,
    count(oi.id) as order_count
  FROM public.menu m
  LEFT JOIN public.order_items oi ON m.id = oi.menu_item_id
  WHERE m.restaurant_id = p_restaurant_id
    AND m.available = true
  GROUP BY m.id
  ORDER BY order_count DESC, m.name ASC
  LIMIT p_limit;
END;
$$;
