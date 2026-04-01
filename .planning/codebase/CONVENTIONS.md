# Coding Conventions

**Analysis Date:** 2026-03-31

## Backend Java Conventions

### Framework & Runtime

All backend services use **Quarkus 3.27.2** (not Spring Boot). Java 17 is used in sales/operations/catalog services; identity-service uses Java 21. Build tool is **Maven** with the `quarkus-maven-plugin`. All services share the same group ID `com.anotame`.

### Package Naming

Each service follows a strict three-layer package layout under `com.anotame.<service-name>`:

```
com.anotame.sales.domain.model.*         # Pure domain models
com.anotame.sales.application.service.*  # Use-case orchestrators
com.anotame.sales.application.port.output.* # Repository port interfaces
com.anotame.sales.application.dto.*      # Request/response DTOs
com.anotame.sales.infrastructure.web.controller.*  # JAX-RS controllers
com.anotame.sales.infrastructure.persistence.entity.*  # JPA entities
com.anotame.sales.infrastructure.persistence.repository.* # Panache repos
com.anotame.sales.infrastructure.persistence.adapter.*    # Port adapters
com.anotame.sales.infrastructure.web.exception.*  # Exception mappers
```

Service-specific namespace examples:
- Identity: `com.anotame.identity`
- Catalog: `com.anotame.catalog`
- Sales: `com.anotame.sales`
- Operations: `com.anotame.operations`

### Class Naming Conventions

| Class Type | Suffix/Convention | Example |
|---|---|---|
| JAX-RS Controller | `Resource` (sales) or `Controller` (others) | `OrdersResource`, `EstablishmentController` |
| Application Service | `Service` or `ServiceImpl` | `SalesService`, `CustomerServiceImpl` |
| Repository Port Interface | `RepositoryPort` | `OrderRepositoryPort` |
| Persistence Adapter | `PersistenceAdapter` | `OrderPersistenceAdapter` |
| JPA Entity (sales) | `Entity` suffix | `OrderEntity`, `CustomerEntity` |
| JPA Entity (operations) | `Jpa` suffix | `EstablishmentJpa`, `WorkOrderJpa` |
| Domain Model | No suffix (plain name) | `Order`, `Customer`, `Establishment` |
| Request DTO | `Request` suffix | `CreateOrderRequest`, `RegisterRequest` |
| Response DTO | `Response` or `Dto` suffix | `OrderResponse`, `CustomerDto` |
| Exception | Extends `RuntimeException` | `FieldValidationException` |
| Exception Mapper | `GlobalExceptionHandler` | `GlobalExceptionHandler` |

Note: The JPA entity suffix is inconsistent across services (`Entity` in sales, `Jpa` in operations). Use `Entity` for new services to align with the majority.

### Lombok Usage

Use only the minimal set of Lombok annotations. Do not apply `@Data` to JPA entities (it causes Hibernate issues with bidirectional relationships).

**Approved patterns:**

```java
// Domain models and request DTOs: @Data is acceptable (no JPA)
@Data
public class CreateOrderRequest { ... }

// DTOs with all constructors needed for builders:
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest { ... }

// JPA entities: use @Getter @Setter only
@Entity
@Table(name = "tco_order")
@Getter
@Setter
public class OrderEntity { ... }

// Application services: use @RequiredArgsConstructor for constructor injection
@ApplicationScoped
@RequiredArgsConstructor
public class SalesService {
    private final OrderRepositoryPort orderRepository;
}
```

### Dependency Injection

Two injection styles coexist. Prefer `@RequiredArgsConstructor` (constructor injection via Lombok) over `@Inject` (field injection):

```java
// Preferred: constructor injection (SalesService, EstablishmentService pattern)
@ApplicationScoped
@RequiredArgsConstructor
public class MyService {
    private final MyRepositoryPort myRepository;
}

// Acceptable but non-preferred: field injection (OrderPersistenceAdapter pattern)
@ApplicationScoped
public class OrderPersistenceAdapter implements OrderRepositoryPort {
    @Inject
    OrderRepository orderRepository;
}
```

