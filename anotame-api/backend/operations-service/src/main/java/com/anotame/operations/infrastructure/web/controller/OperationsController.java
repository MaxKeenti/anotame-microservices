package com.anotame.operations.infrastructure.web.controller;

import com.anotame.operations.application.service.OperationsService;
import com.anotame.operations.domain.model.WorkOrder;
import com.anotame.operations.domain.model.WorkOrderItem;
import com.anotame.operations.infrastructure.web.dto.CreateWorkOrderRequest;
import lombok.RequiredArgsConstructor;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Path("/operations/work-orders")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiredArgsConstructor
public class OperationsController {

    private final OperationsService operationsService;

    @POST
    public Response createWorkOrder(CreateWorkOrderRequest request) {
        List<WorkOrderItem> items = request.getItems().stream().map(dto -> {
            WorkOrderItem item = new WorkOrderItem();
            item.setSalesOrderItemId(dto.getSalesOrderItemId());
            item.setServiceName(dto.getServiceName());
            item.setNotes(dto.getNotes());
            return item;
        }).collect(Collectors.toList());

        WorkOrder createdOrder = operationsService.createWorkOrder(request.getSalesOrderId(), items);
        return Response.status(Response.Status.CREATED).entity(createdOrder).build();
    }

    @GET
    @Path("/{id}")
    public WorkOrder getWorkOrder(@PathParam("id") UUID id) {
        return operationsService.getWorkOrder(id);
    }

    @PATCH
    @Path("/{id}/status")
    public WorkOrder updateStatus(@PathParam("id") UUID id, @QueryParam("status") String status) {
        return operationsService.updateStatus(id, status);
    }

    @GET
    public List<WorkOrder> getAllWorkOrders() {
        return operationsService.getAllWorkOrders();
    }

    @DELETE
    @Path("/{id}")
    public void deleteWorkOrder(@PathParam("id") UUID id) {
        operationsService.deleteWorkOrder(id);
    }
}
