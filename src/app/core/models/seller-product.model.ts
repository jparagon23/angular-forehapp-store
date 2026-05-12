export interface Brand { id: number; name: string; }
export interface BrandLine { id: number; name: string; }
export interface Category { id: number; name: string; }
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
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
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
  title: string;
  description?: string;
  brand: string;
  line?: string;
  category: string;
  status: ProductStatus;
  createdAt: string;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface CreateProductRequest {
  title: string;
  description?: string;
  brandId: number;
  lineId?: number;
  categoryId: number;
}

export interface CreateVariantRequest {
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributeValueIds: number[];
}

export interface InventoryRequest {
  quantity: number;
  reason: 'RESTOCK' | 'RETURN' | 'ADJUSTMENT';
}
