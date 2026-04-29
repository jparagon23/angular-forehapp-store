export interface CartItem {
  key: string;
  id: number;
  name: string;
  emoji: string;
  price: number;
  qty: number;
  size: string | null;
  color: string | null;
}
