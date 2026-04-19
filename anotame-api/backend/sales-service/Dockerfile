# Build Stage
FROM maven:4.0.0-eclipse-temurin-21-alpine AS build
WORKDIR /app
ENV MAVEN_OPTS="--add-opens=jdk.compiler/com.sun.tools.javac.code=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.comp=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.main=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.model=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.processing=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED --add-opens=jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED -Xmx512m"

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
COPY sales-service/src sales-service/src

# Build Sales Service
RUN mvn clean package -pl sales-service -am -DskipTests

# Run Stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/sales-service/target/quarkus-app/ /app/

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60.0", "-XX:InitialRAMPercentage=50.0", "-XX:MaxMetaspaceSize=192m", "-Xss512k", "-XX:+ExitOnOutOfMemoryError", "-Djava.util.logging.manager=org.jboss.logmanager.LogManager", "-jar", "quarkus-run.jar"]
