package com.anotame.sales.infrastructure.web.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@Provider
public class GlobalExceptionHandler implements ExceptionMapper<Exception> {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Override
    public Response toResponse(Exception exception) {
        if (exception instanceof ConstraintViolationException) {
            return handleValidationExceptions((ConstraintViolationException) exception);
        }

        // Handle other RuntimeExceptions
        log.error("Unhandled exception", exception);
        Map<String, String> error = new HashMap<>();
        error.put("error", exception.getMessage() != null ? exception.getMessage() : "Unknown error");
        return Response.status(Response.Status.BAD_REQUEST).entity(error).build();
    }

    private Response handleValidationExceptions(ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String fieldName = violation.getPropertyPath().toString();
            // Simplify property path if needed (e.g. method.arg.field -> field)
            String errorMessage = violation.getMessage();
            errors.put(fieldName, errorMessage);
        }
        return Response.status(Response.Status.BAD_REQUEST).entity(errors).build();
    }
}
