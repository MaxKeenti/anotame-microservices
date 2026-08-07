package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.CreateOrderRequest;
import com.anotame.sales.application.dto.CustomerDto;
import com.anotame.sales.application.dto.OrderItemDto;
import com.anotame.sales.application.dto.OrderItemServiceDto;
import com.anotame.sales.application.port.output.CustomerRepositoryPort;
import com.anotame.sales.application.port.output.OrderAuditLogRepositoryPort;
import com.anotame.sales.application.port.output.OrderPaymentRepositoryPort;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.domain.exception.SalesValidationException;
import com.anotame.sales.domain.model.Customer;
import com.anotame.sales.domain.model.OrderContentSource;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SalesServicePaymentValidationTest {

    @Test
    void rejectsInitialPaymentAboveCalculatedOrderTotal() {
        UUID customerId = UUID.randomUUID();
        Customer customer = new Customer();
        customer.setId(customerId);

        CustomerRepositoryPort customers = (CustomerRepositoryPort) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { CustomerRepositoryPort.class },
                (proxy, method, args) -> method.getName().equals("findById")
                        ? Optional.of(customer)
                        : defaultValue(method.getReturnType()));

        OrderRepositoryPort orders = (OrderRepositoryPort) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { OrderRepositoryPort.class },
                (proxy, method, args) -> method.getName().equals("nextTicketNumber")
                        ? "ORD-00001"
                        : defaultValue(method.getReturnType()));

        SalesService service = new SalesService(
                orders,
                customers,
                unusedPort(OrderAuditLogRepositoryPort.class),
                unusedPort(OrderPaymentRepositoryPort.class));

        CreateOrderRequest request = orderRequest(customerId, new BigDecimal("100.00"), new BigDecimal("100.01"));

        SalesValidationException error = assertThrows(
                SalesValidationException.class,
                () -> service.createOrderDTO(request, UUID.randomUUID(), UUID.randomUUID()));

        assertEquals("OVERPAYMENT: El pago inicial no puede exceder el total del pedido", error.getMessage());
    }

    private CreateOrderRequest orderRequest(UUID customerId, BigDecimal orderTotal, BigDecimal initialPayment) {
        CustomerDto customer = new CustomerDto();
        customer.setId(customerId);

        OrderItemServiceDto service = new OrderItemServiceDto();
        service.setSource(OrderContentSource.CUSTOM);
        service.setServiceName("Custom service");
        service.setUnitPrice(orderTotal);
        service.setAdjustmentAmount(BigDecimal.ZERO);
        service.setDurationMin(30);

        OrderItemDto item = new OrderItemDto();
        item.setSource(OrderContentSource.CUSTOM);
        item.setGarmentName("Custom garment");
        item.setQuantity(1);
        item.setServices(List.of(service));

        CreateOrderRequest request = new CreateOrderRequest();
        request.setCustomer(customer);
        request.setItems(List.of(item));
        request.setAmountPaid(initialPayment);
        request.setPaymentMethod("CASH");
        return request;
    }

    @SuppressWarnings("unchecked")
    private <T> T unusedPort(Class<T> portType) {
        return (T) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { portType },
                (proxy, method, args) -> defaultValue(method.getReturnType()));
    }

    private static Object defaultValue(Class<?> type) {
        if (type == boolean.class) return false;
        if (type == byte.class) return (byte) 0;
        if (type == short.class) return (short) 0;
        if (type == int.class) return 0;
        if (type == long.class) return 0L;
        if (type == float.class) return 0F;
        if (type == double.class) return 0D;
        if (type == char.class) return '\0';
        if (List.class.isAssignableFrom(type)) return List.of();
        if (Optional.class.isAssignableFrom(type)) return Optional.empty();
        return null;
    }
}
