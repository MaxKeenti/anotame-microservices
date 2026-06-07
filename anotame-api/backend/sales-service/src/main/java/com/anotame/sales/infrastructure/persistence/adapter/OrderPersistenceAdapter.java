package com.anotame.sales.infrastructure.persistence.adapter;

import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.application.port.output.OrderSummaryCriteria;
import com.anotame.sales.application.port.output.OrderSummaryProjection;
import com.anotame.sales.application.port.output.OrderSummaryResult;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.domain.model.OrderItem;
import com.anotame.sales.infrastructure.persistence.entity.CustomerEntity;
import com.anotame.sales.infrastructure.persistence.entity.OrderEntity;
import com.anotame.sales.infrastructure.persistence.entity.OrderItemEntity;
import com.anotame.sales.infrastructure.persistence.repository.CustomerRepository;
import com.anotame.sales.infrastructure.persistence.repository.OrderRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
    public OrderSummaryResult findSummaries(int page, int size, OrderSummaryCriteria criteria) {
        String fromClause = buildSummaryFromClause(criteria);

        Query countQuery = em.createQuery("select count(o.id)" + fromClause);
        bindSummaryParameters(countQuery, criteria);
        long total = ((Number) countQuery.getSingleResult()).longValue();

        var dataQuery = em.createQuery(
                "select o.id, o.ticketNumber, c.id, c.firstName, c.lastName, c.email, c.phoneNumber, " +
                        "o.committedDeadline, o.status, o.totalAmount, o.amountPaid, o.totalDurationMin, " +
                        "o.createdAt, o.deliveredAt" +
                        fromClause +
                        " order by o.createdAt desc, o.ticketNumber desc",
                Object[].class);
        bindSummaryParameters(dataQuery, criteria);
        dataQuery.setFirstResult(page * size);
        dataQuery.setMaxResults(size);

        var rows = dataQuery.getResultList();
        List<UUID> orderIds = new ArrayList<>(rows.size());
        for (var row : rows) {
            orderIds.add((UUID) row[0]);
        }
        Map<UUID, List<String>> garmentNames = findGarmentNames(orderIds);
        Map<UUID, List<String>> serviceNames = findServiceNames(orderIds);

        List<OrderSummaryProjection> items = new ArrayList<>(rows.size());
        for (var row : rows) {
            UUID orderId = (UUID) row[0];
            items.add(new OrderSummaryProjection(
                    orderId,
                    (String) row[1],
                    (UUID) row[2],
                    (String) row[3],
                    (String) row[4],
                    (String) row[5],
                    (String) row[6],
                    (OffsetDateTime) row[7],
                    (String) row[8],
                    (BigDecimal) row[9],
                    (BigDecimal) row[10],
                    (Integer) row[11],
                    (OffsetDateTime) row[12],
                    (OffsetDateTime) row[13],
                    garmentNames.getOrDefault(orderId, List.of()),
                    serviceNames.getOrDefault(orderId, List.of())));
        }

        return new OrderSummaryResult(items, total);
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

    private String buildSummaryFromClause(OrderSummaryCriteria criteria) {
        List<String> predicates = new ArrayList<>();
        if (criteria.search() != null) {
            predicates.add("(" +
                    "lower(o.ticketNumber) like :search or " +
                    "lower(c.firstName) like :search or " +
                    "lower(coalesce(c.lastName, '')) like :search or " +
                    "lower(coalesce(c.phoneNumber, '')) like :search" +
                    ")");
        }
        if (criteria.garmentTypeId() != null) {
            predicates.add("exists (" +
                    "select i.id from OrderItemEntity i " +
                    "where i.order = o and i.garmentTypeId = :garmentTypeId" +
                    ")");
        }
        if (criteria.deadlineStart() != null && criteria.deadlineEnd() != null) {
            predicates.add("o.committedDeadline >= :deadlineStart and o.committedDeadline < :deadlineEnd");
        }
        if (criteria.statuses() != null && !criteria.statuses().isEmpty()) {
            predicates.add("o.status in :statuses");
        }

        if (predicates.isEmpty()) {
            return " from OrderEntity o join o.customer c";
        }
        return " from OrderEntity o join o.customer c where " + String.join(" and ", predicates);
    }

    private void bindSummaryParameters(Query query, OrderSummaryCriteria criteria) {
        if (criteria.search() != null) {
            query.setParameter("search", "%" + criteria.search().toLowerCase(Locale.ROOT) + "%");
        }
        if (criteria.garmentTypeId() != null) {
            query.setParameter("garmentTypeId", criteria.garmentTypeId());
        }
        if (criteria.deadlineStart() != null && criteria.deadlineEnd() != null) {
            query.setParameter("deadlineStart", criteria.deadlineStart());
            query.setParameter("deadlineEnd", criteria.deadlineEnd());
        }
        if (criteria.statuses() != null && !criteria.statuses().isEmpty()) {
            query.setParameter("statuses", criteria.statuses());
        }
    }

    private Map<UUID, List<String>> findGarmentNames(List<UUID> orderIds) {
        if (orderIds.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = em.createQuery(
                "select i.order.id, i.garmentName " +
                        "from OrderItemEntity i " +
                        "where i.order.id in :orderIds " +
                        "order by i.order.id, i.id",
                Object[].class)
                .setParameter("orderIds", orderIds)
                .getResultList();
        return groupNamesByOrder(rows);
    }

    private Map<UUID, List<String>> findServiceNames(List<UUID> orderIds) {
        if (orderIds.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = em.createQuery(
                "select s.orderItem.order.id, s.serviceName " +
                        "from OrderItemServiceEntity s " +
                        "where s.orderItem.order.id in :orderIds and s.orderItem.deleted = false " +
                        "order by s.orderItem.order.id, s.orderItem.id, s.id",
                Object[].class)
                .setParameter("orderIds", orderIds)
                .getResultList();
        return groupNamesByOrder(rows);
    }

    private Map<UUID, List<String>> groupNamesByOrder(List<Object[]> rows) {
        Map<UUID, List<String>> grouped = new HashMap<>();
        for (Object[] row : rows) {
            String name = (String) row[1];
            if (name == null || name.isBlank()) {
                continue;
            }
            grouped.computeIfAbsent((UUID) row[0], ignored -> new ArrayList<>()).add(name);
        }
        return grouped;
    }

}
