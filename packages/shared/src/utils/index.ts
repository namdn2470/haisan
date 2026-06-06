export function formatPrice(n: number | string): string {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function calcTotal(items: { price: number; quantity: number }[]): number {
  return items.reduce((s, i) => s + i.price * i.quantity, 0);
}

export function calcDiscount(original: number, discountPercent: number): number {
  return Math.round(original * (1 - discountPercent / 100));
}
