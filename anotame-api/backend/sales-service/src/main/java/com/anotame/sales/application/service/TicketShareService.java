package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.CreatedTicketShareResponse;
import com.anotame.sales.application.dto.PublicHandlingTicketResponse;
import com.anotame.sales.application.dto.PublicTicketResponse;
import com.anotame.sales.application.dto.TicketShareResponse;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.application.port.output.TicketShareRepositoryPort;
import com.anotame.sales.domain.exception.SalesNotFoundException;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.domain.model.OrderItem;
import com.anotame.sales.domain.model.OrderItemService;
import com.anotame.sales.domain.model.TicketShare;
import com.anotame.sales.domain.model.TicketShareScope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
@RequiredArgsConstructor
public class TicketShareService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;
    private static final List<String> ACTIVE_STATUSES = List.of("RECEIVED", "IN_PROGRESS", "READY");

    private final TicketShareRepositoryPort ticketShareRepository;
    private final OrderRepositoryPort orderRepository;

    @ConfigProperty(name = "app.ticket-share.ttl-days", defaultValue = "90")
    int ticketShareTtlDays;

    @ConfigProperty(name = "app.ticket-share.deadline-grace-days", defaultValue = "30")
    int deadlineGraceDays;

    @ConfigProperty(name = "app.timezone", defaultValue = "America/Mexico_City")
    String appTimezone;

    @Transactional
    public CreatedTicketShareResponse create(UUID orderId, UUID userId, UUID branchId) {
        return create(orderId, userId, branchId, TicketShareScope.CUSTOMER);
    }

    @Transactional
    public CreatedTicketShareResponse create(UUID orderId, UUID userId, UUID branchId, TicketShareScope scope) {
        Order order = requireAccessibleOrder(orderId, branchId);
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of(appTimezone));
        String token = generateToken();

        TicketShare share = new TicketShare();
        share.setOrderId(order.getId());
        share.setTokenHash(hashToken(token));
        share.setCreatedByUserId(userId);
        share.setScope(scope);
        share.setCreatedAt(now);
        share.setUpdatedAt(now);
        share.setExpiresAt(resolveExpiry(order, now));

        TicketShare saved = ticketShareRepository.save(share);
        return CreatedTicketShareResponse.builder()
                .id(saved.getId())
                .token(token)
                .expiresAt(saved.getExpiresAt())
                .build();
    }

    @Transactional
    public List<TicketShareResponse> list(UUID orderId, UUID branchId) {
        requireAccessibleOrder(orderId, branchId);
        return ticketShareRepository.findByOrderId(orderId).stream()
                .map(share -> TicketShareResponse.builder()
                        .id(share.getId())
                        .scope(share.getScope())
                        .createdAt(share.getCreatedAt())
                        .expiresAt(share.getExpiresAt())
                        .revokedAt(share.getRevokedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void revoke(UUID orderId, UUID shareId, UUID branchId) {
        requireAccessibleOrder(orderId, branchId);
        TicketShare share = ticketShareRepository.findByIdAndOrderId(shareId, orderId)
                .orElseThrow(() -> new SalesNotFoundException("Ticket share not found"));
        if (share.getRevokedAt() == null) {
            OffsetDateTime now = OffsetDateTime.now(ZoneId.of(appTimezone));
            share.setRevokedAt(now);
            share.setUpdatedAt(now);
            ticketShareRepository.save(share);
        }
    }

    @Transactional
    public PublicTicketResponse getPublicTicket(String token) {
        return mapPublicTicket(requireOrderForScope(token, TicketShareScope.CUSTOMER));
    }

    @Transactional
    public PublicHandlingTicketResponse getHandlingTicket(String token) {
        return mapHandlingTicket(requireOrderForScope(token, TicketShareScope.HANDLING));
    }

    /**
     * Resolves a share token, refusing tokens minted for a different audience.
     * Without this check a handling QR would read the customer receipt (and its
     * pickup code) simply by being pointed at the other endpoint.
     */
    private Order requireOrderForScope(String token, TicketShareScope requiredScope) {
        OffsetDateTime now = OffsetDateTime.now(ZoneId.of(appTimezone));
        TicketShare share = ticketShareRepository.findActiveByTokenHash(hashToken(token), now)
                .orElseThrow(this::ticketNotFound);
        if (share.getScope() != requiredScope) {
            throw ticketNotFound();
        }
        return orderRepository.findById(share.getOrderId())
                .orElseThrow(this::ticketNotFound);
    }

    private Order requireAccessibleOrder(UUID orderId, UUID branchId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new SalesNotFoundException("Order not found"));
        if (!order.getBranchId().equals(branchId)) {
            throw new SalesNotFoundException("Order not found");
        }
        return order;
    }

    private SalesNotFoundException ticketNotFound() {
        return new SalesNotFoundException("Ticket not found");
    }

    private OffsetDateTime resolveExpiry(Order order, OffsetDateTime now) {
        OffsetDateTime standardExpiry = now.plusDays(ticketShareTtlDays);
        if (order.getCommittedDeadline() == null) {
            return standardExpiry;
        }
        OffsetDateTime deadlineExpiry = order.getCommittedDeadline().plusDays(deadlineGraceDays);
        return deadlineExpiry.isAfter(standardExpiry) ? deadlineExpiry : standardExpiry;
    }

    private String generateToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                hex.append(String.format("%02x", value));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private PublicTicketResponse mapPublicTicket(Order order) {
        BigDecimal totalAmount = valueOrZero(order.getTotalAmount());
        BigDecimal amountPaid = valueOrZero(order.getAmountPaid());
        List<PublicTicketResponse.PublicTicketItem> items = order.getItems().stream()
                .map(this::mapPublicItem)
                .toList();

        return PublicTicketResponse.builder()
                .ticketNumber(order.getTicketNumber())
                .customerName(displayCustomerName(order))
                .phoneNumber(maskPhone(order))
                .committedDeadline(order.getCommittedDeadline())
                .status(order.getStatus())
                .totalAmount(totalAmount)
                .amountPaid(amountPaid)
                .balance(totalAmount.subtract(amountPaid).max(BigDecimal.ZERO))
                .items(items)
                .pickupCode(ACTIVE_STATUSES.contains(order.getStatus()) ? order.getPickupCode() : null)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private PublicHandlingTicketResponse mapHandlingTicket(Order order) {
        return PublicHandlingTicketResponse.builder()
                .ticketNumber(order.getTicketNumber())
                .customerName(displayCustomerName(order))
                .phoneNumber(maskPhone(order))
                .committedDeadline(order.getCommittedDeadline())
                .status(order.getStatus())
                .items(order.getItems().stream().map(this::mapHandlingItem).toList())
                .build();
    }

    private PublicHandlingTicketResponse.PublicHandlingItem mapHandlingItem(OrderItem item) {
        List<PublicHandlingTicketResponse.PublicHandlingService> services = item.getServices().stream()
                .map(service -> PublicHandlingTicketResponse.PublicHandlingService.builder()
                        .serviceName(service.getServiceName())
                        .instructions(service.getInstructions())
                        .build())
                .toList();
        return PublicHandlingTicketResponse.PublicHandlingItem.builder()
                .garmentName(item.getGarmentName())
                .quantity(item.getQuantity())
                .notes(item.getNotes())
                .services(services)
                .build();
    }

    private PublicTicketResponse.PublicTicketItem mapPublicItem(OrderItem item) {
        List<PublicTicketResponse.PublicTicketService> services = item.getServices().stream()
                .map(this::mapPublicService)
                .toList();
        return PublicTicketResponse.PublicTicketItem.builder()
                .garmentName(item.getGarmentName())
                .quantity(item.getQuantity())
                .notes(item.getNotes())
                .services(services)
                .build();
    }

    private PublicTicketResponse.PublicTicketService mapPublicService(OrderItemService service) {
        return PublicTicketResponse.PublicTicketService.builder()
                .serviceName(service.getServiceName())
                .unitPrice(valueOrZero(service.getUnitPrice()))
                .adjustmentAmount(valueOrZero(service.getAdjustmentAmount()))
                .adjustmentReason(service.getAdjustmentReason())
                .instructions(service.getInstructions())
                .build();
    }

    private String displayCustomerName(Order order) {
        String firstName = order.getCustomer().getFirstName() == null ? "" : order.getCustomer().getFirstName().trim();
        String lastName = order.getCustomer().getLastName() == null ? "" : order.getCustomer().getLastName().trim();
        if (lastName.isBlank()) {
            return firstName;
        }
        return firstName + " " + lastName.substring(0, 1) + ".";
    }

    private String maskPhone(Order order) {
        String phoneNumber = order.getCustomer().getPhoneNumber();
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return null;
        }
        String digits = phoneNumber.replaceAll("\\D", "");
        if (digits.length() < 4) {
            return "••••";
        }
        return "•••• " + digits.substring(digits.length() - 4);
    }

    private BigDecimal valueOrZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
