export interface Brand { id: number; name: string; }
export interface BrandLine { id: number; name: string; categoryId: number; }
export interface Category { id: number; name: string; }
export interface AdminCategory { id: number; name: string; sortOrder: number; }
export interface Attribute { id: number; name: string; }
export interface AttributeValue { id: number; description: string; }

export interface CategoryAttribute {
  attributeId: number;
  name: string;
  required: boolean;
  values: AttributeValue[];
}

export interface VariantAttribute { id: number; attribute: string; value: string; }

export interface ProductVariant {
  id: number;
  sku: string | null;
  price: number;
  compareAtPrice?: number;
  stock: number;
  active: boolean;
  attributes: VariantAttribute[];
}

export interface ProductImage {
  id: number;
  productId: number;
  url: string;
  displayOrder: number;
  createdAt: string;
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface SellerProduct {
  id: number;
  storeId: number;
  storeName: string;
  title: string;
  description?: string;
  brand: string;
  line?: string;
  category: string;
  status: ProductStatus;
  createdAt: string;
  variantCount: number;
  thumbnailUrl?: string | null;
  freeShipping: boolean;
}

export interface SellerProductDetail extends SellerProduct {
  variants: ProductVariant[];
  images: ProductImage[];
  tags?: string[];
}

export interface CreateProductRequest {
  title: string;
  description?: string;
  brandId: number;
  lineId?: number;
  categoryId: number;
  freeShipping?: boolean;
}

export interface CreateVariantRequest {
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributeValueIds: number[];
}

export interface UpdateVariantRequest {
  price?: number;
  compareAtPrice?: number;
  clearCompareAtPrice?: boolean;
}

export interface InventoryRequest {
  quantity: number;
  reason: 'RESTOCK' | 'RETURN' | 'ADJUSTMENT';
}

export type MovementReason = 'RESTOCK' | 'RETURN' | 'ADJUSTMENT' | 'SALE';

export interface InventoryMovement {
  id: number;
  quantity: number;
  reason: MovementReason;
  createdAt: string;
}

export interface MovementsPage {
  content: InventoryMovement[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}
