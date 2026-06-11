// Admin API service - all admin API calls go through here
// NOTE: Use getUrl() wrapper - do NOT import or use the api() function
// api() function prepends base URL, so we must use relative paths

import { getApiBaseUrl, getToken } from '@/lib/api';

// ── Unwrap helpers ──────────────────────────────────────────────────────────────
// Backend wraps responses with apiResponse(): { success, message, data }
// - Paginated list:  service returns { data, total, page, totalPages }
//                    wrapped = { success, message, data: { data, total, page, totalPages } }
// - Single object:   service returns { data } (or just the object)
//                    wrapped = { success, message, data: { data } } or { success, message, data: {...} }
//
// After unwrapping: caller receives exactly what the service returned.
//
// autoUnwrap handles the apiResponse wrapper so callers don't need to.
// For paginated list endpoints (findAll), the inner structure { data, total, page, totalPages }
// is PRESERVED so callers can do result.data / result.total.
function _unusedAutoUnwrap(raw: any): any {
  if (raw == null || typeof raw !== 'object' || !('success' in raw) || !('data' in raw)) {
    return raw; // Not wrapped
  }
  const inner = raw.data;
  if (
    inner != null &&
    typeof inner === 'object' &&
    !Array.isArray(inner) &&
    'data' in inner &&
    'total' in inner
  ) {
    return inner; // paginated: { data, total, page, totalPages }
  }
  if (inner != null && typeof inner === 'object' && 'data' in inner && inner.data !== undefined && Object.keys(inner).length === 1) {
    return inner.data;
  }
  return inner; // single object or array
}

function getUrl(path: string) {
  const base = getApiBaseUrl();
  const cleanBase = base.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

async function adminFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const url = getUrl(path);
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts?.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { ...opts, headers });
  } catch (e: any) {
    const isNetworkError = e?.name === 'TypeError' || e?.message === 'Failed to fetch';
    if (isNetworkError) {
      throw new Error(`Không thể kết nối đến API (${url}). Vui lòng kiểm tra backend đã chạy chưa.`);
    }
    throw e;
  }
  const raw = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = raw?.message || raw?.error?.message || `API error: ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }

  // autoUnwrap handles { success, message, data } wrapper:
  // - Paginated list: inner has 'data' (array) + 'total' → preserve inner
  // - Non-paginated { data: [...] } (no total): PRESERVE wrapper, caller uses .data
  // - Single object wrapped as { data: {...} }: unwrap one level
  // - Flat object or array: return as-is
  if (raw != null && typeof raw === 'object' && 'success' in raw && 'data' in raw) {
    const inner = raw.data;
    // Paginated: inner has 'data' (array) + 'total'
    if (
      inner != null &&
      typeof inner === 'object' &&
      !Array.isArray(inner) &&
      'data' in inner &&
      Array.isArray(inner.data) &&
      'total' in inner
    ) {
      return { ...inner } as T;
    }
    // Single object { data: {...} }: unwrap one level
    // Only if inner has exactly 1 key ('data') AND data is NOT an array
    if (
      inner != null &&
      typeof inner === 'object' &&
      !Array.isArray(inner) &&
      Object.keys(inner).length === 1 &&
      'data' in inner &&
      !Array.isArray(inner.data)
    ) {
      return inner.data as T;
    }
    // Non-paginated { data: [] } or plain object/array: preserve wrapper
    return inner as T;
  }
  return raw as T;
}

// Dashboard
export async function fetchDashboardStats(): Promise<any> {
  return adminFetch<any>('/api/dashboard/stats');
}

export async function fetchDashboardRevenue(days = 7): Promise<any> {
  return adminFetch<any>(`/api/dashboard/revenue?days=${days}`);
}

export async function fetchDashboardBestSellers(): Promise<any> {
  return adminFetch<any>('/api/dashboard/best-sellers');
}

// Orders
export async function fetchOrders(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.paymentStatus) query.set('paymentStatus', params.paymentStatus);
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  return adminFetch<any>(`/api/orders?${query.toString()}`);
}

export async function fetchOrderById(id: string): Promise<any> {
  return adminFetch<any>(`/api/orders/${id}`);
}

export async function updateOrderStatus(id: string, status: string, note?: string): Promise<any> {
  return adminFetch<any>(`/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, note }),
  });
}

export async function updateOrderNote(id: string, note: string): Promise<any> {
  return adminFetch<any>(`/api/orders/${id}/note`, {
    method: 'PUT',
    body: JSON.stringify({ note }),
  });
}

export async function fetchOrderHistory(id: string): Promise<any[]> {
  const res = await adminFetch<any[]>(`/api/orders/${id}/history`);
  return Array.isArray(res) ? res : [];
}

// Products
export async function fetchProducts(params?: {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  lowStock?: boolean;
  sort?: string;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.lowStock) query.set('lowStock', 'true');
  if (params?.sort) query.set('sort', params.sort);
  query.set('all', 'true');
  return adminFetch<any>(`/api/products?${query.toString()}`);
}

