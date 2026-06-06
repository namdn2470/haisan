#!/usr/bin/env python3
"""Generate SVG images for the seafood website."""
import os

BASE = "/Users/nam/Desktop/SeaFool/apps/web/public"

def svg_product(name, title, subtitle, bg_start, bg_end, icon_path, accent):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_start}"/>
      <stop offset="100%" stop-color="{bg_end}"/>
    </linearGradient>
    <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255,255,255,0)" />
      <stop offset="50%" stop-color="rgba(255,255,255,0.08)" />
      <stop offset="100%" stop-color="rgba(255,255,255,0)" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="600" height="600" rx="24" fill="url(#bg)"/>
  <rect x="0" y="0" width="600" height="600" rx="24" fill="url(#shimmer)"/>
  <!-- Decorative circles -->
  <circle cx="480" cy="120" r="180" fill="{accent}" opacity="0.08"/>
  <circle cx="100" cy="500" r="120" fill="{accent}" opacity="0.06"/>
  <circle cx="350" cy="450" r="200" fill="{accent}" opacity="0.04"/>
  <!-- Icon area -->
  <g transform="translate(200, 140)">
    {icon_path}
  </g>
  <!-- Text -->
  <text x="300" y="420" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" fill="white" filter="url(#shadow)">{title}</text>
  <text x="300" y="460" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="500" fill="rgba(255,255,255,0.75)">{subtitle}</text>
  <!-- Badge -->
  <rect x="220" y="490" width="160" height="32" rx="16" fill="white" opacity="0.15"/>
  <text x="300" y="512" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="white" letter-spacing="1">TƯƠI SỐNG</text>
</svg>'''

def svg_category(name, emoji, bg_start, bg_end, accent):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_start}"/>
      <stop offset="100%" stop-color="{bg_end}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" rx="16" fill="url(#bg)"/>
  <circle cx="320" cy="60" r="100" fill="{accent}" opacity="0.12"/>
  <circle cx="80" cy="250" r="80" fill="{accent}" opacity="0.08"/>
  <text x="200" y="140" text-anchor="middle" font-size="72">{emoji}</text>
  <text x="200" y="200" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="800" fill="white">{name}</text>
  <text x="200" y="230" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="rgba(255,255,255,0.7)">Hải Sản Biển Xanh</text>
</svg>'''

def svg_banner(title, subtitle, w, h, bg_start, bg_end, accent, layout="wide"):
    extra_shapes = ""
    if layout == "wide":
        extra_shapes = f'''
  <circle cx="{w-100}" cy="{h//2}" r="250" fill="{accent}" opacity="0.1"/>
  <circle cx="150" cy="{h-50}" r="180" fill="{accent}" opacity="0.06"/>
  <rect x="60" y="{h//2-120}" width="380" height="240" rx="20" fill="white" opacity="0.08"/>
  <text x="80" y="{h//2-60}" font-family="system-ui, sans-serif" font-size="48" font-weight="900" fill="white">{title}</text>
  <text x="80" y="{h//2}" font-family="system-ui, sans-serif" font-size="22" font-weight="500" fill="rgba(255,255,255,0.8)">{subtitle}</text>
  <rect x="80" y="{h//2+30}" width="200" height="50" rx="25" fill="white" opacity="0.2"/>
  <text x="180" y="{h//2+62}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="white">MUA NGAY</text>'''
    else:
        extra_shapes = f'''
  <circle cx="{w//2}" cy="80" r="120" fill="{accent}" opacity="0.15"/>
  <text x="{w//2}" y="{h//2-20}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="36" font-weight="900" fill="white">{title}</text>
  <text x="{w//2}" y="{h//2+20}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="500" fill="rgba(255,255,255,0.8)">{subtitle}</text>
  <rect x="{w//2-80}" y="{h//2+40}" width="160" height="40" rx="20" fill="white" opacity="0.2"/>
  <text x="{w//2}" y="{h//2+66}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="white">KHÁM PHÁ</text>'''

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_start}"/>
      <stop offset="100%" stop-color="{bg_end}"/>
    </linearGradient>
  </defs>
  <rect width="{w}" height="{h}" rx="16" fill="url(#bg)"/>
  {extra_shapes}
