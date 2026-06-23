import { Component, inject, OnInit, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { SellerProductService } from '../../../core/services/seller-product.service';
import { AdminCategory } from '../../../core/models/seller-product.model';

interface CategoryRow {
  cat: AdminCategory;
  inputValue: number;
  saving: boolean;
  saved: boolean;
  rowError: string;
}

@Component({
  selector: 'app-categories-admin',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, AdminTopbarComponent],
  templateUrl: './categories-admin.component.html',
  styleUrl: './categories-admin.component.scss',
})
export class CategoriesAdminComponent implements OnInit {
  private svc = inject(SellerProductService);

  loading = signal(true);
  error   = signal('');
  rows    = signal<CategoryRow[]>([]);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.svc.getAdminCategories().subscribe({
      next: cats => {
        this.rows.set(cats.map(cat => ({ cat, inputValue: cat.sortOrder, saving: false, saved: false, rowError: '' })));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar las categorías.');
        this.loading.set(false);
      },
    });
  }

  save(row: CategoryRow) {
    if (row.inputValue < 1) { row.rowError = 'El orden mínimo es 1.'; return; }
    row.saving  = true;
    row.saved   = false;
    row.rowError = '';
    this.svc.updateDiscoveryOrder(row.cat.id, row.inputValue).subscribe({
      next: updated => {
        row.cat       = updated;
        row.inputValue = updated.sortOrder;
        row.saving    = false;
        row.saved     = true;
        this.rows.update(list => [...list].sort((a, b) => a.cat.sortOrder - b.cat.sortOrder));
        setTimeout(() => { row.saved = false; }, 2500);
      },
      error: err => {
        row.rowError = err.error?.message ?? 'Error al guardar.';
        row.saving   = false;
      },
    });
  }

  onInputChange(row: CategoryRow) {
    row.saved    = false;
    row.rowError = '';
  }
}
