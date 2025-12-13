# Build Stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy Parent POM
COPY pom.xml .

# Copy Module POMs (to ensure reactor works if needed, though mostly we need parent)
COPY identity-service/pom.xml identity-service/pom.xml
COPY catalog-service/pom.xml catalog-service/pom.xml
COPY sales-service/pom.xml sales-service/pom.xml
COPY operations-service/pom.xml operations-service/pom.xml

# Download dependencies (to cache them)
# We run install on parent to ensure it's available
RUN mvn -B -e -C org.apache.maven.plugins:maven-dependency-plugin:3.6.1:go-offline -DexcludeArtifactIds=anotame-parent

# Copy Source Code
COPY identity-service/src identity-service/src

# Build Identity Service
RUN mvn clean package -pl identity-service -am -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/identity-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
