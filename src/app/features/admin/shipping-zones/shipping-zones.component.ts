import { Component, inject, OnInit, signal } from '@angular/core';
import { NgClass, NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShippingZoneService } from '../../../core/services/shipping-zone.service';
import { ShippingZone } from '../../../core/models/shipping-zone.model';

@Component({
  selector: 'app-shipping-zones',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, CurrencyPipe],
  templateUrl: './shipping-zones.component.html',
  styleUrl: './shipping-zones.component.scss',
})
export class ShippingZonesComponent implements OnInit {
  private service = inject(ShippingZoneService);

  zones   = signal<ShippingZone[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);

  // Form state
  formOpen    = signal(false);
  editingId   = signal<number | null>(null);
  formName    = signal('');
  formCities  = signal('');
  formCost    = signal<number | null>(null);
  formDefault = signal(false);
  formSaving  = signal(false);
  formError   = signal<string | null>(null);

  ngOnInit() { this.load(); }

  private load() {
    this.loading.set(true);
    this.service.getZones().subscribe({
      next: z  => { this.zones.set(z); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar las zonas.'); this.loading.set(false); },
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.formName.set(''); this.formCities.set(''); this.formCost.set(null); this.formDefault.set(false);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  openEdit(z: ShippingZone) {
    this.editingId.set(z.id);
    this.formName.set(z.name);
    this.formCities.set(z.cities.join(', '));
    this.formCost.set(z.cost);
    this.formDefault.set(z.isDefault);
    this.formError.set(null);
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
    const cities = this.formCities().split(',').map(c => c.trim()).filter(Boolean);
    this.formSaving.set(true);
    this.formError.set(null);

    const req = { name, cities, cost, isDefault: this.formDefault() };
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
