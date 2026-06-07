package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.AuditLogResponse;
import com.anotame.sales.application.dto.CreateOrderRequest;
import com.anotame.sales.application.dto.CustomerDto;
import com.anotame.sales.application.dto.OrderItemDto;
import com.anotame.sales.application.dto.UpdateOrderRequest;
import com.anotame.sales.domain.exception.SalesConflictException;
import com.anotame.sales.domain.exception.SalesNotFoundException;
import com.anotame.sales.domain.exception.SalesValidationException;
import com.anotame.sales.application.dto.CalendarDayResponse;
import com.anotame.sales.application.dto.CalendarMonthResponse;
import com.anotame.sales.application.dto.OrderItemResponse;
import com.anotame.sales.application.dto.OrderItemServiceDto;
import com.anotame.sales.application.dto.OrderResponse;
import com.anotame.sales.domain.model.Customer;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.domain.model.OrderItem;
import com.anotame.sales.domain.model.OrderItemService;
import com.anotame.sales.domain.model.OrderPayment;
import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.application.port.output.OrderPaymentRepositoryPort;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.application.port.output.AuditLogEntry;
import com.anotame.sales.application.port.output.OrderAuditLogRepositoryPort;
import lombok.RequiredArgsConstructor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

import com.anotame.sales.application.dto.AtRiskCustomerItem;
import com.anotame.sales.application.dto.DashboardMetricsResponse;
import com.anotame.sales.application.dto.FinancialKpiResponse;
import com.anotame.sales.application.dto.RevenueTrendPoint;
import com.anotame.sales.application.dto.ServiceRevenueItem;
import com.anotame.sales.application.dto.TopCustomerItem;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
@RequiredArgsConstructor
public class SalesService {

    private static final Set<String> VALID_STATUSES = Set.of(
            "RECEIVED", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED");
    private static final Set<String> VALID_PAYMENT_METHODS = Set.of("CASH", "CARD", "TRANSFER");
    private static final String DEFAULT_PAYMENT_METHOD = "CASH";
    private static final String DELIVERY_SETTLEMENT_NOTE = "DELIVERY_SETTLEMENT";

    private final OrderRepositoryPort orderRepository;
    private final CustomerRepositoryPort customerRepository;
    private final OrderAuditLogRepositoryPort auditLogRepositoryPort;
    private final OrderPaymentRepositoryPort paymentRepository;

    @ConfigProperty(name = "app.timezone", defaultValue = "America/Mexico_City")
    String appTimezone;

    @Transactional
    public OrderResponse createOrderDTO(CreateOrderRequest request, UUID userId,
            UUID branchId) {
        Order saved = createOrder(request, userId, branchId);
        return mapToResponse(saved);
    }

    private Order createOrder(CreateOrderRequest request, UUID userId, UUID branchId) {
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
        // amountPaid starts at 0; the ledger entry below drives the denormalized cache
        order.setAmountPaid(BigDecimal.ZERO);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPriceListId(request.getPriceListId());
        order.setPriceListName(request.getPriceListName());

        // Generate 6-digit pickup code
        int code = ThreadLocalRandom.current().nextInt(100_000, 1_000_000);
        order.setPickupCode(String.format("%06d", code));

        // 3. Add Items & Calculate Total
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItemDto itemDto : request.getItems()) {
            OrderItem item = buildOrderItem(itemDto);
            order.addItem(item); // bi-directional setting
            total = total.add(item.getSubtotal());
        }

        order.setTotalAmount(total);
        order.setTotalDurationMin(calculateTotalDuration(order));

        Order saved = orderRepository.save(order);

        // If an initial payment was provided at order creation, create the ledger entry
        BigDecimal initialPayment = request.getAmountPaid();
        if (initialPayment != null && initialPayment.compareTo(BigDecimal.ZERO) > 0) {
            OffsetDateTime now = OffsetDateTime.now();
            OrderPayment payment = new OrderPayment();
            payment.setOrderId(saved.getId());
            payment.setAmount(initialPayment);
            payment.setPaymentMethod(request.getPaymentMethod());
            payment.setRecordedAt(now);
            payment.setCreatedAt(now);
            paymentRepository.save(payment);

            saved.setAmountPaid(initialPayment);
            saved = orderRepository.save(saved);
        }

        return saved;
    }

