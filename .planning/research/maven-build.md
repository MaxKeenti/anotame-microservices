# Maven Build Research: GitHub Packages Elimination & Railway Compatibility

**Project:** anotame-microservices — 4 Quarkus 3.27.2 services under `anotame-api/backend/`
**Date:** 2026-04-14
**Confidence:** HIGH (based on direct POM inspection + authoritative Maven/Quarkus/Railway knowledge)

---

## 1. GitHub Packages Dependency Audit

### Findings from POM Inspection

After reading all five pom.xml files (parent + 4 services), the verdict is:

**There are zero GitHub Packages references in any POM in this project.**

Checked for: `<repositories>`, `<pluginRepositories>`, `<distributionManagement>`, `packages.github.com`, `GITHUB_TOKEN`, custom server credentials. None exist.

All four service POMs are structurally identical:
- BOM import: `io.quarkus.platform:quarkus-bom:3.27.2` — resolves from Maven Central
- Plugin: `io.quarkus.platform:quarkus-maven-plugin:3.27.2` — resolves from Maven Central
- All `io.quarkus:*` artifacts — resolved via the BOM, Maven Central
- `org.projectlombok:lombok:1.18.44` — Maven Central
- Parent aggregator POM (`anotame-parent`) — defines no repositories either

The `.mvn/wrapper/maven-wrapper.properties` downloads Maven 3.9.11 from `repo.maven.apache.org` — no GitHub involvement.

### Where GitHub Packages Dependencies Come From (General Reference)

GitHub Packages authentication failures arise from one of these patterns — none of which exist here, but document for future audits:

**Pattern 1 — Explicit repository block:**
```xml
<repositories>
  <repository>
    <id>github</id>
    <url>https://maven.pkg.github.com/OWNER/REPO</url>
    <snapshots><enabled>true</enabled></snapshots>
  </repository>
</repositories>
```
Any such block requires a PAT in `~/.m2/settings.xml` under a `<server id="github">` entry. Railway has no `~/.m2/settings.xml` by default.

**Pattern 2 — Custom BOM or parent from GitHub Packages:**
```xml
<parent>
  <groupId>com.example</groupId>
  <artifactId>private-parent</artifactId>
  <version>1.0</version>
  <!-- resolved from GitHub Packages, not Central -->
</parent>
```

**Pattern 3 — `settings.xml` in `.mvn/` directory:**
Maven supports `.mvn/settings.xml` at project root. If this file contained GitHub Packages server credentials, it would be used automatically. This project's `.mvn/` contains only `maven-wrapper.properties`.

**Pattern 4 — `distributionManagement` causing build failure:**
```xml
<distributionManagement>
  <repository>
    <id>github</id>
    <url>https://maven.pkg.github.com/OWNER/REPO</url>
  </repository>
</distributionManagement>
```
This only matters for `mvn deploy`, not `mvn package`. However if a parent POM has this section, Maven may attempt to validate the server configuration even during builds. Not present here.

### How to Audit Any Maven Project

```bash
# Grep all POMs for non-Central repository URLs
grep -r "packages.github.com\|repository\|<url>" --include="pom.xml" .

# Check active repositories during a build (dry run)
mvn -B help:effective-pom | grep -A3 "<repository>"

# See what repositories Maven will actually consult
mvn -B dependency:resolve -Dverbose 2>&1 | grep "Downloading from"

# List all repos Maven knows about including from active profiles
mvn -B help:effective-settings
```

If `Downloading from github:` appears in build output, GitHub Packages is in use. If only `Downloading from central:` appears, the build is clean.

---

## 2. Maven Central Only Configuration

### Current State: Already Clean

This project requires zero changes to eliminate GitHub Packages. The POMs resolve everything from Maven Central by default — no `<repositories>` block means Maven uses its built-in Central entry only.

### Hardening: Explicitly Enforce Maven Central Only

While the project is already clean, explicitly declaring the repository prevents accidental introduction of custom repos via profiles or transitive parent POMs. Add to the parent POM or to each service POM:

```xml
<repositories>
  <repository>
    <id>central</id>
    <url>https://repo.maven.apache.org/maven2</url>
    <snapshots>
      <enabled>false</enabled>
    </snapshots>
    <releases>
      <enabled>true</enabled>
    </releases>
  </repository>
</repositories>

<pluginRepositories>
  <pluginRepository>
    <id>central</id>
    <url>https://repo.maven.apache.org/maven2</url>
    <snapshots>
      <enabled>false</enabled>
    </snapshots>
  </pluginRepository>
</pluginRepositories>
```

Adding this to the parent POM (`anotame-api/backend/pom.xml`) propagates to all modules.

### Disabling Custom Repos at Build Time (Defense-in-Depth)

Pass `-nsu` (no snapshot updates) and block non-Central repos via a Maven settings override baked into the Dockerfile:

```dockerfile
# Create a minimal settings.xml that blocks everything except Central
RUN mkdir -p /root/.m2 && cat > /root/.m2/settings.xml <<'EOF'
<settings>
  <mirrors>
    <mirror>
      <id>central-only</id>
      <mirrorOf>*</mirrorOf>
      <url>https://repo.maven.apache.org/maven2</url>
    </mirror>
  </mirrors>
</settings>
EOF
```

The `<mirrorOf>*</mirrorOf>` mirror redirects ALL repository lookups (including any accidentally declared GitHub Packages repo) to Maven Central. This is the most reliable guard.

### Verification Without a GitHub Token

```bash
# Unset any token that might be in the environment
unset GITHUB_TOKEN
unset CR_PAT

# Build from a clean local repo (no cache)
mvn clean package -pl identity-service -am -DskipTests \
  --no-transfer-progress \
  -Dmaven.repo.local=/tmp/clean-repo

# If this succeeds, the build needs no GitHub Packages token.
```

---

## 3. Quarkus BOM on Maven Central

### Confirmation

`io.quarkus.platform:quarkus-bom:3.27.2` is available on Maven Central. The `io.quarkus.platform` group is the official Quarkus release group maintained by Red Hat/Quarkus team. All Quarkus platform releases from 2.x onward are published to Maven Central — there is no private or GitHub Packages distribution for official Quarkus releases.

Maven Central coordinates: `https://repo.maven.apache.org/maven2/io/quarkus/platform/quarkus-bom/3.27.2/`

### Correct BOM Import Pattern (No Custom Repos Required)

The pattern used in all four service POMs is exactly correct:

```xml
<properties>
  <quarkus.platform.group-id>io.quarkus.platform</quarkus.platform.group-id>
  <quarkus.platform.artifact-id>quarkus-bom</quarkus.platform.artifact-id>
  <quarkus.platform.version>3.27.2</quarkus.platform.version>
</properties>

<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>${quarkus.platform.group-id}</groupId>
      <artifactId>${quarkus.platform.artifact-id}</artifactId>
      <version>${quarkus.platform.version}</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
```

No `<repositories>` block is needed. Maven Central is the default.

### Note on Quarkus Plugin Resolution

The `quarkus-maven-plugin` is resolved from the same group (`io.quarkus.platform:quarkus-maven-plugin:3.27.2`) which is also on Maven Central. The plugin resolution follows standard Maven plugin repository rules — no custom `<pluginRepositories>` needed.

---

## 4. Railway Build Environment

### How Railway Builds Projects

Railway's build system works in one of two modes:

**Mode A: Nixpacks (auto-detected, default)**
Railway inspects the repo and auto-detects the language/framework. For Java projects with a `pom.xml`, Nixpacks runs `mvn package -DskipTests` by default. However Nixpacks' Java support is limited and the build context detection can be unreliable for multi-module projects with a non-root parent POM.

**Mode B: Dockerfile (recommended for Quarkus)**
If a `Dockerfile` is present in the service root (or in the build context root), Railway uses it directly via Docker BuildKit. This is the correct approach for this project because:
- Each service already has a Dockerfile
- Quarkus fast-jar layout (`target/quarkus-app/`) requires a multi-stage build
- Railway respects the `RAILWAY_DOCKERFILE_PATH` environment variable or auto-detects `Dockerfile` at the configured root directory

### Railway Configuration

