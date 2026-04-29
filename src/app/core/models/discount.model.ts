export interface Discount {
  code: string;
  type: '%' | 'COP';
  val: number;
  scope: string;
  uses: number;
  used: number;
  from: string;
  to: string;
  active: boolean;
}
