package com.anotame.identity.infrastructure.security;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.Set;

@ApplicationScoped
public class JwtUtils {

    @ConfigProperty(name = "mp.jwt.verify.issuer", defaultValue = "anotame-identity")
    String issuer;

    /**
     * @param username  The user's login name (used as upn).
     * @param userId    The user's real UUID from tca_user.id_user. Always present.
     * @param branchId  The user's active branch UUID from tce_employee_assignment.
     *                  May be null for users with no active branch assignment
     *                  (e.g., newly registered users). When null the claim is
     *                  omitted from the token; sales-service uses its rollout
     *                  fallback in that case.
     * @param roles     Role codes (e.g. {"EMPLOYEE"}).
     */
    public String generateToken(String username, java.util.UUID userId,
                                java.util.UUID branchId, Set<String> roles) {
        var builder = Jwt.issuer(issuer)
                .upn(username)
                .claim("user_id", userId.toString())
                .groups(roles)
                .expiresIn(Duration.ofHours(24));
        if (branchId != null) {
            builder = builder.claim("branch_id", branchId.toString());
        }
        return builder.sign();
    }
}
