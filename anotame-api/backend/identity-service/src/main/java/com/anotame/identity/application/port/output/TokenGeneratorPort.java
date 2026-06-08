package com.anotame.identity.application.port.output;

import java.util.Set;
import java.util.UUID;

public interface TokenGeneratorPort {

    String generateToken(String username, UUID userId, UUID branchId, Set<String> roles);
}
