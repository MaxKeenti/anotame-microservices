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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
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

        // 3. Add Items & Calculate Total
        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemDto itemDto : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setGarmentTypeId(itemDto.getGarmentTypeId());
            item.setGarmentName(itemDto.getGarmentName());
            item.setServiceId(itemDto.getServiceId());
            item.setServiceName(itemDto.getServiceName());
            item.setUnitPrice(itemDto.getUnitPrice());
            item.setQuantity(itemDto.getQuantity());
            item.setNotes(itemDto.getNotes());

            BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setSubtotal(subtotal);

            order.addItem(item); // bi-directional setting
            total = total.add(subtotal);
        }

        order.setTotalAmount(total);

        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
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

        java.util.List<com.anotame.sales.application.dto.OrderItemResponse> items = order.getItems().stream()
                .map(item -> com.anotame.sales.application.dto.OrderItemResponse.builder()
                        .id(item.getId())
                        .garmentName(item.getGarmentName())
                        .serviceName(item.getServiceName())
                        .unitPrice(item.getUnitPrice())
                        .quantity(item.getQuantity())
                        .subtotal(item.getSubtotal())
                        .notes(item.getNotes())
                        .build())
                .collect(java.util.stream.Collectors.toList());

        return com.anotame.sales.application.dto.OrderResponse.builder()
                .id(order.getId())
                .ticketNumber(order.getTicketNumber())
                .customer(custDto)
                .committedDeadline(order.getCommittedDeadline())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .notes(order.getNotes())
                .items(items)
                .createdAt(order.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
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

        // For items, we replace them
        // Note: This is a heavy operation, effectively replacing the order content
        order.getItems().clear();
        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemDto itemDto : request.getItems()) {
            OrderItem item = new OrderItem();
            item.setGarmentTypeId(itemDto.getGarmentTypeId());
            item.setGarmentName(itemDto.getGarmentName());
            item.setServiceId(itemDto.getServiceId());
            item.setServiceName(itemDto.getServiceName());
            item.setUnitPrice(itemDto.getUnitPrice());
            item.setQuantity(itemDto.getQuantity());
            item.setNotes(itemDto.getNotes());

            BigDecimal subtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setSubtotal(subtotal);

            order.addItem(item);
            total = total.add(subtotal);
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
        if (dto.getEmail() != null) {
            var existing = customerRepository.findByEmail(dto.getEmail());
            if (existing.isPresent())
                return existing.get();
        }

        // Create new
        Customer newCustomer = new Customer();
        newCustomer.setFirstName(dto.getFirstName());
        newCustomer.setLastName(dto.getLastName());
        newCustomer.setEmail(dto.getEmail());
        newCustomer.setPhone(dto.getPhone());
        newCustomer.setAddress(dto.getAddress());

        return customerRepository.save(newCustomer);
    }
}
