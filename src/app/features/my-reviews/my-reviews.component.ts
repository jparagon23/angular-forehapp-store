import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';
import { ReviewResponse } from '../../core/models/review.model';
import { ReviewService } from '../../core/services/review.service';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { CartDrawerComponent } from '../cart/cart-drawer.component';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, RouterLink, NavbarComponent, CartDrawerComponent],
  templateUrl: './my-reviews.component.html',
  styleUrl: './my-reviews.component.scss',
})
export class MyReviewsComponent implements OnInit {
  private store         = inject(Store);
  private router        = inject(Router);
  private reviewService = inject(ReviewService);

  reviews       = signal<ReviewResponse[]>([]);
  loading       = signal(true);
  deletingId    = signal<number | null>(null);

  ngOnInit() {
    this.store.select(selectIsLoggedIn).pipe(take(1)).subscribe(loggedIn => {
      if (!loggedIn) { this.router.navigate(['/login'], { queryParams: { redirect: '/my-reviews' } }); return; }
      this.reviewService.getMyReviews().subscribe({
        next:  reviews => { this.reviews.set(reviews); this.loading.set(false); },
        error: ()      => this.loading.set(false),
      });
    });
  }

  canDelete(r: ReviewResponse): boolean {
    return r.status === 'PENDIENTE' || r.status === 'RECHAZADO';
  }

  deleteReview(r: ReviewResponse) {
    this.deletingId.set(r.reviewId);
    this.reviewService.deleteMyReview(r.reviewId).subscribe({
      next: () => {
        this.reviews.update(list => list.filter(x => x.reviewId !== r.reviewId));
        this.deletingId.set(null);
      },
      error: () => this.deletingId.set(null),
    });
  }

  statusLabel(s: string): string {
    if (s === 'APROBADO')  return 'Aprobada';
    if (s === 'RECHAZADO') return 'Rechazada';
    return 'En revisión';
  }

  starsArray(rating: number): string[] {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    return [...Array(full).fill('★'), ...Array(half).fill('½'), ...Array(5 - full - half).fill('☆')];
  }
}
