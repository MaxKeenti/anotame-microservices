package com.anotame.operations.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
public class WorkDay {
    private UUID id;
    private int dayOfWeek; // 1=Monday
    private boolean open;
    private LocalTime openTime;
    private LocalTime closeTime;
}
