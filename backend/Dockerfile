# Build stage
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
# Explicitly copy the shaded artifact name defined in your pom.xml finalName
COPY --from=build /app/target/food-delivery-backend.jar ./app.jar
EXPOSE 8081
CMD ["java", "-jar", "app.jar"]