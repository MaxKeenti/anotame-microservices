# Legacy React Application Structure Analysis

This document traces the structure of the `anotame-legacy-react` project before its deletion, preserving knowledge about the previous frontend implementation.

## Project Overview

- **Name**: `anotamereact`
- **Stack**: React 18, Vite, Bootstrap 5, React-Bootstrap, Sass.
- **State Management**: Context API (implied by `contexts` directory).
- **Routing**: Likely React Router (standard for this stack, though not explicitly seen in the partial listing, `main.jsx` usually holds it).

## Directory Structure

### `src`
The source code was organized into modular directories:

- **`app-modules`**: Functionality-based grouping.
    - `ClientData`: handling client information.
    - `GarmentData`: handling garment/item information.
    - `PaymentData`: handling payment processing.
    - `contexts`: React Context providers for global state.
    - `customized-elements`: Reusable UI components.

- **`services`**: API communication layer.

- **`assets`**: Static assets (likely).

### Configuration
- `vite.config.js`: Vite build configuration.
- `package.json`: Dependency management.

## Key Dependencies
- `react`, `react-dom`: Core framework.
- `bootstrap`, `react-bootstrap`: UI framework.
- `react-icons`: Iconography.
- `sass`: CSS Preprocessing.
- `axios` (implied for services) or `fetch`.

## Notes for Migration
- The domain logic was split into `Client`, `Garment`, and `Payment` modules.
- Ensure the new microservices frontend covers these three critical domains.
