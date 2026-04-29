# Servicios necesarios — Forehapp Store

Mapa de todos los servicios backend requeridos para operar la tienda online completa.
Cada servicio está pensado como un módulo independiente, reemplazable en el frontend
simplemente cambiando el `service.ts` correspondiente.

---

## 1. Auth Service
**Responsabilidad:** Identidad y sesión de usuarios.

| Endpoint | Método | Descripción |
|---|---|---|
| `/auth/register` | POST | Crear cuenta cliente |
| `/auth/login` | POST | Login → devuelve JWT |
| `/auth/logout` | POST | Invalidar token |
| `/auth/refresh` | POST | Renovar JWT sin re-login |
| `/auth/me` | GET | Perfil del usuario autenticado |
| `/auth/password/reset` | POST | Solicitar reset de contraseña |
| `/auth/password/update` | PUT | Cambiar contraseña con token |

**Roles:** `CUSTOMER`, `ADMIN`  
**Token:** JWT con expiración corta + refresh token en cookie HttpOnly.

---

## 2. Product Service
**Responsabilidad:** Catálogo de productos.

| Endpoint | Método | Descripción |
|---|---|---|
| `/products` | GET | Listar productos (con filtros, paginación) |
| `/products/:id` | GET | Detalle de un producto |
| `/products` | POST | Crear producto *(ADMIN)* |
| `/products/:id` | PUT | Actualizar producto *(ADMIN)* |
| `/products/:id` | DELETE | Eliminar producto *(ADMIN)* |
| `/products/categories` | GET | Listar categorías disponibles |

**Filtros soportados:** `?cat=Raquetas&brand=Wilson&minPrice=100000&maxPrice=400000&inStock=true`  
**Variaciones:** El modelo incluye `variations.sizes[]` y `variations.colors[]`.

---

## 3. Inventory Service
**Responsabilidad:** Control de stock en tiempo real.

| Endpoint | Método | Descripción |
|---|---|---|
| `/inventory` | GET | Stock actual de todos los productos |
| `/inventory/:productId` | GET | Stock de un producto |
| `/inventory/:productId` | PATCH | Ajustar stock *(ADMIN)* |
| `/inventory/low-stock` | GET | Productos con stock ≤ umbral |
| `/inventory/movements` | GET | Historial de movimientos de stock |

**Regla de negocio:** Al confirmar un pedido, el stock se descuenta automáticamente. Si el stock llega a 0, el producto se marca como `Agotado`.

---

## 4. Cart Service
**Responsabilidad:** Carrito de compras persistente.

| Endpoint | Método | Descripción |
|---|---|---|
| `/cart` | GET | Obtener carrito del usuario |
| `/cart/items` | POST | Agregar ítem al carrito |
| `/cart/items/:key` | PATCH | Cambiar cantidad de un ítem |
| `/cart/items/:key` | DELETE | Eliminar ítem del carrito |
| `/cart` | DELETE | Vaciar carrito |

**Nota:** El carrito actual vive en NgRx (estado local). Conectar este servicio permite que el carrito persista entre sesiones y dispositivos.

---

## 5. Order Service
**Responsabilidad:** Ciclo de vida de los pedidos.

| Endpoint | Método | Descripción |
|---|---|---|
| `/orders` | POST | Crear pedido (checkout) |
| `/orders` | GET | Listar pedidos del usuario autenticado |
| `/orders/all` | GET | Listar todos los pedidos *(ADMIN)* |
| `/orders/:id` | GET | Detalle de un pedido |
| `/orders/:id/status` | PATCH | Cambiar estado del pedido *(ADMIN)* |
| `/orders/:id/cancel` | POST | Cancelar pedido (cliente o admin) |

**Estados:** `Pendiente → Confirmado → Enviado → Entregado / Cancelado`

---

## 6. Payment Service
**Responsabilidad:** Procesamiento de pagos.

| Endpoint | Método | Descripción |
|---|---|---|
| `/payments/intent` | POST | Crear intención de pago (Stripe / PayU) |
| `/payments/confirm` | POST | Confirmar pago exitoso |
| `/payments/webhook` | POST | Webhook del proveedor de pagos |
| `/payments/:orderId` | GET | Estado del pago de un pedido |
| `/payments/refund/:orderId` | POST | Procesar reembolso *(ADMIN)* |

**Integraciones sugeridas:**
- Colombia: **PayU**, **Wompi** (Bancolombia), PSE
- Internacional: **Stripe**

---

## 7. User / Customer Service
**Responsabilidad:** Perfil y direcciones de envío.

