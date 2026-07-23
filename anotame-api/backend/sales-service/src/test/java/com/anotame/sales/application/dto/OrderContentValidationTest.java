package com.anotame.sales.application.dto;

import com.anotame.sales.domain.model.OrderContentSource;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderContentValidationTest {

    private static ValidatorFactory validatorFactory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        validatorFactory = Validation.buildDefaultValidatorFactory();
        validator = validatorFactory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        validatorFactory.close();
    }

    @Test
    void acceptsCatalogGarmentWithReference() {
        OrderItemDto item = new OrderItemDto();
        item.setGarmentTypeId(UUID.randomUUID());

        assertTrue(validator.validate(item).isEmpty());
    }

    @Test
    void rejectsCatalogGarmentWithoutReference() {
        OrderItemDto item = new OrderItemDto();

        assertFalse(validator.validate(item).isEmpty());
    }

    @Test
    void acceptsCustomGarmentSnapshotWithoutReference() {
        OrderItemDto item = new OrderItemDto();
        item.setSource(OrderContentSource.CUSTOM);
        item.setGarmentName("Sombrero ceremonial");

        assertTrue(validator.validate(item).isEmpty());
    }

    @Test
    void rejectsCustomGarmentWithCatalogReference() {
        OrderItemDto item = new OrderItemDto();
        item.setSource(OrderContentSource.CUSTOM);
        item.setGarmentTypeId(UUID.randomUUID());
        item.setGarmentName("Sombrero ceremonial");

        assertFalse(validator.validate(item).isEmpty());
    }

    @Test
    void acceptsCatalogServiceWithReference() {
        OrderItemServiceDto service = new OrderItemServiceDto();
        service.setServiceId(UUID.randomUUID());
        service.setUnitPrice(BigDecimal.TEN);

        assertTrue(validator.validate(service).isEmpty());
    }

    @Test
    void acceptsCompleteCustomServiceSnapshot() {
        OrderItemServiceDto service = new OrderItemServiceDto();
        service.setSource(OrderContentSource.CUSTOM);
        service.setServiceName("Reforzar aplique antiguo");
        service.setUnitPrice(new BigDecimal("175.00"));
        service.setDurationMin(45);

        assertTrue(validator.validate(service).isEmpty());
    }

    @Test
    void rejectsCustomServiceWithReference() {
        OrderItemServiceDto service = new OrderItemServiceDto();
        service.setSource(OrderContentSource.CUSTOM);
        service.setServiceId(UUID.randomUUID());
        service.setServiceName("Reforzar aplique antiguo");
        service.setUnitPrice(new BigDecimal("175.00"));
        service.setDurationMin(45);

        assertFalse(validator.validate(service).isEmpty());
    }

    @Test
    void rejectsIncompleteCustomServiceSnapshot() {
        OrderItemServiceDto service = new OrderItemServiceDto();
        service.setSource(OrderContentSource.CUSTOM);
        service.setServiceName(" ");
        service.setUnitPrice(new BigDecimal("-1.00"));
        service.setDurationMin(0);

        assertFalse(validator.validate(service).isEmpty());
    }
}
