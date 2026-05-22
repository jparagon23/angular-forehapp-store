import { City, Country, State } from './location.model';

export interface Address {
  id: number;
  alias?: string;
  street: string;
  city: City;
  state: State;
  country: Country;
  zipCode?: string;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  alias?: string;
  street: string;
  cityId: number;
  zipCode?: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequest {
  alias?: string;
  street?: string;
  cityId?: number;
  zipCode?: string;
}
