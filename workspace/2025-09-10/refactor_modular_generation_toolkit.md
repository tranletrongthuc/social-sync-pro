# Refactoring Plan: The Modular Generation Toolkit

**Version:** 3.0
**Date:** 2025-09-09
**Status:** Proposed

---

## 1. Overview

This document outlines a comprehensive refactoring plan to re-architect the AI content generation capabilities of the SocialSync Pro application. The current implementation, while functional, has significant code duplication, particularly within `geminiService.ts`, and tightly couples business logic (what to generate) with API communication logic (how to generate it).

The proposed solution is to create a **"Modular Generation Toolkit"** built on a service-oriented architecture. This will centralize the core generation workflow, making it more scalable, maintainable, and flexible for multiple AI providers and generation modalities (text, image, etc.).

## 2. Problem Statement

The current architecture suffers from several key issues:

-   **Code Duplication:** The logic for building prompts and processing AI responses is repeated across numerous functions and services.
-   **Difficult Maintenance:** A change to a core piece of logic (e.g., how a persona is handled) requires finding and editing multiple files.
-   **Poor Abstraction:** The responsibility between services is unclear. Business logic is mixed with API communication code, making it difficult to swap AI providers.
-   **Fragile Provider Selection:** Logic for choosing an AI provider is not robust and does not use the application's own configuration data.

## 3. Proposed Architecture: Service-Oriented Orchestration

We will refactor the system into distinct layers, each with a single, clear responsibility. This architecture is based on the principle of a central orchestrator that uses specialized tools and simple API clients.

### 3.1. Architectural Diagram

```
+------------------------------------+
|         UI Orchestrator            |
|            (App.tsx)               |
+-----------------^------------------+
                  | Calls
+-----------------v------------------+
|      Orchestration Layer           |
| (textGenerationService.ts,         |
|  imageGenerationService.ts)        |
| *Contains main business logic*     |
+-----------------|------------------+
                  | Uses
       +----------v----------+      +-----------------v-----------------+
       |   Provider Layer    |      |        Toolkit Layer            |
       | (geminiService.ts,  |      |                                   |
       | openrouterService.ts)|      | - prompt.builder.ts               |
       +-------------------+      | - response.processor.ts           |
                                  +-----------------------------------+
```

### 3.2. Component Descriptions

1.  **Orchestration Layer (The "Do-er"):**
    -   **`textGenerationService.ts`, `imageGenerationService.ts`:** These are the primary implementation files. They are **not** just interfaces. They will contain the core orchestration logic for every generation task (e.g., `generateMediaPlanGroup`).
    -   **Workflow:** For any given task, they will be responsible for executing the full sequence: **1. Build Prompt -> 2. Call Provider -> 3. Process Response.**

2.  **Provider Layer (The "Call-er"):**
    -   **`geminiService.ts`, `openrouterService.ts`, `cloudflareService.ts`:** These services will be refactored into simple, stateless "API clients."
    -   Their **sole responsibility** is to export functions that handle the technical details of communicating with a specific backend endpoint (e.g., `callGeminiApi(prompt, config)`).

3.  **Toolkit Layer (The "Helpers"):**
    -   **`prompt.builder.ts`:** A centralized service responsible for all complex prompt engineering. It will build prompts for JSON, text, and hyper-detailed images.
    -   **`response.processor.ts`:** A centralized service responsible for parsing, cleaning, and normalizing all complex JSON responses into application-ready data structures.

4.  **UI Orchestration Layer (`App.tsx`):**
    -   Remains the master controller for user workflows. It will initiate tasks by calling the appropriate function in the **Orchestration Layer** (e.g., `textGenerationService.generateMediaPlanGroup(...)`).

### 3.3. Core Principle: Configuration-Driven Logic

A critical part of this refactoring is to **stop guessing** which provider a model belongs to based on its name. The logic must be driven by the application's own settings.

-   The orchestrator functions (in `textGenerationService.ts`, etc.) will take the `aiModelConfig` object as a parameter.
-   A helper function, `getProviderService(modelName, aiModelConfig)`, will look up the `modelName` in the `aiModelConfig.allModels` array.
-   It will read the `service` property (e.g., "google", "openrouter") from the configuration for that model.
-   A `switch` statement will use this reliable `service` property to return the correct provider service from the Provider Layer.

---

## 4. Phased Implementation Plan

This refactoring will be executed in logical phases to ensure a smooth transition.

### Phase 1: Establish the Toolkit Foundation

1.  **Create New Files:** Create the initial empty files for the toolkit:
    -   `src/services/prompt.builder.ts`
    -   `src/services/response.processor.ts`
    -   `src/services/imageGenerationService.ts` (to define the new image abstraction)

### Phase 2: Refactor a Single Workflow (e.g., Media Plan Generation)

This will serve as the proof-of-concept for the new architecture.

1.  **Isolate Logic into Toolkit:** Copy the prompt-building logic from the original `geminiService.ts` into a new `buildMediaPlanPrompt` function in `prompt.builder.ts`. Copy the response-handling logic into a new `processMediaPlanResponse` function in `response.processor.ts`.
2.  **Refactor Provider Service (`geminiService.ts`):** Edit the `geminiService.ts` file to simplify it. Create a single, generic function for making API calls (e.g., `generateRawContent(prompt, config)`). Remove the old, complex `generateMediaPlanGroup` function.
3.  **Implement Orchestrator (`textGenerationService.ts`):** Create the new `generateMediaPlanGroup` function inside `textGenerationService.ts`. This function will contain the primary logic:
    a.  Call `buildMediaPlanPrompt` from the toolkit.
    b.  Call `getProviderService` (using the `aiModelConfig`) to determine the correct provider.
    c.  Call the provider's `generateRawContent` function.
    d.  Call `processMediaPlanResponse` from the toolkit.
4.  **Update UI (`App.tsx`):** Modify the call to `textGenerationService.generateMediaPlanGroup` in the `handleGenerateMediaPlanGroup` function to pass the required `aiModelConfig` parameter.
5.  **Verify:** Test the end-to-end media plan generation workflow to ensure it functions identically to the user.

### Phase 3: Refactor Remaining Workflows

-   Systematically apply the new pattern to all other generation functions (`generateBrandKit`, `generateContentPackage`, `generateImage`, etc.), moving orchestration logic into the `textGenerationService` or `imageGenerationService`, and creating new helper functions in the `prompt.builder` and `response.processor` as needed.

### Phase 4: Cleanup

-   Once all workflows are migrated, perform a final pass to remove any old, duplicated helper functions or dead code from the provider service files (`geminiService.ts`, etc.).

## 5. Expected Benefits

-   **DRY Principle:** The core logic for any given task is written once in the orchestration layer, completely eliminating duplication.
-   **Maintainability:** The system will be drastically easier to debug and enhance. A single logic change is made in one place.
-   **Scalability & Flexibility:** Adding a new AI provider becomes a simple task of adding a new simple "Provider" service and adding a case for it in the orchestrator's `switch` statement. The core business logic does not need to be touched.
-   **Robustness:** Using the application's own configuration as the source of truth for provider selection eliminates a major source of potential bugs.
