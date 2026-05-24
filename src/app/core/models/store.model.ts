export type StoreRole   = 'OWNER' | 'MANAGER' | 'STAFF';
export type StoreStatus = 'ACTIVE' | 'INACTIVE';

export interface Store {
  id: number;
  name: string;
  slug: string;
  description: string;
  status: StoreStatus;
  createdAt: string;
  freeShippingMinAmount?: number | null;
}

export interface MyStore {
  storeId: number;
  name: string;
  slug: string;
  status: StoreStatus;
  myRole: StoreRole;
}

export interface StoreMember {
  membershipId: number;
  storeId: number;
  storeName: string;
  storeProfileId: number;
  memberName: string;
  memberEmail: string;
  role: StoreRole;
  joinedAt: string;
  active: boolean;
}

export interface CreateStoreRequest {
  name: string;
  description?: string;
  ownerId: number;
}

export interface UpdateStoreRequest {
  name?: string;
  description?: string;
  freeShippingMinAmount?: number | null;
}

export interface InviteMemberRequest {
  userId: number;
  role: StoreRole;
}

export interface UserSearchResult {
  id: number;
  name: string;
  lastname: string;
  email: string;
}
