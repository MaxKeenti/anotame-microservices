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
                        log.warn("Validation failed for request: {}", details);
                        return Response.status(Response.Status.BAD_REQUEST)
                                        .entity(new ErrorResponse("VALIDATION_FAILED", "Validation failed", details))
                                        .build();
                }
                // 2. Custom domain field validations (e.g., duplicate phone)
                if (exception instanceof FieldValidationException fve) {
                        log.warn("Field validation failed: {} = {}", fve.getField(), fve.getMessage());
                        return Response.status(Response.Status.BAD_REQUEST)
                                        .entity(new ErrorResponse("INVALID_REQUEST", "Invalid request data"))
                                        .build();
                }
                // 3. Standard HTTP errors (NotFoundException, etc.)
                if (exception instanceof WebApplicationException wae) {
                        log.warn("Web application exception: {}", wae.getMessage());
                        return Response.status(wae.getResponse().getStatus())
                                        .entity(new ErrorResponse("REQUEST_FAILED", "Request could not be processed"))
                                        .build();
                }
                // 4. Database relational conflicts (FK constraint, Unique constraint)
                if (exception instanceof PersistenceException
                                || exception.getCause() instanceof org.hibernate.exception.ConstraintViolationException) {
                        log.error("Database conflict detected: ", exception);
                        return Response.status(Response.Status.CONFLICT)
                                        .entity(new ErrorResponse("CONFLICT",
                                                        "Database conflict: unique constraint violation or record has associated data"))
                                        .build();
                }
                // 5. Catch-all
                log.error("Unhandled exception", exception);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                                .entity(new ErrorResponse("INTERNAL_ERROR", "Internal server error"))
                                .build();
        }
}
