package com.anotame.operations.application.service;

import com.anotame.operations.application.port.output.EstablishmentRepositoryPort;
import com.anotame.operations.application.dto.PublicReceiptSettingsResponse;
import com.anotame.operations.domain.model.Establishment;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.RequiredArgsConstructor;

@ApplicationScoped
@RequiredArgsConstructor
public class EstablishmentService {

    private final EstablishmentRepositoryPort repository;
    private final ObjectMapper objectMapper;

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

    public PublicReceiptSettingsResponse getPublicReceiptSettings() {
        Establishment establishment = getSettings();
        JsonNode taxInfo = parseTaxInfo(establishment.getTaxInfo());
        return PublicReceiptSettingsResponse.builder()
                .name(establishment.getName())
                .address(text(taxInfo, "address"))
                .rfc(text(taxInfo, "rfc"))
                .taxRegime(text(taxInfo, "regime"))
                .contactPhone(text(taxInfo, "contactPhone"))
                .build();
    }

    private JsonNode parseTaxInfo(String taxInfo) {
        if (taxInfo == null || taxInfo.isBlank()) {
            return objectMapper.createObjectNode();
        }
        try {
            return objectMapper.readTree(taxInfo);
        } catch (Exception ignored) {
            return objectMapper.createObjectNode();
        }
    }

    private String text(JsonNode root, String fieldName) {
        JsonNode field = root.path(fieldName);
        return field.isTextual() ? field.asText() : null;
    }
}
