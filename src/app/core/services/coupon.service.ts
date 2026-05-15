import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CouponPageResponse,
  CouponResponse,
  CouponValidationResponse,
  CreateCouponRequest,
  RedeemCouponRequest,
  UpdateCouponRequest,
  ValidateCouponRequest,
} from '../models/coupon.model';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  validate(req: ValidateCouponRequest): Observable<CouponValidationResponse> {
    return this.http.post<CouponValidationResponse>(`${this.base}/coupons/validate`, req);
  }

  redeem(req: RedeemCouponRequest): Observable<CouponValidationResponse> {
    return this.http.post<CouponValidationResponse>(`${this.base}/coupons/redeem`, req);
  }

  // Seller endpoints
  createCoupon(req: CreateCouponRequest): Observable<CouponResponse> {
    return this.http.post<CouponResponse>(`${this.base}/seller/coupons`, req);
  }

  getMyCoupons(page = 0, size = 20): Observable<CouponPageResponse> {
    return this.http.get<CouponPageResponse>(`${this.base}/seller/coupons`, {
      params: { page: page.toString(), size: size.toString() },
    });
  }

  getMyCoupon(couponId: number): Observable<CouponResponse> {
    return this.http.get<CouponResponse>(`${this.base}/seller/coupons/${couponId}`);
  }

  updateCoupon(couponId: number, req: UpdateCouponRequest): Observable<CouponResponse> {
    return this.http.patch<CouponResponse>(`${this.base}/seller/coupons/${couponId}`, req);
  }

  deactivateCoupon(couponId: number): Observable<CouponResponse> {
    return this.http.patch<CouponResponse>(`${this.base}/seller/coupons/${couponId}/deactivate`, {});
  }

  reactivateCoupon(couponId: number): Observable<CouponResponse> {
    return this.http.patch<CouponResponse>(`${this.base}/seller/coupons/${couponId}`, { status: 'ACTIVA' });
  }

  // Admin endpoint
  getAllCoupons(page = 0, size = 20): Observable<CouponPageResponse> {
    return this.http.get<CouponPageResponse>(`${this.base}/admin/coupons`, {
      params: { page: page.toString(), size: size.toString() },
    });
  }
}
