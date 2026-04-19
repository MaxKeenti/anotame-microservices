# Build Stage
FROM maven:3.9.14-eclipse-temurin-21-alpine AS build
WORKDIR /app
ENV MAVEN_OPTS="-Xmx512m"

# Copy Parent POM
COPY pom.xml .

# Copy Module POMs
COPY identity-service/pom.xml identity-service/pom.xml
COPY catalog-service/pom.xml catalog-service/pom.xml
COPY sales-service/pom.xml sales-service/pom.xml
COPY operations-service/pom.xml operations-service/pom.xml

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

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-XX:InitialRAMPercentage=50.0", "-XX:MaxMetaspaceSize=192m", "-Xss512k", "-XX:+ExitOnOutOfMemoryError", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "quarkus-run.jar"]
