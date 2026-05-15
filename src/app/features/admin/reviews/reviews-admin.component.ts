import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { ReviewResponse } from '../../../core/models/review.model';
import { ReviewService } from '../../../core/services/review.service';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';

@Component({
  selector: 'app-reviews-admin',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, AdminTopbarComponent],
  templateUrl: './reviews-admin.component.html',
  styleUrl: './reviews-admin.component.scss',
})
export class ReviewsAdminComponent implements OnInit {
  private reviewService = inject(ReviewService);

  reviews     = signal<ReviewResponse[]>([]);
  loading     = signal(true);
  total       = signal(0);
  page        = signal(0);
  totalPages  = signal(0);
  actionId    = signal<number | null>(null);

  ngOnInit() { this.load(0); }

  load(page: number) {
    this.loading.set(true);
    this.reviewService.getPendingReviews(page).subscribe({
      next: res => {
        this.reviews.set(res.reviews);
        this.total.set(res.totalElements);
        this.page.set(res.currentPage);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  approve(reviewId: number) {
    this.actionId.set(reviewId);
    this.reviewService.approveReview(reviewId).subscribe({
      next: () => { this.reviews.update(list => list.filter(r => r.reviewId !== reviewId)); this.actionId.set(null); this.total.update(n => n - 1); },
      error: () => this.actionId.set(null),
    });
  }

  reject(reviewId: number) {
    this.actionId.set(reviewId);
    this.reviewService.rejectReview(reviewId).subscribe({
      next: () => { this.reviews.update(list => list.filter(r => r.reviewId !== reviewId)); this.actionId.set(null); this.total.update(n => n - 1); },
      error: () => this.actionId.set(null),
    });
  }

  prevPage() { if (this.page() > 0) this.load(this.page() - 1); }
  nextPage() { if (this.page() < this.totalPages() - 1) this.load(this.page() + 1); }

  autoApproveStatus(createdAt: string): 'ok' | 'soon' | 'imminent' {
    const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
    if (hours >= 20) return 'imminent';
    if (hours >= 12) return 'soon';
    return 'ok';
  }

  hoursLeft(createdAt: string): number {
    const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
    return Math.max(0, Math.round(24 - hours));
  }

  starsArray(rating: number): string[] {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    return [...Array(full).fill('★'), ...Array(half).fill('½'), ...Array(5 - full - half).fill('☆')];
  }
}
