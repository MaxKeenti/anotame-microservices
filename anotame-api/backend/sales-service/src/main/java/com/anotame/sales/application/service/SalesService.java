package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.AuditLogResponse;
import com.anotame.sales.application.dto.CreateOrderRequest;
import com.anotame.sales.application.dto.CustomerDto;
import com.anotame.sales.application.dto.OrderItemDto;
import com.anotame.sales.application.dto.UpdateOrderRequest;
import com.anotame.sales.domain.model.Customer;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.domain.model.OrderItem;
import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.application.port.output.AuditLogEntry;
import com.anotame.sales.application.port.output.OrderAuditLogRepositoryPort;
import lombok.RequiredArgsConstructor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import com.anotame.sales.application.dto.DashboardMetricsResponse;

@ApplicationScoped
@RequiredArgsConstructor
public class SalesService {

    private static final Set<String> VALID_STATUSES = Set.of(
            "RECEIVED", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED");

    private final OrderRepositoryPort orderRepository;
    private final CustomerRepositoryPort customerRepository;
    private final OrderAuditLogRepositoryPort auditLogRepositoryPort;

    @Transactional
    public com.anotame.sales.application.dto.OrderResponse createOrderDTO(CreateOrderRequest request, UUID userId,
            UUID branchId) {
        Order saved = createOrder(request, userId, branchId);
        return mapToResponse(saved);
    }

    @Transactional
    public Order createOrder(CreateOrderRequest request, UUID userId, UUID branchId) {
        // 1. Resolve or Create Customer
        Customer customer = resolveCustomer(request.getCustomer());

        // 2. Create Order
        Order order = new Order();
        order.setCustomer(customer);
        order.setCommittedDeadline(request.getCommittedDeadline());
        order.setNotes(request.getNotes());
        String ticketNumber = orderRepository.nextTicketNumber();
        order.setTicketNumber(ticketNumber);
        // folio_branch uses the same sequence value as ticketNumber for consistency.
        // Parse the numeric part from "ORD-00042" -> 42.
        int folioNumber = Integer.parseInt(ticketNumber.substring(4));
        order.setFolioBranch(folioNumber);
        order.setBranchId(branchId);
        order.setCreatedBy(userId);
        order.setCreatedAt(OffsetDateTime.now(ZoneId.systemDefault()));
        order.setUpdatedAt(OffsetDateTime.now(ZoneId.systemDefault()));
        order.setAmountPaid(request.getAmountPaid() != null ? request.getAmountPaid() : BigDecimal.ZERO);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPriceListId(request.getPriceListId());
        order.setPriceListName(request.getPriceListName());

        // Generate 6-digit pickup code
        int code = ThreadLocalRandom.current().nextInt(100_000, 1_000_000);
        order.setPickupCode(String.format("%06d", code));

        // 3. Add Items & Calculate Total
        BigDecimal total = BigDecimal.ZERO;
        int totalDuration = 0;

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
                    service.setDurationMin(serviceDto.getDurationMin() != null ? serviceDto.getDurationMin() : 0);

                    item.addService(service);

                    BigDecimal serviceTotal = service.getUnitPrice().add(service.getAdjustmentAmount());
                    itemSubtotal = itemSubtotal.add(serviceTotal);
                    totalDuration += (service.getDurationMin() * item.getQuantity());
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
        order.setTotalDurationMin(totalDuration);

        return orderRepository.save(order);
    }

    @Transactional
    public java.util.List<com.anotame.sales.application.dto.OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    private com.anotame.sales.application.dto.OrderResponse mapToResponse(Order order) {
        if (order.getCustomer() == null) {
            throw new RuntimeException("Order customer cannot be null");
        }
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
                            dto.setDurationMin(s.getDurationMin()); // Map duration to DTO
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
                .totalDurationMin(order.getTotalDurationMin())
                .pickupCode(order.getPickupCode())
                .deliveredAt(order.getDeliveredAt())
                .priceListId(order.getPriceListId())
                .priceListName(order.getPriceListName())
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

    public List<AuditLogResponse> getAuditLog(UUID orderId) {
        return auditLogRepositoryPort.findByOrderId(orderId).stream()
                .map(e -> new AuditLogResponse(e.userId(), e.fieldName(), e.oldValue(), e.newValue(), e.changedAt()))
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
    }

    @Transactional
    public com.anotame.sales.application.dto.OrderResponse updateOrder(UUID id, UpdateOrderRequest request, UUID userId,
            String role) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new WebApplicationException(
                        Response.status(404).entity(Map.of("error", "Pedido no encontrado")).build()));

        // Status lock: DELIVERED and CANCELLED orders cannot be edited
        if ("DELIVERED".equals(order.getStatus()) || "CANCELLED".equals(order.getStatus())) {
            throw new WebApplicationException(
                    Response.status(409)
                            .entity(Map.of("error", "No se puede editar un pedido entregado o cancelado"))
                            .build());
        }

        // Audit log: record per-field changes before applying updates
        OffsetDateTime now = OffsetDateTime.now();

        // Always-auditable fields (available to both ADMIN and EMPLOYEE)
        if (!Objects.equals(order.getNotes(), request.getNotes())) {
            auditLogRepositoryPort.save(buildAuditEntry(id, userId, "notes",
                    order.getNotes(), request.getNotes(), now));
        }
        if (!Objects.equals(order.getCommittedDeadline(), request.getCommittedDeadline())) {
            auditLogRepositoryPort.save(buildAuditEntry(id, userId, "committedDeadline",
                    order.getCommittedDeadline() != null ? order.getCommittedDeadline().toString() : null,
                    request.getCommittedDeadline() != null ? request.getCommittedDeadline().toString() : null,
                    now));
        }
        if (!Objects.equals(order.getAmountPaid(), request.getAmountPaid())) {
            auditLogRepositoryPort.save(buildAuditEntry(id, userId, "amountPaid",
                    order.getAmountPaid() != null ? order.getAmountPaid().toString() : null,
                    request.getAmountPaid() != null ? request.getAmountPaid().toString() : null,
                    now));
        }
        if (!Objects.equals(order.getPaymentMethod(), request.getPaymentMethod())) {
            auditLogRepositoryPort.save(buildAuditEntry(id, userId, "paymentMethod",
                    order.getPaymentMethod(), request.getPaymentMethod(), now));
        }

        if ("ADMIN".equals(role)) {
            // ADMIN: apply all fields including customer/garment/service changes
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

            // Replace items (full content update for ADMIN)
            if (request.getItems() != null) {
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
                        service.setDurationMin(serviceDto.getDurationMin() != null ? serviceDto.getDurationMin() : 0);

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

            // Recalculate total duration
            int totalDuration = order.getItems().stream()
                    .filter(item -> !item.isDeleted())
                    .mapToInt(item -> item.getServices().stream()
                            .mapToInt(s -> s.getDurationMin() != null ? s.getDurationMin() : 0)
                            .sum() * (item.getQuantity() != null ? item.getQuantity() : 1))
                    .sum();
            order.setTotalDurationMin(totalDuration);
            }
        } else {
            // EMPLOYEE (OPERATOR): only notes, committedDeadline, amountPaid, paymentMethod
            // Garment/service/customer fields are silently ignored
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
        }

        order.setUpdatedAt(OffsetDateTime.now(ZoneId.systemDefault()));

        Order saved = orderRepository.save(order);
        return mapToResponse(saved);
    }

