package com.anotame.identity.infrastructure.web.controller;

import com.anotame.identity.application.dto.AuthResponse;
import com.anotame.identity.application.dto.LoginRequest;
import com.anotame.identity.application.service.AuthService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;

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
    public Response login(LoginRequest request) {
        AuthResponse authResponse = service.login(request);
        return createCookieResponse(authResponse);
    }

    @POST
    @Path("/logout")
    public Response logout() {
        NewCookie cookie = new NewCookie.Builder("jwt")
                .value("")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(NewCookie.SameSite.valueOf(cookieSameSite.toUpperCase()))
                .build();

        return Response.ok()
                .cookie(cookie)
                .build();
    }

    @GET
    @Path("/me")
    @io.quarkus.security.Authenticated
    public Response me(@jakarta.ws.rs.core.Context jakarta.ws.rs.core.SecurityContext securityContext) {
        String username = securityContext.getUserPrincipal().getName();
        return Response.ok(service.getUser(username)).build();
    }

    @POST
    @Path("/change-credentials")
    @io.quarkus.security.Authenticated
    public Response changeCredentials(@jakarta.ws.rs.core.Context jakarta.ws.rs.core.SecurityContext securityContext,
            com.anotame.identity.application.dto.ChangeCredentialsRequest request) {
        String username = securityContext.getUserPrincipal().getName();
        AuthResponse authResponse = service.updateCredentials(username, request);
        return createCookieResponse(authResponse);
    }

    private Response createCookieResponse(AuthResponse authResponse) {
        NewCookie cookie = new NewCookie.Builder("jwt")
                .value(authResponse.getToken())
                .path("/")
                .httpOnly(true) // Not accessible by JS
                .secure(cookieSecure)
                .sameSite(NewCookie.SameSite.valueOf(cookieSameSite.toUpperCase()))
                .maxAge(86400) // 24 hours (match JWT expiry if possible)
                .build();

        // Body includes both token and user so native clients (Capacitor) can
        // pull the JWT for Bearer-token auth; web clients ignore the token
        // and rely on the HttpOnly cookie.
        return Response.ok(authResponse)
                .cookie(cookie)
                .build();
    }
}