In the Railway project dashboard, per service:
- **Root Directory**: Set to `anotame-api/backend` (the directory containing parent pom.xml and service subdirs)
- **Dockerfile Path**: `identity-service/Dockerfile` (relative to root directory), or set root dir to the service folder and use `Dockerfile`
- **Build Command**: Leave empty when using Dockerfile mode — Railway runs `docker build` directly

Alternatively, configure via `railway.toml` at repo root:

```toml
[build]
builder = "dockerfile"
dockerfilePath = "anotame-api/backend/identity-service/Dockerfile"
```

Railway does NOT run `mvn install` or `mvn deploy` — the build happens entirely inside the Docker build context. The Dockerfile's `RUN mvn clean package` is what builds the artifact.

### Maven Wrapper Support

Railway's Docker build runs the Dockerfile instructions verbatim. The `mvnw` script in `anotame-api/backend/` is available but the Dockerfiles correctly use the `maven:3.9.6-eclipse-temurin-21-alpine` base image which provides Maven directly — the wrapper is not needed inside Docker. This is correct and simpler.

### Railway Memory Constraints

Railway's free-tier build runners have limited memory (~512MB-2GB depending on plan). Quarkus JVM builds are memory-intensive during compilation. Relevant flags:

```dockerfile
ENV MAVEN_OPTS="-Xmx768m -Xms256m"
```

For the runtime container on Railway's free tier (512MB RAM limit), the JVM needs to be constrained:

```dockerfile
ENTRYPOINT ["java", \
  "-Xmx256m", \
  "-Xms64m", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-jar", "quarkus-run.jar"]
```

`-XX:+UseContainerSupport` (enabled by default in JDK 11+) tells the JVM to read cgroup memory limits. `-XX:MaxRAMPercentage=75.0` caps heap at 75% of the container's memory limit. These two flags together are more robust than hard-coded `-Xmx` when Railway's memory allocation changes.

---

## 5. Dockerfile for Quarkus on Railway

### Problems with the Existing Dockerfiles

The current Dockerfiles are functionally correct but have several issues that affect Railway builds:

1. **`go-offline` step will fail for Quarkus** — The `maven-dependency-plugin:go-offline` goal does not understand Quarkus's code generation extensions. It downloads most deps but misses extension-generated artifacts, causing the subsequent `mvn package` to re-download or fail. Remove it.

2. **No MAVEN_OPTS memory cap in build stage** — identity-service and catalog-service Dockerfiles omit `MAVEN_OPTS`, so the Maven build uses unlimited heap. On Railway's build runner this can cause OOM kills.

3. **`-C` (strict checksum) flag on `go-offline`** — Combined with the above, this causes failures on partially cached deps.

4. **No `--add-opens` in identity-service/catalog-service build ENV** — The compiler args are in the POM (correct), but adding them to `MAVEN_OPTS` in the Dockerfile as well (as sales-service and operations-service do) is belt-and-suspenders for Alpine JDK variants.

5. **Inconsistent ENTRYPOINT path** — catalog-service uses `/app/quarkus-run.jar` (absolute), others use `quarkus-run.jar` (relative). With `WORKDIR /app` and all files copied to `/app/`, both work, but relative is canonical for Quarkus's fast-jar.

### Recommended Production Dockerfile (Per Service)

Replace the existing Dockerfiles with this pattern. Shown for `identity-service`; change ports and `-pl` flag per service.

