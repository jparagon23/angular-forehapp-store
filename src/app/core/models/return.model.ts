export type ReturnStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'REEMBOLSADA';
export type ReturnType = 'DEVOLUCION' | 'REEMBOLSO_PARCIAL' | 'REEMBOLSO_COMPLETO';

export interface ReturnItemResponse {
  orderItemId: number;
  productTitle: string;
  variantSku: string | null;
  quantityOrdered: number;
  quantityToReturn: number;
  unitPrice: number;
  subtotal: number;
}

export interface ReturnResponse {
  returnId: number;
  orderGroupId: number;
  orderId: number;
  buyerName: string;
  returnType: ReturnType;
  reason: string;
  refundAmount: number | null;
  adminNotes: string | null;
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string | null;
  items: ReturnItemResponse[];
}

export interface CreateReturnItemRequest {
  orderItemId: number;
  quantityToReturn: number;
}

export interface CreateReturnRequest {
  orderGroupId: number;
  returnType: ReturnType;
  reason: string;
  items: CreateReturnItemRequest[];
}

export interface ApproveReturnRequest {
  refundAmount: number;
  adminNotes?: string;
}

export interface RejectReturnRequest {
  adminNotes: string;
}

export interface ReturnPageResponse {
  content: ReturnResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
