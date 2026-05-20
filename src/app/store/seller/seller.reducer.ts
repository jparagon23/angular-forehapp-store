import { createReducer, on } from '@ngrx/store';
import { SellerProduct } from '../../core/models/seller-product.model';
import {
  adjustSellerInventory,
  adjustSellerInventorySuccess,
  changeSellerProductStatusSuccess,
  clearActiveSellerStore,
  deleteSellerProductSuccess,
  loadSellerProducts,
  loadSellerProductsFailure,
  loadSellerProductsSuccess,
  sellerActionFailure,
  setActiveSellerStore,
} from './seller.actions';

export interface SellerState {
  activeStoreId: number | null;
  activeStoreName: string | null;
  products: SellerProduct[];
  loading: boolean;
  inventoryLoading: boolean;
  error: string | null;
}

const initialState: SellerState = {
  activeStoreId: null,
  activeStoreName: null,
  products: [],
  loading: false,
  inventoryLoading: false,
  error: null,
};

export const sellerReducer = createReducer(
  initialState,
  on(setActiveSellerStore, (state, { storeId, storeName }) => ({
    ...state, activeStoreId: storeId, activeStoreName: storeName, products: [], error: null,
  })),
  on(clearActiveSellerStore, state => ({
    ...state, activeStoreId: null, activeStoreName: null, products: [],
  })),
  on(loadSellerProducts, state => ({ ...state, loading: true, error: null })),
  on(loadSellerProductsSuccess, (state, { products }) => ({ ...state, products, loading: false })),
  on(loadSellerProductsFailure, (state, { error }) => ({ ...state, error, loading: false })),
  on(deleteSellerProductSuccess, (state, { id }) => ({
    ...state, products: state.products.filter(p => p.id !== id),
  })),
  on(changeSellerProductStatusSuccess, (state, { product }) => ({
    ...state,
    products: state.products.map(p => p.id === product.id ? product : p),
  })),
  on(adjustSellerInventory, state => ({ ...state, inventoryLoading: true, error: null })),
  on(adjustSellerInventorySuccess, (state, { productId, variantId, quantity }) => ({
    ...state,
    inventoryLoading: false,
    products: state.products.map(p =>
      p.id === productId
        ? { ...p, variants: p.variants.map(v =>
              v.id === variantId ? { ...v, stock: v.stock + quantity } : v
            )}
        : p
    ),
  })),
  on(sellerActionFailure, (state, { error }) => ({ ...state, error, loading: false, inventoryLoading: false })),
);
