package com.anotame.identity.infrastructure.web.controller;

import com.anotame.identity.application.dto.AuthResponse;
import com.anotame.identity.application.dto.LoginRequest;
import com.anotame.identity.application.dto.RegisterRequest;
import com.anotame.identity.application.service.AuthService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @POST
    @Path("/register")
    public AuthResponse register(RegisterRequest request) {
        return service.register(request);
    }

    @POST
    @Path("/login")
    public AuthResponse login(LoginRequest request) {
        return service.login(request);
    }
}
