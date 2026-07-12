package com.anotame.operations.infrastructure.web.security;

import com.anotame.operations.infrastructure.web.dto.ErrorResponse;
import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Provider
@InternalServiceAuthenticated
@Priority(Priorities.AUTHENTICATION)
public class InternalServiceAuthenticationFilter implements ContainerRequestFilter {

    static final String TOKEN_HEADER = "X-Internal-Service-Token";

    private final byte[] expectedToken;

    public InternalServiceAuthenticationFilter(
            @ConfigProperty(name = "anotame.internal-service.token") String expectedToken) {
        if (expectedToken == null || expectedToken.isBlank()) {
            throw new IllegalStateException("Internal service token must not be blank");
        }
        this.expectedToken = expectedToken.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    public void filter(ContainerRequestContext requestContext) {
        String suppliedToken = requestContext.getHeaderString(TOKEN_HEADER);
        if (suppliedToken == null || !MessageDigest.isEqual(
                expectedToken,
                suppliedToken.getBytes(StandardCharsets.UTF_8))) {
            requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse("INVALID_INTERNAL_CREDENTIAL", "Invalid internal service credential"))
                    .build());
        }
    }
}
