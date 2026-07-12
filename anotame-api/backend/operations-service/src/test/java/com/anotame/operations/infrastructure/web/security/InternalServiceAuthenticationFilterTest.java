package com.anotame.operations.infrastructure.web.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class InternalServiceAuthenticationFilterTest {

    @Test
    void rejectsBlankConfiguredToken() {
        assertThrows(IllegalStateException.class, () -> new InternalServiceAuthenticationFilter(" "));
    }

    @Test
    void acceptsNonBlankConfiguredToken() {
        assertDoesNotThrow(() -> new InternalServiceAuthenticationFilter("test-internal-token"));
    }
}