</svg>'''

def svg_logo():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e7490"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="32" fill="url(#bg)"/>
  <g transform="translate(40, 35)">
    <path d="M0 70c10-15 25-25 50-25s25 10 25 10 10-10 25-10 40 15 60 30" stroke="white" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M0 100c10-15 25-25 50-25s25 10 25 10 10-10 25-10 40 15 60 30" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.4"/>
    <path d="M80 30l-8 20h16l-8-20z" fill="white"/>
  </g>
  <text x="100" y="148" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="white" letter-spacing="1">BIỂN XANH</text>
</svg>'''

def svg_promo(title, discount, bg1, bg2, accent):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 300">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg1}"/>
      <stop offset="100%" stop-color="{bg2}"/>
    </linearGradient>
  </defs>
  <rect width="500" height="300" rx="20" fill="url(#bg)"/>
  <circle cx="400" cy="50" r="120" fill="{accent}" opacity="0.12"/>
  <circle cx="60" cy="260" r="90" fill="{accent}" opacity="0.08"/>
  <rect x="30" y="30" width="120" height="50" rx="25" fill="white" opacity="0.2"/>
  <text x="90" y="62" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="900" fill="white">{discount}</text>
  <text x="40" y="130" font-family="system-ui, sans-serif" font-size="32" font-weight="900" fill="white">{title}</text>
  <text x="40" y="165" font-family="system-ui, sans-serif" font-size="15" font-weight="500" fill="rgba(255,255,255,0.7)">Hải Sản Biển Xanh</text>
  <rect x="40" y="200" width="160" height="42" rx="21" fill="white" opacity="0.2"/>
  <text x="120" y="227" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="white">XEM NGAY</text>
