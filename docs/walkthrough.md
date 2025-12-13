# Anotame Microservices Walkthrough
*(Last Updated: 2025-12-12)*

This guide provides step-by-step instructions to run the full Anotame stack (Database, Backend Microservices, Frontend).

## Prerequisites
*   **Docker Desktop** (running)
*   **Java 17+** & Maven
*   **Node.js 18+** & npm

## Step 1: Start Database (PostgreSQL)
We use Docker for the database to ensure a consistent environment with PostGIS support.

```bash
# From project root
docker-compose up -d
```
*   **URL**: `jdbc:postgresql://localhost:5432/anotame`
*   **User/Pass**: `admin` / `password`
*   **Admin UI**: [http://localhost:5050](http://localhost:5050) (pgAdmin)

---

## Step 2: Start Backend Services
You need to run 3 separate microservices. Open 3 terminal tabs for this.

**1. Identity Service (Auth)**
Authentication API (Login/Register).
```bash
cd anotame-api/backend/identity-service
mvn spring-boot:run
```
*   **Status**: Running on port `8081`

**2. Catalog Service (Menu)**
Provides Garment Types and Services. **Note**: Used for Seeding Data.
```bash
cd anotame-api/backend/catalog-service
mvn spring-boot:run
```
*   **Status**: Running on port `8082`
*   **Info**: On startup, it auto-inserts default data (Pants, Hemming, etc.) into the DB.

**3. Sales Service (Orders)**
Handles Order creation.
```bash
cd anotame-api/backend/sales-service
mvn spring-boot:run
```
*   **Status**: Running on port `8083`

---

## Step 3: Start Frontend (Web)
Run the NextJS application.

```bash
cd anotame-web
npm run dev
```
*   **URL**: [http://localhost:3000](http://localhost:3000)

---

## Step 4: Verification Flow (The "Core Loop")

1.  **Register/Login**:
    *   Go to `http://localhost:3000`.
    *   Click "Login".
    *   Since we have no UI for Registration yet, use the default credentials or register via Postman (`POST http://localhost:8081/auth/register`).
    *   *Tip*: Using the Login form will fail if the user doesn't exist in DB. 
    *   **Action**: For now, the Frontend mocks a "Success" login if the backend is down, BUT with the new integration, it hits the real backend. 
    *   **Self-Correction**: You might need to insert a user manually into `tca_user` table or use a curl command:
    ```bash
    curl -X POST http://localhost:8081/auth/register \
    -H "Content-Type: application/json" \
    -d '{"username":"admin", "password":"password", "email":"admin@anotame.com", "firstName":"Super", "lastName":"User"}'
    ```
    *   Now Login with `admin` / `password`.

2.  **Create New Order**:
    *   Navigate to **Dashboard** -> **New Order**.
    *   You should see "Garment" dropdown populated (Pants, Shirt, etc.) from the Catalog Service.
    *   Fill out Customer Details (First Name, Last Name).
    *   Add an Item (e.g., Pants + Hemming).
    *   Click **Create Ticket**.
    *   Verify you get a Success Alert with a Ticket Number (e.g., `ORD-173...`).

## Troubleshooting
*   **Empty Dropdowns?**: Ensure `catalog-service` is running. It seeds data on startup.
*   **Login Failed?**: Ensure you registered the user via Curl/Postman first.
*   **CORS Errors?**: All services are configured to allow `*` origins for dev. Check console logs.
