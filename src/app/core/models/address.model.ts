export interface Address {
  id: number;
  alias?: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  alias?: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  isDefault?: boolean;
}

export type UpdateAddressRequest = Partial<Omit<CreateAddressRequest, 'isDefault'>>;
