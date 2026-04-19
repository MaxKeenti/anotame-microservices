---
phase: 20-dockerfile-fixes-railway-deployment
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - anotame-api/backend/identity-service/Dockerfile
  - anotame-api/backend/catalog-service/Dockerfile
  - anotame-api/backend/sales-service/Dockerfile
  - anotame-api/backend/operations-service/Dockerfile
  - anotame-api/backend/identity-service/railway.toml
  - anotame-api/backend/catalog-service/railway.toml
  - anotame-api/backend/sales-service/railway.toml
  - anotame-api/backend/operations-service/railway.toml
findings:
  critical: 1
  warning: 2
  info: 3
  total: 6
status: issues_found
---

# Phase 20: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed four Dockerfiles and four railway.toml files covering the identity, catalog, sales, and operations Quarkus microservices. The multi-stage build structure is consistent and correct across all services: parent POM + all module POMs are copied first for dependency caching, then per-service source is added, then the Quarkus `quarkus-app/` output is copied into a slim JRE runtime image.

One critical bug was found in the sales-service Dockerfile that will cause the container to fail to start at runtime. Two warnings cover inconsistent JDK compiler flags that risk latent build failures for identity-service and catalog-service, and the absence of a non-root user in all runtime stages. Three informational items cover Railway configuration assumptions, EXPOSE port conventions, and a missing `.dockerignore`.

---

## Critical Issues

### CR-01: Missing trailing slash on COPY source in sales-service Dockerfile

**File:** `anotame-api/backend/sales-service/Dockerfile:27`

**Issue:** The `COPY` instruction in the sales-service runtime stage is missing a trailing slash on the source path:

```dockerfile
COPY --from=build /app/sales-service/target/quarkus-app /app/
```

Docker's `COPY` semantics differ based on whether the source ends with `/`:
- With trailing slash (`quarkus-app/`): copies the **contents** of the directory into `/app/`. Result: `/app/quarkus-run.jar`, `/app/lib/`, etc.
- Without trailing slash (`quarkus-app`): copies the **directory itself** into `/app/`. Result: `/app/quarkus-app/quarkus-run.jar`.

The `ENTRYPOINT` runs `java ... -jar quarkus-run.jar` from `WORKDIR /app`, which resolves to `/app/quarkus-run.jar`. With the current path, that file does not exist and the container will exit with a `java.io.FileNotFoundException` or similar error on every deploy.

All three other services (identity, catalog, operations) correctly use a trailing slash.

**Fix:**
```dockerfile
# Line 27 - add trailing slash to source path
COPY --from=build /app/sales-service/target/quarkus-app/ /app/
```

---

## Warnings

### WR-01: identity-service and catalog-service missing --add-opens MAVEN_OPTS flags

**File:** `anotame-api/backend/identity-service/Dockerfile:4`, `anotame-api/backend/catalog-service/Dockerfile:4`

**Issue:** The `MAVEN_OPTS` environment variable in identity-service and catalog-service is set to only `-Xmx512m`:

```dockerfile
ENV MAVEN_OPTS="-Xmx512m"
```

The sales-service and operations-service Dockerfiles include a full set of `--add-opens` flags for internal JDK compiler modules:

```dockerfile
ENV MAVEN_OPTS="--add-opens=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED \
  ... -Xmx512m"
```

Both identity-service and catalog-service `pom.xml` files declare Lombok with `<annotationProcessorPaths>` in the compiler plugin. Under JDK 21's strong encapsulation, annotation processing that accesses internal `javac` APIs requires these `--add-opens` flags. If the Maven build encounters a reflective access violation during annotation processing (which can be compiler-version-dependent), identity-service and catalog-service will fail to build in CI/Railway while sales and operations succeed — a confusing, hard-to-diagnose failure.

**Fix:** Apply the same `MAVEN_OPTS` as sales-service and operations-service to both affected Dockerfiles:

```dockerfile
# identity-service/Dockerfile line 4
# catalog-service/Dockerfile line 4
ENV MAVEN_OPTS="--add-opens=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED \
  -Xmx512m"
```

---

### WR-02: Runtime containers run as root (no USER instruction in any Dockerfile)

**File:** `anotame-api/backend/identity-service/Dockerfile:26-30`, `anotame-api/backend/catalog-service/Dockerfile:25-29`, `anotame-api/backend/sales-service/Dockerfile:25-29`, `anotame-api/backend/operations-service/Dockerfile:25-29`

