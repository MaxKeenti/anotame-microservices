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