</svg>'''

# Icon SVG paths for products
ICONS = {
    'tom': '<g fill="none" stroke="white" stroke-width="4" stroke-linecap="round"><path d="M40 80c20-40 80-50 120-20s60 80 40 120"/><path d="M60 100c15-25 55-35 85-15s35 50 25 75"/><circle cx="100" cy="60" r="12" fill="white" opacity="0.3"/><path d="M160 50l20-30m-15 28l18-25m-12 23l15-20" stroke-width="3" opacity="0.6"/></g>',
    'ghe': '<g fill="none" stroke="white" stroke-width="4" stroke-linecap="round"><ellipse cx="100" cy="80" rx="70" ry="50"/><path d="M30 80c0 30 30 60 70 60s70-30 70-60"/><path d="M40 60l-25-35m85 35l25-35"/><circle cx="80" cy="70" r="5" fill="white"/><circle cx="120" cy="70" r="5" fill="white"/><path d="M20 100l-15 10m170-10l15 10" stroke-width="3"/></g>',
    'ca': '<g fill="none" stroke="white" stroke-width="4" stroke-linecap="round"><path d="M30 80c30-40 90-50 140-20s50 60 30 80c-20 20-60 20-100 0s-60-30-70-60z"/><circle cx="140" cy="70" r="5" fill="white"/><path d="M60 80l-20-20m0 20l-20 20" stroke-width="3"/></g>',
    'muc': '<g fill="none" stroke="white" stroke-width="4" stroke-linecap="round"><ellipse cx="100" cy="50" rx="45" ry="35"/><path d="M65 75c-5 30-15 55-20 65m20-65c5 30 15 55 20 65m20-65c-5 30-15 55-20 65m20-65c5 30 15 55 20 65m20-65c-5 30-15 55-20 65"/><circle cx="85" cy="45" r="4" fill="white"/><circle cx="115" cy="45" r="4" fill="white"/></g>',
    'oc': '<g fill="none" stroke="white" stroke-width="4" stroke-linecap="round"><path d="M60 110c0-40 30-70 60-70s40 15 40 30-10 25-25 25-20-10-15-25 15-20 15-20"/><path d="M60 110c-10 15-5 30 10 35"/><circle cx="55" cy="130" r="4" fill="white" opacity="0.5"/></g>',
    'combo': '<g fill="none" stroke="white" stroke-width="4" stroke-linecap="round"><rect x="25" y="40" width="150" height="100" rx="12"/><path d="M25 70h150"/><circle cx="60" cy="55" r="8" fill="white" opacity="0.4"/><circle cx="100" cy="55" r="8" fill="white" opacity="0.4"/><circle cx="140" cy="55" r="8" fill="white" opacity="0.4"/><path d="M50 95l15 15 25-25" stroke-width="5" opacity="0.6"/></g>',
}

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"  Created: {path}")

print("Generating product images...")
products = [
    ("tom-su-size-l", "Tôm Sú Size L", "Tôm tươi sống - 15-20 con/kg", "#dc2626", "#f97316", "tom", "#fb923c"),
    ("ghe-xanh-size-3", "Ghẹ Xanh Size 3", "Ghẹ tươi sống - 0.6-0.8kg/con", "#0369a1", "#0ea5e9", "ghe", "#38bdf8"),
    ("oc-huong-size-l", "Ốc Hương Size L", "Ốc hương tươi - size lớn", "#92400e", "#d97706", "oc", "#fbbf24"),
    ("muc-ong-size-20-30", "Mực Ống Size 20-30", "Mực tươi sống - 20-30 con/kg", "#7e22ce", "#a855f7", "muc", "#c084fc"),
    ("ca-hong-bien", "Cá Hồng Biển", "Cá hồng tươi - đánh bắt tự nhiên", "#0f766e", "#14b8a6", "ca", "#2dd4bf"),
    ("combo-hai-san-gia-dinh", "Combo Hải Sản Gia Đình", "Tiết kiệm hơn - Ngon hơn", "#b91c1c", "#ea580c", "combo", "#f97316"),
]

for slug, title, subtitle, bg1, bg2, icon_key, accent in products:
    for i in range(1, 4):
        content = svg_product(slug, title, subtitle, bg1, bg2, ICONS[icon_key], accent)
        write(f"{BASE}/images/products/{slug}-{i}.png", content)
        # Also write as jpg-name in assets for fallback
        if i == 1:
            asset_name = f"prod-{slug.split('-')[0]}.jpg"
            if slug.startswith("combo"):
                asset_name = "promo-combo.jpg"
            write(f"{BASE}/assets/{asset_name}", content)

print("\nGenerating category images...")
categories = [
    ("tom", "Tôm", "🦐", "#dc2626", "#f97316", "#fb923c"),
    ("cua-ghe", "Cua - Ghẹ", "🦀", "#0369a1", "#0ea5e9", "#38bdf8"),
    ("ca", "Cá", "🐟", "#0f766e", "#14b8a6", "#2dd4bf"),
    ("muc", "Mực", "🦑", "#7e22ce", "#a855f7", "#c084fc"),
    ("oc-so", "Ốc - Sò", "🐚", "#92400e", "#d97706", "#fbbf24"),
    ("combo", "Combo Hot", "🔥", "#b91c1c", "#ea580c", "#f97316"),
    ("hai-san-so-che", "Hải Sản Sơ Chế", "🔪", "#166534", "#22c55e", "#4ade80"),
]

for slug, name, emoji, bg1, bg2, accent in categories:
    content = svg_category(name, emoji, bg1, bg2, accent)
    write(f"{BASE}/images/categories/{slug}.png", content)
    # Also assets
    asset_map = {"tom": "cat-tom", "cua-ghe": "cat-cua", "ca": "cat-ca", "muc": "cat-muc", "oc-so": "cat-oc", "combo": "cat-combo", "hai-san-so-che": "cat-so-che"}
    write(f"{BASE}/assets/{asset_map[slug]}.jpg", content)

print("\nGenerating banner images...")
banners = [
    ("home-hero", "Hải sản tươi sống", "Giao nhanh trong ngày", 1400, 500, "#0e7490", "#155e75", "#06b6d4", "wide"),
    ("mobile-hero", "Hải sản tươi sống", "Giao nhanh 2h tại TP.HCM", 750, 400, "#0e7490", "#155e75", "#06b6d4", "mobile"),
    ("combo-gia-dinh", "Combo gia đình", "Tiết kiệm hơn - Ngon hơn", 1400, 500, "#b91c1c", "#ea580c", "#f97316", "wide"),
    ("hai-san-so-che", "Hải sản sơ chế", "Sạch - Tiện - Ngon", 1400, 500, "#166534", "#15803d", "#22c55e", "wide"),
    ("uu-dai-hom-nay", "Ưu đãi hôm nay", "Giảm đến 30%", 1400, 500, "#9333ea", "#7c3aed", "#a855f7", "wide"),
]

for name, title, subtitle, w, h, bg1, bg2, accent, layout in banners:
    content = svg_banner(title, subtitle, w, h, bg1, bg2, accent, layout)
    write(f"{BASE}/images/banners/{name}.png", content)

print("\nGenerating logo...")
write(f"{BASE}/assets/logo.jpg", svg_logo())

print("\nGenerating promo images...")
promos = [
    ("promo-combo", "Combo Hải Sản", "Giảm 20%", "#b91c1c", "#ea580c", "#f97316"),
    ("promo-gift", "Quà Tặng", "Mua 2 tặng 1", "#7e22ce", "#a855f7", "#c084fc"),
    ("promo-so-che", "Sơ Chế Tiện Lợi", "Sạch - Ngon", "#166534", "#22c55e", "#4ade80"),
]
for name, title, discount, bg1, bg2, accent in promos:
    write(f"{BASE}/assets/{name}.jpg", svg_promo(title, discount, bg1, bg2, accent))

print("\nGenerating hero images...")
# Hero seafood - a large banner
hero = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e7490"/>
      <stop offset="50%" stop-color="#155e75"/>
      <stop offset="100%" stop-color="#0c4a6e"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" rx="20" fill="url(#bg)"/>
  <circle cx="650" cy="150" r="200" fill="#06b6d4" opacity="0.1"/>
  <circle cx="150" cy="450" r="150" fill="#06b6d4" opacity="0.08"/>
  <circle cx="400" cy="300" r="100" fill="white" opacity="0.04"/>
  <!-- Wave lines -->
  <path d="M0 400c100-30 200-10 300-30s200-20 300 10 200 20 300-10" stroke="white" stroke-width="2" fill="none" opacity="0.15"/>
  <path d="M0 430c100-30 200-10 300-30s200-20 300 10 200 20 300-10" stroke="white" stroke-width="2" fill="none" opacity="0.1"/>
  <!-- Seafood icons -->
  <g transform="translate(250, 150)" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" opacity="0.6">
    <path d="M30 60c15-30 50-40 80-15s30 55 20 80"/>
    <circle cx="80" cy="40" r="8" fill="white" opacity="0.4"/>
  </g>
  <g transform="translate(420, 180)" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.5">
    <ellipse cx="50" cy="35" rx="40" ry="28"/>
    <path d="M15 35c0 18 16 32 35 32s35-14 35-32"/>
  </g>
  <text x="400" y="350" text-anchor="middle" font-family="system-ui, sans-serif" font-size="56" font-weight="900" fill="white" opacity="0.9">HẢI SẢN TƯƠI SỐNG</text>
  <text x="400" y="400" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="500" fill="rgba(255,255,255,0.7)">Giao nhanh trong ngày - TP.HCM & lân cận</text>
  <rect x="300" y="430" width="200" height="50" rx="25" fill="white" opacity="0.2"/>
  <text x="400" y="462" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="white">KHÁM PHÁ NGAY</text>
</svg>'''
write(f"{BASE}/hero-seafood.jpg", hero)
write(f"{BASE}/hero-full.jpg", hero)

