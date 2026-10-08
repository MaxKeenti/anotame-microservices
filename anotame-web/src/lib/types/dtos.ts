/**
 * Request and response shapes used across the app.
 *
 * Everything here derives from the backend contracts in `./api/*.d.ts`, which are generated
 * (`bun run gen:api`). Alias a schema directly when the backend type is what the app uses;
 * refine it only where the contract cannot say what the app needs.
 */
import type { components as Catalog } from './api/catalog';
import type { components as Identity } from './api/identity';
import type { components as Operations } from './api/operations';
import type { components as Sales } from './api/sales';

type CatalogSchemas = Catalog['schemas'];
type IdentitySchemas = Identity['schemas'];
type OperationsSchemas = Operations['schemas'];
type SalesSchemas = Sales['schemas'];

/** `K` may be missing or null: the backend leaves it unset, or the app omits it when sending. */
type Unset<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] | null };

// Catalog
export type GarmentTypeResponse = CatalogSchemas['GarmentTypeResponse'];
export type GarmentTypeRequest = CatalogSchemas['GarmentTypeRequest'];
export type ServiceResponse = CatalogSchemas['ServiceResponse'];
export type ServiceRequest = CatalogSchemas['ServiceRequest'];
export type PriceListItemDto = CatalogSchemas['PriceListItemDto'];
export type PriceListResponse = CatalogSchemas['PriceListResponse'];
export type PriceListRequest = CatalogSchemas['PriceListRequest'];

// Sales
export type CustomerDto = SalesSchemas['CustomerDto'];
export type OrderContentSource = SalesSchemas['OrderContentSource'];
export type OrderItemServiceDto = SalesSchemas['OrderItemServiceDto'];
export type OrderItemDto = SalesSchemas['OrderItemDto'];
export type CreateOrderRequest = SalesSchemas['CreateOrderRequest'];
export type OrderItemResponse = SalesSchemas['OrderItemResponse'];
export type OrderResponse = SalesSchemas['OrderResponse'];
export type OrderSummaryResponse = SalesSchemas['OrderSummaryResponse'];
export type TicketShareScope = SalesSchemas['TicketShareScope'];
export type TicketShareResponse = SalesSchemas['TicketShareResponse'];
export type CreatedTicketShareResponse = SalesSchemas['CreatedTicketShareResponse'];
export type PublicHandlingTicketResponse = SalesSchemas['PublicHandlingTicketResponse'];
export type PublicTicketResponse = SalesSchemas['PublicTicketResponse'];
export type WorkloadDayResponse = SalesSchemas['WorkloadDayPoint'];
export type CalendarDayResponse = SalesSchemas['CalendarDayResponse'];
export type CalendarMonthResponse = SalesSchemas['CalendarMonthResponse'];
export type PaymentResponse = SalesSchemas['PaymentResponse'];
export type AuditLogResponse = SalesSchemas['AuditLogResponse'];
export type DashboardMetricsResponse = SalesSchemas['DashboardMetricsResponse'];
export type ReceivablesResponse = SalesSchemas['ReceivablesResponse'];
export type ReceivableOrderPageResponse = SalesSchemas['ReceivableOrderPageResponse'];
export type FinancialKpiResponse = SalesSchemas['FinancialKpiResponse'];

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

// Operations
// These three are the backend's domain models, returned and accepted as they are, so the
// contract carries no nullability for them; the fields below are the ones that can be unset.
export type PublicReceiptSettings = OperationsSchemas['PublicReceiptSettingsResponse'];
export type WorkDay = Unset<OperationsSchemas['WorkDay'], 'id' | 'openTime' | 'closeTime'>;
export type Holiday = Unset<OperationsSchemas['Holiday'], 'id'>;
export type Establishment = Unset<
  OperationsSchemas['Establishment'],
  | 'id'
  | 'ownerName'
  | 'taxInfo'
  | 'dailyCapacityMinutes'
  | 'capacityThresholdGreen'
  | 'capacityThresholdAmber'
  | 'atRiskDaysThreshold'
  | 'primaryColor'
  | 'fontFamily'
>;

// Identity
export type UserResponse = IdentitySchemas['UserResponse'];
export type CreateUserRequest = IdentitySchemas['CreateUserRequest'];
