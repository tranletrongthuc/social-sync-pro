# System Architecture Document: SocialSync Pro

**Version:** 1.0
**Date:** 2025-08-25
**Status:** Active

---

## 1. Introduction
This document outlines the system architecture for the SocialSync Pro application. It describes the major components, their interactions, the data flow, and the key technical decisions made to meet the project's business and non-functional requirements.

## 2. Architectural Goals
The architecture is designed with the following primary goals in mind:
-   **Security:** Protect sensitive credentials (API keys) and ensure data integrity.
-   **Scalability:** Easily handle growth in users, data, and feature complexity.
-   **Maintainability:** Create a clear separation of concerns to make the system easier to understand, modify, and debug.
-   **Flexibility:** Allow for the seamless integration of new AI services and third-party APIs in the future.

---

## 3. System Overview

SocialSync Pro is a modern web application built on a decoupled architecture. The system is composed of three primary layers: a dynamic frontend client, a Backend-for-Frontend (BFF) server, and a set of external third-party services.

### 3.1. High-Level Architecture Diagram

```
+-----------------+      +----------------------------+      +------------------------+
|                 |      |                            |      |   External Services    |
|  Frontend       |      |  Backend-for-Frontend (BFF)|      | - Airtable (Database)  |
|  (React, Vite)  |----->|  (Vercel Serverless Funcs) |----->| - Gemini (AI)          |
|  (User Browser) |      |                            |      | - Cloudinary (Storage) |
|                 |      |                            |      | - Facebook (Publish)   |
+-----------------+      +----------------------------+      | - OpenRouter (AI)      |
                                                             +------------------------+
```

---

## 4. Component Breakdown

### 4.1. Frontend
The frontend is a Single-Page Application (SPA) responsible for rendering the user interface and managing the client-side state.
-   **Framework:** React with TypeScript for type safety and robust component-based UI development.
-   **Build Tool:** Vite for fast development and optimized production builds.
-   **Key Responsibilities:**
    -   Rendering all UI components (e.g., modals, forms, post cards).
    -   Managing local UI state.
    -   Initiating all requests to the BFF for data or processing. It **never** communicates directly with external services.
    -   Handling user authentication for the admin panel.

### 4.2. Backend-for-Frontend (BFF)
The BFF is the critical intermediary layer that handles all communication with the outside world. It is deployed as a set of Node.js-based Serverless Functions on Vercel.
-   **Architecture:** Serverless Functions, where each API endpoint is a separate, auto-scaling function.
-   **Key Responsibilities:**
    -   **API Gateway:** Acts as a single, secure entry point for the frontend.
    -   **Credential Management:** Securely stores and uses API keys for all external services. Keys are stored as environment variables on Vercel, never exposed to the client.
    -   **Business Logic:** Contains logic for interacting with third-party services (e.g., formatting requests to the Gemini API, handling Airtable queries).
    -   **Proxying:** Forwards requests from the client to the appropriate external service and returns the response.
-   **Key Endpoints:**
    -   `POST /api/gemini/[action]`: Proxies requests to the Google Gemini AI service for text and image generation.
    -   `POST /api/openrouter/[action]`: Proxies requests to the OpenRouter AI service.
    -   `POST /api/airtable/[action]`: Acts as a generic proxy for all database operations with Airtable.
    -   `POST /api/cloudinary/upload`: Handles file uploads to Cloudinary.
    -   `POST /api/facebook/publish`: Handles publishing content to the Facebook Graph API.
    -   `GET /api/health`: A simple health check endpoint.

### 4.3. External Services
These are the third-party platforms that provide the core data storage, AI, and publishing capabilities.
-   **Airtable:** Used as the primary database for the application. It stores all persistent data, including user projects, brand information, media plans, posts, personas, and AI service configurations.
-   **Google Gemini & OpenRouter:** Provide the generative AI capabilities for creating text and image content.
-   **Cloudinary:** Used for storing and delivering all media assets, such as generated images and user-uploaded avatars.
-   **Facebook Graph API:** Used to publish content directly to connected Facebook Pages.

---

## 5. Data Flow Example: Generating a Post Image
1.  **User Action:** The user clicks the "Generate Image" button for a post in the frontend UI.
2.  **Frontend to BFF:** The React application calls a function in `bffService.ts`, which sends a `POST` request to its own backend at `/api/gemini/generate-image`. The request payload contains the prompt for the image.
3.  **BFF Logic:** The Vercel Serverless Function at `api/gemini/generate-image.js` is invoked.
    a. It retrieves the secure `GEMINI_API_KEY` from its environment variables.
    b. It constructs a valid request for the Google Gemini API, using the prompt from the frontend and the secure API key.
4.  **BFF to External Service:** The BFF sends the request to the official Gemini API endpoint.
5.  **Response to BFF:** The Gemini API processes the request, generates the image, and returns the image data in its response to the BFF.
6.  **BFF to Frontend:** The BFF receives the response, formats it as needed, and sends it back to the frontend client.
7.  **UI Update:** The frontend receives the image data and updates the `PostCard` component to display the new image.

---

## 6. Data Model
The core data is structured in Airtable tables. Key data structures are defined in `types.ts` and include:
-   `AIService`: Represents an AI provider (e.g., "Gemini").
-   `AIModel`: Represents a specific model from a service (e.g., "gemini-1.5-pro").
-   `Brand`: Contains all information for a user's project.
-   `MediaPlan`: A collection of posts for a specific campaign.
-   `Post`: An individual piece of content with text, image, status, etc.
-   `Persona`: A profile of a target audience member.

---

## 7. Security Considerations
The primary security measure is the BFF architecture itself, which prevents any exposure of API keys to the public-facing client. All communication between the client and BFF is over HTTPS. Access to the admin panel is protected by a password.
