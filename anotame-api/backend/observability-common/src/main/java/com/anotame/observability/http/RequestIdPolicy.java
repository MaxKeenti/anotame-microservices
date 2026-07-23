package com.anotame.observability.http;

import java.util.UUID;

final class RequestIdPolicy {

    private RequestIdPolicy() {
    }

    static String normalizeOrGenerate(String candidate) {
        if (candidate != null) {
            String normalized = candidate.trim();
            if (normalized.length() == 36) {
                try {
                    String canonical = UUID.fromString(normalized).toString();
                    if (canonical.equalsIgnoreCase(normalized)) {
                        return canonical;
                    }
                } catch (IllegalArgumentException ignored) {
                    // An invalid external value is replaced instead of being reflected or logged.
                }
            }
        }
        return UUID.randomUUID().toString();
    }
}
