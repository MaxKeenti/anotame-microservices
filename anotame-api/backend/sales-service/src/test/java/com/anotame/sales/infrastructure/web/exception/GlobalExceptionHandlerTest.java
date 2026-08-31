package com.anotame.sales.infrastructure.web.exception;

import com.anotame.sales.domain.exception.SalesNotFoundException;
import jakarta.persistence.PersistenceException;
import jakarta.ws.rs.core.Response;
import org.hibernate.exception.ConstraintViolationException;
import org.hibernate.exception.SQLGrammarException;
import org.junit.jupiter.api.Test;

import java.sql.SQLException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void malformedSqlIsAServerFaultNotAConflict() {
        // Reproduces the shape of the receivables aging failure: Postgres rejects the statement,
        // Hibernate wraps it in a PersistenceException subclass. Reporting 409 here would tell the
        // client its request clashed with existing data, which is false and hid a real outage.
        SQLGrammarException grammar = new SQLGrammarException(
                "could not prepare statement",
                new SQLException("operator does not exist: timestamp with time zone > interval"));

        Response response = handler.toResponse(grammar);

        assertEquals(500, response.getStatus());
    }

    @Test
    void lostConnectionIsAServerFaultNotAConflict() {
        PersistenceException wrapped = new PersistenceException(
                new SQLException("This connection has been closed."));

        assertEquals(500, handler.toResponse(wrapped).getStatus());
    }

    @Test
    void realConstraintViolationStillMapsToConflict() {
        ConstraintViolationException violation = new ConstraintViolationException(
                "duplicate key value violates unique constraint",
                new SQLException("duplicate key"),
                "uq_ticket_number");

        assertEquals(409, handler.toResponse(violation).getStatus());
    }

    @Test
    void constraintViolationIsFoundWhenNestedDeepInTheCauseChain() {
        // Hibernate rarely hands the violation over at the top level.
        ConstraintViolationException violation = new ConstraintViolationException(
                "FK violation", new SQLException("fk"), "fk_order_customer");
        Exception nested = new IllegalStateException("outer", new PersistenceException(violation));

        assertEquals(409, handler.toResponse(nested).getStatus());
    }

    @Test
    void selfReferentialCauseDoesNotHang() {
        // Guards the cause-chain walk against a cycle.
        Exception looping = new IllegalStateException("boom") {
            @Override
            public synchronized Throwable getCause() {
                return this;
            }
        };

        assertEquals(500, handler.toResponse(looping).getStatus());
    }

    @Test
    void domainExceptionsKeepTheirMapping() {
        assertEquals(404, handler.toResponse(new SalesNotFoundException("missing")).getStatus());
    }
}
