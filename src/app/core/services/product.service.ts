import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Product } from '../models/product.model';
import { Review } from '../models/review.model';

const MOCK_PRODUCTS: Product[] = [
  { id: 1,  emoji: '🎾', brand: 'Wilson',  name: 'Pro Staff RF97',          desc: 'La raqueta favorita de Roger Federer. Control y potencia supremos.',              cat: 'Raquetas',   price: 320000, stock: 14, status: 'Activo' },
  { id: 2,  emoji: '🎾', brand: 'Babolat', name: 'Pure Aero 2024',          desc: 'Diseñada para generar máximo topspin. Usada por Rafael Nadal.',                  cat: 'Raquetas',   price: 295000, stock: 8,  status: 'Activo' },
  { id: 3,  emoji: '🎾', brand: 'Head',    name: 'Speed MP 2024',           desc: 'Equilibrio perfecto entre velocidad y control. Favorita de Djokovic.',           cat: 'Raquetas',   price: 310000, stock: 11, status: 'Activo' },
  { id: 4,  emoji: '🥿', brand: 'Nike',    name: 'Air Zoom Vapor 11',       desc: 'Zapatilla ultraligera con amortiguación reactiva para juego rápido.',            cat: 'Zapatillas', price: 180000, stock: 22, status: 'Activo', variations: { sizes: ['35','36','37','38','39','40','41','42','43','44','45'] } },
  { id: 5,  emoji: '🥿', brand: 'Adidas',  name: 'Barricade 2024',          desc: 'Máxima durabilidad y soporte lateral para jugadores de fondo.',                  cat: 'Zapatillas', price: 165000, stock: 17, status: 'Activo', variations: { sizes: ['35','36','37','38','39','40','41','42','43','44','45'] } },
  { id: 6,  emoji: '🥿', brand: 'Asics',   name: 'Gel-Resolution 9',        desc: 'Estabilidad y comodidad excepcional en toda clase de superficies.',              cat: 'Zapatillas', price: 175000, stock: 9,  status: 'Activo', variations: { sizes: ['35','36','37','38','39','40','41','42','43','44','45'] } },
  { id: 7,  emoji: '👕', brand: 'Nike',    name: 'Camiseta Dri-FIT',        desc: 'Tejido de secado rápido con tecnología Dri-FIT. Disponible en varios colores.',  cat: 'Ropa',       price: 85000,  stock: 3,  status: 'Activo', variations: { sizes: ['XS','S','M','L','XL','XXL'], colors: ['Blanco','Negro','Azul Royal','Rojo','Verde'] } },
  { id: 8,  emoji: '🩳', brand: 'Adidas',  name: 'Short Club Stretch',      desc: 'Comodidad y movilidad total. Bolsillos laterales amplios.',                      cat: 'Ropa',       price: 72000,  stock: 6,  status: 'Activo', variations: { sizes: ['XS','S','M','L','XL','XXL'] } },
  { id: 9,  emoji: '🎽', brand: 'Lacoste', name: 'Polo Ultra Dry',          desc: 'Elegancia clásica con tecnología de secado ultra rápido.',                      cat: 'Ropa',       price: 120000, stock: 7,  status: 'Activo', variations: { sizes: ['XS','S','M','L','XL','XXL'], colors: ['Blanco','Navy','Verde Lacoste','Rojo Oscuro'] } },
  { id: 10, emoji: '🔦', brand: 'Wilson',  name: 'Pelotas Extra Duty x3',   desc: 'Pelotas de alta visibilidad ideales para canchas duras. ITF aprobadas.',        cat: 'Pelotas',    price: 28000,  stock: 4,  status: 'Activo' },
  { id: 11, emoji: '🎒', brand: 'Head',    name: 'Mochila Tour Team 2024',  desc: 'Compartimentos para 2 raquetas, ropa y accesorios. Correas ergonómicas.',       cat: 'Accesorios', price: 145000, stock: 12, status: 'Activo' },
  { id: 12, emoji: '🩺', brand: 'Tourna',  name: 'Sobregrip Tack x30',     desc: 'Pack de 30 overgrips tacky. Máxima adherencia y absorción del sudor.',          cat: 'Accesorios', price: 45000,  stock: 2,  status: 'Activo' },
];

