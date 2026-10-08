# Backend Contracts Generate the Frontend Types

Each Quarkus service writes its OpenAPI document to `<service>/openapi/openapi.yaml` on every Maven
build (`quarkus.smallrye-openapi.store-schema-directory`, set in the service `pom.xml`). The file is
committed. `anotame-web` turns the four documents into `src/lib/types/api/<service>.d.ts` with
`bun run gen:api`, and `src/lib/types/dtos.ts` aliases those generated schemas instead of declaring
shapes by hand.

This replaces 29 hand-written interfaces that mirrored the backend DTOs. They had drifted: fields the
backend sent were missing, a few names differed from the JSON, and several fields the backend can
leave empty were typed as always present.

**Considered Options:** Keep the hand-written types; expose `/q/openapi` at runtime and generate from
a running service; adopt GraphQL. A build-time file needs no running service, adds nothing to the
production image, and keeps REST.

**Consequences:**

- Endpoints return typed values (`T`, or `RestResponse<T>` when they set cookies, headers or a
  status) rather than an untyped `Response`, so both the contract and a native image can see what is
  serialised. `ErrorResponse` is the exception — the exception mappers return it inside a `Response`
  — and carries `@RegisterForReflection`.
- Jackson writes every property, so the generator treats a schema without an explicit `required`
  list as fully present. A response field that can be `null` must say so with
  `@Schema(nullable = true)`; a request DTO lists what the server needs with
  `@Schema(requiredProperties = …)` or Bean Validation.
- Domain models stay free of API annotations. Where a controller returns one directly
  (`Establishment`, `WorkDay`, `Holiday`), `dtos.ts` refines the generated type instead.
- `lint:api` runs in `prebuild` and fails when the committed types no longer match the contracts.
  The web image is built from `anotame-web/` alone, where the contracts are absent, so the gate
  skips there.
- The live `/q/openapi` endpoint is disabled under the `prod` profile; Swagger UI exists only in
  dev mode.
