# Quick Task: Lombok 1.18.44 Java21 Compatibility Update

**Date:** 2026-04-05
**Scope:** Update Lombok across all backend services for Java 21 support
**Blocker:** Phase 14 execution depends on build passing

## Problem

Lombok 1.18.36 fails on Java 21 with:
```
java.lang.NoSuchFieldException: com.sun.tools.javac.code.TypeTag :: UNKNOWN
```

This is because Lombok < 1.18.44 doesn't have proper Java 21 javac support.

## Solution Discovered

**Lombok 1.18.44** includes full Java 21 compatibility. Verified via:
- ✅ Successful compilation of operations-service with Lombok 1.18.44
- ✅ Full `mvn clean install` passes
- ✅ Quarkus augmentation works (no TypeTag errors)

## Files to Update

All backend service pom.xml files that declare Lombok dependency:

```bash
find anotame-api/backend -name "pom.xml" -exec grep -l "org.projectlombok" {} \;
```

Expected: ~4-5 backend services using Lombok

## Changes Required Per Service

In each `pom.xml`:

1. Update `<dependency>` version:
   ```xml
   <version>1.18.44</version>  <!-- was 1.18.36 -->
   ```

2. Update `<annotationProcessorPaths>` version (if present):
   ```xml
   <version>1.18.44</version>  <!-- was 1.18.36 -->
   ```

## Test Plan

After updating all services:
```bash
mvn clean install -DskipTests -pl ':operations-service,:sales-service,:auth-service' # adjust for all backend services
```

## IDE Configuration

VS Code / IntelliJ: Project is auto-configured via pom.xml. No manual IDE setup required after Maven update.