    private AuditLogEntry buildAuditEntry(UUID orderId, UUID userId, String fieldName,
            String oldValue, String newValue, OffsetDateTime changedAt) {
        return new AuditLogEntry(orderId, userId, fieldName, oldValue, newValue, changedAt);
    }

    @Transactional
    public void updateOrderStatus(UUID id, String status) {
        if (status == null || !VALID_STATUSES.contains(status)) {
            throw new WebApplicationException(
                    Response.status(400)
                            .entity(Map.of("error", "Estado inválido: " + status))
                            .build());
        }
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        order.setUpdatedAt(OffsetDateTime.now(ZoneId.systemDefault()));
        orderRepository.save(order);
    }

    @Transactional
    public void deliverOrder(UUID orderId, String pickupCode, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new WebApplicationException(
                        Response.status(404).entity(Map.of("error", "Pedido no encontrado")).build()));

        if (!"READY".equals(order.getStatus())) {
            throw new WebApplicationException(
                    Response.status(409)
                            .entity(Map.of("error", "Solo se pueden entregar pedidos en estado LISTO"))
                            .build());
        }

        if (order.getPickupCode() == null || order.getPickupCode().isEmpty()) {
            throw new WebApplicationException(
                    Response.status(400)
                            .entity(Map.of("error", "Código de recogida no está disponible para este pedido"))
                            .build());
        }

