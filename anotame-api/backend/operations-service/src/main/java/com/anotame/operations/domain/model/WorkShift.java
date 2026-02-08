package com.anotame.operations.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
public class WorkShift {
    private UUID id;
    private UUID userId;
    private int dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean isActive;
}
