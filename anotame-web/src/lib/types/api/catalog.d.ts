/**
 * Generated from anotame-api/backend/catalog-service/openapi/openapi.yaml.
 * Do not edit: run `bun run gen:api` after the backend contract changes.
 */

export interface paths {
    "/catalog/garments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Garments */
        get: operations["CatalogController_getGarments"];
        put?: never;
        /** Create Garment */
        post: operations["CatalogController_createGarment"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/garments/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Garment */
        put: operations["CatalogController_updateGarment"];
        post?: never;
        /** Delete Garment */
        delete: operations["CatalogController_deleteGarment"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/services": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Services */
        get: operations["CatalogController_getServices"];
        put?: never;
        /** Create Service */
        post: operations["CatalogController_createService"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/services/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Service */
        put: operations["CatalogController_updateService"];
        post?: never;
        /** Delete Service */
        delete: operations["CatalogController_deleteService"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/pricelists": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get All */
        get: operations["PriceListController_getAll"];
        put?: never;
        /** Create */
        post: operations["PriceListController_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/pricelists/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get By Id */
        get: operations["PriceListController_getById"];
        /** Update */
        put: operations["PriceListController_update"];
        post?: never;
        /** Delete */
        delete: operations["PriceListController_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/pricing/calculate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Calculate */
        post: operations["PricingController_calculate"];
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
        GarmentTypeRequest: {
            name: string;
            description: string;
        };
        GarmentTypeResponse: {
            id: components["schemas"]["UUID"];
            name: string;
            description: string;
        };
        ItemRequest: {
            serviceId: components["schemas"]["UUID"];
            price: number;
        };
        /**
         * Format: date-time
         * @example 2022-03-10T12:15:50
         */
        LocalDateTime: string;
        PriceListItemDto: {
            serviceId: components["schemas"]["UUID"];
            serviceName: string;
            price: number;
            basePrice: number;
        };
        PriceListRequest: {
            name: string;
            validFrom: components["schemas"]["LocalDateTime"];
            validTo: components["schemas"]["LocalDateTime"];
            active: boolean;
            /** Format: int32 */
            priority: number;
            items: components["schemas"]["ItemRequest"][];
        };
        PriceListResponse: {
            id: components["schemas"]["UUID"];
            name: string;
            validFrom: components["schemas"]["LocalDateTime"];
            validTo: ((string | components["schemas"]["LocalDateTime"] | null) | null) | components["schemas"]["LocalDateTime"] | null;
            active: boolean;
            /** Format: int32 */
            priority: number;
            items: components["schemas"]["PriceListItemDto"][] | null;
        };
        PricingCalculationRequest: {
            serviceId: components["schemas"]["UUID"];
            date: components["schemas"]["LocalDateTime"];
        };
        PricingCalculationResponse: {
            serviceId: components["schemas"]["UUID"];
            finalPrice: number;
            source: string;
            priceListId: components["schemas"]["UUID"];
        };
        ServiceRequest: {
            name: string;
            description: string;
            /** Format: int32 */
            defaultDurationMin: number;
            basePrice: number;
            garmentTypeId: components["schemas"]["UUID"];
        };
        ServiceResponse: {
            id: components["schemas"]["UUID"];
            name: string;
            description: string;
            /** Format: int32 */
            defaultDurationMin: number;
            basePrice: number;
            effectivePrice: number | null;
            garmentTypeId: components["schemas"]["UUID"] | null;
        };
        /** Format: uuid */
        UUID: string;
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    CatalogController_getGarments: {
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
                    "application/json": components["schemas"]["GarmentTypeResponse"][];
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
    CatalogController_createGarment: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["GarmentTypeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GarmentTypeResponse"];
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
    CatalogController_updateGarment: {
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
                "application/json": components["schemas"]["GarmentTypeRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["GarmentTypeResponse"];
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
    CatalogController_deleteGarment: {
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
    CatalogController_getServices: {
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
                    "application/json": components["schemas"]["ServiceResponse"][];
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
    CatalogController_createService: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ServiceRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ServiceResponse"];
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
    CatalogController_updateService: {
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
                "application/json": components["schemas"]["ServiceRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ServiceResponse"];
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
    CatalogController_deleteService: {
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
    PriceListController_getAll: {
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
                    "application/json": components["schemas"]["PriceListResponse"][];
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
    PriceListController_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PriceListRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PriceListResponse"];
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
    PriceListController_getById: {
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
                    "application/json": components["schemas"]["PriceListResponse"];
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
    PriceListController_update: {
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
                "application/json": components["schemas"]["PriceListRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PriceListResponse"];
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
    PriceListController_delete: {
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
    PricingController_calculate: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PricingCalculationRequest"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PricingCalculationResponse"];
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
}