        boolean valid = MessageDigest.isEqual(
                order.getPickupCode().getBytes(java.nio.charset.StandardCharsets.UTF_8),
                pickupCode.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        if (!valid) {
            throw new WebApplicationException(
                    Response.status(400)
                            .entity(Map.of("error", "Código de recogida incorrecto"))
                            .build());
        }

        OffsetDateTime deliveredAt = OffsetDateTime.now();
        order.setStatus("DELIVERED");
        order.setDeliveredAt(deliveredAt);
        order.setUpdatedAt(OffsetDateTime.now(ZoneId.systemDefault()));
        orderRepository.save(order);

        auditLogRepositoryPort.save(buildAuditEntry(
                orderId, userId, "status",
                "READY", "DELIVERED",
                deliveredAt));
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

    @Transactional
    public DashboardMetricsResponse getDashboardMetrics() {
        LocalDate today = LocalDate.now();
        OffsetDateTime startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
        OffsetDateTime startOfTomorrow = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
        OffsetDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();
        OffsetDateTime startOfNextMonth = startOfMonth.plusMonths(1);
        OffsetDateTime sevenDaysAgo = today.minusDays(6).atStartOfDay(ZoneId.systemDefault()).toOffsetDateTime();

        // Workload Metrics
        long todayDeliveries = orderRepository.countActiveByDeadlineRange(startOfDay, startOfTomorrow);
        long comingDeliveries = orderRepository.countActiveFromDeadline(startOfTomorrow);
        long readyForPickup = orderRepository.countByStatus("READY");

        List<String> finishedStatuses = Arrays.asList("READY", "DELIVERED", "CANCELLED");
        long pendingPipeline = orderRepository.countByStatusNotIn(finishedStatuses);
        long totalActive = pendingPipeline + readyForPickup;

        // Finance Metrics
        BigDecimal todayRevenue = orderRepository.sumPaidAmountInRange(startOfDay, startOfTomorrow);
        BigDecimal monthlyRevenue = orderRepository.sumPaidAmountInRange(startOfMonth, startOfNextMonth);
        BigDecimal pendingDebt = orderRepository.sumPendingDebt();

        // Chart Data
        List<Object[]> rawChartData = orderRepository.getWeeklyRevenueData(sevenDaysAgo);
        List<DashboardMetricsResponse.WeeklyChartPoint> chartData = new ArrayList<>();

        // Ensure all 7 days are populated even if empty
        DateTimeFormatter dtf = DateTimeFormatter.ISO_LOCAL_DATE;
        for (int i = 6; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            String dateStr = d.format(dtf);

            BigDecimal amount = BigDecimal.ZERO;
            for (Object[] row : rawChartData) {
                // row[0] is Date (java.sql.Date) or LocalDate, row[1] is BigDecimal
                String rowDate = row[0].toString();
                if (rowDate.equals(dateStr)) {
                    amount = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
                    break;
                }
            }

            chartData.add(DashboardMetricsResponse.WeeklyChartPoint.builder()
                    .date(dateStr)
                    .totalPaid(amount)
                    .build());
        }

        // Daily Workload (Next 30 days)
        OffsetDateTime endOfWorkloadRange = startOfDay.plusDays(30);
        List<Object[]> rawWorkloadData = orderRepository.getDailyWorkload(startOfDay, endOfWorkloadRange);
        List<DashboardMetricsResponse.WorkloadDayPoint> dailyWorkload = new ArrayList<>();

        for (int i = 0; i < 30; i++) {
            LocalDate d = today.plusDays(i);
            String dateStr = d.format(dtf);
            long mins = 0;
            for (Object[] row : rawWorkloadData) {
                if (row[0].toString().equals(dateStr)) {
                    mins = row[1] != null ? ((Number) row[1]).longValue() : 0;
                    break;
                }
            }
            dailyWorkload.add(DashboardMetricsResponse.WorkloadDayPoint.builder()
                    .date(dateStr)
                    .totalMinutesUsed(mins)
                    .build());
        }

        return DashboardMetricsResponse.builder()
                .workload(DashboardMetricsResponse.WorkloadMetrics.builder()
                        .todayDeliveries(todayDeliveries)
                        .comingDeliveries(comingDeliveries)
                        .pendingPipeline(pendingPipeline)
                        .readyForPickup(readyForPickup)
                        .totalActive(totalActive)
                        .build())
                .finance(DashboardMetricsResponse.FinanceMetrics.builder()
                        .todayRevenue(todayRevenue)
                        .monthlyRevenue(monthlyRevenue)
                        .pendingDebt(pendingDebt)
                        .build())
                .weeklyRevenueChart(chartData)
                .dailyWorkload(dailyWorkload)
                .build();
    }
}
