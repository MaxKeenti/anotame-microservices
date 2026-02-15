package com.anotame.catalog.infrastructure.web.controller;

import com.anotame.catalog.application.service.PriceListService;
import com.anotame.catalog.dto.PriceListRequest;
import com.anotame.catalog.dto.PriceListResponse;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;
import java.util.UUID;

@Path("/pricelists")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@io.quarkus.security.Authenticated
public class PriceListController {

    @Inject
    PriceListService priceListService;

    @POST
    public PriceListResponse create(PriceListRequest request) {
        return priceListService.create(request);
    }

    @GET
    public List<PriceListResponse> getAll() {
        return priceListService.getAll();
    }

    @GET
    @Path("/{id}")
    public PriceListResponse getById(@PathParam("id") UUID id) {
        return priceListService.getById(id);
    }

    @PUT
    @Path("/{id}")
    public PriceListResponse update(@PathParam("id") UUID id, PriceListRequest request) {
        return priceListService.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public void delete(@PathParam("id") UUID id) {
        priceListService.delete(id);
    }
}
