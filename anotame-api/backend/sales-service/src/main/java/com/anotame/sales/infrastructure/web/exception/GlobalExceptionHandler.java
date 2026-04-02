package com.anotame.sales.infrastructure.web.exception;

import com.anotame.sales.domain.exception.FieldValidationException;
import com.anotame.sales.infrastructure.web.dto.ErrorResponse;
import jakarta.persistence.PersistenceException;
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
        // 1. Bean validation errors (@NotBlank, @Email, etc.)
        if (exception instanceof ConstraintViolationException cve) {
            List<String> details = cve.getConstraintViolations().stream()
                    .map(v -> v.getPropertyPath() + ": " + v.getMessage())
                    .toList();
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Validation failed", details))
                    .build();
        }
        // 2. Custom domain field validations (e.g., duplicate phone)
        if (exception instanceof FieldValidationException fve) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Validation failed",
                            List.of(fve.getField() + ": " + fve.getMessage())))
                    .build();
        }
        // 3. Standard HTTP errors (NotFoundException, etc.)
        if (exception instanceof WebApplicationException wae) {
            return Response.status(wae.getResponse().getStatus())
                    .entity(new ErrorResponse(wae.getMessage()))
                    .build();
        }
        // 4. Database relational conflicts (FK constraint on delete)
        if (exception instanceof PersistenceException
                || exception.getCause() instanceof org.hibernate.exception.ConstraintViolationException) {
            return Response.status(Response.Status.CONFLICT)
                    .entity(new ErrorResponse("Cannot delete: record has associated data"))
                    .build();
        }
        // 5. Catch-all
        log.error("Unhandled exception", exception);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Internal server error"))
                .build();
    }
}
