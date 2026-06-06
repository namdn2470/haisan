export const ORDER_STATUS = {
  NEW: 'new',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  DELIVERING: 'delivering',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
} as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  new: 'Mới đặt',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chuẩn bị',
  delivering: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  returned: 'Trả hàng',
};

export const PAYMENT_METHOD = {
  COD: 'cod',
  BANK_TRANSFER: 'bank_transfer',
  MOMO: 'momo',
  ZALO_PAY: 'zalo_pay',
} as const;

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: 'COD',
  bank_transfer: 'Chuyển khoản',
  momo: 'Ví MoMo',
  zalo_pay: 'ZaloPay',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export const PRODUCT_UNIT = {
  KG: 'kg',
  CON: 'con',
  COMBO: 'combo',
  HOP: 'hop',
} as const;

export const PRODUCT_BADGE = {
  BAN_CHAY: 'ban_chay',
  UU_DAI: 'uu_dai',
  TUOI_NGON: 'tuoi_ngon',
  MOI: 'moi',
} as const;

export const PRODUCT_BADGE_LABEL: Record<string, string> = {
  ban_chay: 'Bán chạy',
  uu_dai: 'Ưu đãi',
  tuoi_ngon: 'Tươi ngon',
  moi: 'Mới',
};
