package com.anotame.observability.http;

import jakarta.ws.rs.Path;
import jakarta.ws.rs.container.ResourceInfo;

import java.lang.reflect.AnnotatedElement;
import java.util.regex.Pattern;

final class RouteTemplateResolver {

    private static final Pattern PARAMETER_REGEX = Pattern.compile("\\{([^}:]+):[^}]+}");
    private static final Pattern REPEATED_SLASH = Pattern.compile("/{2,}");

    private RouteTemplateResolver() {
    }

    static String resolve(ResourceInfo resourceInfo) {
        if (resourceInfo == null || resourceInfo.getResourceClass() == null || resourceInfo.getResourceMethod() == null) {
            return "_unmatched";
        }

        String classPath = pathValue(resourceInfo.getResourceClass());
        String methodPath = pathValue(resourceInfo.getResourceMethod());
        String combined = "/" + classPath + "/" + methodPath;
        String normalized = REPEATED_SLASH.matcher(combined).replaceAll("/");
        normalized = PARAMETER_REGEX.matcher(normalized).replaceAll("{$1}");
        if (normalized.length() > 1 && normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    private static String pathValue(AnnotatedElement element) {
        Path path = element.getAnnotation(Path.class);
        return path == null ? "" : path.value();
    }
}
