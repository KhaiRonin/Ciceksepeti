// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

// ─────────────────────────────────────────────
// Category
// ─────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  _count?: { products: number };
}

export type CategoryTranslations = Record<string, { name: string; description?: string }>;

// ─────────────────────────────────────────────
// Product
// ─────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number | null;
  isDiscountActive?: boolean;
  discountPercent?: number | null;
  discountStartAt?: string | null;
  discountEndAt?: string | null;
  stock: number;
  images?: string[];
  imageUrl?: string;
  categoryId: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export type ProductTranslations = Record<
  string,
  { name: string; description: string }
>;

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryId: string;
  discountPercent?: number;
  discountDays?: number;
  clearDiscount?: boolean;
}

// ─────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

// ─────────────────────────────────────────────
// Order
// ─────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'CANCELED';

export interface OrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
  unitPrice?: number;
}

export interface Order {
  id: string;
  userId: string;
  user?: AuthUser;
  addressId: string;
  address?: Address;
  status: OrderStatus;
  totalPrice: number;
  totalAmount?: number;
  items: OrderItem[];
  giftNote?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryRegion?: 'GIRNE' | 'LEFKOSA' | 'GAZIMAGUSA';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  addressId: string;
  giftNote?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  deliveryRegion?: 'GIRNE' | 'LEFKOSA' | 'GAZIMAGUSA';
}

// ─────────────────────────────────────────────
// Address
// ─────────────────────────────────────────────
export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  country?: string;
  city: string;
  addressLine?: string;
  title?: string;
  district?: string;
  neighbourhood?: string;
  street?: string;
  buildingNo?: string;
  flat?: string;
  postalCode?: string;
  createdAt: string;
}

export interface CreateAddressPayload {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  addressLine: string;
  postalCode: string;
}

// ─────────────────────────────────────────────
// API Response wrapper
// ─────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PaymentSession {
  provider: string;
  orderId: string;
  orderStatus: string;
  paymentReference: string;
  amount: number;
  currency: string;
  ready: boolean;
  iframeToken: string | null;
  iframeUrl: string | null;
  okUrl: string | null;
  failUrl: string | null;
  callbackUrl: string | null;
  message: string;
}
