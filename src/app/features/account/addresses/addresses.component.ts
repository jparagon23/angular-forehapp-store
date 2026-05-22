import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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

  // ── Address list filter ────────────────────────────────────────
  protected allAddresses = toSignal(this.addresses$, { initialValue: [] as Address[] });
  searchTerm             = signal('');
  filteredAddresses      = computed(() => {
    const q = this.searchTerm().toLowerCase().trim();
    if (!q) return this.allAddresses();
    return this.allAddresses().filter(a =>
      a.alias?.toLowerCase().includes(q) ||
      a.street.toLowerCase().includes(q) ||
      a.city.name.toLowerCase().includes(q) ||
      a.state.name.toLowerCase().includes(q) ||
      a.country.name.toLowerCase().includes(q) ||
      (a.zipCode?.toLowerCase().includes(q) ?? false)
    );
  });

  showModal             = false;
  modalMode: ModalMode  = 'create';
  editingId: number | null      = null;
  deleteTargetId: number | null = null;

  // ── Location cascade (raw data) ────────────────────────────────
  countries = signal<Country[]>([]);
  states    = signal<State[]>([]);
  cities    = signal<City[]>([]);
  countryId = signal<number | null>(null);
  stateId   = signal<number | null>(null);

  // ── Searchable dropdown state ──────────────────────────────────
  countrySearch = signal('');
  stateSearch   = signal('');
  citySearch    = signal('');

  selectedCountryName = signal('');
  selectedStateName   = signal('');
  selectedCityName    = signal('');

  showCountryDrop = signal(false);
  showStateDrop   = signal(false);
  showCityDrop    = signal(false);

  filteredCountries = computed(() => {
    const q = this.countrySearch().toLowerCase().trim();
    if (!q) return this.countries();
    return this.countries().filter(c => c.name.toLowerCase().includes(q));
  });

  filteredStates = computed(() => {
    const q = this.stateSearch().toLowerCase().trim();
    if (!q) return this.states();
    return this.states().filter(s => s.name.toLowerCase().includes(q));
  });

  filteredCities = computed(() => {
    const q = this.citySearch().toLowerCase().trim();
    if (!q) return this.cities();
    return this.cities().filter(c => c.name.toLowerCase().includes(q));
  });

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

  // ── Searchable dropdown handlers ───────────────────────────────

  onCountryFocus() {
    this.countrySearch.set('');
    this.showCountryDrop.set(true);
  }

  selectCountry(c: Country) {
    this.countryId.set(c.id);
    this.selectedCountryName.set(c.name);
    this.countrySearch.set('');
    this.showCountryDrop.set(false);

    this.stateId.set(null);
    this.states.set([]);
    this.cities.set([]);
    this.selectedStateName.set('');
    this.selectedCityName.set('');
    this.stateSearch.set('');
    this.citySearch.set('');
    this.form.patchValue({ cityId: null });

    this.locationService.getStates(c.id).subscribe(ss => this.states.set(ss));
  }

  onStateFocus() {
    if (!this.countryId()) return;
    this.stateSearch.set('');
    this.showStateDrop.set(true);
  }

  selectState(s: State) {
    this.stateId.set(s.id);
    this.selectedStateName.set(s.name);
    this.stateSearch.set('');
    this.showStateDrop.set(false);

    this.cities.set([]);
    this.selectedCityName.set('');
    this.citySearch.set('');
    this.form.patchValue({ cityId: null });

    this.locationService.getCities(s.id).subscribe(cs => this.cities.set(cs));
  }

  onCityFocus() {
    if (!this.stateId()) return;
    this.citySearch.set('');
    this.showCityDrop.set(true);
  }

  selectCity(c: City) {
    this.form.patchValue({ cityId: c.id });
    this.selectedCityName.set(c.name);
    this.citySearch.set('');
    this.showCityDrop.set(false);
  }

  // ── Modal ──────────────────────────────────────────────────────

  openCreate() {
    this.modalMode = 'create';
    this.editingId = null;
    this.countryId.set(null);
    this.stateId.set(null);
    this.states.set([]);
    this.cities.set([]);
    this.selectedCountryName.set('');
    this.selectedStateName.set('');
    this.selectedCityName.set('');
    this.countrySearch.set('');
    this.stateSearch.set('');
    this.citySearch.set('');
    this.showCountryDrop.set(false);
    this.showStateDrop.set(false);
    this.showCityDrop.set(false);
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

    this.selectedCountryName.set(address.country.name);
    this.selectedStateName.set(address.state.name);
    this.selectedCityName.set(address.city.name);
    this.countrySearch.set('');
    this.stateSearch.set('');
    this.citySearch.set('');
    this.showCountryDrop.set(false);
    this.showStateDrop.set(false);
    this.showCityDrop.set(false);

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
    this.showCountryDrop.set(false);
    this.showStateDrop.set(false);
    this.showCityDrop.set(false);
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
