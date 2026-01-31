package com.anotame.sales.domain.model;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class Order {
    private UUID id;
    private String ticketNumber;
    private Integer folioBranch;
    private UUID branchId;
    private Customer customer;
    private LocalDateTime committedDeadline;
    private String status = "RECEIVED";
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private String notes;
    private BigDecimal amountPaid = BigDecimal.ZERO;
    private String paymentMethod;
    private List<OrderItem> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private UUID createdBy;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private boolean deleted = false;

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
