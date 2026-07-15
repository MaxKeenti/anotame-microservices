package com.anotame.observability.http;

import jakarta.enterprise.context.RequestScoped;

@RequestScoped
public class RequestCorrelationContext {

    private String requestId;

    public String initialize(String candidate) {
        requestId = RequestIdPolicy.normalizeOrGenerate(candidate);
        return requestId;
    }

    public String requestId() {
        if (requestId == null) {
            requestId = RequestIdPolicy.normalizeOrGenerate(null);
        }
        return requestId;
    }
}
