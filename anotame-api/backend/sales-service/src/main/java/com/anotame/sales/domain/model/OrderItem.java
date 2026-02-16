package com.anotame.sales.domain.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItem {
    private UUID id;
    @JsonIgnore
    private Order order;
    private UUID garmentTypeId;

    // Services
    private java.util.List<OrderItemService> services = new java.util.ArrayList<>();

    private String garmentName;
    private Integer quantity = 1;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;

    private String notes;
    private boolean deleted = false;

    public void addService(OrderItemService service) {
        services.add(service);
    }
}
