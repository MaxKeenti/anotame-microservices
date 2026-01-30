# Build Stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy Parent POM
COPY pom.xml .

# Copy Module POMs
COPY identity-service/pom.xml identity-service/pom.xml
COPY catalog-service/pom.xml catalog-service/pom.xml
COPY sales-service/pom.xml sales-service/pom.xml
COPY operations-service/pom.xml operations-service/pom.xml

# Download dependencies
RUN mvn -B -e -C org.apache.maven.plugins:maven-dependency-plugin:3.6.1:go-offline -DexcludeArtifactIds=anotame-parent

# Copy Source Code
COPY catalog-service/src catalog-service/src

# Build Catalog Service
RUN mvn clean package -pl catalog-service -am -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/catalog-service/target/quarkus-app/ /app/
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "/app/quarkus-run.jar"]
