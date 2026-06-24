export type CatalogRequestType   = 'BRAND' | 'CATEGORY';
export type CatalogRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CatalogRequestResponse {
  id: number;
  type: CatalogRequestType;
  suggestedName: string;
  status: CatalogRequestStatus;
  storeName: string;
  requestedByName: string;
  rejectionReason: string | null;
  resultId: number | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface CreateCatalogRequestDto {
  type: CatalogRequestType;
  suggestedName: string;
}
