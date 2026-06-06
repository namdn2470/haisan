export const money = (n: number | null | undefined): string =>
  new Intl.NumberFormat('vi-VN').format(Number(n) || 0) + 'đ';
