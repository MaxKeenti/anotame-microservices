package com.anotame.operations.infrastructure.web.exception;

import com.anotame.operations.domain.exception.ActiveBranchNotFoundException;
import com.anotame.operations.domain.exception.AmbiguousActiveBranchException;
import com.anotame.operations.infrastructure.web.dto.ErrorResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Override
    public Response toResponse(Exception exception) {
        if (exception instanceof ActiveBranchNotFoundException notFound) {
            log.warn("Active branch assignment not found: {}", notFound.getMessage());
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("ACTIVE_BRANCH_NOT_FOUND", "Active branch assignment not found"))
                    .build();
        }
        if (exception instanceof AmbiguousActiveBranchException ambiguous) {
            log.error("Ambiguous active branch assignment: {}", ambiguous.getMessage());
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse("AMBIGUOUS_ACTIVE_BRANCH", "Multiple active branch assignments require resolution"))
                    .build();
        }
        if (exception instanceof ConstraintViolationException cve) {
            List<String> details = cve.getConstraintViolations().stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .toList();
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("VALIDATION_FAILED", "Validation failed", details))
                    .build();
        }
        if (exception instanceof EntityNotFoundException enfe) {
            log.warn("Entity not found: {}", enfe.getMessage());
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("NOT_FOUND", "Resource not found"))
                    .build();
        }
        if (exception instanceof IllegalArgumentException iae) {
            log.warn("Illegal argument: {}", iae.getMessage());
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("INVALID_REQUEST", "Invalid request"))
                    .build();
        }
        if (exception instanceof WebApplicationException wae) {
            log.warn("Web application exception: {}", wae.getMessage());
            return Response.status(wae.getResponse().getStatus())
                    .entity(new ErrorResponse("REQUEST_FAILED", "Request could not be processed"))
                    .build();
        }
        log.error("Unhandled exception", exception);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("INTERNAL_ERROR", "Internal server error"))
                .build();
    }
}
