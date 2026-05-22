export interface ShippingZone {
  id: number;
  name: string;
  cities: string[];
  cost: number;
  isDefault: boolean;
  active: boolean;
}

export interface CreateShippingZoneRequest {
  name: string;
  cities: string[];
  cost: number;
  isDefault: boolean;
}

export interface UpdateShippingZoneRequest {
  name?: string;
  cities?: string[];
  cost?: number;
  isDefault?: boolean;
  active?: boolean;
}
