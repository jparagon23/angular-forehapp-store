import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectHasSeller } from '../../store/auth/auth.selectors';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { SeoService } from '../../core/services/seo.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, RouterOutlet, AsyncPipe, NgIf, NavbarComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private store = inject(Store);
  private seo   = inject(SeoService);
  hasSeller$ = this.store.select(selectHasSeller);

  ngOnInit() { this.seo.set({ title: 'Panel de Administración' }); }
}
