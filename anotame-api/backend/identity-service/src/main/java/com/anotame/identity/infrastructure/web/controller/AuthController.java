package com.anotame.identity.infrastructure.web.controller;

import com.anotame.identity.application.dto.AuthResponse;
import com.anotame.identity.application.dto.LoginRequest;
import com.anotame.identity.application.dto.UserResponse;
import com.anotame.identity.application.service.AuthService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.NewCookie;
import lombok.RequiredArgsConstructor;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.jboss.resteasy.reactive.RestResponse;

@Path("/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "anotame.auth.cookie.secure", defaultValue = "true")
    boolean cookieSecure;

    @org.eclipse.microprofile.config.inject.ConfigProperty(name = "anotame.auth.cookie.same-site", defaultValue = "None")
    String cookieSameSite;

    @POST
    @Path("/login")
    public RestResponse<UserResponse> login(LoginRequest request) {
        AuthResponse authResponse = service.login(request);
        return createCookieResponse(authResponse);
    }

    @POST
    @Path("/logout")
    @APIResponse(responseCode = "200", description = "OK")
    public RestResponse<Void> logout() {
        NewCookie cookie = new NewCookie.Builder("jwt")
                .value("")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(NewCookie.SameSite.valueOf(cookieSameSite.toUpperCase()))
                .build();

        return RestResponse.ResponseBuilder.<Void>ok()
                .cookie(cookie)
                .build();
    }

    @GET
    @Path("/me")
    @io.quarkus.security.Authenticated
    public UserResponse me(@jakarta.ws.rs.core.Context jakarta.ws.rs.core.SecurityContext securityContext) {
        String username = securityContext.getUserPrincipal().getName();
        return service.getUser(username);
    }

    @POST
    @Path("/change-credentials")
    @io.quarkus.security.Authenticated
    public RestResponse<UserResponse> changeCredentials(@jakarta.ws.rs.core.Context jakarta.ws.rs.core.SecurityContext securityContext,
            com.anotame.identity.application.dto.ChangeCredentialsRequest request) {
        String username = securityContext.getUserPrincipal().getName();
        AuthResponse authResponse = service.updateCredentials(username, request);
        return createCookieResponse(authResponse);
    }

    private RestResponse<UserResponse> createCookieResponse(AuthResponse authResponse) {
        NewCookie cookie = new NewCookie.Builder("jwt")
                .value(authResponse.getToken())
                .path("/")
                .httpOnly(true) // Not accessible by JS
                .secure(cookieSecure)
                .sameSite(NewCookie.SameSite.valueOf(cookieSameSite.toUpperCase()))
                .maxAge(86400) // 24 hours (match JWT expiry if possible)
                .build();

        return RestResponse.ResponseBuilder.ok(authResponse.getUser()) // Return only user info
                .cookie(cookie)
                .build();
    }
}
