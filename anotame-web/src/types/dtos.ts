export interface GarmentTypeResponse {
  id: string;
  code: string;
  name: string;
  description: string;
}

export interface ServiceResponse {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultDurationMin: number;
  basePrice: number;
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
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  notes: string;
  adjustmentAmount?: number;
  adjustmentReason?: string;
}

export interface CreateOrderRequest {
  customer: CustomerDto;
  items: OrderItemDto[];
  committedDeadline: string; // ISO Date String
  notes: string;
}

export interface OrderItemResponse {
  id: string;
  garmentName: string;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  adjustmentAmount?: number;
  adjustmentReason?: string;
  notes: string;
}

export interface OrderResponse {
  id: string;
  ticketNumber: string;
  customer: CustomerDto;
  committedDeadline: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  paymentMethod: string;
  notes: string;
  items: OrderItemResponse[];
  createdAt: string;
}

export interface GarmentTypeRequest {
  code: string;
  name: string;
  description: string;
}

export interface ServiceRequest {
  code: string;
  name: string;
  description: string;
  defaultDurationMin: number;
  basePrice: number;
}

export interface WorkOrderItem {
  id: string;
  salesOrderItemId: string;
  serviceName: string;
  currentStage: string;
  notes: string;
}

export interface WorkOrder {
  id: string;
  salesOrderId: string;
  status: string; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  items: WorkOrderItem[];
  createdAt: string;
  updatedAt: string;
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
