package com.anotame.operations.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "top_holiday")
@Getter
@Setter
public class HolidayJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_holiday")
    private UUID id;

    @Column(name = "holiday_date", nullable = false, unique = true)
    private LocalDate date;

    @Column(name = "description")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