**Issue:** None of the four runtime stages include a `USER` instruction. The JVM process runs as `root` (UID 0) inside the container. If a vulnerability in the application or a dependency allows arbitrary code execution, the attacker has root access within the container, making container escape or lateral movement significantly easier.

This affects all four services identically.

**Fix:** Add a non-root user in the runtime stage of each Dockerfile. The `eclipse-temurin:21-jre-alpine` base image supports `adduser`/`addgroup`:

```dockerfile
# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=build /app/identity-service/target/quarkus-app/ /app/
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8081
ENTRYPOINT ["java", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "quarkus-run.jar"]
```

Apply the equivalent pattern to all four Dockerfiles.

---

## Info

### IN-01: railway.toml dockerfilePath assumes Railway Root Directory = anotame-api/backend/

**File:** `anotame-api/backend/identity-service/railway.toml:3`, `anotame-api/backend/catalog-service/railway.toml:3`, `anotame-api/backend/sales-service/railway.toml:3`, `anotame-api/backend/operations-service/railway.toml:3`

**Issue:** All four `railway.toml` files set `dockerfilePath` relative to a root of `anotame-api/backend/`:

```toml
# identity-service/railway.toml
dockerfilePath = "identity-service/Dockerfile"
```

This path is only valid if Railway's "Root Directory" for each service is configured to `anotame-api/backend` in the Railway UI (or project config). If the root directory is set to the service's own directory (e.g., `anotame-api/backend/identity-service`), Railway would look for `identity-service/identity-service/Dockerfile`, which does not exist, and the build fails immediately.

Furthermore, the Dockerfiles themselves require the build context to be `anotame-api/backend/` (they do `COPY pom.xml .` expecting the parent aggregator POM, and `COPY identity-service/pom.xml ...` expecting sibling service POMs). This requirement is confirmed by `compose.yaml` which sets `context: .` from the `backend/` directory.

This configuration is correct **only** when Railway's Root Directory is `anotame-api/backend`. This assumption is invisible from the repository files alone and must be documented or enforced.

**Fix:** Add a comment to each `railway.toml` making the dependency explicit, or document it in the service README:

```toml
# IMPORTANT: Railway "Root Directory" for this service must be set to:
#   anotame-api/backend
# The dockerfilePath and Dockerfile COPY instructions are relative to that directory.
[build]
builder = "dockerfile"
dockerfilePath = "identity-service/Dockerfile"

[deploy]
healthcheckPath = "/q/health/ready"
healthcheckTimeout = 300
```

---

### IN-02: EXPOSE ports are hardcoded and do not match Railway's injected PORT

**File:** `anotame-api/backend/identity-service/Dockerfile:29`, `anotame-api/backend/catalog-service/Dockerfile:28`, `anotame-api/backend/sales-service/Dockerfile:28`, `anotame-api/backend/operations-service/Dockerfile:28`

**Issue:** Each Dockerfile `EXPOSE`s a fixed port (8081, 8082, 8083, 8084). Railway injects a `PORT` environment variable at runtime, and each service's `application.properties` correctly reads it via `quarkus.http.port=${PORT:808x}`. This means Quarkus will bind to the Railway-assigned `PORT` value, but the `EXPOSE` instruction documents a different (hardcoded) port.

`EXPOSE` is purely documentation in Docker and has no runtime effect, so this does not cause a malfunction. However, it creates a misleading discrepancy: a reader of the Dockerfile would assume the service listens on the exposed port, which may not be the case in Railway deployments.

**Fix:** Either update `EXPOSE` to use `$PORT` (which is a valid Docker build arg pattern), or remove the `EXPOSE` instruction since it provides no functional value in Railway deployments. The simplest correct option:

```dockerfile
# Remove EXPOSE or document the intent
# Railway assigns PORT dynamically; Quarkus reads ${PORT:8081} from application.properties
# EXPOSE 8081  <- removed, misleading in Railway context
```

---

### IN-03: No .dockerignore file at the build context root

**File:** `anotame-api/backend/` (missing file)

**Issue:** There is no `.dockerignore` file in `anotame-api/backend/`, which is the Docker build context for all four services. When building locally with `docker compose`, the build daemon sends the entire `backend/` directory as context, including `*/target/` directories (compiled classes, test output, local quarkus-app builds) and any IDE/tool artifacts.

This does not affect Railway deployments (Railway performs a clean git checkout), but it degrades local build performance significantly and risks `COPY` instructions accidentally matching stale local build artifacts that differ from what the Docker build would produce.

**Fix:** Add `anotame-api/backend/.dockerignore`:

```
**/target/
**/.idea/
**/*.iml
**/node_modules/
**/.mvn/timing.properties
```

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
