import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { loadProducts, updateStock } from '../../../store/products/products.actions';
import { selectAllProducts, selectLowStockProducts } from '../../../store/products/products.selectors';
import { Product } from '../../../core/models/product.model';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, FormsModule, AdminTopbarComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  private store = inject(Store);
  products$ = this.store.select(selectAllProducts);
  lowStock$ = this.store.select(selectLowStockProducts);
  modalOpen = signal(false);
  adjustingProduct = signal<Product | null>(null);
  newStock = signal(0);
  readonly reasons = ['Reposición de proveedor','Corrección de inventario','Devolución de cliente','Merma / daño','Otro'];

  ngOnInit() { this.store.dispatch(loadProducts({})); }

  openModal(p: Product) {
    this.adjustingProduct.set(p);
    this.newStock.set(p.stock);
    this.modalOpen.set(true);
  }

  apply() {
    const p = this.adjustingProduct();
    if (p) this.store.dispatch(updateStock({ id: p.id, stock: this.newStock() }));
    this.modalOpen.set(false);
  }

  stockClass(n: number): string {
    if (n === 0) return 'stock-out';
    if (n <= 5)  return 'stock-low';
    return 'stock-ok';
  }
}
