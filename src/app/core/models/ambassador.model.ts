export type AmbassadorStatus = 'ACTIVE' | 'INACTIVE';
export type CommissionStatus  = 'PENDING' | 'PAID';

export interface AmbassadorResponse {
  id:                   number;
  profileId:            number;
  name:                 string;
  email:                string;
  referralCode:         string;
  commissionPercentage: number;
  status:               AmbassadorStatus;
  totalOrders:          number;
  totalEarned:          number;
  pendingAmount:        number;
  paidAmount:           number;
  createdAt:            string;
}

export interface AmbassadorMeResponse {
  referralCode:         string;
  commissionPercentage: number;
  totalOrders:          number;
  totalEarned:          number;
  pendingAmount:        number;
  paidAmount:           number;
}

export interface CommissionResponse {
  id:               number;
  orderId:          number;
  orderTotal:       number;
  commissionAmount: number;
  status:           CommissionStatus;
  createdAt:        string;
}

export interface CreateAmbassadorRequest {
  profileId:            number;
  referralCode:         string;
  commissionPercentage: number;
}

export interface UpdateAmbassadorRequest {
  commissionPercentage?: number;
  status?:               AmbassadorStatus;
}

export interface ReferralValidationResponse {
  referralCode:   string;
  ambassadorName: string;
}
