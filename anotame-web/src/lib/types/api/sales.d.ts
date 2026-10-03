/**
 * Generated from anotame-api/backend/sales-service/openapi/openapi.yaml.
 * Do not edit: run `bun run gen:api` after the backend contract changes.
 */

export interface paths {
    "/api/customers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Customer */
        post: operations["CustomerController_createCustomer"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/customers/search": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Search Customers */
        get: operations["CustomerController_searchCustomers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/customers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Customer */
        get: operations["CustomerController_getCustomer"];
        /** Update Customer */
        put: operations["CustomerController_updateCustomer"];
        post?: never;
        /** Delete Customer */
        delete: operations["CustomerController_deleteCustomer"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Orders */
        get: operations["OrdersController_getOrders"];
        put?: never;
        /** Create Order */
        post: operations["OrdersController_createOrder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/kpi/calendar": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Calendar Data */
        get: operations["OrderKpiController_getCalendarData"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/kpi/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Dashboard Metrics */
        get: operations["OrderKpiController_getDashboardMetrics"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/kpi/financial": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Financial Kpis */
        get: operations["OrderKpiController_getFinancialKpis"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/kpi/receivables": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Receivables */
        get: operations["OrderKpiController_getReceivables"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/kpi/receivables/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Receivable Orders */
        get: operations["OrderKpiController_getReceivableOrders"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Order Summaries */
        get: operations["OrdersController_getOrderSummaries"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Order */
        get: operations["OrdersController_getOrder"];
        /** Update Order */
        put: operations["OrdersController_updateOrder"];
        post?: never;
        /** Delete Order */
        delete: operations["OrdersController_deleteOrder"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{id}/audit": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Audit Log */
        get: operations["OrdersController_getAuditLog"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{id}/deliver": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Deliver Order */
        patch: operations["OrdersController_deliverOrder"];
        trace?: never;
    };
    "/orders/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /** Update Status */
        patch: operations["OrdersController_updateStatus"];
        trace?: never;
    };
    "/orders/{orderId}/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Payments */
        get: operations["OrderPaymentController_getPayments"];
        put?: never;
        /** Add Payment */
        post: operations["OrderPaymentController_addPayment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/ticket-shares": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List */
        get: operations["TicketShareController_list"];
        put?: never;
        /** Create */
        post: operations["TicketShareController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/orders/{orderId}/ticket-shares/{shareId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Revoke */
        delete: operations["TicketShareController_revoke"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/handling/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Handling */
        get: operations["PublicTicketController_getHandling"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/tickets/shared/{token}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get */
        get: operations["PublicTicketController_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AddPaymentRequest: {
            amount: number;
            paymentMethod?: string;
            notes?: string;
        };
        AgingBucket: {
            /** @enum {string} */
            bucket: "0_30" | "31_60" | "61_90" | "90_PLUS";
            /** Format: int64 */
            orderCount: number;
            balance: number;
        };
        AtRiskCustomerItem: {
            customerId: components["schemas"]["UUID"];
            firstName: string;
            lastName: string;
            lastOrderDate: string | null;
            /** Format: int64 */
            daysSinceLastOrder: number | null;
        };
        AuditLogResponse: {
            userId: components["schemas"]["UUID"];
            fieldName: string;
            oldValue: string | null;
            newValue: string | null;
            changedAt: components["schemas"]["OffsetDateTime"];
        };
        BranchBreakdown: {
            branchId: components["schemas"]["UUID"];
            /** Format: int64 */
            orderCount: number;
            balance: number;
        };
        CalendarDayResponse: {
            date: components["schemas"]["LocalDate"];
            /** Format: int32 */
            totalMinutesUsed: number;
            /** Format: int32 */
            orderCount: number;
            scheduledRevenue: number;
            /** Format: double */
            capacityPercent: number;
            isHoliday: boolean;
            isOpen: boolean;
        };
        CalendarMonthResponse: {
            days: components["schemas"]["CalendarDayResponse"][];
        };
        CreateOrderRequest: {
            customer: components["schemas"]["CustomerDto"];
            items: components["schemas"]["OrderItemDto"][];
            committedDeadline?: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
            notes?: string | null;
            amountPaid?: number | null;
            paymentMethod?: string | null;
            priceListId?: components["schemas"]["UUID"] | null;
            priceListName?: string | null;
        };
        CreatedTicketShareResponse: {
            id: components["schemas"]["UUID"];
            token: string;
            expiresAt: components["schemas"]["OffsetDateTime"];
        };
        CustomerDto: {
            id?: components["schemas"]["UUID"];
            firstName: string;
            lastName?: string | null;
            email?: string | null;
            phoneNumber: string;
            preferences?: {
                [key: string]: unknown;
            } | null;
        };
        DashboardMetricsResponse: {
            workload: components["schemas"]["WorkloadMetrics"];
            finance: components["schemas"]["FinanceMetrics"];
            weeklyRevenueChart: components["schemas"]["WeeklyChartPoint"][];
            dailyWorkload: components["schemas"]["WorkloadDayPoint"][];
        };
        DeliverOrderRequest: {
            pickupCode: string;
            markFullyPaid?: boolean;
            paymentMethod?: string;
        };
        FinanceMetrics: {
            todayRevenue: number;
            monthlyRevenue: number;
            monthlyRevenueByPaymentMethod: components["schemas"]["PaymentMethodTotal"][];
            monthlyBilled: number;
            monthlyCollected: number;
            monthlyPending: number;
            openReceivable: number;
            deliveredUnpaid: number;
        };
        FinancialKpiResponse: {
            revenueTrend: components["schemas"]["RevenueTrendPoint"][];
            serviceBreakdown: components["schemas"]["ServiceRevenueItem"][];
            topCustomers: components["schemas"]["TopCustomerItem"][];
            atRiskCustomers: components["schemas"]["AtRiskCustomerItem"][];
            repeatRate: number;
            /** Format: int64 */
            totalCustomersInPeriod: number;
            /** Format: int64 */
            repeatCustomers: number;
        };
        /**
         * Format: date
         * @example 2022-03-10
         */
        LocalDate: string;
        /**
         * Format: date-time
         * @example 2022-03-10T12:15:50-04:00
         */
        OffsetDateTime: string;
        /** @enum {string} */
        OrderContentSource: "CATALOG" | "CUSTOM";
        OrderItemDto: {
            garmentTypeId?: components["schemas"]["UUID"] | null;
            source: components["schemas"]["OrderContentSource"];
            garmentName?: string;
            services?: components["schemas"]["OrderItemServiceDto"][];
            /** Format: int32 */
            quantity?: number;
            notes?: string;
        };
        OrderItemResponse: {
            id: components["schemas"]["UUID"];
            garmentTypeId: components["schemas"]["UUID"] | null;
            source: components["schemas"]["OrderContentSource"];
            garmentName: string;
            services: components["schemas"]["OrderItemServiceDto"][];
            /** Format: int32 */
            quantity: number;
            unitPrice: number;
            subtotal: number;
            notes: string | null;
        };
        OrderItemServiceDto: {
            serviceId?: components["schemas"]["UUID"] | null;
            source: components["schemas"]["OrderContentSource"];
            serviceName: string;
            unitPrice: number;
            adjustmentAmount?: number | null;
            adjustmentReason?: string | null;
            /** Format: int32 */
            durationMin: number;
            instructions?: string | null;
        };
        OrderResponse: {
            id: components["schemas"]["UUID"];
            ticketNumber: string;
            customer: components["schemas"]["CustomerDto"];
            committedDeadline: components["schemas"]["OffsetDateTime"];
            status: string;
            totalAmount: number;
            amountPaid: number;
            paymentMethod: string | null;
            notes: string | null;
            items: components["schemas"]["OrderItemResponse"][];
            createdAt: components["schemas"]["OffsetDateTime"];
            /** Format: int32 */
            totalDurationMin: number | null;
            pickupCode: string | null;
            deliveredAt: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
            priceListId: components["schemas"]["UUID"] | null;
            priceListName: string | null;
        };
        OrderSummaryPageResponse: {
            items: components["schemas"]["OrderSummaryResponse"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            total: number;
            /** Format: int32 */
            totalPages: number;
        };
        OrderSummaryResponse: {
            id: components["schemas"]["UUID"];
            ticketNumber: string;
            customer: components["schemas"]["CustomerDto"];
            committedDeadline: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
            status: string;
            totalAmount: number;
            amountPaid: number;
            /** Format: int32 */
            totalDurationMin: number | null;
            createdAt: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
            deliveredAt: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
            garmentNames: string[];
            serviceNames: string[];
        };
        PaymentMethodTotal: {
            /** @enum {string} */
            paymentMethod: "CASH" | "CARD" | "TRANSFER" | "UNSPECIFIED";
            total: number;
        };
        PaymentResponse: {
            id: components["schemas"]["UUID"];
            orderId: components["schemas"]["UUID"];
            amount: number;
            paymentMethod: string | null;
            notes: string | null;
            recordedAt: components["schemas"]["OffsetDateTime"];
            orderAmountPaid: number;
            orderTotalAmount: number;
            orderBalance: number;
        };
        PublicHandlingItem: {
            garmentName: string;
            /** Format: int32 */
            quantity: number;
            notes: string | null;
            services: components["schemas"]["PublicHandlingService"][];
        };
        PublicHandlingService: {
            serviceName: string;
            instructions: string | null;
        };
        PublicHandlingTicketResponse: {
            ticketNumber: string;
            customerName: string;
            phoneNumber: string | null;
            committedDeadline: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
            status: string;
            items: components["schemas"]["PublicHandlingItem"][];
        };
        PublicTicketItem: {
            garmentName: string;
            /** Format: int32 */
            quantity: number;
            notes: string | null;
            services: components["schemas"]["PublicTicketService"][];
        };
        PublicTicketResponse: {
            ticketNumber: string;
            customerName: string;
            phoneNumber: string | null;
            committedDeadline: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
            status: string;
            totalAmount: number;
            amountPaid: number;
            balance: number;
            items: components["schemas"]["PublicTicketItem"][];
            pickupCode: string | null;
            createdAt: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
            updatedAt: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
        };
        PublicTicketService: {
            serviceName: string;
            unitPrice: number;
            adjustmentAmount: number;
            adjustmentReason: string | null;
            instructions: string | null;
        };
        ReceivableOrderItem: {
            id: components["schemas"]["UUID"];
            ticketNumber: string;
            branchId: components["schemas"]["UUID"];
            customerName: string | null;
            createdAt: components["schemas"]["OffsetDateTime"];
            committedDeadline: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
            totalAmount: number;
            amountPaid: number;
            balance: number;
            /** Format: int32 */
            daysOutstanding: number;
            status: string;
        };
        ReceivableOrderPageResponse: {
            items: components["schemas"]["ReceivableOrderItem"][];
            /** Format: int32 */
            page: number;
            /** Format: int32 */
            size: number;
            /** Format: int64 */
            total: number;
            /** Format: int32 */
            totalPages: number;
            totalBalance: number;
        };
        ReceivablesResponse: {
            openReceivable: number;
            deliveredUnpaid: number;
            /** Format: int64 */
            openOrderCount: number;
            /** Format: int64 */
            deliveredUnpaidOrderCount: number;
            aging: components["schemas"]["AgingBucket"][];
            byStatus: components["schemas"]["StatusBreakdown"][];
            byBranch: components["schemas"]["BranchBreakdown"][];
            ledgerReconciled: boolean;
            ledgerDifference: number;
        };
        RevenueTrendPoint: {
            period: string;
            totalRevenue: number;
            /** Format: int64 */
            paymentCount: number;
        };
        ServiceRevenueItem: {
            source: components["schemas"]["OrderContentSource"];
            serviceName: string;
            totalRevenue: number;
            /** Format: int64 */
            orderCount: number;
            /** Format: int64 */
            totalDurationMin: number;
            revenuePerMinute: number;
            percentShare: number;
        };
        StatusBreakdown: {
            status: string;
            /** Format: int64 */
            orderCount: number;
            balance: number;
        };
        TicketShareResponse: {
            id: components["schemas"]["UUID"];
            scope: components["schemas"]["TicketShareScope"];
            createdAt: components["schemas"]["OffsetDateTime"];
            expiresAt: components["schemas"]["OffsetDateTime"];
            revokedAt: ((string | components["schemas"]["OffsetDateTime"] | null) | null) | components["schemas"]["OffsetDateTime"] | null;
        };
        /** @enum {string} */
        TicketShareScope: "CUSTOMER" | "HANDLING";
        TopCustomerItem: {
            customerId: components["schemas"]["UUID"];
            firstName: string;
            lastName: string;
            totalSpend: number;
            /** Format: int64 */
            orderCount: number;
            lastOrderDate: string;
        };
        /** Format: uuid */
        UUID: string;
        UpdateOrderRequest: {
            customer: components["schemas"]["CustomerDto"];
            items: components["schemas"]["OrderItemDto"][];
            committedDeadline: components["schemas"]["OffsetDateTime"];
            notes: string;
        };
        WeeklyChartPoint: {
            date: string;
            totalPaid: number;
        };
        WorkloadDayPoint: {
            date: string;
            /** Format: int64 */
            totalMinutesUsed: number;
        };
        WorkloadMetrics: {
            /** Format: int64 */
            todayDeliveries: number;
            /** Format: int64 */
            comingDeliveries: number;
            /** Format: int64 */
            pendingPipeline: number;
            /** Format: int64 */
            readyForPickup: number;
            /** Format: int64 */
            totalActive: number;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    CustomerController_createCustomer: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomerDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerDto"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomerController_searchCustomers: {
        parameters: {
            query?: {
                query?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerDto"][];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomerController_getCustomer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerDto"];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomerController_updateCustomer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CustomerDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerDto"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CustomerController_deleteCustomer: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrdersController_getOrders: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderResponse"][];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrdersController_createOrder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateOrderRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderResponse"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderKpiController_getCalendarData: {
        parameters: {
            query?: {
                dailyCapacityMinutes?: number;
                month?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CalendarMonthResponse"];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderKpiController_getDashboardMetrics: {
        parameters: {
            query?: {
                month?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DashboardMetricsResponse"];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderKpiController_getFinancialKpis: {
        parameters: {
            query?: {
                atRiskDays?: number;
                granularity?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["FinancialKpiResponse"];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderKpiController_getReceivables: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReceivablesResponse"];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderKpiController_getReceivableOrders: {
        parameters: {
            query?: {
                delivered?: boolean;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReceivableOrderPageResponse"];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrdersController_getOrderSummaries: {
        parameters: {
            query?: {
                deadline?: components["schemas"]["LocalDate"];
                garmentId?: components["schemas"]["UUID"];
                garmentSource?: string;
                page?: number;
                search?: string;
                size?: number;
                status?: string[];
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderSummaryPageResponse"];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrdersController_getOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderResponse"];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrdersController_updateOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateOrderRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrderResponse"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrdersController_deleteOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrdersController_getAuditLog: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuditLogResponse"][];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrdersController_deliverOrder: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DeliverOrderRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrdersController_updateStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": {
                    [key: string]: string;
                };
            };
        };
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderPaymentController_getPayments: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentResponse"][];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    OrderPaymentController_addPayment: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddPaymentRequest"];
            };
        };
        responses: {
            /** @description Created */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PaymentResponse"];
                };
            };
            /** @description Bad Request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TicketShareController_list: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TicketShareResponse"][];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TicketShareController_create: {
        parameters: {
            query?: {
                scope?: string;
            };
            header?: never;
            path: {
                orderId: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreatedTicketShareResponse"];
                };
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TicketShareController_revoke: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                orderId: components["schemas"]["UUID"];
                shareId: components["schemas"]["UUID"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description No Content */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Authorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Not Allowed */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicTicketController_getHandling: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicHandlingTicketResponse"];
                };
            };
        };
    };
    PublicTicketController_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                token: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PublicTicketResponse"];
                };
            };
        };
    };
}
