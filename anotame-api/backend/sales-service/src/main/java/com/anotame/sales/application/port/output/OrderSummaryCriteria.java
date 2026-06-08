package com.anotame.sales.application.port.output;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderSummaryCriteria(
        String search,
        UUID garmentTypeId,
        OffsetDateTime deadlineStart,
        OffsetDateTime deadlineEnd,
        List<String> statuses) {
}