    @Transactional
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    private OrderResponse mapToResponse(Order order) {
        if (order.getCustomer() == null) {
            throw new IllegalStateException("Order customer cannot be null");
        }
        CustomerDto custDto = new CustomerDto();
        custDto.setId(order.getCustomer().getId());
        custDto.setFirstName(order.getCustomer().getFirstName());
        custDto.setLastName(order.getCustomer().getLastName());
        custDto.setEmail(order.getCustomer().getEmail());
        custDto.setPhoneNumber(order.getCustomer().getPhoneNumber());

        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> {
                    List<OrderItemServiceDto> serviceDtos = new ArrayList<>();
                    if (item.getServices() != null) {
                        serviceDtos = item.getServices().stream().map(s -> {
                            OrderItemServiceDto dto = new OrderItemServiceDto();
                            dto.setServiceId(s.getServiceId());
                            dto.setServiceName(s.getServiceName());
                            dto.setUnitPrice(s.getUnitPrice());
                            dto.setAdjustmentAmount(s.getAdjustmentAmount());
                            dto.setAdjustmentReason(s.getAdjustmentReason());
                            dto.setDurationMin(s.getDurationMin()); // Map duration to DTO
                            return dto;
                        }).toList();
                    }

                    return OrderItemResponse.builder()
                            .id(item.getId())
                            .garmentTypeId(item.getGarmentTypeId())
                            .garmentName(item.getGarmentName())
                            .services(serviceDtos)
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .subtotal(item.getSubtotal())
                            .notes(item.getNotes())
                            .build();
                })
                .toList();

