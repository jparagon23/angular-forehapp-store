import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateReviewRequest, ProductRatingSummary, ReviewPageResponse, ReviewResponse } from '../models/review.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getProductReviews(productId: number, page = 0, size = 10): Observable<ReviewPageResponse> {
    return this.http.get<ReviewPageResponse>(
      `${this.base}/products/${productId}/reviews`, { params: { page, size } }
    );
  }

  getProductRatingSummary(productId: number): Observable<ProductRatingSummary> {
    return this.http.get<ProductRatingSummary>(`${this.base}/products/${productId}/reviews/summary`);
  }

  createReview(productId: number, req: CreateReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.base}/products/${productId}/reviews`, req);
  }

  deleteMyReview(reviewId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/reviews/${reviewId}`);
  }

  getMyReviews(): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/reviews/my`);
  }

  getPendingReviews(page = 0, size = 20): Observable<ReviewPageResponse> {
    return this.http.get<ReviewPageResponse>(
      `${this.base}/admin/reviews/pending`, { params: { page, size } }
    );
  }

  approveReview(reviewId: number): Observable<ReviewResponse> {
    return this.http.patch<ReviewResponse>(`${this.base}/admin/reviews/${reviewId}/approve`, {});
  }

  rejectReview(reviewId: number): Observable<ReviewResponse> {
    return this.http.patch<ReviewResponse>(`${this.base}/admin/reviews/${reviewId}/reject`, {});
  }
}
