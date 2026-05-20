import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { loadMyStores } from '../../store/stores/stores.actions';
import { selectMyStores, selectStoresError, selectStoresLoading } from '../../store/stores/stores.selectors';

@Component({
  selector: 'app-my-stores',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, RouterLink],
  templateUrl: './my-stores.component.html',
  styleUrl: './my-stores.component.scss',
})
export class MyStoresComponent implements OnInit {
  private store = inject(Store);

  stores$  = this.store.select(selectMyStores);
  loading$ = this.store.select(selectStoresLoading);
  error$   = this.store.select(selectStoresError);

  ngOnInit() { this.store.dispatch(loadMyStores()); }

  roleLabel(role: string): string {
    return { OWNER: 'Dueño', MANAGER: 'Manager', STAFF: 'Staff' }[role] ?? role;
  }
}