### Database Entity Conventions

- **Table name prefix per bounded context:**
  - Identity: `tca_` (e.g., `tca_user`)
  - Sales/Orders: `tco_` (e.g., `tco_order`)
  - Operations/Establishment: `tce_` (e.g., `tce_establishment`)
  - Catalog: inspect `catalog-service` for its prefix
- **Column names:** `snake_case` (e.g., `id_order`, `committed_deadline`, `created_at`)
- **Primary key:** UUID v4, column named `id_<entity>` (e.g., `id_order`, `id_user`)
- **Soft delete pattern (mandatory):**
  ```java
  @SQLDelete(sql = "UPDATE tco_order SET is_deleted = true, deleted_at = NOW() WHERE id_order = ?")
  @SQLRestriction("is_deleted = false")
  public class OrderEntity {
      @Column(name = "deleted_at")
      private LocalDateTime deletedAt;
      @Column(name = "is_deleted")
      private boolean deleted = false;
  }
  ```
- **Audit timestamps (mandatory on all transactional tables):**
  ```java
  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @UpdateTimestamp
  @Column(name = "updated_at")
  private LocalDateTime updatedAt;
  ```
- **Money:** Use `BigDecimal` with `precision = 19, scale = 4`.
- **Relationships:** Use `FetchType.LAZY` for `@ManyToOne` by default; `EAGER` only when always needed (e.g., `Role` on `User`).

### REST API Conventions

Controllers use JAX-RS annotations:

```java
@Path("/orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@io.quarkus.security.Authenticated
public class OrdersResource {

    @GET
    public List<OrderResponse> getOrders() { ... }

    @GET
    @Path("/{id}")
    public OrderResponse getOrder(@PathParam("id") UUID id) { ... }

    @POST
    public Order createOrder(@jakarta.validation.Valid CreateOrderRequest request) { ... }

    @PUT
    @Path("/{id}")
    public OrderResponse updateOrder(@PathParam("id") UUID id, ...) { ... }

    @DELETE
    @Path("/{id}")
    public void deleteOrder(@PathParam("id") UUID id) { ... }

    @PATCH
    @Path("/{id}/status")
    public void updateStatus(@PathParam("id") UUID id, Map<String, String> payload) { ... }
}
```

- All endpoints return JSON. Empty successful deletes return `void` (204).
- Use `@jakarta.validation.Valid` on request body parameters.
- User identity propagated via `@HeaderParam("X-User-Name")` header (set by API gateway).
- KPI/metrics endpoints live under `/kpi/` sub-path (e.g., `/orders/kpi/dashboard`).

### Error Response Format

The `GlobalExceptionHandler` (`anotame-api/backend/sales-service/src/main/java/com/anotame/sales/infrastructure/web/exception/GlobalExceptionHandler.java`) standardizes responses:

| Exception Type | HTTP Status | Body Format |
|---|---|---|
| `ConstraintViolationException` | 400 | `{ "fieldName": "validation message", ... }` |
| `FieldValidationException` | 400 | `{ "fieldName": "message" }` |
| `WebApplicationException` | (original status) | `{ "error": "message" }` |
| `PersistenceException` (FK conflict) | 409 | `{ "error": "No se puede eliminar..." }` |
| Unknown `RuntimeException` | 500 | `{ "error": "message" }` |

Custom domain validation exceptions must extend `FieldValidationException` found at `anotame-api/backend/sales-service/src/main/java/com/anotame/sales/domain/exception/FieldValidationException.java`.

### Bean Validation (Backend)

Use Jakarta Bean Validation on DTO fields:

```java
@Data
public class CreateOrderRequest {
    @FutureOrPresent(message = "La fecha de entrega debe ser hoy o en el futuro")
    private LocalDateTime committedDeadline;
}
```

Apply `@jakarta.validation.Valid` at the controller method level to trigger validation.

