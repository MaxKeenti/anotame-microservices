package com.anotame.operations.application.port.output;

import com.anotame.operations.domain.model.Establishment;
import java.util.Optional;

public interface EstablishmentRepositoryPort {
    Optional<Establishment> getEstablishment();

    Establishment save(Establishment establishment);
}
