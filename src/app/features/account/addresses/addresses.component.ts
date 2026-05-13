import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { take } from 'rxjs';
import { selectIsLoggedIn } from '../../../store/auth/auth.selectors';
import {
  selectAllAddresses, selectAddressesLoading, selectAddressesSaving, selectAddressCount,
} from '../../../store/addresses/addresses.selectors';
import {
  loadAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress,
} from '../../../store/addresses/addresses.actions';
import { Address } from '../../../core/models/address.model';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink, ReactiveFormsModule, NavbarComponent],
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.scss',
})
export class AddressesComponent implements OnInit {
  private store  = inject(Store);
  private router = inject(Router);
  private fb     = inject(FormBuilder);

  addresses$   = this.store.select(selectAllAddresses);
  loading$     = this.store.select(selectAddressesLoading);
  saving$      = this.store.select(selectAddressesSaving);
  count$       = this.store.select(selectAddressCount);
  isLoggedIn$  = this.store.select(selectIsLoggedIn);

  showModal     = false;
  modalMode: ModalMode = 'create';
  editingId: number | null = null;
  deleteTargetId: number | null = null;

  form = this.fb.group({
    alias:   [''],
    street:  ['', [Validators.required, Validators.maxLength(255)]],
    city:    ['', [Validators.required, Validators.maxLength(100)]],
    state:   [''],
    country: ['', [Validators.required, Validators.maxLength(100)]],
    zipCode: [''],
    isDefault: [false],
  });

  ngOnInit() {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) this.router.navigate(['/login'], { queryParams: { redirect: '/account/addresses' } });
      else this.store.dispatch(loadAddresses());
    });
  }

  openCreate() {
    this.modalMode = 'create';
    this.editingId = null;
    this.form.reset({ alias: '', street: '', city: '', state: '', country: '', zipCode: '', isDefault: false });
    this.showModal = true;
  }

  openEdit(address: Address) {
    this.modalMode = 'edit';
    this.editingId = address.id;
    this.form.patchValue({
      alias:   address.alias   ?? '',
      street:  address.street,
      city:    address.city,
      state:   address.state   ?? '',
      country: address.country,
      zipCode: address.zipCode ?? '',
    });
    this.form.get('isDefault')?.disable();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingId = null;
    this.form.get('isDefault')?.enable();
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();

    if (this.modalMode === 'create') {
      this.store.dispatch(createAddress({
        req: {
          alias:     v.alias     || undefined,
          street:    v.street!,
          city:      v.city!,
          state:     v.state     || undefined,
          country:   v.country!,
          zipCode:   v.zipCode   || undefined,
          isDefault: v.isDefault ?? false,
        },
      }));
    } else if (this.editingId !== null) {
      this.store.dispatch(updateAddress({
        id:  this.editingId,
        req: {
          alias:   v.alias   || undefined,
          street:  v.street  || undefined,
          city:    v.city    || undefined,
          state:   v.state   || undefined,
          country: v.country || undefined,
          zipCode: v.zipCode || undefined,
        },
      }));
    }

    this.saving$.pipe(take(2)).subscribe(saving => {
      if (!saving) this.closeModal();
    });
  }

  confirmDelete(id: number) {
    this.deleteTargetId = id;
  }

  cancelDelete() {
    this.deleteTargetId = null;
  }

  doDelete() {
    if (this.deleteTargetId !== null) {
      this.store.dispatch(deleteAddress({ id: this.deleteTargetId }));
      this.deleteTargetId = null;
    }
  }

  setDefault(id: number) {
    this.store.dispatch(setDefaultAddress({ id }));
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c.touched);
  }
}
