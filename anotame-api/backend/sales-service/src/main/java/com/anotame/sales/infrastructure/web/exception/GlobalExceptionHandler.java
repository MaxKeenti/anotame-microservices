package com.anotame.sales.infrastructure.web.exception;

import jakarta.ws.rs.WebApplicationException;
import com.anotame.sales.domain.exception.FieldValidationException;
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
        // --- 1. Handle Jakarta Bean Validations (e.g., @NotBlank, @Email) ---
        if (exception instanceof ConstraintViolationException) {
            return handleValidationExceptions((ConstraintViolationException) exception);
        }

        // --- 2. Handle Custom Domain Field Validations (e.g., Duplicates) ---
        if (exception instanceof FieldValidationException) {
            FieldValidationException fieldEx = (FieldValidationException) exception;
            Map<String, String> error = new HashMap<>();

            // Creates the format: { "phoneNumber": "Phone number already in use" }
            error.put(fieldEx.getField(), fieldEx.getMessage());

            return Response.status(Response.Status.BAD_REQUEST).entity(error).build();
        }

        // --- 3. Handle Standard HTTP Errors (like NotFoundException) ---
        if (exception instanceof WebApplicationException) {
            WebApplicationException webEx = (WebApplicationException) exception;
            Map<String, String> error = new HashMap<>();
            error.put("error", webEx.getMessage());
            return Response.status(webEx.getResponse().getStatus()).entity(error).build();
        }

        // --- 4. Handle Database Relational Conflicts (Foreign Keys) ---
        // This catches Hibernate/JPA errors when trying to delete tied records
        if (exception instanceof jakarta.persistence.PersistenceException ||
                exception.getCause() instanceof org.hibernate.exception.ConstraintViolationException) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "No se puede eliminar el cliente porque tiene registros u órdenes asociadas.");
            return Response.status(Response.Status.CONFLICT).entity(error).build();
        }

        // --- 5. Handle Generic/Unknown RuntimeExceptions ---
        log.error("Unhandled exception", exception);
        Map<String, String> error = new HashMap<>();
        error.put("error", exception.getMessage() != null ? exception.getMessage() : "Unknown error");
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(error).build();
    }

    private Response handleValidationExceptions(ConstraintViolationException ex) {
        Map<String, String> errors = new HashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String fieldName = violation.getPropertyPath().toString();
            String errorMessage = violation.getMessage();
            errors.put(fieldName, errorMessage);
        }
        return Response.status(Response.Status.BAD_REQUEST).entity(errors).build();
    }
}