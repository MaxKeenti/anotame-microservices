package com.anotame.sales.application.service;

import com.anotame.sales.application.dto.CreatedTicketShareResponse;
import com.anotame.sales.application.dto.PublicHandlingTicketResponse;
import com.anotame.sales.application.dto.PublicTicketResponse;
import com.anotame.sales.application.port.output.OrderRepositoryPort;
import com.anotame.sales.application.port.output.TicketShareRepositoryPort;
import com.anotame.sales.domain.exception.SalesNotFoundException;
import com.anotame.sales.domain.model.Customer;
import com.anotame.sales.domain.model.Order;
import com.anotame.sales.domain.model.OrderItem;
import com.anotame.sales.domain.model.OrderItemService;
import com.anotame.sales.domain.model.TicketShare;
import com.anotame.sales.domain.model.TicketShareScope;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TicketShareServiceTest {

    @Test
    void createsRandomTokenAndPersistsOnlyItsHash() throws Exception {
        Order order = order("READY");
        FakeTicketShareRepository shares = new FakeTicketShareRepository();
        TicketShareService service = service(shares, order);

        CreatedTicketShareResponse created = service.create(order.getId(), UUID.randomUUID(), order.getBranchId());

        assertFalse(created.getToken().isBlank());
        assertEquals(43, created.getToken().length());
        assertFalse(created.getToken().equals(shares.saved.getTokenHash()));
        assertEquals(
                HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                        .digest(created.getToken().getBytes(StandardCharsets.UTF_8))),
                shares.saved.getTokenHash());
    }

    @Test
    void publicTicketMasksPhoneAndHidesPickupCodeAfterDelivery() {
        Order order = order("DELIVERED");
        FakeTicketShareRepository shares = new FakeTicketShareRepository();
        TicketShare share = new TicketShare();
        share.setId(UUID.randomUUID());
        share.setOrderId(order.getId());
        shares.activeShare = share;
        TicketShareService service = service(shares, order);

        PublicTicketResponse ticket = service.getPublicTicket("an-opaque-token");

        assertEquals("Ada L.", ticket.getCustomerName());
        assertEquals("•••• 7890", ticket.getPhoneNumber());
        assertNull(ticket.getPickupCode());
        assertEquals(new BigDecimal("75.00"), ticket.getBalance());
    }

    @Test
    void refusesToCreateLinkForAnotherBranch() {
        Order order = order("READY");
        TicketShareService service = service(new FakeTicketShareRepository(), order);

        assertThrows(SalesNotFoundException.class,
                () -> service.create(order.getId(), UUID.randomUUID(), UUID.randomUUID()));
    }

    @Test
    void handlingTokenCannotReadTheCustomerReceipt() {
        Order order = order("READY");
        FakeTicketShareRepository shares = sharesWith(order, TicketShareScope.HANDLING);
        TicketShareService service = service(shares, order);

        assertThrows(SalesNotFoundException.class, () -> service.getPublicTicket("a-handling-token"));
    }

    @Test
    void customerTokenCannotReadTheHandlingView() {
        Order order = order("READY");
        FakeTicketShareRepository shares = sharesWith(order, TicketShareScope.CUSTOMER);
        TicketShareService service = service(shares, order);

        assertThrows(SalesNotFoundException.class, () -> service.getHandlingTicket("a-customer-token"));
    }

    @Test
    void handlingTicketCarriesTheWorkButNeverThePickupCode() {
        Order order = order("READY");
        OrderItemService embroidery = new OrderItemService();
        embroidery.setServiceName("Poner escudos");
        embroidery.setInstructions("Escudo bordado, hilo azul");
        embroidery.setUnitPrice(new BigDecimal("15.00"));
        OrderItem item = new OrderItem();
        item.setGarmentName("Camisa");
        item.setQuantity(2);
        item.setNotes("Va a bordado");
        item.addService(embroidery);
        order.addItem(item);

        FakeTicketShareRepository shares = sharesWith(order, TicketShareScope.HANDLING);
        TicketShareService service = service(shares, order);

        PublicHandlingTicketResponse ticket = service.getHandlingTicket("a-handling-token");

        assertEquals("ORD-00001", ticket.getTicketNumber());
        assertEquals("Ada L.", ticket.getCustomerName());
        assertEquals("•••• 7890", ticket.getPhoneNumber());
        assertEquals(1, ticket.getItems().size());
        assertEquals("Camisa", ticket.getItems().get(0).getGarmentName());
        assertEquals("Va a bordado", ticket.getItems().get(0).getNotes());
        assertEquals("Escudo bordado, hilo azul",
                ticket.getItems().get(0).getServices().get(0).getInstructions());
        // The pickup code is what a lost tag would leak; it has no field to land in.
        assertNotNull(order.getPickupCode());
        assertFalse(java.util.Arrays.stream(PublicHandlingTicketResponse.class.getDeclaredFields())
                .anyMatch(field -> field.getName().toLowerCase().contains("pickup")
                        || field.getName().toLowerCase().contains("amount")
                        || field.getName().toLowerCase().contains("balance")));
    }

    @Test
    void tagLinksAreMintedWithHandlingScope() {
        Order order = order("READY");
        FakeTicketShareRepository shares = new FakeTicketShareRepository();
        TicketShareService service = service(shares, order);

        service.create(order.getId(), UUID.randomUUID(), order.getBranchId(), TicketShareScope.HANDLING);

        assertEquals(TicketShareScope.HANDLING, shares.saved.getScope());
    }

    @Test
    void plainCreateStillMintsCustomerScope() {
        Order order = order("READY");
        FakeTicketShareRepository shares = new FakeTicketShareRepository();
        TicketShareService service = service(shares, order);

        service.create(order.getId(), UUID.randomUUID(), order.getBranchId());

        assertEquals(TicketShareScope.CUSTOMER, shares.saved.getScope());
    }

    private FakeTicketShareRepository sharesWith(Order order, TicketShareScope scope) {
        FakeTicketShareRepository shares = new FakeTicketShareRepository();
        TicketShare share = new TicketShare();
        share.setId(UUID.randomUUID());
        share.setOrderId(order.getId());
        share.setScope(scope);
        shares.activeShare = share;
        return shares;
    }

    private TicketShareService service(FakeTicketShareRepository shares, Order order) {
        TicketShareService service = new TicketShareService(shares, orderRepository(order));
        service.ticketShareTtlDays = 90;
        service.deadlineGraceDays = 30;
        service.appTimezone = "America/Mexico_City";
        return service;
    }

    private Order order(String status) {
        Customer customer = new Customer();
        customer.setFirstName("Ada");
        customer.setLastName("Lovelace");
        customer.setPhoneNumber("55 1234 7890");

        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setBranchId(UUID.randomUUID());
        order.setCustomer(customer);
        order.setTicketNumber("ORD-00001");
        order.setStatus(status);
        order.setPickupCode("123456");
        order.setTotalAmount(new BigDecimal("100.00"));
        order.setAmountPaid(new BigDecimal("25.00"));
        order.setCreatedAt(OffsetDateTime.now());
        order.setUpdatedAt(OffsetDateTime.now());
        return order;
    }

    private OrderRepositoryPort orderRepository(Order order) {
        return (OrderRepositoryPort) Proxy.newProxyInstance(
                getClass().getClassLoader(),
                new Class<?>[] { OrderRepositoryPort.class },
                (proxy, method, args) -> {
                    if (method.getName().equals("findById")) return Optional.of(order);
                    if (method.getReturnType().equals(long.class)) return 0L;
                    if (method.getReturnType().equals(BigDecimal.class)) return BigDecimal.ZERO;
                    if (method.getReturnType().equals(List.class)) return List.of();
                    if (method.getReturnType().equals(Optional.class)) return Optional.empty();
                    return null;
                });
    }

    private static class FakeTicketShareRepository implements TicketShareRepositoryPort {
        private TicketShare saved;
        private TicketShare activeShare;

        @Override
        public TicketShare save(TicketShare share) {
            if (share.getId() == null) share.setId(UUID.randomUUID());
            saved = share;
            return share;
        }

        @Override
        public Optional<TicketShare> findActiveByTokenHash(String tokenHash, OffsetDateTime now) {
            return Optional.ofNullable(activeShare);
        }

        @Override
        public List<TicketShare> findByOrderId(UUID orderId) {
            return List.of();
        }

        @Override
        public Optional<TicketShare> findByIdAndOrderId(UUID shareId, UUID orderId) {
            return Optional.empty();
        }
    }
}
