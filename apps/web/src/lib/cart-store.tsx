'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  addRemoteCartItem,
  getRemoteCart,
  removeRemoteCartItem,
  updateRemoteCartItem,
} from '@/services/cartService';
import { getToken as getAuthToken } from '@/lib/api';

// ============================================================
// Types
// ============================================================
export type CartItem = {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  selectedUnit: string;
  priceAtTime: number;
  note?: string;
  processingServiceId?: string;
  product: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    unit: string;
    images?: { imageUrl: string }[] | string[];
  };
  variant?: { id: string; name: string; price: number };
  processingService?: { id: string; name: string; price: number };
};

type CartState = {
  items: CartItem[];
  lastUpdated: number;
};

type CartAction =
  | { type: 'SET_ITEMS'; items: CartItem[] }
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'UPDATE_QUANTITY'; itemId: string; quantity: number }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] };

const STORAGE_KEY = 'hsbx_cart';

function mergeCartItem(items: CartItem[], item: CartItem) {
  const existing = items.findIndex(
    (i) =>
      i.productId === item.productId &&
      (i.variantId || '') === (item.variantId || '') &&
      (i.processingService?.id || '') === (item.processingService?.id || '')
  );

  if (existing >= 0) {
    const updated = [...items];
    updated[existing] = {
      ...updated[existing],
      quantity: updated[existing].quantity + item.quantity,
    };
    return updated;
  }

  return [...items, item];
}

function persistLocalCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { items: action.items, lastUpdated: Date.now() };
    case 'ADD_ITEM': {
      return { items: mergeCartItem(state.items, action.item), lastUpdated: Date.now() };
    }
    case 'UPDATE_QUANTITY': {
      if (action.quantity < 1) return state;
      return {
        items: state.items.map((i) =>
          i.id === action.itemId ? { ...i, quantity: action.quantity } : i
        ),
        lastUpdated: Date.now(),
      };
    }
    case 'REMOVE_ITEM':
      return {
        items: state.items.filter((i) => i.id !== action.itemId),
        lastUpdated: Date.now(),
      };
    case 'CLEAR':
      return { items: [], lastUpdated: Date.now() };
    case 'LOAD':
      return { items: action.items, lastUpdated: Date.now() };
    default:
      return state;
  }
}

// ============================================================
// Toast system
// ============================================================
type ToastItem = { id: string; message: string; type: 'success' | 'error' | 'info' };

let toastCounter = 0;
let addToastExternal: ((msg: string, type?: ToastItem['type']) => void) | null = null;

export function showToast(message: string, type: ToastItem['type'] = 'success') {
  addToastExternal?.(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToastExternal = (message: string, type: ToastItem['type'] = 'success') => {
      const id = String(++toastCounter);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };
    return () => {
      addToastExternal = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 360,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background:
              t.type === 'success'
                ? '#10b981'
                : t.type === 'error'
                ? '#ef4444'
                : '#0066ff',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'toastSlideIn 0.3s ease',
          }}
        >
          {t.type === 'success' ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : t.type === 'error' ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {t.message}
        </div>
      ))}
      <style>
        {`
          @keyframes toastSlideIn {
            from { opacity: 0; transform: translateX(100%); }
            to { opacity: 1; transform: translateX(0); }
          }
        `}
      </style>
    </div>
  );
}