        return OrderResponse.builder()
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
    public OrderResponse getOrder(UUID id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new SalesNotFoundException("Order not found"));
        return mapToResponse(order);
    }

    @Transactional
    public void deleteOrder(UUID id) {
        orderRepository.delete(id);
    }

    public List<AuditLogResponse> getAuditLog(UUID orderId) {
        return auditLogRepositoryPort.findByOrderId(orderId).stream()
                .map(e -> new AuditLogResponse(e.userId(), e.fieldName(), e.oldValue(), e.newValue(), e.changedAt()))
                .toList();
    }

    @Transactional
    public OrderResponse updateOrder(UUID id, UpdateOrderRequest request, UUID userId,
            String role) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new SalesNotFoundException("Pedido no encontrado"));

        // Status lock: DELIVERED and CANCELLED orders cannot be edited
        if ("DELIVERED".equals(order.getStatus()) || "CANCELLED".equals(order.getStatus())) {
            throw new SalesConflictException("No se puede editar un pedido entregado o cancelado");
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
        if ("ADMIN".equals(role)) {
            // ADMIN: apply all fields including customer/garment/service changes
            if (request.getNotes() != null) {
                order.setNotes(request.getNotes());
            }
            if (request.getCommittedDeadline() != null) {
                order.setCommittedDeadline(request.getCommittedDeadline());
            }

            // Replace items (full content update for ADMIN)
            if (request.getItems() != null) {
                order.getItems().clear();
                BigDecimal total = BigDecimal.ZERO;
                for (OrderItemDto itemDto : request.getItems()) {
                    OrderItem item = buildOrderItem(itemDto);
                    order.addItem(item);
                    total = total.add(item.getSubtotal());
                }
                order.setTotalAmount(total);
                order.setTotalDurationMin(calculateTotalDuration(order));
            }
        } else {
            // EMPLOYEE (OPERATOR): only notes, committedDeadline
            // Payment fields are managed exclusively through POST /orders/{id}/payments
            if (request.getNotes() != null) {
                order.setNotes(request.getNotes());
            }
            if (request.getCommittedDeadline() != null) {
                order.setCommittedDeadline(request.getCommittedDeadline());
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
            throw new SalesValidationException("Estado inválido: " + status);
        }
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new SalesNotFoundException("Order not found"));
        order.setStatus(status);
        order.setUpdatedAt(OffsetDateTime.now(ZoneId.systemDefault()));
        orderRepository.save(order);
    }

    @Transactional
    public void deliverOrder(UUID orderId, String pickupCode, UUID userId, boolean markFullyPaid,
                             String paymentMethod) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new SalesNotFoundException("Pedido no encontrado"));

        if (!"READY".equals(order.getStatus())) {
            throw new SalesConflictException("Solo se pueden entregar pedidos en estado LISTO");
        }

        if (order.getPickupCode() == null || order.getPickupCode().isEmpty()) {
            throw new SalesValidationException("Código de recogida no está disponible para este pedido");
        }

        boolean valid = MessageDigest.isEqual(
                order.getPickupCode().getBytes(StandardCharsets.UTF_8),
                pickupCode.getBytes(StandardCharsets.UTF_8));
        if (!valid) {
            throw new SalesValidationException("Código de recogida incorrecto");
        }

        OffsetDateTime deliveredAt = OffsetDateTime.now(ZoneId.systemDefault());
        if (markFullyPaid) {
            settleRemainingBalance(order, orderId, paymentMethod, deliveredAt);
        }

        order.setStatus("DELIVERED");
        order.setDeliveredAt(deliveredAt);
        order.setUpdatedAt(deliveredAt);
        orderRepository.save(order);

        auditLogRepositoryPort.save(buildAuditEntry(
                orderId, userId, "status",
                "READY", "DELIVERED",
                deliveredAt));
    }

    private void settleRemainingBalance(Order order, UUID orderId, String requestedPaymentMethod,
                                        OffsetDateTime recordedAt) {
        BigDecimal totalAmount = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal amountPaid = paymentRepository.sumByOrderId(orderId);
        BigDecimal remainingBalance = totalAmount.subtract(amountPaid);

        if (remainingBalance.compareTo(BigDecimal.ZERO) <= 0) {
            order.setAmountPaid(amountPaid);
            return;
        }

        OrderPayment payment = new OrderPayment();
        payment.setOrderId(orderId);
        payment.setAmount(remainingBalance);
        payment.setPaymentMethod(resolvePaymentMethod(requestedPaymentMethod, order.getPaymentMethod()));
        payment.setNotes(DELIVERY_SETTLEMENT_NOTE);
        payment.setRecordedAt(recordedAt);
        payment.setCreatedAt(recordedAt);
        paymentRepository.save(payment);

        order.setAmountPaid(amountPaid.add(remainingBalance));
    }

    private String resolvePaymentMethod(String requestedPaymentMethod, String orderPaymentMethod) {
        if (requestedPaymentMethod != null && !requestedPaymentMethod.isBlank()) {
            String normalized = requestedPaymentMethod.trim().toUpperCase();
            if (VALID_PAYMENT_METHODS.contains(normalized)) {
                return normalized;
            }
            throw new SalesValidationException("Método de pago inválido: " + requestedPaymentMethod);
        }

        if (orderPaymentMethod != null && !orderPaymentMethod.isBlank()) {
            String normalized = orderPaymentMethod.trim().toUpperCase();
            if (VALID_PAYMENT_METHODS.contains(normalized)) {
                return normalized;
            }
        }

        return DEFAULT_PAYMENT_METHOD;
    }

    /**
     * Builds a persistent-ready {@link OrderItem} from its DTO, attaching services and computing
     * the per-item unit price (sum of service prices + adjustments) and line subtotal (× quantity).
     */
    private OrderItem buildOrderItem(OrderItemDto itemDto) {
        OrderItem item = new OrderItem();
        item.setGarmentTypeId(itemDto.getGarmentTypeId());
        item.setGarmentName(itemDto.getGarmentName());
        item.setQuantity(itemDto.getQuantity());
        item.setNotes(itemDto.getNotes());

        BigDecimal itemSubtotal = BigDecimal.ZERO;
        if (itemDto.getServices() != null) {
            for (OrderItemServiceDto serviceDto : itemDto.getServices()) {
                OrderItemService service = new OrderItemService();
                service.setServiceId(serviceDto.getServiceId());
                service.setServiceName(serviceDto.getServiceName());
                service.setUnitPrice(serviceDto.getUnitPrice());
                service.setAdjustmentAmount(
                        serviceDto.getAdjustmentAmount() != null ? serviceDto.getAdjustmentAmount() : BigDecimal.ZERO);
                service.setAdjustmentReason(serviceDto.getAdjustmentReason());
                service.setDurationMin(serviceDto.getDurationMin() != null ? serviceDto.getDurationMin() : 0);

                item.addService(service);
                itemSubtotal = itemSubtotal.add(service.getUnitPrice().add(service.getAdjustmentAmount()));
            }
        }

        item.setUnitPrice(itemSubtotal);
        item.setSubtotal(itemSubtotal.multiply(BigDecimal.valueOf(item.getQuantity())));
        return item;
    }

    /** Sums duration across all non-deleted items: Σ(service minutes) × item quantity. */
    private int calculateTotalDuration(Order order) {
        return order.getItems().stream()
                .filter(item -> !item.isDeleted())
                .mapToInt(item -> item.getServices().stream()
                        .mapToInt(s -> s.getDurationMin() != null ? s.getDurationMin() : 0)
                        .sum() * (item.getQuantity() != null ? item.getQuantity() : 1))
                .sum();
    }

    private Customer resolveCustomer(CustomerDto dto) {
        UUID customerId = dto.getId();
        if (customerId != null) {
            return customerRepository.findById(customerId)
                    .orElseThrow(() -> new SalesNotFoundException("Customer not found"));
        }

        // Check by existing unique fields
        if (dto.getPhoneNumber() != null) {
            var existing = customerRepository.findByPhoneNumber(dto.getPhoneNumber());
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
        return getDashboardMetrics(null);
    }

    @Transactional
    public DashboardMetricsResponse getDashboardMetrics(String monthParam) {
        ZoneId zone = ZoneId.of(appTimezone);
        String zoneId = zone.getId();
        LocalDate today = LocalDate.now(zone);
        YearMonth selectedMonth = parseMonthParam(monthParam, today);
        OffsetDateTime startOfDay = today.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime startOfTomorrow = today.plusDays(1).atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime startOfMonth = selectedMonth.atDay(1).atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime startOfNextMonth = startOfMonth.plusMonths(1);
        OffsetDateTime sevenDaysAgo = today.minusDays(6).atStartOfDay(zone).toOffsetDateTime();

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

        // Chart Data — index raw rows by date (row[0]) for O(1) lookup while filling every day.
        // row[0] is Date (java.sql.Date) or LocalDate, row[1] is BigDecimal.
        List<Object[]> rawChartData = orderRepository.getWeeklyRevenueData(sevenDaysAgo, zoneId);
        Map<String, Object[]> chartByDate = rawChartData.stream()
                .collect(Collectors.toMap(row -> row[0].toString(), row -> row, (a, b) -> a));
        List<DashboardMetricsResponse.WeeklyChartPoint> chartData = new ArrayList<>();

        // Ensure all 7 days are populated even if empty
        DateTimeFormatter dtf = DateTimeFormatter.ISO_LOCAL_DATE;
        for (int i = 6; i >= 0; i--) {
            String dateStr = today.minusDays(i).format(dtf);
            Object[] row = chartByDate.get(dateStr);
            BigDecimal amount = row != null && row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            chartData.add(DashboardMetricsResponse.WeeklyChartPoint.builder()
                    .date(dateStr)
                    .totalPaid(amount)
                    .build());
        }

        // Daily Workload (Next 30 days) — dates grouped in local timezone so calendar labels match user expectations
        OffsetDateTime endOfWorkloadRange = startOfDay.plusDays(30);
        List<Object[]> rawWorkloadData = orderRepository.getDailyWorkload(startOfDay, endOfWorkloadRange, zoneId);
        Map<String, Object[]> workloadByDate = rawWorkloadData.stream()
                .collect(Collectors.toMap(row -> row[0].toString(), row -> row, (a, b) -> a));
        List<DashboardMetricsResponse.WorkloadDayPoint> dailyWorkload = new ArrayList<>();

        for (int i = 0; i < 30; i++) {
            String dateStr = today.plusDays(i).format(dtf);
            Object[] row = workloadByDate.get(dateStr);
            long mins = row != null && row[1] != null ? ((Number) row[1]).longValue() : 0;
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

    public FinancialKpiResponse getFinancialKpis(String granularity, int atRiskDays) {
        ZoneId zone = ZoneId.of(appTimezone);
        String zoneId = zone.getId();
        LocalDate today = LocalDate.now(zone);
        OffsetDateTime now = OffsetDateTime.now(zone);

        // Determine date ranges based on granularity
        OffsetDateTime start;
        OffsetDateTime end = now;

        if ("week".equals(granularity)) {
            start = now.minusWeeks(12);
        } else if ("month".equals(granularity)) {
            start = now.minusMonths(12);
        } else {
            // Default to day (last 30 days)
            start = now.minusDays(30);
        }

        // 1. Get Revenue Time Series
        List<Object[]> rawTrendData = orderRepository.getRevenueTimeSeries(start, granularity, zoneId);
        List<RevenueTrendPoint> revenueTrend = new ArrayList<>();

        for (Object[] row : rawTrendData) {
            revenueTrend.add(RevenueTrendPoint.builder()
                    .period((String) row[0])
                    .totalRevenue(row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO)
                    .paymentCount(((Number) row[2]).longValue())
                    .build());
        }

        // 2. Get Service Type Revenue (with percentage share calculation)
        List<Object[]> rawServiceData = orderRepository.getServiceTypeRevenue(start, end);
        BigDecimal totalServiceRevenue = BigDecimal.ZERO;

        // First pass: sum total revenue
        for (Object[] row : rawServiceData) {
            totalServiceRevenue = totalServiceRevenue.add(
                    row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO);
        }

        // Second pass: build service items with percentage share
        List<ServiceRevenueItem> serviceBreakdown = new ArrayList<>();
        for (Object[] row : rawServiceData) {
            BigDecimal revenue = row[1] != null ? (BigDecimal) row[1] : BigDecimal.ZERO;
            long totalDurationMin = ((Number) row[3]).longValue();
            BigDecimal revenuePerMinute = totalDurationMin > 0
                    ? revenue.divide(BigDecimal.valueOf(totalDurationMin), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            BigDecimal percentShare = totalServiceRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.divide(totalServiceRevenue, 4, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal("100"))
                    : BigDecimal.ZERO;

            serviceBreakdown.add(ServiceRevenueItem.builder()
                    .serviceName((String) row[0])
                    .totalRevenue(revenue)
                    .orderCount(((Number) row[2]).longValue())
                    .totalDurationMin(totalDurationMin)
                    .revenuePerMinute(revenuePerMinute)
                    .percentShare(percentShare)
                    .build());
        }

        // 3. Get Top Customers
        List<Object[]> rawCustomerData = orderRepository.getTopCustomers(start, end, 10);
        List<TopCustomerItem> topCustomers = new ArrayList<>();

        for (Object[] row : rawCustomerData) {
            topCustomers.add(TopCustomerItem.builder()
                    .customerId((UUID) row[0])
                    .firstName((String) row[1])
                    .lastName((String) row[2])
                    .totalSpend(row[3] != null ? (BigDecimal) row[3] : BigDecimal.ZERO)
                    .orderCount(((Number) row[4]).longValue())
                    .lastOrderDate((String) row[5])
                    .build());
        }

        // 4. Get At-Risk Customers (no order in atRiskDays+ days)
        int safeAtRiskDays = Math.max(1, atRiskDays);
        LocalDate atRiskCutoff = today.minusDays(safeAtRiskDays);
        List<Object[]> rawAtRiskData = orderRepository.getAtRiskCustomers(atRiskCutoff, zoneId, 10);
        List<AtRiskCustomerItem> atRiskCustomers = new ArrayList<>();

        for (Object[] row : rawAtRiskData) {
            String lastOrderDateStr = (String) row[3];
            Long daysSince = null;
            if (lastOrderDateStr != null) {
                LocalDate lastOrderDate = LocalDate.parse(lastOrderDateStr);
                daysSince = ChronoUnit.DAYS.between(lastOrderDate, today);
            }
            atRiskCustomers.add(AtRiskCustomerItem.builder()
                    .customerId((UUID) row[0])
                    .firstName((String) row[1])
                    .lastName((String) row[2])
                    .lastOrderDate(lastOrderDateStr)
                    .daysSinceLastOrder(daysSince)
                    .build());
        }

        Object[] repeatRateRow = orderRepository.getRepeatRate(start, end);
        long totalCustomersInPeriod = 0L;
        long repeatCustomers = 0L;
        BigDecimal repeatRate = BigDecimal.ZERO;
        if (repeatRateRow != null && repeatRateRow.length >= 2) {
            totalCustomersInPeriod = ((Number) repeatRateRow[0]).longValue();
            repeatCustomers = ((Number) repeatRateRow[1]).longValue();
            if (totalCustomersInPeriod > 0) {
                repeatRate = BigDecimal.valueOf(repeatCustomers)
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(totalCustomersInPeriod), 2, RoundingMode.HALF_UP);
            }
        }

        return FinancialKpiResponse.builder()
                .revenueTrend(revenueTrend)
                .serviceBreakdown(serviceBreakdown)
                .topCustomers(topCustomers)
                .atRiskCustomers(atRiskCustomers)
                .repeatRate(repeatRate)
                .totalCustomersInPeriod(totalCustomersInPeriod)
                .repeatCustomers(repeatCustomers)
                .build();
    }

    public CalendarMonthResponse getCalendarData(String monthParam, int dailyCapacityMinutes) {
        ZoneId zone = ZoneId.of(appTimezone);
        String zoneId = zone.getId();
        LocalDate today = LocalDate.now(zone);
        LocalDate monthStart = parseMonthParam(monthParam, today).atDay(1);

        // Calculate month boundaries
        LocalDate monthEnd = monthStart.plusMonths(1);
        OffsetDateTime monthStartOdt = monthStart.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime monthEndOdt = monthEnd.atStartOfDay(zone).toOffsetDateTime();

        // Fetch daily aggregates from repository, indexed by date (row[0]) for O(1) lookup.
        List<Object[]> rawData = orderRepository.getCalendarMonthData(monthStartOdt, monthEndOdt, zoneId);
        Map<Object, Object[]> dataByDate = rawData.stream()
                .collect(Collectors.toMap(row -> row[0], row -> row, (a, b) -> a));
        List<CalendarDayResponse> days = new ArrayList<>();

        // Build complete month calendar (fill in missing days)
        LocalDate current = monthStart;
        while (current.isBefore(monthEnd)) {
            final LocalDate day = current;

            Object[] dayData = dataByDate.get(day);
            Integer totalMinutes = dayData != null ? ((Number) dayData[1]).intValue() : 0;
            Integer orderCount = dayData != null ? ((Number) dayData[2]).intValue() : 0;
            BigDecimal scheduledRevenue = dayData != null ? (BigDecimal) dayData[3] : BigDecimal.ZERO;

            double capacityPercent = totalMinutes > 0 ? (totalMinutes * 100.0) / dailyCapacityMinutes : 0.0;

            days.add(CalendarDayResponse.builder()
                    .date(day)
                    .totalMinutesUsed(totalMinutes)
                    .orderCount(orderCount)
                    .scheduledRevenue(scheduledRevenue)
                    .capacityPercent(capacityPercent)
                    .isHoliday(false)
                    .isOpen(true)
                    .build());

            current = current.plusDays(1);
        }

        return CalendarMonthResponse.builder()
                .days(days)
                .build();
    }

    private YearMonth parseMonthParam(String monthParam, LocalDate fallbackDate) {
        if (monthParam == null || monthParam.isBlank()) {
            return YearMonth.from(fallbackDate);
        }

        try {
            return YearMonth.parse(monthParam);
        } catch (DateTimeParseException e) {
            throw new SalesValidationException("month must use YYYY-MM format");
        }
    }
}