### Domain-to-Entity Mapping

All mapping between domain models and JPA entities is done **manually** (no MapStruct, no ModelMapper) inside persistence adapters. Pattern:

```java
// In PersistenceAdapter: entity → domain
private Order toDomain(OrderEntity entity) {
    Order o = new Order();
    o.setId(entity.getId());
    // ... field-by-field mapping
    return o;
}
```

### Logging

Use SLF4J with `LoggerFactory`:

```java
private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
log.error("Unhandled exception", exception);
```

---

## Frontend TypeScript/Svelte Conventions

### File Naming

| File Type | Convention | Example |
|---|---|---|
| Svelte components | `kebab-case.svelte` | `customer-dialog.svelte` |
| Svelte reactive services/state | `kebab-case.svelte.ts` | `api.svelte.ts`, `auth.svelte.ts` |
| Svelte reactive state classes | `PascalCase.svelte.ts` | `OrderWizardState.svelte.ts` |
| Type definition files | `camelCase.ts` | `dtos.ts` |
| Utility files | `camelCase.ts` | `formatUtils.ts`, `statusUtils.ts` |
| Guard files | `index.svelte.ts` | `src/lib/guards/index.svelte.ts` |
| Hook files | `use-kebab-case.svelte.ts` | `use-mobile.svelte.ts` |

### Svelte 5 Runes

Always use Svelte 5 runes. Never use `$store` syntax or Svelte 4 stores.

```svelte
<script lang="ts">
  let items = $state<any[]>([]);
  let loading = $state(true);
  let searchQuery = $state('');

  // Derived values
  const open = $derived(item !== null);

  // Side effects
  $effect(() => {
    if (item) {
      $form = { id: item.id || null, ... };
    }
  });

  // Props
  let { item, onClose, onSuccess } = $props<{
    item: any | null;
    onClose: () => void;
    onSuccess?: () => void;
  }>();
</script>
```

### Service Pattern

Services are class-based singletons exported as module-level instances. Files use the `.svelte.ts` extension when they contain rune usage.

```typescript
// src/lib/services/auth.svelte.ts
class AuthService {
    private userState = new PersistedState<User | null>('auth_user', null);

    get user(): User | null { return this.userState.current; }
    get isAuthenticated(): boolean { return this.user !== null; }

    async login(credentials: any): Promise<void> { ... }
    async logout(): Promise<void> { ... }
}

export const authService = new AuthService();
```

Use `runed`'s `PersistedState` for any state that must survive page reloads (e.g., auth user, order drafts).

### API Calls

All API calls go through `apiService` from `src/lib/services/api.svelte.ts`. Never call `fetch` directly.

```typescript
import { apiService, API_SALES, ApiValidationError } from '$lib/services/api.svelte';

// GET
const data = await apiService.request<MyType[]>(`${API_SALES}/api/customers`);

// POST/PUT/DELETE
await apiService.request(`${API_SALES}/api/customers/${id}`, {
  method: 'PUT',
  body: JSON.stringify(payload)
});
```

Available API base constants (from `src/lib/services/api.svelte.ts`):
- `API_IDENTITY = "/api/identity"`
- `API_CATALOG = "/api/catalog"`
- `API_SALES = "/api/sales"`
- `API_OPERATIONS = "/api/operations"`

### Error Handling (Frontend)

Backend errors are surfaced as `ApiValidationError` (field-level) or generic `Error`:

```typescript
try {
  await apiService.request(...);
} catch (e: any) {
  if (e instanceof ApiValidationError) {
    for (const [field, message] of Object.entries(e.validationErrors)) {
      setError(form, field as keyof typeof form.data, message);
    }
    toast.error("Por favor, revisa los campos marcados en rojo.");
  } else {
    toast.error(e.message || "Error al guardar.");
  }
}
```

Always use `toast` from `svelte-sonner` for user-facing notifications. Never use `alert()`.

### Form Handling

