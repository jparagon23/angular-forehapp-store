export interface ProductVariations {
  sizes?: string[];
  colors?: string[];
}

export interface DetailVariantAttribute { id: number; attribute: string; value: string; }

export interface DetailVariant {
  id: number;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  attributes: DetailVariantAttribute[];
}

export interface ProductImage { id: number; url: string; displayOrder: number; }

export interface ProductStore {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface Product {
  id: number;
  emoji: string;
  image: string;
  images?: ProductImage[];
  brand: string;
  name: string;
  desc: string;
  price: number;
  compareAtPrice?: number | null;
  cat: string;
  stock: number;
  status: 'Activo' | 'Borrador' | 'Agotado';
  freeShipping?: boolean;
  variations?: ProductVariations;
  variants?: DetailVariant[];
  store?: ProductStore;
  tags?: string[];
}
