export type AmbassadorStatus = 'ACTIVE' | 'INACTIVE';
export type CommissionStatus  = 'PENDING' | 'PAID';

export interface AmbassadorStats {
  totalOrders:   number;
  totalEarned:   number;
  pendingAmount: number;
  paidAmount:    number;
}

export interface AmbassadorResponse {
  ambassadorId:         number;
  profileId:            number;
  userName:             string;
  userEmail:            string;
  referralCode:         string;
  commissionPercentage: number;
  status:               AmbassadorStatus;
  createdAt:            string;
  stats:                AmbassadorStats;
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
  commissionId:         number;
  orderId:              number;
  commissionAmount:     number;
  commissionPercentage: number;
  status:               CommissionStatus;
  createdAt:            string;
}

export interface CreateAmbassadorRequest {
  userId:               number;
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