export async function fetchProductById(id: string): Promise<any> {
  return adminFetch<any>(`/api/products/${id}`);
}

export async function createProduct(data: any): Promise<any> {
  return adminFetch<any>('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(id: string, data: any): Promise<any> {
  return adminFetch<any>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(id: string): Promise<any> {
  return adminFetch<any>(`/api/products/${id}`, { method: 'DELETE' });
}

export async function uploadImage(file: File): Promise<string | null> {
  const url = getUrl('/api/upload/image');
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.data?.url ?? null;
  } catch {
    return null;
  }
}

// Categories
export interface CategoryResponse {
  data: any[];
  total?: number;
}

export interface CategoryDeleteResponse {
  softDeleted?: boolean;
  message?: string;
}

export async function fetchCategories(): Promise<CategoryResponse> {
  const res = await adminFetch<CategoryResponse>('/api/categories');
  return res;
}

export async function fetchCategoryById(id: string): Promise<any> {
  return adminFetch<any>(`/api/categories/${id}`);
}

export async function createCategory(data: any): Promise<any> {
  return adminFetch<any>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(id: string, data: any): Promise<any> {
  return adminFetch<any>(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<CategoryDeleteResponse> {
  return adminFetch<CategoryDeleteResponse>(`/api/categories/${id}`, { method: 'DELETE' });
}

// Customers
export async function fetchCustomers(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return adminFetch<any>(`/api/users/customers?${query.toString()}`);
}

export async function fetchCustomerById(id: string): Promise<any> {
  return adminFetch<any>(`/api/users/customers/${id}`);
}

export async function updateCustomerStatus(id: string, status: string): Promise<any> {
  return adminFetch<any>(`/api/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function fetchCustomerOrders(id: string): Promise<any> {
  return adminFetch<any>(`/api/users/customers/${id}/orders`);
}

// Promotions
export async function fetchPromotions(params?: {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return adminFetch<any>(`/api/promotions?${query.toString()}`);
}

export async function createPromotion(data: any): Promise<any> {
  return adminFetch<any>('/api/promotions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePromotion(id: string, data: any): Promise<any> {
  return adminFetch<any>(`/api/promotions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePromotion(id: string): Promise<any> {
  return adminFetch<any>(`/api/promotions/${id}`, { method: 'DELETE' });
}

// Banners
export async function fetchBanners(params?: { position?: string; isActive?: boolean; search?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.position) query.set('position', params.position);
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.search) query.set('search', params.search);
  return adminFetch<any>(`/api/banners?${query.toString()}`);
}

export async function fetchBannerById(id: string): Promise<any> {
  return adminFetch<any>(`/api/banners/${id}`);
}

export async function createBanner(data: any): Promise<any> {
  return adminFetch<any>('/api/banners', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBanner(id: string, data: any): Promise<any> {
  return adminFetch<any>(`/api/banners/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBanner(id: string): Promise<any> {
  return adminFetch<any>(`/api/banners/${id}`, { method: 'DELETE' });
}

// Reviews
export async function fetchReviews(params?: {
  productId?: string;
  status?: string;
  search?: string;
  rating?: number;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.productId) query.set('productId', params.productId);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.rating) query.set('rating', String(params.rating));
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return adminFetch<any>(`/api/reviews?${query.toString()}`);
}

export async function updateReviewStatus(id: string, status: string): Promise<any> {
  return adminFetch<any>(`/api/reviews/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function deleteReview(id: string): Promise<any> {
  return adminFetch<any>(`/api/reviews/${id}`, { method: 'DELETE' });
}

// Staff
export async function fetchStaff(params?: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.role) query.set('role', params.role);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return adminFetch<any>(`/api/staff?${query.toString()}`);
}

export async function fetchStaffById(id: string): Promise<any> {
  return adminFetch<any>(`/api/staff/${id}`);
}

export async function createStaff(data: {
  fullName: string;
  phone: string;
  email?: string;
  role?: string;
  password: string;
}): Promise<any> {
  return adminFetch<any>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStaff(id: string, data: {
  fullName?: string;
  phone?: string;
  email?: string;
  role?: string;
  status?: string;
  password?: string;
}): Promise<any> {
  return adminFetch<any>(`/api/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function toggleStaffStatus(id: string): Promise<any> {
  return adminFetch<any>(`/api/staff/${id}/toggle-status`, {
    method: 'PUT',
  });
}

export async function deleteStaff(id: string): Promise<any> {
  return adminFetch<any>(`/api/staff/${id}`, { method: 'DELETE' });
}

// Delivery
export async function fetchDeliveries(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return adminFetch<any>(`/api/delivery?${query.toString()}`);
}

export async function assignDelivery(orderId: string, shipperId: string): Promise<any> {
  return adminFetch<any>('/api/delivery', {
    method: 'POST',
    body: JSON.stringify({ orderId, shipperId }),
  });
}

export async function updateDeliveryStatus(id: string, status: string): Promise<any> {
  return adminFetch<any>(`/api/delivery/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// Inventory
export async function fetchInventory(params?: {
  productId?: string;
  lowStock?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.productId) query.set('productId', params.productId);
  if (params?.lowStock) query.set('lowStock', 'true');
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return adminFetch<any>(`/api/inventory?${query.toString()}`);
}

export async function fetchInventoryLogs(params?: {
  productId?: string;
  type?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.productId) query.set('productId', params.productId);
  if (params?.type) query.set('type', params.type);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return adminFetch<any>(`/api/inventory/logs?${query.toString()}`);
}

export async function importStock(data: {
  productId: string;
  variantId?: string;
  quantity: number;
  note?: string;
}): Promise<any> {
  return adminFetch<any>('/api/inventory/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function exportStock(data: {
  productId: string;
  variantId?: string;
  quantity: number;
  note?: string;
}): Promise<any> {
  return adminFetch<any>('/api/inventory/export', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adjustStock(data: {
  productId: string;
  variantId?: string;
  newQuantity: number;
  note?: string;
}): Promise<any> {
  return adminFetch<any>('/api/inventory/adjust', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Notifications
export async function fetchNotifications(params?: { page?: number; limit?: number }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return adminFetch<any>(`/api/notifications?${query.toString()}`);
}

export async function markNotificationRead(id: string): Promise<any> {
  return adminFetch<any>(`/api/notifications/${id}/read`, { method: 'PUT' });
}

// Posts
export async function fetchPosts(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  return adminFetch<any>(`/api/posts?${query.toString()}`);
}

export async function fetchPostById(id: string): Promise<any> {
  return adminFetch<any>(`/api/posts/${id}`);
}

export async function createPost(data: any): Promise<any> {
  return adminFetch<any>('/api/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePost(id: string, data: any): Promise<any> {
  return adminFetch<any>(`/api/posts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deletePost(id: string): Promise<any> {
  return adminFetch<any>(`/api/posts/${id}`, { method: 'DELETE' });
}

// Shipping Zones
export async function fetchShippingZones(params?: {
  isActive?: boolean;
  search?: string;
}): Promise<any> {
  const query = new URLSearchParams();
  if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
  if (params?.search) query.set('search', params.search);
  return adminFetch<any>(`/api/shipping-zones?${query.toString()}`);
}

export async function fetchShippingZoneById(id: string): Promise<any> {
  return adminFetch<any>(`/api/shipping-zones/${id}`);
}

export async function createShippingZone(data: any): Promise<any> {
  return adminFetch<any>('/api/shipping-zones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateShippingZone(id: string, data: any): Promise<any> {
  return adminFetch<any>(`/api/shipping-zones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteShippingZone(id: string): Promise<any> {
  return adminFetch<any>(`/api/shipping-zones/${id}`, { method: 'DELETE' });
}

// Reports
export async function fetchReports(type: string, params?: { startDate?: string; endDate?: string }): Promise<any> {
  const query = new URLSearchParams({ type });
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  return adminFetch<any>(`/api/reports?${query.toString()}`);
}

// Roles / Permissions
export async function fetchRoles(params?: { search?: string; isActive?: string }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.isActive) query.set('isActive', params.isActive);
  return adminFetch<any>(`/api/roles?${query.toString()}`);
}

export async function fetchRoleById(id: string): Promise<any> {
  return adminFetch<any>(`/api/roles/${id}`);
}

export async function fetchPermissions(): Promise<any> {
  return adminFetch<any>('/api/roles/permissions');
}

export async function createRole(data: {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  permissions?: string[];
}): Promise<any> {
  return adminFetch<any>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRole(id: string, data: {
  name?: string;
  description?: string;
  color?: string;
  permissions?: string[];
  isActive?: boolean;
}): Promise<any> {
  return adminFetch<any>(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRole(id: string): Promise<any> {
  return adminFetch<any>(`/api/roles/${id}`, { method: 'DELETE' });
}

// ——— Config API ———
export async function getAllConfigs(group?: string): Promise<any> {
  const params = group ? `?group=${group}` : '';
  return adminFetch<any>(`/api/config${params}`);
}

export async function getPublicConfigs(): Promise<any> {
  return adminFetch<any>('/api/config/public');
}

export async function getConfigByKey(key: string): Promise<any> {
  return adminFetch<any>(`/api/config/${key}`);
}

export async function updateConfig(key: string, data: {
  value: string;
  type?: string;
  group?: string;
  label?: string;
  description?: string;
}): Promise<any> {
  return adminFetch<any>(`/api/config/${key}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function batchUpdateConfigs(items: {
  key: string;
  value: string;
  type?: string;
  group?: string;
  label?: string;
  description?: string;
}[]): Promise<any> {
  return adminFetch<any>('/api/config/batch', {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}

export async function initializeConfigs(): Promise<any> {
  return adminFetch<any>('/api/config/initialize', { method: 'POST' });
}

// ——— Settings ———
export async function fetchSettings(): Promise<any> {
  return adminFetch<any>('/api/settings');
}

export async function updateSettings(data: any): Promise<any> {
  return adminFetch<any>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function fetchPublicSettings(): Promise<any> {
  return adminFetch<any>('/api/settings/public');
}
