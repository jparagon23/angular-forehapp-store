import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CartItemResponse, CartResponse, CartSellerGroup } from '../models/cart.model';

export interface GuestCartItem {
  variantId: number;
  quantity: number;
  sku: string | null;
  productTitle: string;
  unitPrice: number;
  thumbnailUrl?: string;
}

const KEY = 'forehapp_guest_cart';

@Injectable({ providedIn: 'root' })
export class GuestCartService {
  private platformId = inject(PLATFORM_ID);
  private get ok() { return isPlatformBrowser(this.platformId); }

  getItems(): GuestCartItem[] {
    if (!this.ok) return [];
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }

  addItem(item: GuestCartItem): void {
    if (!this.ok) return;
    const items = this.getItems();
    const existing = items.find(i => i.variantId === item.variantId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      items.push({ ...item });
    }
    this.save(items);
  }

  updateItem(variantId: number, quantity: number): void {
    if (!this.ok) return;
    const items = this.getItems();
    const found = items.find(i => i.variantId === variantId);
    if (found) { found.quantity = quantity; this.save(items); }
  }

  removeItem(variantId: number): void {
    if (!this.ok) return;
    this.save(this.getItems().filter(i => i.variantId !== variantId));
  }

  clear(): void {
    if (!this.ok) return;
    localStorage.removeItem(KEY);
  }

  buildCartResponse(): CartResponse {
    const items = this.getItems();
    if (items.length === 0) {
      return { cartId: null, status: 'GUEST', updatedAt: null, total: 0, sellerGroups: [] };
    }
    const cartItems: CartItemResponse[] = items.map(i => ({
      itemId:        -i.variantId,
      variantId:     i.variantId,
      sku:           i.sku,
      productTitle:  i.productTitle,
      quantity:      i.quantity,
      unitPrice:     i.unitPrice,
      subtotal:      i.unitPrice * i.quantity,
      priceChanged:  false,
      previousPrice: null,
      thumbnailUrl:  i.thumbnailUrl,
    }));
    const group: CartSellerGroup = {
      storeId:   0,
      storeName: 'Tu carrito',
      subtotal:   cartItems.reduce((s, i) => s + i.subtotal, 0),
      items:      cartItems,
    };
    return {
      cartId:       null,
      status:       'GUEST',
      updatedAt:    null,
      total:        group.subtotal,
      sellerGroups: [group],
    };
  }

  private save(items: GuestCartItem[]): void {
    localStorage.setItem(KEY, JSON.stringify(items));
  }
}
