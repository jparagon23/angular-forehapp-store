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
  /** Unidades que la tienda tiene de verdad. */
  stock: number;
  /** Lo que falte de stock propio lo despacha el proveedor. */
  dropship?: boolean;
  /** El proveedor lo tiene ahora (solo cuenta con dropship). */
  supplierAvailable?: boolean;
  /** Activa y con stock propio o del proveedor. */
  sellable?: boolean;
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
  dropship?: boolean;
  supplierAvailable?: boolean;
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
  dropship?: boolean;
  supplierAvailable?: boolean;
}

// ── Despacho: stock propio vs dropshipping ──────────────────────────────────

/** Cómo se despacha una variante; en el back son dos campos (dropship + supplierAvailable). */
export type FulfillmentMode = 'OWN' | 'DROPSHIP' | 'DROPSHIP_OUT';

export const FULFILLMENT_OPTIONS: { value: FulfillmentMode; label: string; hint: string }[] = [
  { value: 'OWN',          label: 'Solo stock propio',            hint: 'Se vende solo lo que tienes en bodega.' },
  { value: 'DROPSHIP',     label: 'Dropship – proveedor tiene',   hint: 'Primero tu stock; lo que falte lo despacha el proveedor.' },
  { value: 'DROPSHIP_OUT', label: 'Dropship – proveedor agotado', hint: 'Solo se vende tu stock hasta que el proveedor vuelva a tener.' },
];

export function fulfillmentOf(v: Pick<ProductVariant, 'dropship' | 'supplierAvailable'>): FulfillmentMode {
  if (!v.dropship) return 'OWN';
  return v.supplierAvailable === false ? 'DROPSHIP_OUT' : 'DROPSHIP';
}

/** "Solo stock propio" no toca la disponibilidad del proveedor (la sincronización la sigue llevando). */
export function fulfillmentFlags(mode: FulfillmentMode): { dropship: boolean; supplierAvailable?: boolean } {
  if (mode === 'OWN') return { dropship: false };
  return { dropship: true, supplierAvailable: mode !== 'DROPSHIP_OUT' };
}

/** Se puede vender: usa el dato del back y, si falta (back anterior), lo calcula. */
export function isSellable(v: ProductVariant): boolean {
  if (v.sellable !== undefined) return v.sellable;
  return v.active && (v.stock > 0 || (!!v.dropship && v.supplierAvailable !== false));
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
