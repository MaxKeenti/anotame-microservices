package com.anotame.sales.application.dto;

import com.anotame.sales.domain.model.OrderContentSource;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class OrderItemServiceDto {
    private UUID serviceId;
    @NotNull
    private OrderContentSource source = OrderContentSource.CATALOG;
    private String serviceName;
    @NotNull
    private BigDecimal unitPrice;
    private BigDecimal adjustmentAmount;
    private String adjustmentReason;
    private Integer durationMin;
    private String instructions;

    @JsonIgnore
    @AssertTrue(message = "La referencia de servicio no coincide con su origen")
    public boolean isSourceReferenceValid() {
        if (source == null) {
            return false;
        }
        return source == OrderContentSource.CATALOG
                ? serviceId != null
                : serviceId == null;
    }

    @JsonIgnore
    @AssertTrue(message = "Un servicio personalizado requiere nombre, precio no negativo y duración positiva")
    public boolean isCustomSnapshotValid() {
        if (source != OrderContentSource.CUSTOM) {
            return true;
        }
        return serviceName != null
                && !serviceName.isBlank()
                && unitPrice != null
                && unitPrice.signum() >= 0
                && durationMin != null
                && durationMin > 0;
    }
}
