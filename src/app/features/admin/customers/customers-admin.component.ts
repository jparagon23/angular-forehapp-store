import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { loadCustomers } from '../../../store/customers/customers.actions';
import { selectAllCustomers } from '../../../store/customers/customers.selectors';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';

@Component({
  selector: 'app-customers-admin',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, AdminTopbarComponent],
  templateUrl: './customers-admin.component.html',
  styleUrl: './customers-admin.component.scss',
})
export class CustomersAdminComponent implements OnInit {
  private store = inject(Store);
  customers$ = this.store.select(selectAllCustomers);

  ngOnInit() { this.store.dispatch(loadCustomers()); }
}
