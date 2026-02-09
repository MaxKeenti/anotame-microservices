package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.domain.model.OrderItem;
import com.anotame.sales.infrastructure.persistence.entity.CustomerEntity;
import com.anotame.sales.infrastructure.persistence.entity.OrderEntity;
import com.anotame.sales.infrastructure.persistence.entity.OrderItemEntity;
import com.anotame.sales.infrastructure.persistence.repository.CustomerRepository;
import com.anotame.sales.infrastructure.persistence.repository.OrderRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class OrderPersistenceAdapter implements OrderRepositoryPort {

    @Inject
    OrderRepository orderRepository;

    @Inject
    CustomerRepository customerRepository;

    @Override
    @Transactional
    public Order save(Order order) {
        OrderEntity entity;
        if (order.getId() != null) {
            entity = orderRepository.findById(order.getId());
            if (entity == null)
                entity = new OrderEntity();
        } else {
            entity = new OrderEntity();
        }

        entity.setTicketNumber(order.getTicketNumber());
        entity.setFolioBranch(order.getFolioBranch());
        entity.setBranchId(order.getBranchId());
        entity.setStatus(order.getStatus());
        entity.setTotalAmount(order.getTotalAmount());
        entity.setNotes(order.getNotes());
        entity.setAmountPaid(order.getAmountPaid());
        entity.setPaymentMethod(order.getPaymentMethod());
        entity.setCommittedDeadline(order.getCommittedDeadline());
        entity.setCreatedBy(order.getCreatedBy());

        // Map items
        // Simplified: Clear and re-add for now, or careful merge.
        // Given complexity, let's assume creation mainly.
        // For updates, we'd need smarter diffing.
        // Assuming creation for MVP migration step.
        entity.getItems().clear();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                OrderItemEntity ie = new OrderItemEntity();
                ie.setGarmentTypeId(item.getGarmentTypeId());
                ie.setServiceId(item.getServiceId());
                ie.setServiceName(item.getServiceName());
                ie.setGarmentName(item.getGarmentName());
                ie.setUnitPrice(item.getUnitPrice());
                ie.setQuantity(item.getQuantity());
                ie.setSubtotal(item.getSubtotal());
                ie.setAdjustmentAmount(item.getAdjustmentAmount());
                ie.setAdjustmentReason(item.getAdjustmentReason());
                ie.setNotes(item.getNotes());
                entity.addItem(ie);
            }
        }

        // Link Customer (Must exist)
        if (order.getCustomer() != null && order.getCustomer().getId() != null) {
            CustomerEntity customerEntity = customerRepository.findById(order.getCustomer().getId());
            if (customerEntity != null) {
                entity.setCustomer(customerEntity);
            }
        }

        orderRepository.persist(entity);
        return toDomain(entity);
    }

    @Override
    public List<Order> findAll() {
        return orderRepository.listAll().stream().map(this::toDomain).collect(Collectors.toList());
    }

    @Override
    public Optional<Order> findById(UUID id) {
        return orderRepository.findByIdOptional(id).map(this::toDomain);
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        orderRepository.deleteById(id);
    }

    private Order toDomain(OrderEntity entity) {
        Order o = new Order();
        o.setId(entity.getId());
        o.setTicketNumber(entity.getTicketNumber());
        o.setFolioBranch(entity.getFolioBranch());
        o.setBranchId(entity.getBranchId());
        o.setCommittedDeadline(entity.getCommittedDeadline());
        o.setStatus(entity.getStatus());
        o.setTotalAmount(entity.getTotalAmount());
        o.setNotes(entity.getNotes());
        o.setAmountPaid(entity.getAmountPaid());
        o.setPaymentMethod(entity.getPaymentMethod());
        o.setCreatedAt(entity.getCreatedAt());
        o.setCreatedBy(entity.getCreatedBy());
        o.setUpdatedAt(entity.getUpdatedAt());
        o.setDeletedAt(entity.getDeletedAt());
        o.setDeleted(entity.isDeleted());

        // Map Customer (Simplified)
        if (entity.getCustomer() != null) {
            com.anotame.sales.domain.model.Customer c = new com.anotame.sales.domain.model.Customer();
            c.setId(entity.getCustomer().getId());
            c.setFirstName(entity.getCustomer().getFirstName());
            c.setLastName(entity.getCustomer().getLastName());
            c.setEmail(entity.getCustomer().getEmail());
            c.setPhoneNumber(entity.getCustomer().getPhoneNumber());
            o.setCustomer(c);
        }

        // Map Items
        if (entity.getItems() != null) {
            for (OrderItemEntity ie : entity.getItems()) {
                OrderItem item = new OrderItem();
                item.setId(ie.getId());
                item.setGarmentTypeId(ie.getGarmentTypeId());
                item.setServiceId(ie.getServiceId());
                item.setServiceName(ie.getServiceName());
                item.setGarmentName(ie.getGarmentName());
                item.setUnitPrice(ie.getUnitPrice());
                item.setQuantity(ie.getQuantity());
                item.setSubtotal(ie.getSubtotal());
                item.setAdjustmentAmount(ie.getAdjustmentAmount());
                item.setAdjustmentReason(ie.getAdjustmentReason());
                item.setNotes(ie.getNotes());
                o.addItem(item);
            }
        }
        return o;
    }
}
