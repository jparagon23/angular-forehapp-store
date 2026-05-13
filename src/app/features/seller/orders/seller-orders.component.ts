import { Component, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { CurrencyCopPipe } from '../../../shared/pipes/currency-cop.pipe';

type OrderStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface SellerOrderItem { sku: string; name: string; qty: number; price: number; }
interface SellerOrder {
  id: string; buyer: string; date: string;
  items: SellerOrderItem[]; total: number; status: OrderStatus;
}

const MOCK_ORDERS: SellerOrder[] = [
  { id: 'ORD-1042', buyer: 'Carlos M.',    date: '2026-05-13T10:30:00',
    items: [{ sku: 'WLS-PS97-G3-M',     name: 'Wilson Pro Staff 97',        qty: 1, price: 350000 }],
    total: 350000, status: 'PENDING' },
  { id: 'ORD-1039', buyer: 'Laura T.',     date: '2026-05-12T14:20:00',
    items: [
      { sku: 'NK-CAZOOM-BL-42',  name: 'Nike Court Air Zoom',          qty: 1, price: 245000 },
      { sku: 'NK-SHIRT-M-BLK',   name: 'Nike Dri-FIT Camiseta',        qty: 2, price:  89000 },
    ], total: 423000, status: 'SHIPPED' },
  { id: 'ORD-1033', buyer: 'Andrés P.',    date: '2026-05-10T09:00:00',
    items: [{ sku: 'WLS-CLASH100-R',    name: 'Wilson Clash 100',           qty: 1, price: 280000 }],
    total: 280000, status: 'DELIVERED' },
  { id: 'ORD-1028', buyer: 'Valentina C.', date: '2026-05-08T16:45:00',
    items: [
      { sku: 'HD-PRESTIGE-G2-M', name: 'Head Prestige MP',              qty: 1, price: 320000 },
      { sku: 'WLS-UTOUR-BL-42',  name: 'Wilson Ultra Tour Zapatillas', qty: 1, price: 195000 },
    ], total: 515000, status: 'DELIVERED' },
  { id: 'ORD-1021', buyer: 'Sebastián L.', date: '2026-05-05T11:10:00',
    items: [{ sku: 'BA-JETMACH-BL-43', name: 'Babolat Jet Mach',           qty: 1, price: 215000 }],
    total: 215000, status: 'CANCELLED' },
  { id: 'ORD-1018', buyer: 'María G.',     date: '2026-05-03T08:30:00',
    items: [{ sku: 'WLS-PS97-G4-L',     name: 'Wilson Pro Staff 97',        qty: 1, price: 350000 }],
    total: 350000, status: 'DELIVERED' },
  { id: 'ORD-1015', buyer: 'Tomás R.',     date: '2026-05-01T15:00:00',
    items: [{ sku: 'NK-SHIRT-L-WHT',    name: 'Nike Dri-FIT Camiseta',      qty: 3, price:  89000 }],
    total: 267000, status: 'SHIPPED' },
];

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, DatePipe, CurrencyPipe, CurrencyCopPipe],
  templateUrl: './seller-orders.component.html',
  styleUrl: './seller-orders.component.scss',
})
export class SellerOrdersComponent {
  activeFilter = signal<OrderStatus | null>(null);
  expandedId   = signal<string | null>(null);

  filtered = computed(() => {
    const f = this.activeFilter();
    return f ? MOCK_ORDERS.filter(o => o.status === f) : MOCK_ORDERS;
  });

  counts = computed(() => ({
    ALL:       MOCK_ORDERS.length,
    PENDING:   MOCK_ORDERS.filter(o => o.status === 'PENDING').length,
    SHIPPED:   MOCK_ORDERS.filter(o => o.status === 'SHIPPED').length,
    DELIVERED: MOCK_ORDERS.filter(o => o.status === 'DELIVERED').length,
    CANCELLED: MOCK_ORDERS.filter(o => o.status === 'CANCELLED').length,
  }));

  toggleExpand(id: string) {
    this.expandedId.update(cur => cur === id ? null : id);
  }

  statusLabel(s: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      PENDING: 'Pendiente', SHIPPED: 'Enviado',
      DELIVERED: 'Entregado', CANCELLED: 'Cancelado',
    };
    return m[s];
  }

  statusClass(s: OrderStatus): string {
    const m: Record<OrderStatus, string> = {
      PENDING: 'so-pending', SHIPPED: 'so-shipped',
      DELIVERED: 'so-delivered', CANCELLED: 'so-cancelled',
    };
    return m[s];
  }

  markShipped(id: string, e: Event) {
    e.stopPropagation();
    const order = MOCK_ORDERS.find(o => o.id === id);
    if (order) order.status = 'SHIPPED';
  }
}