| Endpoint | Método | Descripción |
|---|---|---|
| `/users/profile` | GET / PUT | Ver y editar perfil |
| `/users/addresses` | GET | Listar direcciones guardadas |
| `/users/addresses` | POST | Agregar dirección |
| `/users/addresses/:id` | PUT / DELETE | Editar / eliminar dirección |
| `/users` | GET | Listar clientes *(ADMIN)* |
| `/users/:id` | GET | Detalle de un cliente *(ADMIN)* |

---

## 8. Discount / Coupon Service
**Responsabilidad:** Cupones y descuentos.

| Endpoint | Método | Descripción |
|---|---|---|
| `/discounts` | GET | Listar cupones *(ADMIN)* |
| `/discounts` | POST | Crear cupón *(ADMIN)* |
| `/discounts/:code` | PATCH | Activar / pausar cupón *(ADMIN)* |
| `/discounts/:code` | DELETE | Eliminar cupón *(ADMIN)* |
| `/discounts/validate/:code` | POST | Validar cupón en checkout |

**Tipos:** Porcentaje (`%`) o monto fijo (`COP`). Aplicable a toda la tienda o por categoría.

---

## 9. Notification Service
**Responsabilidad:** Emails y notificaciones al cliente.

| Trigger | Canal | Descripción |
|---|---|---|
| Registro exitoso | Email | Bienvenida + verificación |
| Pedido creado | Email | Confirmación con resumen |
| Pedido enviado | Email + SMS | Número de guía y tracking |
| Pedido entregado | Email | Encuesta de satisfacción |
| Stock bajo | Email | Alerta al administrador |
| Reset de contraseña | Email | Link con token temporal |

**Integraciones sugeridas:** SendGrid, AWS SES, Twilio (SMS).

---

## 10. Media / File Service
**Responsabilidad:** Subida y gestión de imágenes de productos.

| Endpoint | Método | Descripción |
|---|---|---|
| `/media/upload` | POST | Subir imagen (multipart) *(ADMIN)* |
| `/media/:id` | DELETE | Eliminar imagen *(ADMIN)* |

**Notas:** Actualmente los productos usan emojis como placeholder. Al integrar este servicio, el modelo `Product` agrega un campo `imageUrl`. Almacenamiento recomendado: AWS S3, Cloudinary.

---

## 11. Search Service
**Responsabilidad:** Búsqueda avanzada de productos.

| Endpoint | Método | Descripción |
|---|---|---|
| `/search` | GET | `?q=raqueta&cat=Raquetas&sort=price_asc` |
| `/search/suggestions` | GET | Autocompletado mientras el usuario escribe |

**Integración sugerida:** Elasticsearch, Algolia, o simplemente índice en PostgreSQL con `ILIKE`.

---

## 12. Analytics / Reporting Service
**Responsabilidad:** Datos para el dashboard de admin.

| Endpoint | Método | Descripción |
|---|---|---|
| `/analytics/revenue` | GET | Ingresos por período |
| `/analytics/orders` | GET | Pedidos por período / estado |
| `/analytics/top-products` | GET | Productos más vendidos |
| `/analytics/customers` | GET | Clientes nuevos vs recurrentes |
| `/analytics/conversion` | GET | Tasa de conversión |

**Parámetros comunes:** `?from=2026-01-01&to=2026-04-28&groupBy=month`

---

## 13. Shipping Service
**Responsabilidad:** Opciones de envío y tracking.

| Endpoint | Método | Descripción |
|---|---|---|
| `/shipping/rates` | POST | Calcular costo según dirección y peso |
| `/shipping/track/:code` | GET | Estado del envío |
| `/shipping/providers` | GET | Operadores disponibles |

**Integraciones sugeridas (Colombia):** Coordinadora, Servientrega, Interrapidísimo.

---

## Resumen de prioridades

| Prioridad | Servicio | Razón |
|---|---|---|
| **P0 — Crítico** | Auth, Product, Order, Payment | Sin estos no hay tienda |
| **P1 — Importante** | Inventory, Cart, Notification, User | Experiencia completa |
| **P2 — Valor agregado** | Discount, Media, Search | Mejoran conversión |
| **P3 — Operación** | Analytics, Shipping | Gestión y crecimiento |

---

## Cómo conectar al frontend actual

Cada servicio del frontend vive en `src/app/core/services/`.  
Hoy todos retornan `of(MOCK_DATA)`. Para conectar un endpoint real:

```typescript
// ANTES (mock)
getProducts(): Observable<Product[]> {
  return of(MOCK_PRODUCTS);
}

// DESPUÉS (real)
getProducts(): Observable<Product[]> {
  return this.http.get<Product[]>(`${environment.apiUrl}/products`);
}
```

Los effects, reducers y componentes **no requieren ningún cambio**.
