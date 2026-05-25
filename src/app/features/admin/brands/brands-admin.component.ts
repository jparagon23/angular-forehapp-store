import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AdminTopbarComponent } from '../shared/admin-topbar.component';
import { SellerProductService } from '../../../core/services/seller-product.service';
import { Attribute, AttributeValue, Brand, BrandLine, Category, CategoryAttribute } from '../../../core/models/seller-product.model';

@Component({
  selector: 'app-brands-admin',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf, AdminTopbarComponent],
  templateUrl: './brands-admin.component.html',
  styleUrl: './brands-admin.component.scss',
})
export class BrandsAdminComponent implements OnInit {
  private svc = inject(SellerProductService);

  loading = true;

  // ── Categories ────────────────────────────────────────────────
  categories: Category[]  = [];
  catName    = ''; catLoading = false; catError = ''; catCreated: Category | null = null;
  editCatId: number | null = null; editCatName = ''; catSaving = false;
  catErrors: Record<number, string> = {};

  // ── Brands ────────────────────────────────────────────────────
  brands: Brand[]         = [];
  brandName  = ''; brandLoading = false; brandError = ''; brandCreated: Brand | null = null;
  editBrandId: number | null = null; editBrandName = ''; brandSaving = false;
  brandErrors: Record<number, string> = {};

  // ── Lines ─────────────────────────────────────────────────────
  linesBrandId: number | null = null;
  lines: BrandLine[] = []; linesLoading = false;
  lineName = ''; lineSelectedBrandId: number | null = null; lineCategoryId: number | null = null;
  lineLoading = false; lineError = ''; lineCreated: BrandLine | null = null;
  editLineId: number | null = null; editLineName = ''; lineSaving = false;
  lineErrors: Record<number, string> = {};

  // ── Attributes ────────────────────────────────────────────────
  attributes: Attribute[] = [];
  attrValues: Record<number, AttributeValue[]> = {};
  expandedAttrId: number | null = null;
  attrName = ''; attrLoading = false; attrError = ''; attrCreated: Attribute | null = null;
  editAttrId: number | null = null; editAttrName = ''; attrSaving = false;
  attrErrors: Record<number, string> = {};

  // ── Attribute Values ──────────────────────────────────────────
  newValueAttrId: number | null = null; newValueDesc = ''; newValueLoading = false; newValueError = '';
  editValueKey: string | null = null; editValueDesc = ''; valueSaving = false;
  valueErrors: Record<string, string> = {};

  // ── Category-Attribute Links ──────────────────────────────────
  linksCatId: number | null = null;
  catLinks: CategoryAttribute[] = []; catLinksLoading = false;
  linkAttrId: number | null = null; linkRequired = false; linkLoading = false; linkError = '';

  ngOnInit() {
    forkJoin({ brands: this.svc.getBrands(), categories: this.svc.getCategories(), attributes: this.svc.getAttributes() })
      .subscribe({
        next: ({ brands, categories, attributes }) => {
          this.brands = brands; this.categories = categories; this.attributes = attributes;
          this.loading = false;
        },
        error: () => { this.loading = false; },
      });
  }

  // ── Categories ────────────────────────────────────────────────
  createCategory() {
    if (!this.catName.trim()) return;
    this.catLoading = true; this.catError = ''; this.catCreated = null;
    this.svc.createCategory(this.catName.trim()).subscribe({
      next: c => { this.catCreated = c; this.categories = [...this.categories, c]; this.catName = ''; this.catLoading = false; },
      error: err => { this.catError = err.error?.message ?? 'Error al crear.'; this.catLoading = false; },
    });
  }

  startEditCat(c: Category) { this.editCatId = c.id; this.editCatName = c.name; delete this.catErrors[c.id]; }
  cancelEditCat() { this.editCatId = null; }

  saveEditCat(id: number) {
    if (!this.editCatName.trim()) return;
    this.catSaving = true;
    this.svc.updateCategory(id, this.editCatName.trim()).subscribe({
      next: u => { this.categories = this.categories.map(c => c.id === id ? u : c); this.editCatId = null; this.catSaving = false; },
      error: err => { this.catErrors[id] = err.error?.message ?? 'Error al guardar.'; this.catSaving = false; },
    });
  }

  deleteCat(id: number) {
    if (!confirm('¿Eliminar esta categoría?')) return;
    this.svc.deleteCategory(id).subscribe({
      next: () => { this.categories = this.categories.filter(c => c.id !== id); },
      error: err => { this.catErrors[id] = err.status === 409 ? 'Tiene productos asociados, no se puede eliminar.' : (err.error?.message ?? 'Error al eliminar.'); },
    });
  }

  // ── Brands ────────────────────────────────────────────────────
  createBrand() {
    if (!this.brandName.trim()) return;
    this.brandLoading = true; this.brandError = ''; this.brandCreated = null;
    this.svc.createBrand(this.brandName.trim()).subscribe({
      next: b => { this.brandCreated = b; this.brands = [...this.brands, b]; this.brandName = ''; this.brandLoading = false; },
      error: err => { this.brandError = err.error?.message ?? 'Error al crear.'; this.brandLoading = false; },
    });
  }

