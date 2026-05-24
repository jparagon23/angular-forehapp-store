import { City } from './location.model';

export interface ShippingZone {
  id: number;
  name: string;
  cities: City[];
  cost: number;
  isDefault: boolean;
  active: boolean;
}

export interface CreateShippingZoneRequest {
  name: string;
  cityIds: number[];
  cost: number;
  isDefault: boolean;
}

export interface UpdateShippingZoneRequest {
  name?: string;
  cityIds?: number[];
  cost?: number;
  isDefault?: boolean;
  active?: boolean;
}
