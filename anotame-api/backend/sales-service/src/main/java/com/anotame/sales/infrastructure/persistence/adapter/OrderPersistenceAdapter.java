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
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class OrderPersistenceAdapter implements OrderRepositoryPort {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final EntityManager em;

    @Override
    @Transactional
    public Order save(Order order) {
        OrderEntity entity;
        if (order.getId() != null) {
            entity = orderRepository.findById(order.getId());
            if (entity == null) {
                entity = new OrderEntity();
            }
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
        entity.setCreatedAt(order.getCreatedAt());
        entity.setUpdatedAt(order.getUpdatedAt());
        entity.setTotalDurationMin(order.getTotalDurationMin());
        entity.setPickupCode(order.getPickupCode());
        entity.setDeliveredAt(order.getDeliveredAt());
        entity.setPriceListId(order.getPriceListId());
        entity.setPriceListName(order.getPriceListName());

        entity.getItems().clear();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                OrderItemEntity ie = new OrderItemEntity();
                ie.setGarmentTypeId(item.getGarmentTypeId());
                ie.setGarmentName(item.getGarmentName());
                ie.setQuantity(item.getQuantity());
                ie.setUnitPrice(item.getUnitPrice());
                ie.setSubtotal(item.getSubtotal());
                ie.setNotes(item.getNotes());

                if (item.getServices() != null) {
                    for (com.anotame.sales.domain.model.OrderItemService service : item.getServices()) {
                        com.anotame.sales.infrastructure.persistence.entity.OrderItemServiceEntity se = new com.anotame.sales.infrastructure.persistence.entity.OrderItemServiceEntity();
                        se.setServiceId(service.getServiceId());
                        se.setServiceName(service.getServiceName());
                        se.setUnitPrice(service.getUnitPrice());
                        se.setAdjustmentAmount(service.getAdjustmentAmount());
                        se.setAdjustmentReason(service.getAdjustmentReason());
                        se.setDurationMin(service.getDurationMin());
                        se.setOrderItem(ie);
                        ie.getServices().add(se);
                    }
                }

                entity.addItem(ie);
                ie.setOrder(entity);
            }
        }

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
        return orderRepository.listAll().stream().map(this::toDomain).toList();
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

    @Override
    public long countActiveByDeadlineRange(java.time.OffsetDateTime start, java.time.OffsetDateTime end) {
        return orderRepository.countActiveByDeadlineRange(start, end);
    }

    @Override
    public long countActiveFromDeadline(java.time.OffsetDateTime start) {
        return orderRepository.countActiveFromDeadline(start);
    }

    @Override
    public long countByStatusNotIn(java.util.List<String> excludedStatuses) {
        return orderRepository.countByStatusNotIn(excludedStatuses);
    }

    @Override
    public long countByStatus(String status) {
        return orderRepository.countByStatus(status);
    }

    @Override
    public java.math.BigDecimal sumPaidAmountInRange(java.time.OffsetDateTime start, java.time.OffsetDateTime end) {
        return orderRepository.sumPaidAmountInRange(start, end);
    }

    @Override
    public java.math.BigDecimal sumPendingDebt() {
        return orderRepository.sumPendingDebt();
    }

    @Override
    public java.util.List<Object[]> getWeeklyRevenueData(java.time.OffsetDateTime start, String zoneId) {
        return orderRepository.getWeeklyRevenueData(start, zoneId);
    }

    @Override
    public java.util.List<Object[]> getDailyWorkload(java.time.OffsetDateTime start, java.time.OffsetDateTime end,
            String zoneId) {
        return orderRepository.getDailyWorkload(start, end, zoneId);
    }

    @Override
    public String nextTicketNumber() {
        Long next = ((Number) em.createNativeQuery(
                "SELECT nextval('tco_ticket_number_seq')").getSingleResult()).longValue();
        return String.format("ORD-%05d", next);
    }

    @Override
    public java.util.List<Object[]> getRevenueTimeSeries(java.time.OffsetDateTime start, String granularity, String zoneId) {
        return orderRepository.getRevenueTimeSeries(start, granularity, zoneId);
    }

    @Override
    public java.util.List<Object[]> getServiceTypeRevenue(java.time.OffsetDateTime start, java.time.OffsetDateTime end) {
        return orderRepository.getServiceTypeRevenue(start, end);
    }

    @Override
    public java.util.List<Object[]> getTopCustomers(java.time.OffsetDateTime start, java.time.OffsetDateTime end, int limit) {
        return orderRepository.getTopCustomers(start, end, limit);
    }

    @Override
    public java.util.List<Object[]> getAtRiskCustomers(java.time.LocalDate cutoffDate, String zoneId, int limit) {
        return orderRepository.getAtRiskCustomers(cutoffDate, zoneId, limit);
    }

    @Override
    public java.util.List<Object[]> getCalendarMonthData(java.time.OffsetDateTime monthStart, java.time.OffsetDateTime monthEnd, String zoneId) {
        return orderRepository.getCalendarMonthData(monthStart, monthEnd, zoneId);
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
        o.setTotalDurationMin(entity.getTotalDurationMin());
        o.setPickupCode(entity.getPickupCode());
        o.setDeliveredAt(entity.getDeliveredAt());
        o.setPriceListId(entity.getPriceListId());
        o.setPriceListName(entity.getPriceListName());

        if (entity.getCustomer() != null) {
            com.anotame.sales.domain.model.Customer c = new com.anotame.sales.domain.model.Customer();
            c.setId(entity.getCustomer().getId());
            c.setFirstName(entity.getCustomer().getFirstName());
            c.setLastName(entity.getCustomer().getLastName());
            c.setEmail(entity.getCustomer().getEmail());
            c.setPhoneNumber(entity.getCustomer().getPhoneNumber());
            o.setCustomer(c);
        }

        if (entity.getItems() != null) {
            for (OrderItemEntity ie : entity.getItems()) {
                OrderItem item = new OrderItem();
                item.setId(ie.getId());
                item.setGarmentTypeId(ie.getGarmentTypeId());
                item.setGarmentName(ie.getGarmentName());
                item.setQuantity(ie.getQuantity());
                item.setUnitPrice(ie.getUnitPrice());
                item.setSubtotal(ie.getSubtotal());
                item.setNotes(ie.getNotes());

                if (ie.getServices() != null) {
                    for (com.anotame.sales.infrastructure.persistence.entity.OrderItemServiceEntity se : ie
                            .getServices()) {
                        com.anotame.sales.domain.model.OrderItemService s = new com.anotame.sales.domain.model.OrderItemService();
                        s.setId(se.getId());
                        s.setServiceId(se.getServiceId());
                        s.setServiceName(se.getServiceName());
                        s.setUnitPrice(se.getUnitPrice());
                        s.setAdjustmentAmount(se.getAdjustmentAmount());
                        s.setAdjustmentReason(se.getAdjustmentReason());
                        s.setDurationMin(se.getDurationMin());
                        item.addService(s);
                    }
                }

                o.addItem(item);
            }
        }
        return o;
    }

    @Override
    public Object[] getRepeatRate(java.time.OffsetDateTime start, java.time.OffsetDateTime end) {
        return orderRepository.getRepeatRate(start, end);
    }

}
