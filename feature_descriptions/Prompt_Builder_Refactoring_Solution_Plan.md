# Solution Plan: Refactoring the Prompt Builder

**Version:** 3.0
**Date:** 2025-09-11
**Status:** Proposed

---

## 1. Problem Statement

The current prompt generation system is not a true "builder." It relies on large, monolithic prompt templates stored in the database, which creates several critical issues:

1.  **High Risk of Instability:** Allowing the entire prompt, including the JSON structure, to be defined by a user or admin in a database field is extremely fragile. A small mistake can change the expected output structure and crash the application.
2.  **Poor Maintainability:** Improving a piece of core logic (e.g., enhancing persona instructions) requires finding and manually editing every prompt template that uses it.
3.  **Complex Settings Management:** The previous model of copying all settings for each new brand created a complex "opt-in" system for updates and made global changes difficult to propagate.

## 2. Proposed Solution: A Two-Tiered, Component-Based Architecture

We will re-architect the prompt generation system using a **Composition** model combined with a **two-tiered settings hierarchy**. This provides maximum stability for the application while granting appropriate customization to both Admins and users.

### 2.1. The Core Principle: Separating Structure, Templates, and Rules

The new architecture is built on a clear separation of concerns:

1.  **Structure (Code-Controlled):** The application's required JSON output structure is **hardcoded** within the application. It is non-negotiable and cannot be changed by any user or admin. This guarantees application stability.
2.  **Templates (Admin-Controlled):** The main, complex prompt templates (e.g., the overall instructions for generating a Media Plan) are stored **only** in the global `adminSettings`. Only administrators can edit these.
3.  **Rules (User-Controlled):** Regular users (brands) can customize the *style* and *content* of smaller, recurring elements by defining a set of simple rules (e.g., "All image prompts must be photorealistic"). These rules are the only settings stored in a brand's specific settings object.

### 2.2. The New Data Flow

When a prompt is constructed, the builder will fetch settings from two sources:

*   It will get the main **template** from the global `adminSettings`.
*   It will get the stylistic **rules** from the current brand's specific `settings`.

This eliminates the need to copy settings. All brands use the same global templates, ensuring that when an admin improves a prompt, all users benefit immediately.

### 2.3. Reusable Prompt Components

The system will be built from small, reusable functions that generate specific parts of a prompt. These components will be responsible for combining the admin's template with the user's rules.

**Key Component Examples:**

*   `buildImagePromptComponent(topic, settings)`: Takes a topic and combines it with the user-defined rules from `settings.prompts.rules.imagePrompt`.
*   `buildPostCaptionComponent(body, settings)`: Takes the body of a post and applies the user's caption rules from `settings.prompts.rules.postCaption`.
*   `buildJsonOutputComponent(structure)`: A hardcoded component that generates the strict JSON output instructions.

### 2.4. How This Solves the Core Problems

1.  **Guaranteed Stability:** The JSON output structure is now controlled by code, eliminating crashes from bad prompts.
2.  **Simplified Settings:** Users are no longer burdened with managing enormous, complex prompt templates. They only need to manage a small set of simple, stylistic rules.
3.  **Centralized Control & Easy Updates:** Admins can update a core prompt template in one place, and the change is instantly reflected for all users.
4.  **Maintainability:** The code becomes cleaner, with a clear separation between different types of settings and a library of reusable prompt-building components.
