package com.anotame.sales.application.port.output;

import com.anotame.sales.domain.model.Order;
import java.util.UUID;

public interface OrderRepositoryPort {
    Order save(Order order);
}
