export type FoundationStatus = 'ACTIVE' | 'INACTIVE';
export type DonationRecordStatus = 'PENDING' | 'PAID';

export interface Foundation {
  id: number;
  name: string;
  description: string | null;
  status: FoundationStatus;
  createdAt: string;
}

export interface CreateFoundationRequest {
  name: string;
  description?: string;
}

export interface UpdateFoundationRequest {
  description?: string;
  status?: FoundationStatus;
}

export interface DonationRecord {
  id: number;
  orderId: number;
  couponCode: string;
  foundationId: number;
  foundationName: string;
  orderTotal: number;
  donationPercentage: number;
  donationAmount: number;
  status: DonationRecordStatus;
  createdAt: string;
}

export interface DonationRecordPage {
  content: DonationRecord[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
