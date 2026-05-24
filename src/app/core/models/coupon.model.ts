export type DiscountType = 'PORCENTAJE' | 'MONTO_FIJO';
export type CouponStatus = 'ACTIVA' | 'INACTIVA';

export interface CouponResponse {
  couponId: number;
  storeId: number;
  storeName: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usesCount: number;
  maxUsesPerUser: number;
  validFrom: string;
  validUntil: string | null;
  status: CouponStatus;
  createdAt: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  couponId: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
  message: string;
}

export interface ValidateCouponRequest {
  code: string;
  storeId: number;
  orderAmount: number;
}

export interface RedeemCouponRequest {
  code: string;
  storeId: number;
  orderAmount: number;
  orderId?: number;
}

export interface CreateCouponRequest {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxUsesPerUser: number;
  validFrom: string;
  validUntil?: string;
}

export interface UpdateCouponRequest {
  description?: string;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  validUntil?: string | null;
  status?: CouponStatus;
}

export interface CouponPageResponse {
  content: CouponResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AppliedCoupon {
  storeId: number;
  code: string;
  discountAmount: number;
  finalAmount: number;
  discountType: DiscountType;
  discountValue: number;
}
