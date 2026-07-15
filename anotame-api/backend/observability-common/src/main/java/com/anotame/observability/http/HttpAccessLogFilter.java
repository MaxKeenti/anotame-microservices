package com.anotame.observability.http;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.Priority;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Provider
@ApplicationScoped
@Priority(Priorities.AUTHENTICATION - 100)
public class HttpAccessLogFilter implements ContainerRequestFilter, ContainerResponseFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";

    private static final String START_NANOS_PROPERTY = HttpAccessLogFilter.class.getName() + ".startNanos";
    private static final Logger ACCESS_LOG = Logger.getLogger("anotame.http.access");
    private static final Logger LOG = Logger.getLogger(HttpAccessLogFilter.class);

    @Inject
    ObjectMapper objectMapper;

    @Inject
    RequestCorrelationContext correlationContext;

    @Context
    ResourceInfo resourceInfo;

    @ConfigProperty(name = "quarkus.application.name")
    String applicationName;

    @ConfigProperty(name = "RAILWAY_SERVICE_NAME", defaultValue = "")
    String railwayServiceName;

    @ConfigProperty(name = "RAILWAY_ENVIRONMENT_NAME", defaultValue = "local")
    String environment;

    @ConfigProperty(name = "RAILWAY_DEPLOYMENT_ID", defaultValue = "local")
    String deploymentId;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        requestContext.setProperty(START_NANOS_PROPERTY, System.nanoTime());
        String requestId = correlationContext.initialize(requestContext.getHeaderString(REQUEST_ID_HEADER));
        requestContext.getHeaders().putSingle(REQUEST_ID_HEADER, requestId);
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        String route = RouteTemplateResolver.resolve(resourceInfo);
        if (isHealthRoute(route)) {
            return;
        }

        String requestId = correlationContext.requestId();
        responseContext.getHeaders().putSingle(REQUEST_ID_HEADER, requestId);

        HttpAccessEvent event = new HttpAccessEvent(
                "http_access",
                serviceName(),
                environment,
                deploymentId,
                requestId,
                requestContext.getMethod(),
                route,
                responseContext.getStatus(),
                elapsedMillis(requestContext));

        try {
            ACCESS_LOG.info(objectMapper.writeValueAsString(event));
        } catch (JsonProcessingException exception) {
            LOG.warn("Unable to serialize normalized HTTP access event", exception);
        }
    }

    private String serviceName() {
        return railwayServiceName == null || railwayServiceName.isBlank()
                ? applicationName
                : railwayServiceName;
    }

    private static long elapsedMillis(ContainerRequestContext requestContext) {
        Object startValue = requestContext.getProperty(START_NANOS_PROPERTY);
        if (!(startValue instanceof Long startNanos)) {
            return 0;
        }
        return Math.max(0, TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startNanos));
    }

    private static boolean isHealthRoute(String route) {
        return route.equals("/q/health")
                || route.startsWith("/q/health/")
                || route.equals("/q/live")
                || route.equals("/q/ready");
    }
}
