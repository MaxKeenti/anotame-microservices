# Build Stage
FROM maven:3.9.14-eclipse-temurin-21-alpine AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx512m"

# Copy Parent POM
COPY pom.xml .

# Copy Module POMs
COPY observability-common/pom.xml observability-common/pom.xml
COPY identity-service/pom.xml identity-service/pom.xml
COPY catalog-service/pom.xml catalog-service/pom.xml
COPY sales-service/pom.xml sales-service/pom.xml
COPY operations-service/pom.xml operations-service/pom.xml

# Install the shared library before resolving service dependencies.
COPY observability-common/src observability-common/src
RUN mvn -B install -pl observability-common -DskipTests

# Download dependencies
RUN mvn -B dependency:resolve dependency:resolve-plugins -DexcludeArtifactIds=anotame-parent

# Copy Source Code
COPY catalog-service/src catalog-service/src

# Build Catalog Service
RUN mvn clean package -pl catalog-service -am -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/catalog-service/target/quarkus-app/ /app/

ENV JAVA_TOOL_OPTIONS="-Xms64m -Xmx256m -XX:MaxMetaspaceSize=128m -Xss512k -XX:+UseSerialGC -XX:ActiveProcessorCount=1 -XX:+ExitOnOutOfMemoryError"

ENTRYPOINT ["java", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "quarkus-run.jar"]
