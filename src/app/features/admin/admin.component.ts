import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectHasSeller } from '../../store/auth/auth.selectors';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SeoService } from '../../core/services/seo.service';
import { CatalogRequestService } from '../../core/services/catalog-request.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, RouterOutlet, AsyncPipe, NgIf, NgClass, NavbarComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private store          = inject(Store);
  private seo            = inject(SeoService);
  private catalogService = inject(CatalogRequestService);

  hasSeller$          = this.store.select(selectHasSeller);
  pendingCatalogCount = signal(0);

  ngOnInit() {
    this.seo.set({ title: 'Panel de Administración' });
    this.catalogService.adminGetRequests('PENDING').subscribe({
      next: list => this.pendingCatalogCount.set(list.length),
      error: ()  => {},
    });
  }
}
