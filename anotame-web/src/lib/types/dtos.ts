export interface GarmentTypeResponse {
  id: string;
  name: string;
  description: string;
}

export interface ServiceResponse {
  id: string;
  name: string;
  description: string;
  defaultDurationMin: number;
  basePrice: number;
  effectivePrice?: number;
  garmentTypeId?: string;
}

export interface CustomerDto {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  preferences?: Record<string, any>;
}

export interface OrderItemDto {
  garmentTypeId: string;
  garmentName: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    unitPrice: number;
    adjustmentAmount?: number;
    adjustmentReason?: string;
  }>;
  quantity: number;
  notes: string;
}

export interface CreateOrderRequest {
  customer: CustomerDto;
  items: OrderItemDto[];
  committedDeadline: string; // ISO Date String
  notes: string;
}

export interface OrderItemResponse {
  id: string;
  garmentTypeId: string;
  garmentName: string;
  services: Array<{
    serviceId: string;
    serviceName: string;
    unitPrice: number;
    adjustmentAmount?: number;
    adjustmentReason?: string;
  }>;
  quantity: number;
  subtotal: number;
  notes: string;
}

export interface OrderResponse {
  id: string;
  ticketNumber: string;
  customer: CustomerDto;
  committedDeadline: string;
  status: string;
  totalAmount: number;
  totalDurationMin?: number;
  amountPaid: number;
  paymentMethod: string;
  notes: string;
  items: OrderItemResponse[];
  createdAt: string;
  pickupCode?: string;
  deliveredAt?: string;  // ISO string (OffsetDateTime serialized)
  priceListId?: string | null;
  priceListName?: string | null;
}

export interface OrderSummaryResponse {
  id: string;
  ticketNumber: string;
  customer: CustomerDto;
  committedDeadline?: string | null;
  status: string;
  totalAmount: number;
  totalDurationMin?: number;
  amountPaid: number;
  createdAt?: string;
  deliveredAt?: string | null;
  garmentNames: string[];
  serviceNames: string[];
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface WorkloadDayResponse {
  date: string;
  totalMinutesUsed: number;
}

export interface CalendarDayResponse {
  date: string;
  totalMinutesUsed: number;
  orderCount: number;
  scheduledRevenue: number;
  capacityPercent: number;
  isHoliday: boolean;
  isOpen: boolean;
}

export interface CalendarMonthResponse {
  days: CalendarDayResponse[];
}

export interface GarmentTypeRequest {
  name: string;
  description: string;
}

export interface ServiceRequest {
  name: string;
  description: string;
  defaultDurationMin: number;
  basePrice: number;
  garmentTypeId?: string;
}

export interface PriceListItemDto {
  serviceId: string;
  serviceName: string;
  price: number;
  basePrice: number;
}

export interface PriceListResponse {
  id: string;
  name: string;
  validFrom: string;
  validTo?: string;
  active: boolean;
  priority: number;
  items?: PriceListItemDto[];
}

export interface PriceListRequest {
  name: string;
  validFrom: string;
  validTo?: string;
  active: boolean;
  priority: number;
  items?: Array<{ serviceId: string; price: number }>;
}

export interface WorkDay {
  id?: string;
  dayOfWeek: number; // 1=Mon, 7=Sun
  open: boolean;
  openTime?: string; // HH:mm:ss
  closeTime?: string; // HH:mm:ss
}

export interface Holiday {
  id?: string;
  date: string; // YYYY-MM-DD
  description: string;
}

export interface Establishment {
  id?: string;
  name: string;
  ownerName?: string;
  taxInfo?: string; // JSON
  active: boolean;
  dailyCapacityMinutes?: number;
  capacityThresholdGreen?: number;
  capacityThresholdAmber?: number;
  atRiskDaysThreshold?: number;
  primaryColor?: string | null;
  fontFamily?: string | null;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  password?: string; // Optional if we auto-generate or something, but usually required
}
