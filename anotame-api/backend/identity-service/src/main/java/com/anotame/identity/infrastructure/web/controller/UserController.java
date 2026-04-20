package com.anotame.identity.infrastructure.web.controller;

import com.anotame.identity.application.dto.UpdateLocaleRequest;
import com.anotame.identity.application.dto.UpdateUserRequest;
import com.anotame.identity.application.dto.UserResponse;
import com.anotame.identity.application.service.UserService;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
@io.quarkus.security.Authenticated
public class UserController {

    private final UserService userService;

    @GET
    public List<UserResponse> getAllUsers() {
        return userService.getAllUsers();
    }

    @jakarta.annotation.security.RolesAllowed("ADMIN")
    @POST
    public UserResponse createUser(com.anotame.identity.application.dto.CreateUserRequest request) {
        return userService.createUser(request);
    }

    @GET
    @Path("/{id}")
    public UserResponse getUserById(@PathParam("id") UUID id) {
        return userService.getUserById(id);
    }

    @jakarta.annotation.security.RolesAllowed("ADMIN")
    @PUT
    @Path("/{id}")
    public UserResponse updateUser(@PathParam("id") UUID id, UpdateUserRequest request) {
        return userService.updateUser(id, request);
    }

    @jakarta.annotation.security.RolesAllowed("ADMIN")
    @DELETE
    @Path("/{id}")
    public void deleteUser(@PathParam("id") UUID id) {
        userService.deleteUser(id);
    }

    @PATCH
    @Path("/{id}/locale")
    public jakarta.ws.rs.core.Response updateLocale(@PathParam("id") UUID id,
                                                    @jakarta.validation.Valid UpdateLocaleRequest request) {
        userService.updateLocale(id, request.getLocale());
        return jakarta.ws.rs.core.Response.noContent().build();
    }
}
