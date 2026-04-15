package com.anotame.sales.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class DeliverOrderRequest {

    @NotBlank
    @Size(min = 6, max = 6)
    @Pattern(regexp = "[0-9]{6}")
    private String pickupCode;

    public String getPickupCode() { return pickupCode; }
    public void setPickupCode(String pickupCode) { this.pickupCode = pickupCode; }
}
