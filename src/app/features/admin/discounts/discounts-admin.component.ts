import { Component, inject, OnInit, signal } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { loadDiscounts, createDiscount, toggleDiscount, deleteDiscount } from '../../../store/discounts/discounts.actions';
import { selectAllDiscounts } from '../../../store/discounts/discounts.selectors';
import { Discount } from '../../../core/models/discount.model';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';

@Component({
  selector: 'app-discounts-admin',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, FormsModule, AdminTopbarComponent],
  templateUrl: './discounts-admin.component.html',
  styleUrl: './discounts-admin.component.scss',
})
export class DiscountsAdminComponent implements OnInit {
  private store = inject(Store);
  discounts$ = this.store.select(selectAllDiscounts);
  modalOpen = signal(false);
  form = { code: '', type: '%' as '%' | 'COP', val: 0, scope: 'Toda la tienda', uses: 100 };
  readonly scopes = ['Toda la tienda', 'Raquetas', 'Zapatillas', 'Ropa', 'Accesorios'];

  ngOnInit() { this.store.dispatch(loadDiscounts()); }

  save() {
    const d: Discount = { ...this.form, used: 0, from: '28/04/2026', to: '28/05/2026', active: true };
    this.store.dispatch(createDiscount({ discount: d }));
    this.modalOpen.set(false);
  }

  toggle(code: string) { this.store.dispatch(toggleDiscount({ code })); }

  delete(code: string) {
    if (confirm('¿Eliminar cupón?')) this.store.dispatch(deleteDiscount({ code }));
  }
}
