#!/bin/bash
# Script to build and push Docker images for Anotame Microservices to GitHub Container Registry (ghcr.io)
# Usage: ./build_and_push.sh [GITHUB_USERNAME]

# Default GitHub username
DEFAULT_USERNAME="maxkeenti"
USERNAME="${1:-$DEFAULT_USERNAME}"

# Convert username to lowercase for Docker image naming convention
# GitHub usernames are case-insensitive but Docker registries often prefer lowercase
USERNAME_LOWER=$(echo "$USERNAME" | tr '[:upper:]' '[:lower:]')

REGISTRY="ghcr.io"
NAMESPACE="$REGISTRY/$USERNAME_LOWER"

echo "========================================================"
echo "Building and Pushing Images for: $NAMESPACE"
echo "========================================================"
echo "Ensure you have logged in to GHCR first:"
echo "  echo \$CR_PAT | docker login ghcr.io -u $USERNAME --password-stdin"
echo "========================================================"
echo ""

# Function to build and push
build_and_push() {
    local SERVICE_NAME=$1
    local DOCKER_CONTEXT=$2
    local DOCKERFILE_PATH=$3

    echo "--------------------------------------------------------"
    echo "Processing: $SERVICE_NAME"
    echo "Context: $DOCKER_CONTEXT"
    echo "--------------------------------------------------------"

    FULL_IMAGE_NAME="$NAMESPACE/anotame-$SERVICE_NAME:latest"

    # Check if context exists
    if [ ! -d "$DOCKER_CONTEXT" ]; then
        echo "Error: Directory $DOCKER_CONTEXT does not exist."
        exit 1
    fi

    # Build
    echo "Building $FULL_IMAGE_NAME..."
    # Note: We use the context directory as the build context
    if docker build --platform linux/amd64 -t "$FULL_IMAGE_NAME" -f "$DOCKERFILE_PATH" "$DOCKER_CONTEXT"; then
        echo "Build successful."
    else
        echo "Error: Build failed for $SERVICE_NAME"
        exit 1
    fi

    # Push
    echo "Pushing $FULL_IMAGE_NAME..."
    if docker push "$FULL_IMAGE_NAME"; then
        echo "Push successful."
    else
        echo "Error: Push failed for $SERVICE_NAME. (Did you run 'docker login ghcr.io'?)"
        exit 1
    fi
    echo ""
}

# 0. Database (Custom Image with Schema)
build_and_push "db" "anotame-db" "anotame-db/Dockerfile"

# 1. Identity Service
build_and_push "identity-service" "anotame-api/backend" "anotame-api/backend/identity-service/Dockerfile"

# 2. Sales Service
build_and_push "sales-service" "anotame-api/backend" "anotame-api/backend/sales-service/Dockerfile"

# 3. Operations Service
build_and_push "operations-service" "anotame-api/backend" "anotame-api/backend/operations-service/Dockerfile"

# 4. Catalog Service
build_and_push "catalog-service" "anotame-api/backend" "anotame-api/backend/catalog-service/Dockerfile"

# 5. Web Frontend
build_and_push "web" "anotame-web" "anotame-web/Dockerfile"

echo "========================================================"
echo "All images built and pushed successfully!"
echo "You can now verify them at: https://github.com/$USERNAME?tab=packages"
echo "========================================================"
