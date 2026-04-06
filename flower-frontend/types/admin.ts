// ─── Admin-specific extended types ──────────────────────────────────────────

// Prisma OrderStatus enum (UPPERCASE - server-side values)
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELED';

export type UserRole = 'user' | 'admin';

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  activeVisitors?: number;
  revenueGrowth?: number;
  ordersGrowth?: number;
  customersGrowth?: number;
  pendingOrders: number;
  lowStockProducts: number;
  soonEndingDiscounts?: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  images?: string[];
  totalSold: number;
  revenue: number;
  stock: number;
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: string;           // Decimal comes as string from backend
  discountPercent?: string | null;
  discountStartAt?: string | null;
  discountEndAt?: string | null;
  stock: number;
  images: string[];
  categoryId: string;
  category?: { id: string; name: string; createdAt: string };
  createdAt: string;
  _count?: { orderItems: number };
}

export interface AdminCategory {
  id: string;
  name: string;
  imageUrl?: string | null;
  createdAt: string;
  _count?: { products: number };
}

export interface AdminOrder {
  id: string;
  userId: string;
  totalPrice: string;      // Decimal comes as string
  status: OrderStatus;
  giftNote?: string;
  deliveryRegion?: 'GIRNE' | 'LEFKOSA' | 'GAZIMAGUSA';
  deliveryDate?: string;
  deliveryTime?: string;
  addressId: string;
  createdAt: string;
  user: { id: string; name: string; email: string; role: UserRole; createdAt: string; updatedAt: string };
  address: AdminAddress;
  items: AdminOrderItem[];
}

export interface AdminOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string;           // Decimal
  product?: { id: string; name: string; images: string[] };
}

export interface AdminAddress {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  addressLine: string;
  postalCode: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  _count?: { orders: number };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  images?: string[];
  discountPercent?: number;
  discountDays?: number;
  clearDiscount?: boolean;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface CreateCategoryPayload {
  name: string;
  imageUrl?: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}

export interface DashboardData {
  stats: AdminStats;
  revenueChart: RevenueDataPoint[];
  recentOrders: AdminOrder[];
  topProducts: TopProduct[];
  lowStockProducts: AdminProduct[];
}

export type ChartPeriod = 'daily' | 'weekly' | 'monthly';

// ─── Kupon ───────────────────────────────────────────────────────────────────
export type CouponType = 'PERCENTAGE' | 'FIXED';

export interface AdminCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: string;        // Decimal as string
  minOrder: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponPayload {
  code: string;
  type: CouponType;
  value: number;
  minOrder?: number;
  maxUses?: number;
  isActive: boolean;
  expiresAt?: string;
  description?: string;
}

// ─── Yorum ───────────────────────────────────────────────────────────────────
export interface AdminReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { id: string; name: string; images: string[] };
  user: { id: string; name: string; email: string };
}

// ─── Banner ───────────────────────────────────────────────────────────────────
export interface AdminBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBannerPayload {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ─── Not Şablonları ─────────────────────────────────────────────────────────
export type GiftNoteRecipientType =
  | 'SEVGILI'
  | 'ANNE'
  | 'BABA'
  | 'ES'
  | 'ARKADAS'
  | 'OGRETMEN'
  | 'KARDES'
  | 'DIGER';

export interface AdminGiftNoteTemplate {
  id: string;
  recipientType: GiftNoteRecipientType | string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGiftNoteTemplatePayload {
  recipientType: GiftNoteRecipientType | string;
  content: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ─── Loglar ──────────────────────────────────────────────────────────────────
export type AdminLogLevel = 'info' | 'warn' | 'error' | 'success';

export interface AdminLogEntry {
  id: string;
  level: AdminLogLevel;
  message: string;
  details?: string;
  user?: string;
  ip?: string;
  createdAt: string;
}

// ─── İade ────────────────────────────────────────────────────────────────────
export type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface AdminReturn {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: ReturnStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  order: { id: string; totalPrice: string; status: OrderStatus; createdAt: string };
  user: { id: string; name: string; email: string };
}

// ─── Rapor ───────────────────────────────────────────────────────────────────
export interface ReportTopProduct {
  id: string;
  name: string;
  images: string[];
  totalSold: number;
  revenue: number;
}

export interface ReportTopCustomer {
  id: string;
  name: string;
  email: string;
  orderCount: number;
  totalSpent: number;
}

export interface AdminReport {
  totalRevenue: number;
  totalOrders: number;
  byStatus: Record<string, number>;
  topProducts: ReportTopProduct[];
  topCustomers: ReportTopCustomer[];
}

export interface AdminZReportHourlySale {
  hour: string;
  orderCount: number;
  total: number;
}

export interface AdminZReportTopProduct {
  id: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface AdminZReport {
  reportPeriod: 'daily' | 'weekly' | 'monthly';
  reportDate: string;
  generatedAt: string;
  openingTime: string;
  closingTime: string;
  totalOrders: number;
  successfulOrders: number;
  canceledOrders: number;
  grossRevenue: number;
  canceledRevenue: number;
  netRevenue: number;
  averageBasket: number;
  statusBreakdown: Record<string, number>;
  hourlySales: AdminZReportHourlySale[];
  topProducts: AdminZReportTopProduct[];
}
