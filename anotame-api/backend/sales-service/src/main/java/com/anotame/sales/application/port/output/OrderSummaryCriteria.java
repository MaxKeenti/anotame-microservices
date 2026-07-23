package com.anotame.sales.application.port.output;

import com.anotame.sales.domain.model.OrderContentSource;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record OrderSummaryCriteria(
        String search,
        String exactTicketNumber,
        UUID garmentTypeId,
        OrderContentSource garmentSource,
        OffsetDateTime deadlineStart,
        OffsetDateTime deadlineEnd,
        List<String> statuses) {
}
