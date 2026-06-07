package com.anotame.identity.infrastructure.web.exception;

import com.anotame.identity.domain.exception.DomainException;
import com.anotame.identity.domain.exception.InvalidCredentialsException;
import com.anotame.identity.domain.exception.ResourceNotFoundException;
import com.anotame.identity.domain.exception.UserAlreadyExistsException;
import com.anotame.identity.infrastructure.web.dto.ErrorResponse;
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
                    .entity(new ErrorResponse("VALIDATION_FAILED", "Validation failed", details))
                    .build();
        }
        if (exception instanceof DomainException de) {
            log.warn("Domain exception: {}", de.getMessage());
            return Response.status(statusFor(de))
                    .entity(new ErrorResponse("DOMAIN_EXCEPTION", de.getMessage()))
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

    private Response.Status statusFor(DomainException exception) {
        if (exception instanceof InvalidCredentialsException) {
            return Response.Status.UNAUTHORIZED;
        }
        if (exception instanceof ResourceNotFoundException) {
            return Response.Status.NOT_FOUND;
        }
        if (exception instanceof UserAlreadyExistsException) {
            return Response.Status.CONFLICT;
        }
        return Response.Status.BAD_REQUEST;
    }
}
