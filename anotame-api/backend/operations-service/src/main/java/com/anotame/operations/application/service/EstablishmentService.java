package com.anotame.operations.application.service;

import com.anotame.operations.application.port.output.EstablishmentRepositoryPort;
import com.anotame.operations.domain.model.Establishment;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;

@ApplicationScoped
@RequiredArgsConstructor
public class EstablishmentService {

    private final EstablishmentRepositoryPort repository;

    public Establishment getSettings() {
        return repository.getEstablishment().orElseGet(() -> {
            Establishment defaultEst = new Establishment();
            defaultEst.setName("My Store");
            defaultEst.setActive(true);
            return defaultEst;
        });
    }

    public Establishment updateSettings(Establishment establishment) {
        return repository.save(establishment);
    }
}
