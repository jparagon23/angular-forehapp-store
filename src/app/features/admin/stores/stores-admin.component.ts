import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { createStore } from '../../../store/stores/stores.actions';
import { selectLastCreatedStore, selectStoresActionLoading, selectStoresError } from '../../../store/stores/stores.selectors';
import { StoreService } from '../../../core/services/store.service';
import { UserSearchResult } from '../../../core/models/store.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-stores-admin',
  standalone: true,
  imports: [AsyncPipe, NgIf, UpperCasePipe, FormsModule, AdminTopbarComponent],
  templateUrl: './stores-admin.component.html',
  styleUrl: './stores-admin.component.scss',
})
export class StoresAdminComponent implements OnInit {
  private ngrxStore = inject(Store);
  private storeSvc  = inject(StoreService);

  loading$    = this.ngrxStore.select(selectStoresActionLoading);
  error$      = this.ngrxStore.select(selectStoresError);
  created$    = this.ngrxStore.select(selectLastCreatedStore);

  name        = '';
  description = '';

  searchEmail  = '';
  searching    = false;
  foundOwner: UserSearchResult | null = null;
  searchError  = '';

  ngOnInit() {}

  searchOwner() {
    const email = this.searchEmail.trim();
    if (!email) return;
    this.searching   = true;
    this.foundOwner  = null;
    this.searchError = '';
    this.storeSvc.searchUserByEmail(email).pipe(
      finalize(() => this.searching = false)
    ).subscribe({
      next:  user => this.foundOwner = user,
      error: ()   => this.searchError = 'No se encontró ningún usuario con ese correo.',
    });
  }

  clearOwner() {
    this.foundOwner  = null;
    this.searchError = '';
    this.searchEmail = '';
  }

  submit() {
    if (!this.name.trim() || !this.foundOwner) return;
    this.ngrxStore.dispatch(createStore({
      req: {
        name: this.name.trim(),
        description: this.description.trim() || undefined,
        ownerId: this.foundOwner.id,
      },
    }));
  }

  reset() {
    this.name        = '';
    this.description = '';
    this.clearOwner();
  }
}
