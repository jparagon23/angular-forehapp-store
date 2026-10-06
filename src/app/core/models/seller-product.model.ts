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
  cost?: number | null;
  margin?: number | null;
  marginPercent?: number | null;
  /** Días que dura una unidad de esta variante; null = hereda del producto. */
  repurchaseDays?: number | null;
}

export interface VariantCostHistory {
  id: number;
  cost: number;
  notes: string | null;
  changedAt: string;
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
  /** Días que dura una unidad antes de recomprar; null = sin recordatorio de recompra. */
  repurchaseDays?: number | null;
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
  repurchaseDays?: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  /** Enviar repurchaseDays: null no borra el valor; hay que usar este flag. */
  clearRepurchaseDays?: boolean;
}

export interface CreateVariantRequest {
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributeValueIds: number[];
  cost?: number;
  costNotes?: string;
  repurchaseDays?: number;
}

export interface UpdateVariantRequest {
  price?: number;
  compareAtPrice?: number;
  clearCompareAtPrice?: boolean;
  cost?: number;
  costNotes?: string;
  clearCost?: boolean;
  repurchaseDays?: number;
  clearRepurchaseDays?: boolean;
}

export interface InventoryRequest {
  quantity: number;
  reason: 'RESTOCK' | 'RETURN' | 'ADJUSTMENT';
}

/** SUPPLIER_SYNC: ajuste automático de la sincronización con el proveedor (no se puede crear a mano). */
export type MovementReason = 'RESTOCK' | 'RETURN' | 'ADJUSTMENT' | 'SALE' | 'SUPPLIER_SYNC';

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