All forms use `sveltekit-superforms` in SPA mode with the Zod4 adapter. Define the schema inline in the component (not in a separate file), then use `superForm` with `SPA: true`.

```typescript
const mySchema = z.object({
  firstName: z.string().min(2, 'El nombre es obligatorio'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Debe ser un número de 10 dígitos'),
  email: z.string().email('Correo inválido').optional().or(z.literal(''))
});

const { form, enhance, errors, reset } = superForm(defaults(zod4(mySchema)), {
  SPA: true,
  validators: zod4(mySchema),
  async onUpdate({ form }) {
    if (!form.valid) return;
    // ... perform API call
  }
});
```

### Confirmation Dialogs

Never use `window.confirm()`. Use `adaptiveConfirm`:

```typescript
import { adaptiveConfirm } from '$lib/components/ui/responsive/confirm-state.svelte';

const ok = await adaptiveConfirm({
  title: 'Eliminar Cliente',
  description: '¿Seguro que deseas eliminar este registro?'
});
if (ok) { /* proceed */ }
```

### Adaptive UI Components

Use the wrappers in `src/lib/components/ui/responsive/` instead of native browser elements:

| Use case | Component | Never use |
|---|---|---|
| Select/dropdown | `AdaptiveSelect` | `<select>` directly |
| Date picker | `AdaptiveDatePicker` | `<input type="date">` directly |
| Date+time picker | `AdaptiveDateTimePicker` | `<input type="datetime-local">` directly |
| Confirmation | `adaptiveConfirm()` | `window.confirm()` |

### Single-Dialog Page Pattern

Each page uses a single dialog instance with a nullable `editingItem` state variable. Never mount multiple dialog instances.

```svelte
<!-- In +page.svelte -->
let editingCustomer = $state<any | null>(null);

function handleCreateClick() {
  editingCustomer = { id: null, firstName: '', ... };
}
function handleEditClick(customer: any) {
  editingCustomer = customer;
}

<!-- At page bottom, single instance -->
<CustomerDialog
  item={editingCustomer}
  onClose={() => editingCustomer = null}
  onSuccess={handleFormSuccess}
/>
```

### Auth Guards

Protect routes using guards from `src/lib/guards/index.svelte.ts`:

```svelte
<script lang="ts">
  import { useAuthGuard } from '$lib/guards';
  const guard = useAuthGuard();
</script>

{#if guard.checking}
  <p>Loading...</p>
{:else if guard.allowed}
  <!-- page content -->
{/if}
```

### TypeScript Types

Shared API contract types live in `src/lib/types/dtos.ts` as TypeScript interfaces (not Zod schemas). These mirror backend DTOs 1:1.

### Svelte Compiler Rules (Mandatory)

- Never use `<svelte:component>`. Map to uppercase variable: `{@const IconComponent = item.icon}` then `<IconComponent />`.
- `{@const}` must be a direct child of `{#each}` or `{#if}` blocks — never inside a plain HTML element.
- All `<label>` elements must use `for=` linked to an `id=` on the input.
- Never use `$state` or `$derived` in `<script module>` blocks. Move to a separate `.svelte.ts` file.
- Never use self-closing non-void HTML: write `<div></div>` not `<div />`.

### Import Aliases

Use `$lib/` for all imports from `src/lib/`:

```typescript
import { apiService } from '$lib/services/api.svelte';
import type { OrderResponse } from '$lib/types/dtos';
import { Button } from '$lib/components/ui/button';
```

---

## Internationalization

All user-visible text must use Paraglide i18n. Do not hardcode display strings. The `messages/` directory holds translation keys. Import message functions from the generated `$lib/paraglide/messages.js`.

---

## Build & Quality Gates

- Frontend: `bun run build` must exit 0 before committing.
- `bun run check` runs `svelte-check` for TypeScript errors.
- Backend: `mvn quarkus:build` per service.
- Full stack verification: `docker compose up --build`.

---

*Convention analysis: 2026-03-31*
