package com.anotame.sales.infrastructure.web.controller;

import com.anotame.sales.application.dto.CreateOrderRequest;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.application.service.SalesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrdersController {

    private final SalesService salesService;

    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderRequest request,
            @org.springframework.web.bind.annotation.RequestHeader("X-User-Name") String username) {
        Order nOrder = salesService.createOrder(request, username);
        return ResponseEntity.ok(nOrder);
    }

    @org.springframework.web.bind.annotation.GetMapping
    public ResponseEntity<java.util.List<com.anotame.sales.application.dto.OrderResponse>> getOrders() {
        return ResponseEntity.ok(salesService.getAllOrders());
    }

    @org.springframework.web.bind.annotation.GetMapping("/{id}")
    public ResponseEntity<com.anotame.sales.application.dto.OrderResponse> getOrder(
            @org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        return ResponseEntity.ok(salesService.getOrder(id));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}")
    public ResponseEntity<com.anotame.sales.application.dto.OrderResponse> updateOrder(
            @org.springframework.web.bind.annotation.PathVariable java.util.UUID id,
            @RequestBody CreateOrderRequest request) {
        return ResponseEntity.ok(salesService.updateOrder(id, request));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        salesService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }
}
