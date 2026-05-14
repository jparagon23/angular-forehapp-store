import { Routes } from '@angular/router';
import { sellerGuard } from './core/guards/seller.guard';

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
    path: 'orders',
    loadComponent: () => import('./features/orders/orders.component').then(m => m.OrdersComponent),
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./features/wishlist/wishlist.component').then(m => m.WishlistComponent),
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
        canActivate: [sellerGuard],
      },
      {
        path: 'products',
        loadComponent: () => import('./features/seller/products/seller-products.component').then(m => m.SellerProductsComponent),
        canActivate: [sellerGuard],
      },
      {
        path: 'products/create',
        loadComponent: () => import('./features/seller/products/create/product-create.component').then(m => m.ProductCreateComponent),
        canActivate: [sellerGuard],
      },
      {
        path: 'orders',
        loadComponent: () => import('./features/seller/orders/seller-orders.component').then(m => m.SellerOrdersComponent),
        canActivate: [sellerGuard],
      },
    ],
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'orders', loadComponent: () => import('./features/admin/orders/orders-admin.component').then(m => m.OrdersAdminComponent) },
      { path: 'products', loadComponent: () => import('./features/admin/products/products-admin.component').then(m => m.ProductsAdminComponent) },
      { path: 'inventory', loadComponent: () => import('./features/admin/inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: 'analytics', loadComponent: () => import('./features/admin/analytics/analytics.component').then(m => m.AnalyticsComponent) },
      { path: 'customers', loadComponent: () => import('./features/admin/customers/customers-admin.component').then(m => m.CustomersAdminComponent) },
      { path: 'discounts', loadComponent: () => import('./features/admin/discounts/discounts-admin.component').then(m => m.DiscountsAdminComponent) },
    ]
  },
  { path: '**', redirectTo: '' },
];
