package com.anotame.operations.domain.model;

import java.util.Set;

/**
 * How much of the order flow the shop works with. The orders keep the same
 * statuses in both modes, so switching back and forth needs no data change.
 */
public final class WorkflowMode {
    /** Every status, moved along from the Operations page. */
    public static final String FULL = "FULL";
    /** Only received and delivered, handled from the Orders page. */
    public static final String SIMPLE = "SIMPLE";

    private static final Set<String> VALUES = Set.of(FULL, SIMPLE);

    private WorkflowMode() {
    }

    public static boolean isValid(String mode) {
        return VALUES.contains(mode);
    }
}
