import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { loadProducts, createProduct, updateProduct, deleteProduct } from '../../../store/products/products.actions';
import { selectAllProducts } from '../../../store/products/products.selectors';
import { Product } from '../../../core/models/product.model';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-products-admin',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, FormsModule, AdminTopbarComponent, CurrencyCopPipe],
  templateUrl: './products-admin.component.html',
  styleUrl: './products-admin.component.scss',
})
export class ProductsAdminComponent implements OnInit {
  private store = inject(Store);
  products$ = this.store.select(selectAllProducts);
  filter = signal('');
  modalOpen = signal(false);
  editing = signal<Product | null>(null);

  form = { name: '', brand: '', cat: 'Raquetas', price: 0, stock: 0, emoji: '🎾', desc: '', status: 'Activo' as Product['status'] };
  readonly cats = ['Raquetas', 'Zapatillas', 'Ropa', 'Accesorios', 'Pelotas'];

  formSizes  = signal<string[]>([]);
  formColors = signal<string[]>([]);
  newColor   = '';

  readonly CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  readonly SHOE_SIZES     = ['35','36','37','38','39','40','41','42','43','44','45'];

  ngOnInit() { this.store.dispatch(loadProducts({})); }

  filtered(products: Product[] | null): Product[] {
    if (!products) return [];
    const q = this.filter().toLowerCase();
    return q ? products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)) : products;
  }

  openNew() {
    this.editing.set(null);
    this.form = { name: '', brand: '', cat: 'Raquetas', price: 0, stock: 0, emoji: '🎾', desc: '', status: 'Activo' };
    this.formSizes.set([]);
    this.formColors.set([]);
    this.newColor = '';
    this.modalOpen.set(true);
  }

  openEdit(p: Product) {
    this.editing.set(p);
    this.form = { name: p.name, brand: p.brand, cat: p.cat, price: p.price, stock: p.stock, emoji: p.emoji, desc: p.desc, status: p.status };
    this.formSizes.set([...(p.variations?.sizes ?? [])]);
    this.formColors.set([...(p.variations?.colors ?? [])]);
    this.newColor = '';
    this.modalOpen.set(true);
  }

  toggleSize(s: string) {
    this.formSizes.update(sizes =>
      sizes.includes(s) ? sizes.filter(x => x !== s) : [...sizes, s]
    );
  }

  addColor() {
    const c = this.newColor.trim();
    if (!c || this.formColors().includes(c)) { this.newColor = ''; return; }
    this.formColors.update(cols => [...cols, c]);
    this.newColor = '';
  }

  removeColor(c: string) {
    this.formColors.update(cols => cols.filter(x => x !== c));
  }

  save() {
    const sizes  = this.formSizes();
    const colors = this.formColors();
    const variations: Product['variations'] = {};
    if (sizes.length)  variations.sizes  = sizes;
    if (colors.length) variations.colors = colors;

    const ed = this.editing();
    const base = {
      ...this.form,
      image: ed?.image ?? '',
      ...(Object.keys(variations).length ? { variations } : { variations: undefined }),
    };

    if (ed) {
      this.store.dispatch(updateProduct({ product: { ...ed, ...base } }));
    } else {
      this.store.dispatch(createProduct({ product: base as Omit<Product, 'id'> }));
    }
    this.modalOpen.set(false);
  }

  delete(id: number) {
    if (confirm('¿Eliminar este producto?')) {
      this.store.dispatch(deleteProduct({ id }));
    }
  }

  stockClass(n: number): string {
    if (n === 0) return 'stock-out';
    if (n <= 5)  return 'stock-low';
    return 'stock-ok';
  }

  variationsSummary(p: Product): string {
    const parts: string[] = [];
    if (p.variations?.sizes?.length)  parts.push(`${p.variations.sizes.length} tallas`);
    if (p.variations?.colors?.length) parts.push(`${p.variations.colors.length} colores`);
    return parts.join(' · ') || '—';
  }
}
