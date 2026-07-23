package com.anotame.observability.http;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.container.ResourceInfo;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HttpAccessContractTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Test
    void emitsOnlyTheApprovedFieldContract() throws Exception {
        HttpAccessEvent event = new HttpAccessEvent(
                "http_access",
                "identity-service",
                "staging",
                "deployment-123",
                "728d758a-4bb6-4d24-947a-dc5b710ccdf4",
                "GET",
                "/users/{userId}",
                200,
                17);

        JsonNode json = OBJECT_MAPPER.readTree(OBJECT_MAPPER.writeValueAsString(event));

        assertEquals(Set.of(
                        "event", "service", "environment", "deployment_id", "request_id",
                        "method", "route", "status", "duration_ms"),
                OBJECT_MAPPER.convertValue(json, java.util.Map.class).keySet());
        assertFalse(json.has("path"));
        assertFalse(json.has("query"));
        assertFalse(json.has("headers"));
        assertFalse(json.has("cookies"));
    }

    @Test
    void derivesAStableRouteTemplateWithoutLiteralIdentifiers() throws Exception {
        Method method = ExampleResource.class.getDeclaredMethod("find", UUID.class);

        assertEquals("/branches/{branchId}/users/{userId}",
                RouteTemplateResolver.resolve(resourceInfo(ExampleResource.class, method)));
    }

    @Test
    void preservesCanonicalIncomingRequestIds() {
        String requestId = UUID.randomUUID().toString();

        assertEquals(requestId, RequestIdPolicy.normalizeOrGenerate(requestId));
    }

    @Test
    void replacesUnsafeIncomingRequestIds() {
        String unsafe = "attacker-controlled-value\nsecond-log-line";
        String replacement = RequestIdPolicy.normalizeOrGenerate(unsafe);

        assertNotEquals(unsafe, replacement);
        assertEquals(36, replacement.length());
        assertTrue(UUID.fromString(replacement).toString().equals(replacement));
    }

    private static ResourceInfo resourceInfo(Class<?> resourceClass, Method resourceMethod) {
        return new ResourceInfo() {
            @Override
            public Method getResourceMethod() {
                return resourceMethod;
            }

            @Override
            public Class<?> getResourceClass() {
                return resourceClass;
            }
        };
    }

    @Path("/branches/{branchId}")
    static class ExampleResource {

        @GET
        @Path("/users/{userId:[0-9a-f-]+}")
        void find(UUID userId) {
        }
    }
}
