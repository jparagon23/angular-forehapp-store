import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { createStore } from '../../../store/stores/stores.actions';
import { selectLastCreatedStore, selectStoresActionLoading, selectStoresError } from '../../../store/stores/stores.selectors';

@Component({
  selector: 'app-stores-admin',
  standalone: true,
  imports: [AsyncPipe, NgIf, FormsModule, AdminTopbarComponent],
  templateUrl: './stores-admin.component.html',
  styleUrl: './stores-admin.component.scss',
})
export class StoresAdminComponent implements OnInit {
  private store = inject(Store);

  loading$    = this.store.select(selectStoresActionLoading);
  error$      = this.store.select(selectStoresError);
  created$    = this.store.select(selectLastCreatedStore);

  name        = '';
  description = '';
  ownerId: number | null = null;

  ngOnInit() {}

  submit() {
    if (!this.name.trim() || !this.ownerId) return;
    this.store.dispatch(createStore({
      req: {
        name: this.name.trim(),
        description: this.description.trim() || undefined,
        ownerId: this.ownerId,
      },
    }));
  }

  reset() {
    this.name = '';
    this.description = '';
    this.ownerId = null;
  }
}
