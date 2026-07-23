package com.anotame.sales.application.dto;

import com.anotame.sales.domain.model.OrderContentSource;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class OrderItemDto {
    private UUID garmentTypeId;
    @NotNull
    private OrderContentSource source = OrderContentSource.CATALOG;
    private String garmentName;
    @Valid
    private java.util.List<OrderItemServiceDto> services;
    private Integer quantity;
    private String notes;

    @JsonIgnore
    @AssertTrue(message = "La referencia de prenda no coincide con su origen")
    public boolean isSourceReferenceValid() {
        if (source == null) {
            return false;
        }
        return source == OrderContentSource.CATALOG
                ? garmentTypeId != null
                : garmentTypeId == null;
    }

    @JsonIgnore
    @AssertTrue(message = "Una prenda personalizada requiere nombre")
    public boolean isCustomSnapshotValid() {
        return source != OrderContentSource.CUSTOM
                || (garmentName != null && !garmentName.isBlank());
    }
}
