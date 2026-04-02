package com.anotame.catalog.infrastructure.web.exception;

import com.anotame.catalog.infrastructure.web.dto.ErrorResponse;
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
        if (exception instanceof ConstraintViolationException cve) {
            List<String> details = cve.getConstraintViolations().stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .toList();
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Validation failed", details))
                    .build();
        }
        if (exception instanceof WebApplicationException wae) {
            return Response.status(wae.getResponse().getStatus())
                    .entity(new ErrorResponse(wae.getMessage()))
                    .build();
        }
        log.error("Unhandled exception", exception);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Internal server error"))
                .build();
    }
}
