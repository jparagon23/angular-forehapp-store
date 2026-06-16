import { Routes } from '@angular/router';
import { sellerGuard } from './core/guards/seller.guard';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { ambassadorGuard } from './core/guards/ambassador.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/catalog/catalog.component').then(m => m.CatalogComponent),
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./features/product-detail/product-detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: 'payment/success',
    loadComponent: () => import('./features/thanks/thanks.component').then(m => m.ThanksComponent),
  },
  {
    path: 'payment/failure',
    loadComponent: () => import('./features/payment-failure/payment-failure.component').then(m => m.PaymentFailureComponent),
  },
  {
    path: 'payment/pending',
    loadComponent: () => import('./features/payment-pending/payment-pending.component').then(m => m.PaymentPendingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'verify-code',
    loadComponent: () => import('./features/auth/verify-code/verify-code.component').then(m => m.VerifyCodeComponent),
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },
  {
    path: 'checkout/start',
    loadComponent: () => import('./features/checkout-entry/checkout-entry.component').then(m => m.CheckoutEntryComponent),
  },
  {
    path: 'checkout/guest',
    loadComponent: () => import('./features/guest-checkout/guest-checkout.component').then(m => m.GuestCheckoutComponent),
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent),
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./features/wishlist/wishlist.component').then(m => m.WishlistComponent),
    canActivate: [authGuard],
  },
  {
    path: 'my-reviews',
    loadComponent: () => import('./features/my-reviews/my-reviews.component').then(m => m.MyReviewsComponent),
  },
  {
    path: 'my-returns',
    loadComponent: () => import('./features/my-returns/my-returns.component').then(m => m.MyReturnsComponent),
  },
  {
    path: 'account/addresses',
    loadComponent: () => import('./features/account/addresses/addresses.component').then(m => m.AddressesComponent),
  },
  {
    path: 'seller',
    loadComponent: () => import('./features/seller/seller.component').then(m => m.SellerComponent),
    canActivate: [sellerGuard],
    children: [
      { path: '', redirectTo: 'stats', pathMatch: 'full' },
      {
        path: 'stats',
        loadComponent: () => import('./features/seller/stats/seller-stats.component').then(m => m.SellerStatsComponent),
      },
      {
        path: 'products',
        loadComponent: () => import('./features/seller/products/seller-products.component').then(m => m.SellerProductsComponent),
      },
      {
        path: 'products/create',
        loadComponent: () => import('./features/seller/products/create/product-create.component').then(m => m.ProductCreateComponent),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./features/seller/products/edit/product-edit.component').then(m => m.ProductEditComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/seller/orders/seller-orders.component').then(m => m.SellerOrdersComponent),
      },
      {
        path: 'coupons',
        loadComponent: () => import('./features/seller/coupons/seller-coupons.component').then(m => m.SellerCouponsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/seller/settings/seller-settings.component').then(m => m.SellerSettingsComponent),
      },
    ],
  },
  {
    path: 'stores',
    loadComponent: () => import('./features/stores/my-stores.component').then(m => m.MyStoresComponent),
    canActivate: [authGuard],
  },
  {
    path: 'stores/:storeId',
    loadComponent: () => import('./features/stores/store-detail/store-detail.component').then(m => m.StoreDetailComponent),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'orders', loadComponent: () => import('./features/admin/orders/orders-admin.component').then(m => m.OrdersAdminComponent) },
      { path: 'products', loadComponent: () => import('./features/admin/products/products-admin.component').then(m => m.ProductsAdminComponent) },
      { path: 'inventory', loadComponent: () => import('./features/admin/inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: 'brands', loadComponent: () => import('./features/admin/brands/brands-admin.component').then(m => m.BrandsAdminComponent) },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/analytics.component').then(m => m.AnalyticsComponent) },
      { path: 'customers', loadComponent: () => import('./features/admin/customers/customers-admin.component').then(m => m.CustomersAdminComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/users/users-admin.component').then(m => m.UsersAdminComponent) },
      { path: 'discounts', loadComponent: () => import('./features/admin/discounts/discounts-admin.component').then(m => m.DiscountsAdminComponent) },
      { path: 'donations', loadComponent: () => import('./features/admin/donations/donations-admin.component').then(m => m.DonationsAdminComponent) },
      { path: 'reviews',  loadComponent: () => import('./features/admin/reviews/reviews-admin.component').then(m => m.ReviewsAdminComponent) },
      { path: 'returns',  loadComponent: () => import('./features/admin/returns/returns-admin.component').then(m => m.ReturnsAdminComponent) },
      { path: 'stores',   loadComponent: () => import('./features/admin/stores/stores-admin.component').then(m => m.StoresAdminComponent) },
      { path: 'shipping-zones', loadComponent: () => import('./features/admin/shipping-zones/shipping-zones.component').then(m => m.ShippingZonesComponent) },
      { path: 'ambassadors',    loadComponent: () => import('./features/admin/ambassadors/ambassadors-admin.component').then(m => m.AmbassadorsAdminComponent) },
    ]
  },
  {
    path: 'ambassador',
    loadComponent: () => import('./features/ambassador/ambassador.component').then(m => m.AmbassadorComponent),
    canActivate: [ambassadorGuard],
  },
  { path: '**', redirectTo: '' },
];
