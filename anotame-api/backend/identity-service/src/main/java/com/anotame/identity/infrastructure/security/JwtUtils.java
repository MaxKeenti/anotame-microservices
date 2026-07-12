package com.anotame.identity.infrastructure.security;

import com.anotame.identity.application.port.output.TokenGeneratorPort;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class JwtUtils implements TokenGeneratorPort {

    @ConfigProperty(name = "mp.jwt.verify.issuer", defaultValue = "anotame-identity")
    String issuer;

    /**
     * @param username  The user's login name (used as upn).
     * @param userId    The user's real UUID from tca_user.id_user. Always present.
     * @param branchId  The user's required Operations-owned active branch UUID.
     * @param roles     Role codes (e.g. {"EMPLOYEE"}).
     */
    @Override
    public String generateToken(String username, UUID userId, UUID branchId, Set<String> roles) {
        return Jwt.issuer(issuer)
                .upn(username)
                .claim("user_id", userId.toString())
                .claim("branch_id", branchId.toString())
                .groups(roles)
                .expiresIn(Duration.ofHours(24))
                .sign();
    }
}