  startEditBrand(b: Brand) { this.editBrandId = b.id; this.editBrandName = b.name; delete this.brandErrors[b.id]; }
  cancelEditBrand() { this.editBrandId = null; }

  saveEditBrand(id: number) {
    if (!this.editBrandName.trim()) return;
    this.brandSaving = true;
    this.svc.updateBrand(id, this.editBrandName.trim()).subscribe({
      next: u => { this.brands = this.brands.map(b => b.id === id ? u : b); this.editBrandId = null; this.brandSaving = false; },
      error: err => { this.brandErrors[id] = err.error?.message ?? 'Error al guardar.'; this.brandSaving = false; },
    });
  }

  deleteBrand(id: number) {
    if (!confirm('¿Eliminar esta brand?')) return;
    this.svc.deleteBrand(id).subscribe({
      next: () => { this.brands = this.brands.filter(b => b.id !== id); if (this.linesBrandId === id) { this.linesBrandId = null; this.lines = []; } },
      error: err => { this.brandErrors[id] = err.status === 409 ? 'Tiene productos asociados, no se puede eliminar.' : (err.error?.message ?? 'Error al eliminar.'); },
    });
  }

  // ── Lines ─────────────────────────────────────────────────────
  onLinesBrandChange(brandId: number | null) {
    if (!brandId) return;
    this.linesBrandId = brandId; this.lines = []; this.linesLoading = true;
    this.svc.getBrandLines(brandId).subscribe({
      next: l => { this.lines = l; this.linesLoading = false; },
      error: () => { this.linesLoading = false; },
    });
  }

  createLine() {
    if (!this.lineName.trim() || !this.lineSelectedBrandId || !this.lineCategoryId) return;
    this.lineLoading = true; this.lineError = ''; this.lineCreated = null;
    this.svc.createBrandLine(this.lineSelectedBrandId, this.lineName.trim(), this.lineCategoryId).subscribe({
      next: l => {
        this.lineCreated = l;
        if (this.linesBrandId === this.lineSelectedBrandId) this.lines = [...this.lines, l];
        this.lineName = ''; this.lineLoading = false;
      },
      error: err => { this.lineError = err.error?.message ?? 'Error al crear.'; this.lineLoading = false; },
    });
  }

  startEditLine(l: BrandLine) { this.editLineId = l.id; this.editLineName = l.name; delete this.lineErrors[l.id]; }
  cancelEditLine() { this.editLineId = null; }

  saveEditLine(brandId: number, lineId: number) {
    if (!this.editLineName.trim()) return;
    this.lineSaving = true;
    this.svc.updateLine(brandId, lineId, this.editLineName.trim()).subscribe({
      next: u => { this.lines = this.lines.map(l => l.id === lineId ? u : l); this.editLineId = null; this.lineSaving = false; },
      error: err => { this.lineErrors[lineId] = err.error?.message ?? 'Error al guardar.'; this.lineSaving = false; },
    });
  }

  deleteLine(brandId: number, lineId: number) {
    if (!confirm('¿Eliminar esta line?')) return;
    this.svc.deleteLine(brandId, lineId).subscribe({
      next: () => { this.lines = this.lines.filter(l => l.id !== lineId); },
      error: err => { this.lineErrors[lineId] = err.status === 409 ? 'Tiene productos asociados, no se puede eliminar.' : (err.error?.message ?? 'Error al eliminar.'); },
    });
  }

  categoryName(id: number): string { return this.categories.find(c => c.id === id)?.name ?? String(id); }

  // ── Attributes ────────────────────────────────────────────────
  createAttribute() {
    if (!this.attrName.trim()) return;
    this.attrLoading = true; this.attrError = ''; this.attrCreated = null;
    this.svc.createAttribute(this.attrName.trim()).subscribe({
      next: a => { this.attrCreated = a; this.attributes = [...this.attributes, a]; this.attrName = ''; this.attrLoading = false; },
      error: err => { this.attrError = err.error?.message ?? 'Error al crear.'; this.attrLoading = false; },
    });
  }

  startEditAttr(a: Attribute) { this.editAttrId = a.id; this.editAttrName = a.name; delete this.attrErrors[a.id]; }
  cancelEditAttr() { this.editAttrId = null; }

  saveEditAttr(id: number) {
    if (!this.editAttrName.trim()) return;
    this.attrSaving = true;
    this.svc.updateAttribute(id, this.editAttrName.trim()).subscribe({
      next: u => { this.attributes = this.attributes.map(a => a.id === id ? u : a); this.editAttrId = null; this.attrSaving = false; },
      error: err => { this.attrErrors[id] = err.error?.message ?? 'Error al guardar.'; this.attrSaving = false; },
    });
  }

