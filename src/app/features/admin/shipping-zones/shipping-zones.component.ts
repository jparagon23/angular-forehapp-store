import { Component, inject, OnInit, signal } from '@angular/core';
import { NgClass, NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShippingZoneService } from '../../../core/services/shipping-zone.service';
import { LocationService } from '../../../core/services/location.service';
import { ShippingZone } from '../../../core/models/shipping-zone.model';
import { City, Country, State } from '../../../core/models/location.model';

interface SelectedCity { id: number; name: string; }

@Component({
  selector: 'app-shipping-zones',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CurrencyPipe],
  templateUrl: './shipping-zones.component.html',
  styleUrl: './shipping-zones.component.scss',
})
export class ShippingZonesComponent implements OnInit {
  private service  = inject(ShippingZoneService);
  private locSvc   = inject(LocationService);

  zones   = signal<ShippingZone[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);

  // Form state
  formOpen    = signal(false);
  editingId   = signal<number | null>(null);
  formName    = signal('');
  formCost    = signal<number | null>(null);
  formDefault = signal(false);
  formSaving  = signal(false);
  formError   = signal<string | null>(null);

  // City picker (location cascade)
  locCountries  = signal<Country[]>([]);
  locStates     = signal<State[]>([]);
  locCities     = signal<City[]>([]);
  pickerCountry = signal<number | null>(null);
  pickerState   = signal<number | null>(null);
  pickerCity    = signal<number | null>(null);
  formCityIds   = signal<SelectedCity[]>([]);

  ngOnInit() {
    this.load();
    this.locSvc.getCountries().subscribe(cs => this.locCountries.set(cs));
  }

  private load() {
    this.loading.set(true);
    this.service.getZones().subscribe({
      next: z  => { this.zones.set(z); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar las zonas.'); this.loading.set(false); },
    });
  }

  onLocCountryChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.pickerCountry.set(id);
    this.pickerState.set(null);
    this.pickerCity.set(null);
    this.locStates.set([]);
    this.locCities.set([]);
    if (id) this.locSvc.getStates(id).subscribe(ss => this.locStates.set(ss));
  }

  onLocStateChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.pickerState.set(id);
    this.pickerCity.set(null);
    this.locCities.set([]);
    if (id) this.locSvc.getCities(id).subscribe(cs => this.locCities.set(cs));
  }

  onLocCityChange(event: Event) {
    const id = Number((event.target as HTMLSelectElement).value) || null;
    this.pickerCity.set(id);
  }

  addCity() {
    const id = this.pickerCity();
    if (!id) return;
    const city = this.locCities().find(c => c.id === id);
    if (!city) return;
    if (this.formCityIds().some(c => c.id === id)) return;
    this.formCityIds.update(list => [...list, { id: city.id, name: city.name }]);
    this.pickerCity.set(null);
  }

  removeCity(id: number) {
    this.formCityIds.update(list => list.filter(c => c.id !== id));
  }

  private resetPicker() {
    this.pickerCountry.set(null);
    this.pickerState.set(null);
    this.pickerCity.set(null);
    this.locStates.set([]);
    this.locCities.set([]);
  }

  openCreate() {
    this.editingId.set(null);
    this.formName.set('');
    this.formCost.set(null);
    this.formDefault.set(false);
    this.formCityIds.set([]);
    this.formError.set(null);
    this.resetPicker();
    this.formOpen.set(true);
  }

  openEdit(z: ShippingZone) {
    this.editingId.set(z.id);
    this.formName.set(z.name);
    this.formCost.set(z.cost);
    this.formDefault.set(z.isDefault);
    this.formCityIds.set(z.cities.map(c => ({ id: c.id, name: c.name })));
    this.formError.set(null);
    this.resetPicker();
    this.formOpen.set(true);
  }

  closeForm() { this.formOpen.set(false); }

  submit() {
    const name = this.formName().trim();
    const cost = this.formCost();
    if (!name || cost === null || cost < 0) {
      this.formError.set('Nombre y costo son obligatorios. El costo no puede ser negativo.');
      return;
    }
    const cityIds = this.formCityIds().map(c => c.id);
    this.formSaving.set(true);
    this.formError.set(null);

    const req = { name, cityIds, cost, isDefault: this.formDefault() };
    const id  = this.editingId();

    const call = id !== null
      ? this.service.updateZone(id, req)
      : this.service.createZone(req);

    call.subscribe({
      next: () => { this.formOpen.set(false); this.formSaving.set(false); this.load(); },
      error: err => { this.formError.set(err.error?.message ?? 'Error al guardar.'); this.formSaving.set(false); },
    });
  }

  toggleActive(z: ShippingZone) {
    this.service.updateZone(z.id, { active: !z.active }).subscribe({
      next: updated => this.zones.update(list => list.map(x => x.id === z.id ? updated : x)),
    });
  }

  delete(z: ShippingZone) {
    if (!confirm(`¿Eliminar la zona "${z.name}"?`)) return;
    this.service.deleteZone(z.id).subscribe({
      next: () => this.zones.update(list => list.filter(x => x.id !== z.id)),
    });
  }
}
