import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { selectActiveSellerStoreId } from '../../../store/seller/seller.selectors';
import { StoreService } from '../../../core/services/store.service';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';

@Component({
  selector: 'app-seller-settings',
  standalone: true,
  imports: [NgIf, FormsModule, CurrencyCopPipe],
  templateUrl: './seller-settings.component.html',
  styleUrl: './seller-settings.component.scss',
})
export class SellerSettingsComponent implements OnInit {
  private ngrx         = inject(Store);
  private storeService = inject(StoreService);

  private storeId = toSignal(this.ngrx.select(selectActiveSellerStoreId), { initialValue: null });

  loading = signal(true);
  saving  = signal(false);
  saved   = signal(false);
  error   = signal<string | null>(null);

  freeShippingMinAmount = signal<number | null>(null);
  inputValue = '';

  ngOnInit() {
    const id = this.storeId();
    if (!id) { this.loading.set(false); return; }
    this.storeService.getStore(id).pipe(take(1)).subscribe({
      next: store => {
        this.freeShippingMinAmount.set(store.freeShippingMinAmount ?? null);
        this.inputValue = store.freeShippingMinAmount != null ? String(store.freeShippingMinAmount) : '';
        this.loading.set(false);
      },
      error: () => { this.error.set('Error al cargar la configuración.'); this.loading.set(false); },
    });
  }

  save() {
    const id = this.storeId();
    if (!id) return;
    const raw = this.inputValue.trim();
    const amount = raw === '' ? null : Number(raw);
    if (raw !== '' && (isNaN(amount!) || amount! < 0)) {
      this.error.set('Ingresa un monto válido mayor o igual a 0.');
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    this.saved.set(false);
    this.storeService.updateStore(id, { freeShippingMinAmount: amount }).pipe(take(1)).subscribe({
      next: store => {
        this.freeShippingMinAmount.set(store.freeShippingMinAmount ?? null);
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3000);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Error al guardar.');
        this.saving.set(false);
      },
    });
  }

  clear() {
    this.inputValue = '';
    this.save();
  }
}
