import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { Product } from '../../core/models/product.model';
import * as ProductsActions from './products.actions';

export interface ProductsState extends EntityState<Product> {
  selectedId: number | null;
  loading: boolean;
  selectedLoading: boolean;
  error: string | null;
}

const adapter = createEntityAdapter<Product>();

const initialState: ProductsState = adapter.getInitialState({
  selectedId: null,
  loading: true,
  selectedLoading: false,
  error: null,
});

export const productsReducer = createReducer(
  initialState,
  on(ProductsActions.resetProductList, state => adapter.removeAll({ ...state, loading: true, error: null })),
  on(ProductsActions.loadProducts, state => ({ ...state, loading: true, error: null })),
  on(ProductsActions.loadProductsSuccess, (state, { products }) => {
    // Preserva variants/image de un loadProduct detallado previo que setAll sobrescribiría
    const enriched = products.map(p => ({
      ...p,
      variants: state.entities[p.id]?.variants ?? p.variants,
      image:    state.entities[p.id]?.image    || p.image,
      images:   state.entities[p.id]?.images   ?? p.images,
    }));
    return adapter.setAll(enriched, { ...state, loading: false });
  }),
  on(ProductsActions.loadProductsFailure, (state, { error }) =>
    ({ ...state, loading: false, error })),

  on(ProductsActions.clearSelectedProduct, state => ({ ...state, selectedId: null, loading: true, selectedLoading: true })),
  on(ProductsActions.loadProduct, state => ({ ...state, loading: true, selectedLoading: true })),
  on(ProductsActions.loadProductSuccess, (state, { product }) =>
    adapter.upsertOne(product, { ...state, selectedId: product.id, loading: false, selectedLoading: false })),
  on(ProductsActions.loadProductFailure, (state, { error }) =>
    ({ ...state, loading: false, selectedLoading: false, error })),

  on(ProductsActions.createProductSuccess, (state, { product }) =>
    adapter.addOne(product, state)),
  on(ProductsActions.updateProductSuccess, (state, { product }) =>
    adapter.updateOne({ id: product.id, changes: product }, state)),
  on(ProductsActions.deleteProductSuccess, (state, { id }) =>
    adapter.removeOne(id, state)),
  on(ProductsActions.updateStockSuccess, (state, { id, stock }) =>
    adapter.updateOne({ id, changes: { stock } }, state)),
);

export const { selectAll, selectEntities, selectIds, selectTotal } = adapter.getSelectors();
