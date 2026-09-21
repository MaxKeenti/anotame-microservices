package com.anotame.observability;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import org.jboss.logging.MDC;
import org.jboss.resteasy.reactive.server.ServerRequestFilter;
import org.jboss.resteasy.reactive.server.ServerResponseFilter;

import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Puts the web proxy's X-Request-Id into the logging MDC so every log line for a request
 * carries the same ID as the anotame-web proxy logs, and echoes it on the response.
 */
public class RequestIdFilter {

        public static final String HEADER = "X-Request-Id";
        public static final String MDC_KEY = "requestId";

        /** Same shape the web proxy accepts; anything else is replaced to keep logs clean. */
        private static final Pattern VALID_ID = Pattern.compile("^[A-Za-z0-9-]{8,64}$");

        @ServerRequestFilter(preMatching = true)
        public void assignRequestId(ContainerRequestContext request) {
                String incoming = request.getHeaderString(HEADER);
                String requestId = incoming != null && VALID_ID.matcher(incoming).matches()
                                ? incoming
                                : UUID.randomUUID().toString();
                request.setProperty(MDC_KEY, requestId);
                MDC.put(MDC_KEY, requestId);
        }

        @ServerResponseFilter
        public void echoRequestId(ContainerRequestContext request, ContainerResponseContext response) {
                Object requestId = request.getProperty(MDC_KEY);
                if (requestId != null) {
                        response.getHeaders().putSingle(HEADER, requestId);
                }
                MDC.remove(MDC_KEY);
        }
}
