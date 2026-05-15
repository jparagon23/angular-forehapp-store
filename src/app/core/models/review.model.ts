export type ReviewStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface ReviewResponse {
  reviewId: number;
  productId: number;
  productTitle: string;
  reviewerId: number;
  reviewerName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
}

export interface ProductRatingSummary {
  productId: number;
  averageRating: number;
  totalReviews: number;
}

export interface ReviewPageResponse {
  summary: ProductRatingSummary | null;
  reviews: ReviewResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

export interface CreateReviewRequest {
  rating: number;
  title?: string;
  comment?: string;
}
