import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  changeSellerProductStatus,
  deleteSellerProduct,
  loadSellerProducts,
} from '../../../store/seller/seller.actions';
import {
  selectSellerError,
  selectSellerLoading,
  selectSellerProducts,
} from '../../../store/seller/seller.selectors';
import { ProductStatus } from '../../../core/models/seller-product.model';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.scss',
})
export class SellerProductsComponent implements OnInit {
  private store = inject(Store);

  products$ = this.store.select(selectSellerProducts);
  loading$  = this.store.select(selectSellerLoading);
  error$    = this.store.select(selectSellerError);

  ngOnInit() { this.store.dispatch(loadSellerProducts()); }

  statusLabel(s: ProductStatus): string {
    const map: Record<ProductStatus, string> = {
      DRAFT: 'Borrador', ACTIVE: 'Activo', INACTIVE: 'Inactivo', OUT_OF_STOCK: 'Sin stock',
    };
    return map[s];
  }

  statusClass(s: ProductStatus): string {
    const map: Record<ProductStatus, string> = {
      DRAFT: 'status-draft', ACTIVE: 'status-active',
      INACTIVE: 'status-inactive', OUT_OF_STOCK: 'status-out',
    };
    return map[s];
  }

  minPrice(variants: { price: number }[]): number {
    if (!variants.length) return 0;
    return Math.min(...variants.map(v => v.price));
  }

  delete(id: number) {
    if (confirm('¿Eliminar este producto? Solo se pueden eliminar borradores.')) {
      this.store.dispatch(deleteSellerProduct({ id }));
    }
  }

  publish(id: number)    { this.store.dispatch(changeSellerProductStatus({ id, action: 'publish' })); }
  deactivate(id: number) { this.store.dispatch(changeSellerProductStatus({ id, action: 'deactivate' })); }
  activate(id: number)   { this.store.dispatch(changeSellerProductStatus({ id, action: 'activate' })); }
}
