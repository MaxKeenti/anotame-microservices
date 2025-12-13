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
    public ResponseEntity<java.util.List<Order>> getOrders() {
        return ResponseEntity.ok(salesService.getAllOrders());
    }
}
