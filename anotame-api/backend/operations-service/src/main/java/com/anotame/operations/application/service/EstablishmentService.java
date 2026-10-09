package com.anotame.operations.application.service;

import com.anotame.operations.application.port.output.EstablishmentRepositoryPort;
import com.anotame.operations.application.dto.PublicReceiptSettingsResponse;
import com.anotame.operations.domain.model.Establishment;
import com.anotame.operations.domain.model.WorkflowMode;
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
            defaultEst.setWorkflowMode(WorkflowMode.FULL);
            return defaultEst;
        });
    }

    public Establishment updateSettings(Establishment establishment) {
        String workflowMode = establishment.getWorkflowMode();
        if (workflowMode == null) {
            // A save replaces every column, so a client that does not know the
            // setting must not reset it.
            establishment.setWorkflowMode(getSettings().getWorkflowMode());
        } else if (!WorkflowMode.isValid(workflowMode)) {
            throw new IllegalArgumentException("Invalid workflow mode: " + workflowMode);
        }
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
                .workflowMode(establishment.getWorkflowMode())
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
