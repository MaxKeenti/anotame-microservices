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
    public ResponseEntity<Order> createOrder(@RequestBody CreateOrderRequest request) {
        Order nOrder = salesService.createOrder(request);
        return ResponseEntity.ok(nOrder);
    }
}
