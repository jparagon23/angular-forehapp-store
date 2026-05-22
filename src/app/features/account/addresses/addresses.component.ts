import { Component, inject, OnInit, signal } from '@angular/core';
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
import { City, Country, State } from '../../../core/models/location.model';
import { LocationService } from '../../../core/services/location.service';
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
  private store           = inject(Store);
  private router          = inject(Router);
  private fb              = inject(FormBuilder);
  private locationService = inject(LocationService);

  addresses$  = this.store.select(selectAllAddresses);
  loading$    = this.store.select(selectAddressesLoading);
  saving$     = this.store.select(selectAddressesSaving);
  count$      = this.store.select(selectAddressCount);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);

  showModal             = false;
  modalMode: ModalMode  = 'create';
  editingId: number | null     = null;
  deleteTargetId: number | null = null;

  // Location cascade
  countries = signal<Country[]>([]);
  states    = signal<State[]>([]);
  cities    = signal<City[]>([]);
  countryId = signal<number | null>(null);
  stateId   = signal<number | null>(null);

  form = this.fb.group({
    alias:     [''],
    street:    ['', [Validators.required, Validators.maxLength(255)]],
    cityId:    [null as number | null, Validators.required],
    zipCode:   [''],
    isDefault: [false],
  });

  ngOnInit() {
    this.isLoggedIn$.pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) this.router.navigate(['/login'], { queryParams: { redirect: '/account/addresses' } });
      else this.store.dispatch(loadAddresses());
    });
    this.locationService.getCountries().subscribe(cs => this.countries.set(cs));
  }

  onCountryChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.countryId.set(id);
    this.stateId.set(null);
    this.states.set([]);
    this.cities.set([]);
    this.form.patchValue({ cityId: null });
    if (id) this.locationService.getStates(id).subscribe(ss => this.states.set(ss));
  }

  onStateChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.stateId.set(id);
    this.cities.set([]);
    this.form.patchValue({ cityId: null });
    if (id) this.locationService.getCities(id).subscribe(cs => this.cities.set(cs));
  }

  onCityChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.form.patchValue({ cityId: id });
  }

  openCreate() {
    this.modalMode = 'create';
    this.editingId = null;
    this.countryId.set(null);
    this.stateId.set(null);
    this.states.set([]);
    this.cities.set([]);
    this.form.reset({ alias: '', street: '', cityId: null, zipCode: '', isDefault: false });
    this.showModal = true;
  }

  openEdit(address: Address) {
    this.modalMode = 'edit';
    this.editingId = address.id;
    this.form.reset({
      alias:     address.alias   ?? '',
      street:    address.street,
      cityId:    address.city.id,
      zipCode:   address.zipCode ?? '',
      isDefault: false,
    });
    this.form.get('isDefault')?.disable();

    // Pre-load cascade from the nested address objects
    const cId = address.country.id;
    const sId = address.state.id;
    this.countryId.set(cId);
    this.locationService.getStates(cId).subscribe(ss => {
      this.states.set(ss);
      this.stateId.set(sId);
      this.locationService.getCities(sId).subscribe(cs => this.cities.set(cs));
    });

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
          alias:     v.alias   || undefined,
          street:    v.street!,
          cityId:    v.cityId!,
          zipCode:   v.zipCode || undefined,
          isDefault: v.isDefault ?? false,
        },
      }));
    } else if (this.editingId !== null) {
      this.store.dispatch(updateAddress({
        id:  this.editingId,
        req: {
          alias:   v.alias   || undefined,
          street:  v.street  || undefined,
          cityId:  v.cityId  ?? undefined,
          zipCode: v.zipCode || undefined,
        },
      }));
    }

    this.saving$.pipe(take(2)).subscribe(saving => {
      if (!saving) this.closeModal();
    });
  }

  confirmDelete(id: number) { this.deleteTargetId = id; }
  cancelDelete()            { this.deleteTargetId = null; }

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
