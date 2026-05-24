import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { SellerProductService } from '../../../core/services/seller-product.service';
import { Brand, BrandLine, Category } from '../../../core/models/seller-product.model';

@Component({
  selector: 'app-brands-admin',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, AdminTopbarComponent],
  templateUrl: './brands-admin.component.html',
  styleUrl: './brands-admin.component.scss',
})
export class BrandsAdminComponent implements OnInit {
  private svc = inject(SellerProductService);

  brands: Brand[]     = [];
  categories: Category[] = [];
  loading = true;

  catName     = '';
  catLoading  = false;
  catError    = '';
  catCreated: Category | null = null;

  brandName     = '';
  brandLoading  = false;
  brandError    = '';
  brandCreated: Brand | null = null;

  lineSelectedBrandId: number | null = null;
  lineCategoryId: number | null = null;
  lineName     = '';
  lineLoading  = false;
  lineError    = '';
  lineCreated: BrandLine | null = null;

  ngOnInit() {
    forkJoin({ brands: this.svc.getBrands(), categories: this.svc.getCategories() }).subscribe({
      next: ({ brands, categories }) => {
        this.brands     = brands;
        this.categories = categories;
        this.loading    = false;
      },
      error: () => { this.loading = false; },
    });
  }

  createCategory() {
    if (!this.catName.trim()) return;
    this.catLoading = true;
    this.catError   = '';
    this.catCreated = null;
    this.svc.createCategory(this.catName.trim()).subscribe({
      next: cat => {
        this.catCreated    = cat;
        this.categories    = [...this.categories, cat];
        this.catName       = '';
        this.catLoading    = false;
      },
      error: err => {
        this.catError   = err.error?.message ?? 'Error al crear la categoría.';
        this.catLoading = false;
      },
    });
  }

  createBrand() {
    if (!this.brandName.trim()) return;
    this.brandLoading = true;
    this.brandError   = '';
    this.brandCreated = null;
    this.svc.createBrand(this.brandName.trim()).subscribe({
      next: brand => {
        this.brandCreated = brand;
        this.brands       = [...this.brands, brand];
        this.brandName    = '';
        this.brandLoading = false;
      },
      error: err => {
        this.brandError   = err.error?.message ?? 'Error al crear la brand.';
        this.brandLoading = false;
      },
    });
  }

  createLine() {
    if (!this.lineName.trim() || !this.lineSelectedBrandId || !this.lineCategoryId) return;
    this.lineLoading  = true;
    this.lineError    = '';
    this.lineCreated  = null;
    this.svc.createBrandLine(this.lineSelectedBrandId, this.lineName.trim(), this.lineCategoryId).subscribe({
      next: line => {
        this.lineCreated  = line;
        this.lineName     = '';
        this.lineLoading  = false;
      },
      error: err => {
        this.lineError    = err.error?.message ?? 'Error al crear la line.';
        this.lineLoading  = false;
      },
    });
  }

  categoryName(id: number): string {
    return this.categories.find(c => c.id === id)?.name ?? String(id);
  }
}
