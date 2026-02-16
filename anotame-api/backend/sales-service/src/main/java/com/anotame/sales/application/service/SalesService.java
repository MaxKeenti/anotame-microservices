package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.CreateOrderRequest;
import com.anotame.sales.application.dto.CustomerDto;
import com.anotame.sales.application.dto.OrderItemDto;
import com.anotame.sales.domain.model.Customer;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.domain.model.OrderItem;
import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import lombok.RequiredArgsConstructor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class SalesService {

    private final OrderRepositoryPort orderRepository;
    private final CustomerRepositoryPort customerRepository;

    @Transactional
    public Order createOrder(CreateOrderRequest request, String username) {
        // 1. Resolve or Create Customer
        Customer customer = resolveCustomer(request.getCustomer());

        // 2. Create Order
        Order order = new Order();
        order.setCustomer(customer);
        order.setCommittedDeadline(request.getCommittedDeadline());
        order.setNotes(request.getNotes());
        order.setTicketNumber("ORD-" + System.currentTimeMillis() % 10000); // Simple ID generation
        order.setFolioBranch(1); // Default Folio for test
        order.setBranchId(UUID.fromString("ea22f4a4-5504-43d9-92f9-30cc17b234d1")); // Default Branch
        order.setCreatedBy(UUID.nameUUIDFromBytes(username.getBytes())); // Deterministic UUID from username
        order.setCreatedAt(LocalDateTime.now());
        order.setAmountPaid(request.getAmountPaid() != null ? request.getAmountPaid() : BigDecimal.ZERO);
        order.setPaymentMethod(request.getPaymentMethod());

        // 3. Add Items & Calculate Total
        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemDto itemDto : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setGarmentTypeId(itemDto.getGarmentTypeId());
            item.setGarmentName(itemDto.getGarmentName());
            item.setQuantity(itemDto.getQuantity());
            item.setNotes(itemDto.getNotes());

            BigDecimal itemSubtotal = BigDecimal.ZERO;

            if (itemDto.getServices() != null) {
                for (com.anotame.sales.application.dto.OrderItemServiceDto serviceDto : itemDto.getServices()) {
                    com.anotame.sales.domain.model.OrderItemService service = new com.anotame.sales.domain.model.OrderItemService();
                    service.setServiceId(serviceDto.getServiceId());
                    service.setServiceName(serviceDto.getServiceName());
                    service.setUnitPrice(serviceDto.getUnitPrice());
                    service.setAdjustmentAmount(
                            serviceDto.getAdjustmentAmount() != null ? serviceDto.getAdjustmentAmount()
                                    : BigDecimal.ZERO);
                    service.setAdjustmentReason(serviceDto.getAdjustmentReason());

                    item.addService(service);

                    BigDecimal serviceTotal = service.getUnitPrice().add(service.getAdjustmentAmount());
                    itemSubtotal = itemSubtotal.add(serviceTotal);
                }
            }

            // Subtotal = (Sum(Service Prices + Adjustments)) * Quantity
            item.setUnitPrice(itemSubtotal); // Set unit price (per item subtotal)
            BigDecimal lineTotal = itemSubtotal.multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setSubtotal(lineTotal);

            order.addItem(item); // bi-directional setting
            total = total.add(lineTotal);
        }

        order.setTotalAmount(total);

        return orderRepository.save(order);
    }

    @Transactional
    public java.util.List<com.anotame.sales.application.dto.OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    private com.anotame.sales.application.dto.OrderResponse mapToResponse(Order order) {
        CustomerDto custDto = new CustomerDto();
        custDto.setId(order.getCustomer().getId());
        custDto.setFirstName(order.getCustomer().getFirstName());
        custDto.setLastName(order.getCustomer().getLastName());
        custDto.setEmail(order.getCustomer().getEmail());
        custDto.setPhoneNumber(order.getCustomer().getPhoneNumber());

        java.util.List<com.anotame.sales.application.dto.OrderItemResponse> items = order.getItems().stream()
                .map(item -> {
                    java.util.List<com.anotame.sales.application.dto.OrderItemServiceDto> serviceDtos = new java.util.ArrayList<>();
                    if (item.getServices() != null) {
                        serviceDtos = item.getServices().stream().map(s -> {
                            com.anotame.sales.application.dto.OrderItemServiceDto dto = new com.anotame.sales.application.dto.OrderItemServiceDto();
                            dto.setServiceId(s.getServiceId());
                            dto.setServiceName(s.getServiceName());
                            dto.setUnitPrice(s.getUnitPrice());
                            dto.setAdjustmentAmount(s.getAdjustmentAmount());
                            dto.setAdjustmentReason(s.getAdjustmentReason());
                            return dto;
                        }).collect(java.util.stream.Collectors.toList());
                    }

                    return com.anotame.sales.application.dto.OrderItemResponse.builder()
                            .id(item.getId())
                            .garmentName(item.getGarmentName())
                            .services(serviceDtos)
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .subtotal(item.getSubtotal())
                            .notes(item.getNotes())
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());

        return com.anotame.sales.application.dto.OrderResponse.builder()
                .id(order.getId())
                .ticketNumber(order.getTicketNumber())
                .customer(custDto)
                .committedDeadline(order.getCommittedDeadline())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .amountPaid(order.getAmountPaid())
                .paymentMethod(order.getPaymentMethod())
                .notes(order.getNotes())
                .items(items)
                .createdAt(order.getCreatedAt())
                .build();
    }

    @Transactional
    public com.anotame.sales.application.dto.OrderResponse getOrder(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        return mapToResponse(order);
    }

    @Transactional
    public void deleteOrder(UUID id) {
        orderRepository.delete(id);
    }

    @Transactional
    public com.anotame.sales.application.dto.OrderResponse updateOrder(UUID id, CreateOrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Update fields
        if (request.getNotes() != null) {
            order.setNotes(request.getNotes());
        }
        if (request.getCommittedDeadline() != null) {
            order.setCommittedDeadline(request.getCommittedDeadline());
        }
        if (request.getAmountPaid() != null) {
            order.setAmountPaid(request.getAmountPaid());
        }
        if (request.getPaymentMethod() != null) {
            order.setPaymentMethod(request.getPaymentMethod());
        }

        // For items, we replace them
        // Note: This is a heavy operation, effectively replacing the order content
        order.getItems().clear();
        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemDto itemDto : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setGarmentTypeId(itemDto.getGarmentTypeId());
            item.setGarmentName(itemDto.getGarmentName());
            item.setQuantity(itemDto.getQuantity());
            item.setNotes(itemDto.getNotes());

            BigDecimal itemSubtotal = BigDecimal.ZERO;

            if (itemDto.getServices() != null) {
                for (com.anotame.sales.application.dto.OrderItemServiceDto serviceDto : itemDto.getServices()) {
                    com.anotame.sales.domain.model.OrderItemService service = new com.anotame.sales.domain.model.OrderItemService();
                    service.setServiceId(serviceDto.getServiceId());
                    service.setServiceName(serviceDto.getServiceName());
                    service.setUnitPrice(serviceDto.getUnitPrice());
                    service.setAdjustmentAmount(
                            serviceDto.getAdjustmentAmount() != null ? serviceDto.getAdjustmentAmount()
                                    : BigDecimal.ZERO);
                    service.setAdjustmentReason(serviceDto.getAdjustmentReason());

                    item.addService(service);

                    BigDecimal serviceTotal = service.getUnitPrice().add(service.getAdjustmentAmount());
                    itemSubtotal = itemSubtotal.add(serviceTotal);
                }
            }

            BigDecimal lineTotal = itemSubtotal.multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setUnitPrice(itemSubtotal);
            item.setSubtotal(lineTotal);

            order.addItem(item);
            total = total.add(lineTotal);
        }
        order.setTotalAmount(total);

        Order saved = orderRepository.save(order);
        return mapToResponse(saved);
    }

    @Transactional
    public void updateOrderStatus(UUID id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        orderRepository.save(order);
    }

    private Customer resolveCustomer(CustomerDto dto) {
        UUID customerId = dto.getId();
        if (customerId != null) {
            return customerRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
        }

        // Check by existing unique fields
        if (dto.getPhoneNumber() != null) {
            var existing = customerRepository.findByPhoneNumber(dto.getPhoneNumber()); // Assuming port has this
            if (existing.isPresent())
                return existing.get();
        }

        // Create new
        Customer newCustomer = new Customer();
        newCustomer.setFirstName(dto.getFirstName());
        newCustomer.setLastName(dto.getLastName());
        newCustomer.setEmail(dto.getEmail());
        newCustomer.setPhoneNumber(dto.getPhoneNumber());
        newCustomer.setPreferences(dto.getPreferences());

        return customerRepository.save(newCustomer);
    }
}
