#!/bin/bash

# Configuration
IDENTITY_URL="http://localhost:8081"
CATALOG_URL="http://localhost:8082"
SALES_URL="http://localhost:8083"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "=================================================="
echo "   ANOTAME COMPLETE INTEGRATION TEST"
echo "=================================================="

# 1. Register User
USERNAME="testuser_$(date +%s)"
EMAIL="$USERNAME@example.com"
PASSWORD="GlobalPassword123!"

echo -e "\n[1] Registering User: $USERNAME"
REGISTER_RESPONSE=$(curl -s -X POST "$IDENTITY_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\", \"email\": \"$EMAIL\", \"firstName\": \"Test\", \"lastName\": \"User\"}")

# Check if registration was successful (conceptually, by trying to login next)
echo "    Response: $REGISTER_RESPONSE"

# 2. Login & Get Token
echo -e "\n[2] Logging In..."
LOGIN_RESPONSE=$(curl -s -X POST "$IDENTITY_URL/auth/token" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}FAILED: Could not get token.${NC}"
  echo "Login Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}SUCCESS: Got Token!${NC}"
# echo "Token: $TOKEN" # Uncomment for debug

# 3. Fetch Catalog (Garments)
echo -e "\n[3] Fetching Garments from Catalog..."
GARMENTS_RESPONSE=$(curl -s "$CATALOG_URL/catalog/garments")
GARMENT_ID=$(echo $GARMENTS_RESPONSE | jq -r '.[0].id')

if [ -z "$GARMENT_ID" ] || [ "$GARMENT_ID" == "null" ]; then
  echo -e "${RED}FAILED: Could not get Garment ID.${NC}"
  echo "Response: $GARMENTS_RESPONSE"
  exit 1
fi

echo -e "${GREEN}SUCCESS: Found Garment ID: $GARMENT_ID${NC}"

# 4. Fetch Catalog (Services)
echo -e "\n[4] Fetching Services from Catalog..."
SERVICES_RESPONSE=$(curl -s "$CATALOG_URL/catalog/services")
SERVICE_ID=$(echo $SERVICES_RESPONSE | jq -r '.[0].id')
SERVICE_PRICE=$(echo $SERVICES_RESPONSE | jq -r '.[0].basePrice')

if [ -z "$SERVICE_ID" ] || [ "$SERVICE_ID" == "null" ]; then
  echo -e "${RED}FAILED: Could not get Service ID.${NC}"
  echo "Response: $SERVICES_RESPONSE"
  exit 1
fi

echo -e "${GREEN}SUCCESS: Found Service ID: $SERVICE_ID ($SERVICE_PRICE)${NC}"

# 5. Create Order
echo -e "\n[5] Creating Order in Sales Service..."

ORDER_PAYLOAD=$(cat <<EOF
{
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@client.com",
    "phone": "555-0199"
  },
  "items": [
    {
      "garmentTypeId": "$GARMENT_ID",
      "garmentName": "Test Garment",
      "serviceId": "$SERVICE_ID",
      "serviceName": "Test Service",
      "quantity": 1,
      "unitPrice": $SERVICE_PRICE,
      "notes": " Urgent fix"
    }
  ],
  "committedDeadline": "$(date -v+3d +%Y-%m-%dT%H:%M:%S)",
  "notes": "Integration Test Order"
}
EOF
)

ORDER_RESPONSE=$(curl -s -X POST "$SALES_URL/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-User-Name: $USERNAME" \
  -d "$ORDER_PAYLOAD")

TICKET_NUMBER=$(echo $ORDER_RESPONSE | jq -r '.ticketNumber')

if [ -z "$TICKET_NUMBER" ] || [ "$TICKET_NUMBER" == "null" ]; then
  echo -e "${RED}FAILED: Order creation failed.${NC}"
  echo "Response: $ORDER_RESPONSE"
  exit 1
fi

echo -e "${GREEN}SUCCESS: Order Created! Ticket Number: $TICKET_NUMBER${NC}"
echo "    Full Order: $ORDER_RESPONSE"

echo -e "\n=================================================="
echo -e "${GREEN}INTEGRATION TEST PASSED!${NC}"
echo "=================================================="