```dockerfile
# ============================================================
# Stage 1: Build
# ============================================================
FROM maven:3.9.11-eclipse-temurin-21-alpine AS build

# Memory cap for Maven compiler — prevents OOM on Railway build runners.
# The --add-opens flags satisfy Lombok's annotation processor on Java 21.
ENV MAVEN_OPTS="\
  -Xmx768m \
  -Xms128m \
  --add-opens=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED \
  --add-opens=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED"

WORKDIR /app

# --- Layer: Parent POM only ---
# Copy parent POM first so Docker caches this layer independently.
COPY pom.xml ./pom.xml

# --- Layer: All module POMs (for reactor resolution without sources) ---
COPY identity-service/pom.xml   identity-service/pom.xml
COPY catalog-service/pom.xml    catalog-service/pom.xml
COPY sales-service/pom.xml      sales-service/pom.xml
COPY operations-service/pom.xml operations-service/pom.xml

# --- Layer: Dependency pre-fetch ---
# Use dependency:resolve instead of go-offline. go-offline does not handle
# Quarkus extension metadata correctly and causes spurious re-downloads.
# -pl identity-service -am resolves deps for this module and its parents only.
# This layer is cached as long as the POMs do not change.
RUN mvn -B -ntp dependency:resolve \
    -pl identity-service -am \
    -DincludeScope=runtime \
    -DskipTests \
  && mvn -B -ntp dependency:resolve-plugins \
    -pl identity-service -am \
    -DskipTests

# --- Layer: Source code ---
# Only copy the specific service's source. This layer busts cache only when
# that service's source changes, not when sibling services change.
COPY identity-service/src identity-service/src

# --- Layer: Compile and package ---
# -pl identity-service -am: build this module, skipping unrelated siblings.
# -DskipTests: no integration tests during Railway builds.
# -Dquarkus.package.jar.type=fast-jar: explicit (default since Quarkus 2.x,
#   but explicit beats implicit for reproducibility).
RUN mvn -B -ntp clean package \
    -pl identity-service -am \
    -DskipTests \
    -Dquarkus.package.jar.type=fast-jar

# ============================================================
# Stage 2: Runtime
# ============================================================
# eclipse-temurin:21-jre-alpine is ~180MB. Use the same JDK family as the
# build stage to avoid ClassLoader/ABI surprises with native libraries.
FROM eclipse-temurin:21-jre-alpine AS runtime

# Non-root user for Railway's security model.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Copy the Quarkus fast-jar output directory.
# quarkus-app/ contains:
#   quarkus-run.jar        — thin launcher jar (~7KB)
#   lib/                   — all dependencies (flat jars)
#   app/                   — application classes
#   quarkus/               — Quarkus framework bootstrap cache
COPY --from=build /app/identity-service/target/quarkus-app/ ./

EXPOSE 8081

# -XX:+UseContainerSupport  — read cgroup memory limit (JDK 11+ default, explicit is safe)
# -XX:MaxRAMPercentage=75.0 — cap heap at 75% of container RAM limit
# -Djava.util.logging.manager — required by Quarkus log manager; without this
#   JUL logging initializes before Quarkus can replace it, producing duplicate logs
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", \
  "-jar", "quarkus-run.jar"]
```

### Port Map for All Four Services

| Service | Internal Port | `-pl` flag |
|---------|--------------|------------|
| identity-service | 8081 | `-pl identity-service -am` |
| catalog-service | 8082 | `-pl catalog-service -am` |
| sales-service | 8083 | `-pl sales-service -am` |
| operations-service | 8084 | `-pl operations-service -am` |

### Docker Build Context for Railway

Railway builds from a **root directory** you configure per service. Because all four Dockerfiles need to COPY from sibling directories (`COPY catalog-service/pom.xml ...` when building identity-service), the build context must be the parent directory containing all four service folders.

Set Railway's **Root Directory** to `anotame-api/backend` for all four services. Then set the Dockerfile path per service:

| Service | Dockerfile Path (relative to Root Directory) |
|---------|----------------------------------------------|
| identity-service | `identity-service/Dockerfile` |
| catalog-service | `catalog-service/Dockerfile` |
| sales-service | `sales-service/Dockerfile` |
| operations-service | `operations-service/Dockerfile` |

---

## 6. Parent POM Consolidation (Optional but Recommended)

Currently the parent POM (`anotame-api/backend/pom.xml`) is a pure aggregator with no shared configuration. Each service POM duplicates identical `<properties>`, `<dependencyManagement>`, and `<build>` sections. This is the correct separation for now (Railway builds each service independently), but the duplication is a maintenance burden.

If consolidating, move shared config to the parent POM and have each service inherit from it:

```xml
<!-- anotame-api/backend/pom.xml (parent) -->
<project>
  <groupId>com.anotame</groupId>
  <artifactId>anotame-parent</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <packaging>pom</packaging>

  <properties>
    <quarkus.platform.group-id>io.quarkus.platform</quarkus.platform.group-id>
    <quarkus.platform.artifact-id>quarkus-bom</quarkus.platform.artifact-id>
    <quarkus.platform.version>3.27.2</quarkus.platform.version>
    <compiler-plugin.version>3.13.0</compiler-plugin.version>
    <surefire-plugin.version>3.5.2</surefire-plugin.version>
    <maven.compiler.release>21</maven.compiler.release>
    <lombok.version>1.18.44</lombok.version>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <!-- Lock ALL versions via BOM import in parent -->
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>${quarkus.platform.group-id}</groupId>
        <artifactId>${quarkus.platform.artifact-id}</artifactId>
        <version>${quarkus.platform.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>

  <!-- Shared build config inherited by all modules -->
  <build>
    <pluginManagement>
      <plugins>
        <plugin>
          <groupId>${quarkus.platform.group-id}</groupId>
          <artifactId>quarkus-maven-plugin</artifactId>
          <version>${quarkus.platform.version}</version>
        </plugin>
        <plugin>
          <artifactId>maven-compiler-plugin</artifactId>
          <version>${compiler-plugin.version}</version>
          <configuration>
            <compilerArgs>
              <arg>-parameters</arg>
              <!-- add-opens args here -->
            </compilerArgs>
            <annotationProcessorPaths>
              <path>
                <groupId>org.projectlombok</groupId>
                <artifactId>lombok</artifactId>
                <version>${lombok.version}</version>
              </path>
            </annotationProcessorPaths>
          </configuration>
        </plugin>
      </plugins>
    </pluginManagement>
  </build>

  <modules>
    <module>identity-service</module>
    <module>catalog-service</module>
    <module>sales-service</module>
    <module>operations-service</module>
  </modules>
</project>
```

Each service POM then reduces to groupId, artifactId, version, a `<parent>` block, and only service-specific `<dependencies>`.

**Caveat for Railway:** If using parent inheritance, the Dockerfile `COPY pom.xml ./pom.xml` step must copy the parent before resolving module POMs. The current Dockerfiles already do this correctly.

---

## 7. Summary: Actions Required

| # | Action | Priority | File |
|---|--------|----------|------|
| 1 | No GitHub Packages removal needed — POMs are already clean | Done | — |
| 2 | Upgrade Dockerfiles: remove `go-offline`, add memory cap, add `UseContainerSupport` | High | Each service's `Dockerfile` |
| 3 | Add `-Djava.util.logging.manager` to ENTRYPOINT in all Dockerfiles | High | Each service's `Dockerfile` |
| 4 | Fix catalog-service ENTRYPOINT path (`/app/quarkus-run.jar` → `quarkus-run.jar`) | Medium | `catalog-service/Dockerfile` |
| 5 | Add Maven version to `3.9.11` in build stage (matches wrapper version) | Low | Each service's `Dockerfile` |
| 6 | Set Railway Root Directory to `anotame-api/backend` per service | High | Railway dashboard |
| 7 | Set Dockerfile path per service in Railway dashboard | High | Railway dashboard |
| 8 | Optionally add `central-only` mirror to Dockerfile to guard against future accidental GitHub Packages deps | Low | Each service's `Dockerfile` |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| GitHub Packages audit | HIGH | Direct POM inspection — no references found |
| Maven Central availability of Quarkus BOM | HIGH | `io.quarkus.platform` has been Central-only since Quarkus 1.13; 3.x confirmed |
| Quarkus fast-jar layout | HIGH | Stable since Quarkus 2.0; `target/quarkus-app/quarkus-run.jar` is canonical |
| Railway Docker mode behavior | MEDIUM | Based on Railway's documented build system behavior; exact env vars may shift |
| Railway memory limits | MEDIUM | Documented free-tier constraints; paid plans differ — use `MaxRAMPercentage` over hard `-Xmx` |
| `go-offline` failure with Quarkus | HIGH | Known issue: Quarkus augmentation generates classfiles at build time that `go-offline` cannot prefetch |
