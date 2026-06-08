WITH image_urls AS (
  SELECT
    'https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=1600'::text AS hero,
    'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS shrimp,
    'https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS shrimp_cooked,
    'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS crab,
    'https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS fish,
    'https://images.pexels.com/photos/1321124/pexels-photo-1321124.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS fish_market,
    'https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS squid,
    'https://images.pexels.com/photos/30496793/pexels-photo-30496793.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS calamari,
    'https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS shellfish,
    'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS seafood_platter,
    'https://images.pexels.com/photos/19835566/pexels-photo-19835566.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS prepared
)
UPDATE categories c
SET image_url = CASE c.slug
  WHEN 'tom' THEN image_urls.shrimp
  WHEN 'cua-ghe' THEN image_urls.crab
  WHEN 'ca' THEN image_urls.fish
  WHEN 'muc' THEN image_urls.squid
  WHEN 'oc-so' THEN image_urls.shellfish
  WHEN 'combo' THEN image_urls.seafood_platter
  WHEN 'hai-san-so-che' THEN image_urls.prepared
  ELSE c.image_url
END
FROM image_urls
WHERE c.slug IN ('tom', 'cua-ghe', 'ca', 'muc', 'oc-so', 'combo', 'hai-san-so-che');

WITH image_urls AS (
  SELECT
    'https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=1600'::text AS hero,
    'https://images.pexels.com/photos/14480456/pexels-photo-14480456.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS shrimp,
    'https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS shrimp_cooked,
    'https://images.pexels.com/photos/15665165/pexels-photo-15665165.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS crab,
    'https://images.pexels.com/photos/8250365/pexels-photo-8250365.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS fish,
    'https://images.pexels.com/photos/1321124/pexels-photo-1321124.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS fish_market,
    'https://images.pexels.com/photos/3276125/pexels-photo-3276125.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS squid,
    'https://images.pexels.com/photos/30496793/pexels-photo-30496793.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS calamari,
    'https://images.pexels.com/photos/19671370/pexels-photo-19671370.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS shellfish,
    'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS seafood_platter,
    'https://images.pexels.com/photos/19835566/pexels-photo-19835566.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS prepared
)
UPDATE product_images pi
SET image_url = CASE c.slug
  WHEN 'tom' THEN CASE (pi.sort_order - 1) % 3
    WHEN 0 THEN image_urls.shrimp
    WHEN 1 THEN image_urls.shrimp_cooked
    ELSE image_urls.seafood_platter
  END
  WHEN 'cua-ghe' THEN CASE (pi.sort_order - 1) % 3
    WHEN 0 THEN image_urls.crab
    WHEN 1 THEN image_urls.shrimp_cooked
    ELSE image_urls.seafood_platter
  END
  WHEN 'ca' THEN CASE (pi.sort_order - 1) % 3
    WHEN 0 THEN image_urls.fish
    WHEN 1 THEN image_urls.fish_market
    ELSE image_urls.seafood_platter
  END
  WHEN 'muc' THEN CASE (pi.sort_order - 1) % 3
    WHEN 0 THEN image_urls.squid
    WHEN 1 THEN image_urls.calamari
    ELSE image_urls.prepared
  END
  WHEN 'oc-so' THEN CASE (pi.sort_order - 1) % 3
    WHEN 0 THEN image_urls.shellfish
    WHEN 1 THEN image_urls.seafood_platter
    ELSE image_urls.prepared
  END
  WHEN 'combo' THEN CASE (pi.sort_order - 1) % 3
    WHEN 0 THEN image_urls.seafood_platter
    WHEN 1 THEN image_urls.hero
    ELSE image_urls.prepared
  END
  WHEN 'hai-san-so-che' THEN CASE (pi.sort_order - 1) % 3
    WHEN 0 THEN image_urls.prepared
    WHEN 1 THEN image_urls.calamari
    ELSE image_urls.shrimp_cooked
  END
  ELSE pi.image_url
END
FROM products p
JOIN categories c ON c.id = p.category_id
CROSS JOIN image_urls
WHERE pi.product_id = p.id;

WITH image_urls AS (
  SELECT
    'https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=1600'::text AS hero,
    'https://images.pexels.com/photos/16737158/pexels-photo-16737158.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS shrimp_cooked,
    'https://images.pexels.com/photos/18281684/pexels-photo-18281684.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS seafood_platter,
    'https://images.pexels.com/photos/19835566/pexels-photo-19835566.jpeg?auto=compress&cs=tinysrgb&w=900'::text AS prepared
)
UPDATE banners b
SET image_url = CASE b.title
  WHEN 'Hải sản tươi sống' THEN image_urls.hero
  WHEN 'Mobile Hero' THEN image_urls.hero
  WHEN 'Combo gia đình' THEN image_urls.seafood_platter
  WHEN 'Hải sản sơ chế' THEN image_urls.prepared
  WHEN 'Ưu đãi hôm nay' THEN image_urls.shrimp_cooked
  ELSE b.image_url
END
FROM image_urls
WHERE b.title IN ('Hải sản tươi sống', 'Mobile Hero', 'Combo gia đình', 'Hải sản sơ chế', 'Ưu đãi hôm nay');
