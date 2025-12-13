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
}

export interface CustomerDto {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

export interface OrderItemDto {
  garmentTypeId: string;
  garmentName: string;
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  quantity: number;
  notes: string;
}

export interface CreateOrderRequest {
  customer: CustomerDto;
  items: OrderItemDto[];
  committedDeadline: string; // ISO Date String
  notes: string;
}
