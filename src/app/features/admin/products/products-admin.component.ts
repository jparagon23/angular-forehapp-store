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

  ngOnInit() { this.store.dispatch(loadProducts()); }

  filtered(products: Product[] | null): Product[] {
    if (!products) return [];
    const q = this.filter().toLowerCase();
    return q ? products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)) : products;
  }

  openNew() {
    this.editing.set(null);
    this.form = { name: '', brand: '', cat: 'Raquetas', price: 0, stock: 0, emoji: '🎾', desc: '', status: 'Activo' };
    this.modalOpen.set(true);
  }

  openEdit(p: Product) {
    this.editing.set(p);
    this.form = { name: p.name, brand: p.brand, cat: p.cat, price: p.price, stock: p.stock, emoji: p.emoji, desc: p.desc, status: p.status };
    this.modalOpen.set(true);
  }

  save() {
    const ed = this.editing();
    if (ed) {
      this.store.dispatch(updateProduct({ product: { ...ed, ...this.form } }));
    } else {
      this.store.dispatch(createProduct({ product: { ...this.form } as Omit<Product, 'id'> }));
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
}
