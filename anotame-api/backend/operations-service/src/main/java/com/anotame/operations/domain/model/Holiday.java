package com.anotame.operations.domain.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class Holiday {
    private UUID id;
    private LocalDate date;
    private String description;
}
