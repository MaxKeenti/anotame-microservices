package com.anotame.identity.infrastructure.security;

import com.anotame.identity.application.port.output.PasswordHasherPort;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class BcryptPasswordHasher implements PasswordHasherPort {

    @Override
    public String hash(String rawPassword) {
        return BcryptUtil.bcryptHash(rawPassword);
    }

    @Override
    public boolean matches(String rawPassword, String hashedPassword) {
        return BcryptUtil.matches(rawPassword, hashedPassword);
    }
}
