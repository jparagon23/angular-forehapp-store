export interface ProductVariations {
  sizes?: string[];
  colors?: string[];
}

export interface Product {
  id: number;
  emoji: string;
  image: string;
  brand: string;
  name: string;
  desc: string;
  price: number;
  cat: string;
  stock: number;
  status: 'Activo' | 'Borrador' | 'Agotado';
  variations?: ProductVariations;
}
