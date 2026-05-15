import { Injectable } from '@angular/core';
import { CartItemResponse, CartResponse, CartSellerGroup } from '../models/cart.model';

export interface GuestCartItem {
  variantId: number;
  quantity: number;
  sku: string;
  productTitle: string;
  unitPrice: number;
}

const KEY = 'forehapp_guest_cart';

@Injectable({ providedIn: 'root' })
export class GuestCartService {

  getItems(): GuestCartItem[] {
    try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); }
    catch { return []; }
  }

  addItem(item: GuestCartItem): void {
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
    const items = this.getItems();
    const found = items.find(i => i.variantId === variantId);
    if (found) { found.quantity = quantity; this.save(items); }
  }

  removeItem(variantId: number): void {
    this.save(this.getItems().filter(i => i.variantId !== variantId));
  }

  clear(): void {
    localStorage.removeItem(KEY);
  }

  buildCartResponse(): CartResponse {
    const items = this.getItems();
    if (items.length === 0) {
      return { cartId: null, status: 'GUEST', updatedAt: null, total: 0, sellerGroups: [] };
    }
    const cartItems: CartItemResponse[] = items.map(i => ({
      itemId:        -i.variantId,   // negativo = ítem guest (nunca choca con IDs del server)
      variantId:     i.variantId,
      sku:           i.sku,
      productTitle:  i.productTitle,
      quantity:      i.quantity,
      unitPrice:     i.unitPrice,
      subtotal:      i.unitPrice * i.quantity,
      priceChanged:  false,
      previousPrice: null,
    }));
    const group: CartSellerGroup = {
      sellerId:   0,
      sellerName: 'Tu carrito',
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