const MOCK_REVIEWS: Review[] = [
  { id: 1,  productId: 1,  author: 'Carlos M.',   rating: 5, comment: 'Control y potencia increíbles. Definitivamente se nota por qué es la raqueta de Federer. Vale cada peso invertido.', date: '2026-02-10', verified: true },
  { id: 2,  productId: 1,  author: 'Laura T.',     rating: 4, comment: 'Muy buena raqueta, aunque requiere práctica para dominarla. El brazo no se cansa tanto como esperaba.', date: '2026-01-28', verified: true },
  { id: 3,  productId: 1,  author: 'Diego R.',     rating: 5, comment: 'La uso en torneos locales y me ha dado resultados increíbles. 100% recomendada para jugadores avanzados.', date: '2025-12-05', verified: false },
  { id: 4,  productId: 2,  author: 'Andrés P.',    rating: 5, comment: 'El topspin que genera es brutal. Perfecta para jugar desde el fondo de la cancha con agresividad.', date: '2026-03-01', verified: true },
  { id: 5,  productId: 2,  author: 'María G.',     rating: 4, comment: 'Muy ligera y potente. La recomiendo para jugadores intermedios en adelante. El mango es muy cómodo.', date: '2026-02-14', verified: true },
  { id: 6,  productId: 3,  author: 'Felipe S.',    rating: 5, comment: 'Velocidad de swing increíble. El balance es perfecto y no se cansa el hombro ni en partidos largos.', date: '2026-01-20', verified: true },
  { id: 7,  productId: 3,  author: 'Natalia V.',   rating: 4, comment: 'Gran raqueta para subir a la red. El marco ancho ayuda mucho en los voleos. Muy buena compra.', date: '2026-03-10', verified: false },
  { id: 8,  productId: 4,  author: 'Valentina C.', rating: 5, comment: 'Muy cómodas y el agarre es excelente. Las uso en cancha dura y arcilla sin problema.', date: '2026-03-12', verified: true },
  { id: 9,  productId: 4,  author: 'Julián O.',    rating: 4, comment: 'Buena amortiguación, aunque tuve que acostumbrarme al ajuste del talón. Al final valió la pena.', date: '2026-02-22', verified: false },
  { id: 10, productId: 5,  author: 'Isabel F.',    rating: 5, comment: 'Durabilidad increíble. Ya llevan 6 meses de uso intensivo y siguen prácticamente como nuevas.', date: '2026-02-05', verified: true },
  { id: 11, productId: 5,  author: 'Tomás B.',     rating: 5, comment: 'El soporte lateral es lo mejor que he probado. Cero lesiones en el tobillo desde que las uso.', date: '2026-01-30', verified: true },
  { id: 12, productId: 6,  author: 'Pilar M.',     rating: 4, comment: 'Muy estables en tierra batida. La suela agarra perfecto y no resbala ni en canchas mojadas.', date: '2026-02-18', verified: true },
  { id: 13, productId: 7,  author: 'Sebastián L.', rating: 4, comment: 'La tela Dri-FIT es genial, no se siente el calor en cancha. El tallaje está un poco pequeño.', date: '2026-03-08', verified: true },
  { id: 14, productId: 7,  author: 'Claudia R.',   rating: 5, comment: 'Hermosa camiseta. El estampado no se destiñe después de varios lavados. Muy recomendada.', date: '2026-02-25', verified: false },
  { id: 15, productId: 9,  author: 'Camila R.',    rating: 5, comment: 'El polo más elegante que he comprado. Perfecta relación calidad-precio para un Lacoste.', date: '2026-01-15', verified: true },
  { id: 16, productId: 11, author: 'David M.',     rating: 5, comment: 'Caben perfectamente dos raquetas, ropa y accesorios. Las correas ergonómicas son un plus enorme.', date: '2026-02-28', verified: true },
  { id: 17, productId: 11, author: 'Sara Q.',      rating: 4, comment: 'Muy espaciosa y resistente. Le falta un poco más de acolchado en los tirantes, pero es buena.', date: '2026-01-22', verified: true },
  { id: 18, productId: 12, author: 'Esteban N.',   rating: 5, comment: 'Pack de 30 unidades a excelente precio. La adherencia es superior a otras marcas que he probado.', date: '2026-03-05', verified: true },
];

@Injectable({ providedIn: 'root' })
export class ProductService {
  getProducts(): Observable<Product[]> {
    return of(MOCK_PRODUCTS);
  }

  getProduct(id: number): Observable<Product | undefined> {
    return of(MOCK_PRODUCTS.find(p => p.id === id));
  }

  createProduct(product: Omit<Product, 'id'>): Observable<Product> {
    const newProduct: Product = { ...product, id: Date.now() };
    return of(newProduct);
  }

  updateProduct(product: Product): Observable<Product> {
    return of(product);
  }

  deleteProduct(id: number): Observable<number> {
    return of(id);
  }

  updateStock(id: number, stock: number): Observable<{ id: number; stock: number }> {
    return of({ id, stock });
  }

  getReviews(productId: number): Observable<Review[]> {
    return of(MOCK_REVIEWS.filter(r => r.productId === productId));
  }
}
