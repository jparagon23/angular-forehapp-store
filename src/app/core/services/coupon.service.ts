import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CouponPageResponse,
  CouponResponse,
  CouponValidationResponse,
  CreateCouponRequest,
  CreateDonationCouponRequest,
  UpdateCouponRequest,
  ValidateCouponRequest,
  ValidateGuestCouponRequest,
} from '../models/coupon.model';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  validate(req: ValidateCouponRequest): Observable<CouponValidationResponse> {
    return this.http.post<CouponValidationResponse>(`${this.base}/coupons/validate`, req);
  }

  validateGuest(req: ValidateGuestCouponRequest): Observable<CouponValidationResponse> {
    return this.http.post<CouponValidationResponse>(`${this.base}/coupons/validate/guest`, req);
  }

  // Seller endpoints
  createCoupon(storeId: number, req: CreateCouponRequest): Observable<CouponResponse> {
    return this.http.post<CouponResponse>(`${this.base}/stores/${storeId}/coupons`, req);
  }

  getMyCoupons(storeId: number, page = 0, size = 20): Observable<CouponPageResponse> {
    return this.http.get<CouponPageResponse>(`${this.base}/stores/${storeId}/coupons`, {
      params: { page: page.toString(), size: size.toString() },
    });
  }

  getMyCoupon(storeId: number, couponId: number): Observable<CouponResponse> {
    return this.http.get<CouponResponse>(`${this.base}/stores/${storeId}/coupons/${couponId}`);
  }

  updateCoupon(storeId: number, couponId: number, req: UpdateCouponRequest): Observable<CouponResponse> {
    return this.http.patch<CouponResponse>(`${this.base}/stores/${storeId}/coupons/${couponId}`, req);
  }

  deactivateCoupon(storeId: number, couponId: number): Observable<CouponResponse> {
    return this.http.patch<CouponResponse>(`${this.base}/stores/${storeId}/coupons/${couponId}/deactivate`, {});
  }

  // Admin endpoints
  getAllCoupons(page = 0, size = 20): Observable<CouponPageResponse> {
    return this.http.get<CouponPageResponse>(`${this.base}/admin/coupons`, {
      params: { page: page.toString(), size: size.toString() },
    });
  }

  createDonationCoupon(req: CreateDonationCouponRequest): Observable<CouponResponse> {
    return this.http.post<CouponResponse>(`${this.base}/admin/coupons/donation`, req);
  }
}
