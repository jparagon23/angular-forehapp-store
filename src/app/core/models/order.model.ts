export type OrderStatus = 'Pendiente' | 'Enviado' | 'Entregado' | 'Cancelado';

export interface Order {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: string;
  status: OrderStatus;
}
