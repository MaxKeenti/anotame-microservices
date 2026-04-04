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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import com.anotame.sales.application.dto.DashboardMetricsResponse;

@ApplicationScoped
@RequiredArgsConstructor
public class SalesService {

    private final OrderRepositoryPort orderRepository;
    private final CustomerRepositoryPort customerRepository;

    @Transactional
    public Order createOrder(CreateOrderRequest request, UUID userId, UUID branchId) {
        // 1. Resolve or Create Customer
        Customer customer = resolveCustomer(request.getCustomer());

        // 2. Create Order
        Order order = new Order();
        order.setCustomer(customer);
        order.setCommittedDeadline(request.getCommittedDeadline() != null
                ? request.getCommittedDeadline().toLocalDateTime()
                : null);
        order.setNotes(request.getNotes());
        String ticketNumber = orderRepository.nextTicketNumber();
        order.setTicketNumber(ticketNumber);
        // folio_branch uses the same sequence value as ticketNumber for consistency.
        // Parse the numeric part from "ORD-00042" -> 42.
        int folioNumber = Integer.parseInt(ticketNumber.substring(4));
        order.setFolioBranch(folioNumber);
        order.setBranchId(branchId);
        order.setCreatedBy(userId);
        order.setCreatedAt(LocalDateTime.now());
        order.setAmountPaid(request.getAmountPaid() != null ? request.getAmountPaid() : BigDecimal.ZERO);
        order.setPaymentMethod(request.getPaymentMethod());

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
            order.setCommittedDeadline(request.getCommittedDeadline().toLocalDateTime());
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

    @Transactional
    public DashboardMetricsResponse getDashboardMetrics() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime startOfTomorrow = today.plusDays(1).atStartOfDay();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfNextMonth = startOfMonth.plusMonths(1);
        LocalDateTime sevenDaysAgo = today.minusDays(6).atStartOfDay();

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
        LocalDateTime endOfWorkloadRange = startOfDay.plusDays(30);
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
