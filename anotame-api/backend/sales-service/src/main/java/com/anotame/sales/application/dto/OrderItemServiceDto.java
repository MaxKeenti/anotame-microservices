package com.anotame.sales.application.dto;

import com.anotame.sales.domain.model.OrderContentSource;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

// Read back as part of an order, the name and duration are always there; the app sends them too.
@Schema(requiredProperties = {"source", "serviceName", "unitPrice", "durationMin"})
@Data
public class OrderItemServiceDto {
    @Schema(nullable = true)
    private UUID serviceId;
    @NotNull
    private OrderContentSource source = OrderContentSource.CATALOG;
    private String serviceName;
    @NotNull
    private BigDecimal unitPrice;
    @Schema(nullable = true)
    private BigDecimal adjustmentAmount;
    @Schema(nullable = true)
    private String adjustmentReason;
    private Integer durationMin;
    @Schema(nullable = true)
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
