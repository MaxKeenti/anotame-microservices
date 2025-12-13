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
COPY operations-service/src operations-service/src

# Build Operations Service
RUN mvn clean package -pl operations-service -am -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/operations-service/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["java", "-jar", "app.jar"]