// ============================================================
// Context
// ============================================================
type CartContextValue = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  isLoading: boolean;
  getItemCount: () => number;
  getSubtotal: () => number;
  getShippingFee: () => number;
  getTotal: () => number;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    lastUpdated: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const getToken = () => getAuthToken() || '';

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRemoteCart<{ items: any[] }>();
      dispatch({
        type: 'LOAD',
        items: normalizeCartItems(data?.data?.items || []),
      });
    } catch {
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) {
      refreshCart();
    } else {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          dispatch({ type: 'LOAD', items: JSON.parse(stored) });
        } else {
          dispatch({ type: 'LOAD', items: [] });
        }
      } catch {
        dispatch({ type: 'LOAD', items: [] });
      }
      setIsLoading(false);
    }
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {}
  }, [state.items]);

  const addToCart = useCallback(
    async (item: Omit<CartItem, 'id'>) => {
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const cartItem: CartItem = { ...item, id: tempId };
      const token = getToken();

      dispatch({ type: 'ADD_ITEM', item: cartItem });
      persistLocalCart(mergeCartItem(state.items, cartItem));

      if (!token) {
        showToast('Đã thêm vào giỏ — hãy đăng nhập để đặt hàng');
        return;
      }

      try {
        const data = await addRemoteCartItem<any>({
          product_id: item.productId,
          variant_id: item.variantId || null,
          quantity: item.quantity,
          selected_unit: item.selectedUnit,
          processing_service_id: item.processingServiceId || item.processingService?.id || null,
          price_at_time: item.priceAtTime,
          note: item.note || null,
        });

        dispatch({ type: 'REMOVE_ITEM', itemId: tempId });
        if (data?.data) {
          dispatch({
            type: 'ADD_ITEM',
            item: normalizeCartItem(data.data),
          });
        }
        showToast('Đã thêm vào giỏ hàng');
      } catch {
        showToast('Đã lưu giỏ hàng trên thiết bị');
      }
    },
    [state.items]
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (quantity < 1) return;
      persistLocalCart(
        state.items.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        )
      );
      dispatch({ type: 'UPDATE_QUANTITY', itemId, quantity });
      try {
        if (getToken() && !itemId.startsWith('temp_')) {
          await updateRemoteCartItem(itemId, quantity);
        }
      } catch {
        // Silent fail — optimistic update already applied
      }
    },
    [state.items]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      persistLocalCart(state.items.filter((i) => i.id !== itemId));
      dispatch({ type: 'REMOVE_ITEM', itemId });
      try {
        if (getToken() && !itemId.startsWith('temp_')) {
          await removeRemoteCartItem(itemId);
        }
      } catch {
        // Silent fail
      }
    },
    [state.items]
  );

  const clearCart = useCallback(() => {
    persistLocalCart([]);
    dispatch({ type: 'CLEAR' });
  }, []);

  const getItemCount = useCallback(() => {
    return state.items.reduce((sum, i) => sum + i.quantity, 0);
  }, [state.items]);

  const getSubtotal = useCallback(() => {
    return state.items.reduce((sum, i) => sum + i.priceAtTime * i.quantity, 0);
  }, [state.items]);

  const getShippingFee = useCallback(() => {
    const sub = getSubtotal();
    return sub >= 500000 ? 0 : 30000;
  }, [getSubtotal]);

  const getTotal = useCallback(() => {
    return getSubtotal() + getShippingFee();
  }, [getSubtotal, getShippingFee]);

  const value = useMemo(
    () => ({
      items: state.items,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      isLoading,
      getItemCount,
      getSubtotal,
      getShippingFee,
      getTotal,
      refreshCart,
    }),
    [
      state.items,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart,
      isLoading,
      getItemCount,
      getSubtotal,
      getShippingFee,
      getTotal,
      refreshCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

// ============================================================
// Normalize API cart items to our CartItem type
// ============================================================
function normalizeCartItems(raw: any[]): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeCartItem);
}

function normalizeCartItem(raw: any): CartItem {
  return {
    id: raw.id || raw._id || String(Math.random()),
    productId:
      raw.product_id ||
      raw.productId ||
      raw.product?.id ||
      '',
    variantId: raw.variant_id || raw.variantId,
    quantity: Number(raw.quantity || 1),
    selectedUnit: raw.selected_unit || raw.selectedUnit || 'kg',
    priceAtTime: Number(raw.price_at_time || raw.priceAtTime || 0),
    note: raw.note,
    product: {
      id: raw.product?.id || raw.product_id || raw.productId || '',
      name: raw.product?.name || raw.productName || 'Sản phẩm',
      slug: raw.product?.slug || '',
      basePrice: Number(
        raw.product?.base_price || raw.product?.basePrice || 0
      ),
      unit: raw.product?.unit || raw.selectedUnit || 'kg',
      images: raw.product?.images || [],
    },
    variant: raw.variant
      ? {
          id: raw.variant.id || raw.variantId || '',
          name: raw.variant.name || '',
          price: Number(raw.variant.price || 0),
        }
      : undefined,
    processingService: raw.processingService || raw.processing_service
      ? {
          id:
            raw.processingService?.id ||
            raw.processing_service?.id ||
            '',
          name:
            raw.processingService?.name ||
            raw.processing_service?.name ||
            '',
          price: Number(
            raw.processingService?.price ||
              raw.processing_service?.price ||
              0
          ),
        }
      : undefined,
  };
}
