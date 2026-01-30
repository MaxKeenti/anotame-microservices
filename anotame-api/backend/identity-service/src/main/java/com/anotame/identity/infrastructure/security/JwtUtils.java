package com.anotame.identity.infrastructure.security;

import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.HashSet;
import java.util.Set;

@ApplicationScoped
public class JwtUtils {

    @ConfigProperty(name = "mp.jwt.verify.issuer", defaultValue = "anotame-identity")
    String issuer;

    public String generateToken(String username, Set<String> roles) {
        return Jwt.issuer(issuer)
                .upn(username)
                .groups(roles)
                .expiresIn(Duration.ofHours(24))
                .sign();
    }
}
