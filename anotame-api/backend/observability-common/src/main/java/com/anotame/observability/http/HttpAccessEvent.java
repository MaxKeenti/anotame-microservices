package com.anotame.observability.http;

import com.fasterxml.jackson.annotation.JsonProperty;

record HttpAccessEvent(
        String event,
        String service,
        String environment,
        @JsonProperty("deployment_id") String deploymentId,
        @JsonProperty("request_id") String requestId,
        String method,
        String route,
        int status,
        @JsonProperty("duration_ms") long durationMs) {
}