  deleteAttr(id: number) {
    if (!confirm('¿Eliminar este atributo?')) return;
    this.svc.deleteAttribute(id).subscribe({
      next: () => { this.attributes = this.attributes.filter(a => a.id !== id); delete this.attrValues[id]; if (this.expandedAttrId === id) this.expandedAttrId = null; },
      error: err => { this.attrErrors[id] = err.status === 409 ? 'Tiene valores asociados. Elimínalos primero.' : (err.error?.message ?? 'Error al eliminar.'); },
    });
  }

  toggleExpand(attrId: number) {
    if (this.expandedAttrId === attrId) { this.expandedAttrId = null; return; }
    this.expandedAttrId = attrId;
    if (!this.attrValues[attrId]) {
      this.svc.getAttributeValues(attrId).subscribe({ next: v => { this.attrValues = { ...this.attrValues, [attrId]: v }; } });
    }
  }

  // ── Attribute Values ──────────────────────────────────────────
  showNewValueForm(attrId: number) { this.newValueAttrId = attrId; this.newValueDesc = ''; this.newValueError = ''; }
  cancelNewValue() { this.newValueAttrId = null; }

  createValue(attrId: number) {
    if (!this.newValueDesc.trim()) return;
    this.newValueLoading = true; this.newValueError = '';
    this.svc.createAttributeValue(attrId, this.newValueDesc.trim()).subscribe({
      next: v => {
        this.attrValues = { ...this.attrValues, [attrId]: [...(this.attrValues[attrId] ?? []), v] };
        this.newValueDesc = ''; this.newValueLoading = false; this.newValueAttrId = null;
      },
      error: err => { this.newValueError = err.error?.message ?? 'Error al crear.'; this.newValueLoading = false; },
    });
  }

  vKey(attrId: number, valueId: number) { return `${attrId}-${valueId}`; }

  startEditValue(attrId: number, v: AttributeValue) { this.editValueKey = this.vKey(attrId, v.id); this.editValueDesc = v.description; }
  cancelEditValue() { this.editValueKey = null; }

  saveEditValue(attrId: number, valueId: number) {
    if (!this.editValueDesc.trim()) return;
    this.valueSaving = true;
    this.svc.updateAttributeValue(attrId, valueId, this.editValueDesc.trim()).subscribe({
      next: u => {
        this.attrValues = { ...this.attrValues, [attrId]: (this.attrValues[attrId] ?? []).map(v => v.id === valueId ? u : v) };
        this.editValueKey = null; this.valueSaving = false;
      },
      error: err => { this.valueErrors[this.vKey(attrId, valueId)] = err.error?.message ?? 'Error al guardar.'; this.valueSaving = false; },
    });
  }

  deleteValue(attrId: number, valueId: number) {
    if (!confirm('¿Eliminar este valor?')) return;
    this.svc.deleteAttributeValue(attrId, valueId).subscribe({
      next: () => { this.attrValues = { ...this.attrValues, [attrId]: (this.attrValues[attrId] ?? []).filter(v => v.id !== valueId) }; },
      error: err => { this.valueErrors[this.vKey(attrId, valueId)] = err.status === 409 ? 'Está en uso por variantes de productos.' : (err.error?.message ?? 'Error al eliminar.'); },
    });
  }

  // ── Category-Attribute Links ──────────────────────────────────
  onLinksCatChange(catId: number | null) {
    if (!catId) return;
    this.linksCatId = catId; this.catLinks = []; this.catLinksLoading = true; this.linkError = '';
    this.svc.getCategoryAttributes(catId).subscribe({
      next: l => { this.catLinks = l; this.catLinksLoading = false; },
      error: () => { this.catLinksLoading = false; },
    });
  }

  linkAttribute() {
    if (!this.linksCatId || !this.linkAttrId) return;
    this.linkLoading = true; this.linkError = '';
    this.svc.linkAttribute(this.linksCatId, this.linkAttrId, this.linkRequired).subscribe({
      next: l => { this.catLinks = [...this.catLinks, l]; this.linkAttrId = null; this.linkRequired = false; this.linkLoading = false; },
      error: err => { this.linkError = err.error?.message ?? 'Error al vincular.'; this.linkLoading = false; },
    });
  }

  toggleRequired(catId: number, attrId: number, current: boolean) {
    this.svc.updateAttributeLink(catId, attrId, !current).subscribe({
      next: u => { this.catLinks = this.catLinks.map(l => l.attributeId === attrId ? u : l); },
    });
  }

  unlinkAttribute(catId: number, attrId: number) {
    if (!confirm('¿Desvincular este atributo?')) return;
    this.svc.unlinkAttribute(catId, attrId).subscribe({
      next: () => { this.catLinks = this.catLinks.filter(l => l.attributeId !== attrId); },
    });
  }

  linkedAttrIds(): Set<number> { return new Set(this.catLinks.map(l => l.attributeId)); }
}