# Hero full (larger variant)
hero_full = hero.replace('viewBox="0 0 800 600"', 'viewBox="0 0 1400 500"').replace('width="800" height="600"', 'width="1400" height="500"')
write(f"{BASE}/hero-full.jpg", hero_full)

print("\nGenerating misc assets...")
# Cart preview
cart_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" rx="16" fill="#f0fdfa"/>
  <g transform="translate(140, 50)" fill="none" stroke="#0891b2" stroke-width="3" stroke-linecap="round">
    <circle cx="60" cy="60" r="40"/>
    <path d="M40 60l-20 40h80l-20-40"/>
    <circle cx="50" cy="110" r="5" fill="#0891b2"/>
    <circle cx="90" cy="110" r="5" fill="#0891b2"/>
  </g>
  <text x="200" y="210" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" font-weight="700" fill="#0e7490">Giỏ hàng trống</text>
  <text x="200" y="240" text-anchor="middle" font-family="system-ui, sans-serif" font-size="13" fill="#64748b">Thêm sản phẩm để bắt đầu</text>
</svg>'''
write(f"{BASE}/cart-preview.jpg", cart_svg)

# Admin preview
admin_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" rx="16" fill="#f8fafc"/>
  <rect x="20" y="20" width="360" height="40" rx="8" fill="#0e7490"/>
  <text x="40" y="47" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="white">Dashboard</text>
  <rect x="20" y="80" width="110" height="70" rx="10" fill="#ecfdf5"/>
  <rect x="145" y="80" width="110" height="70" rx="10" fill="#eff6ff"/>
  <rect x="270" y="80" width="110" height="70" rx="10" fill="#fef3c7"/>
  <text x="75" y="115" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#059669">24</text>
  <text x="75" y="138" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">Đơn mới</text>
  <text x="200" y="115" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#2563eb">12.5M</text>
  <text x="200" y="138" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">Doanh thu</text>
  <rect x="20" y="170" width="360" height="110" rx="10" fill="white" stroke="#e2e8f0"/>
  <text x="40" y="195" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#1e293b">Đơn hàng gần đây</text>
  <rect x="40" y="210" width="320" height="20" rx="4" fill="#f1f5f9"/>
  <rect x="40" y="240" width="320" height="20" rx="4" fill="#f1f5f9"/>
</svg>'''
write(f"{BASE}/admin-preview.jpg", admin_svg)

# Mobile preview
mobile_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 600">
  <rect width="300" height="600" rx="30" fill="#0e7490"/>
  <rect x="8" y="8" width="284" height="584" rx="24" fill="#f3fbff"/>
  <rect x="20" y="20" width="260" height="50" rx="12" fill="white" stroke="#e2e8f0"/>
  <text x="40" y="52" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#0e7490">Hải Sản Biển Xanh</text>
  <rect x="20" y="90" width="260" height="180" rx="12" fill="#0e7490"/>
  <text x="150" y="170" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="white">HẢI SẢN TƯƠI</text>
  <text x="150" y="200" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="rgba(255,255,255,0.7)">Giao nhanh trong ngày</text>
  <rect x="20" y="290" width="120" height="130" rx="10" fill="white" stroke="#e2e8f0"/>
  <rect x="160" y="290" width="120" height="130" rx="10" fill="white" stroke="#e2e8f0"/>
  <rect x="20" y="440" width="260" height="50" rx="25" fill="#0e7490"/>
  <text x="150" y="472" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="white">MUA SẮM NGAY</text>
</svg>'''
write(f"{BASE}/mobile-preview.jpg", mobile_svg)

print("\nAll images generated!")
