# Technical Implementation Plan: Believable Persona Management System

**Version:** 1.0
**Date:** 2025-09-05
**Status:** Proposed

---

## 1. Overview

This document provides a detailed, phased technical plan to implement the "Believable Character" strategy. The goal is to evolve the application's existing persona functionality from a simple profile into a deep, multi-dimensional **Persona Management System**. This system will enable the generation of highly authentic, in-character content by systematically leveraging a rich "Persona Bible" at every step of the AI-powered workflow.

This plan builds directly upon the existing application architecture, enhancing current components and data structures to achieve the desired outcome.

---

## 2. Phase 1: Enhance the Persona Core (The Foundation)

**Objective:** Upgrade the data model and user interface to capture, store, and manage the rich, detailed information required for the "Persona Bible." This is the foundational step upon which all other phases depend.

### 2.1. Task: Evolve Data Model

-   **File to Modify:** `types.ts`
-   **Action:** The `Persona` interface will be expanded to include complex objects and arrays that represent the character's full identity.

**Current `Persona` type (Simplified Example):**
```typescript
export interface Persona {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  // ... other simple fields
}
```

**Proposed New `Persona` type:**
```typescript
export interface Persona {
  id: string;
  name: string;
  bio: string;
  avatar: string;
  demographics: {
    age: number;
    location: string;
    occupation: string;
  };
  backstory: string; // Supports rich text/markdown
  voice: {
    personalityTraits: string[]; // e.g., ["Witty", "Sarcastic", "Empathetic"]
    communicationStyle: {
      formality: number; // Slider value 0-100
      energy: number;     // Slider value 0-100
    };
    linguisticRules: string[]; // e.g., ["Uses slang: 'cháy quá'", "Uses emojis: 🌱, ☕️"]
  };
  knowledgeBase: string[]; // Hobbies & interests, e.g., ["Film Photography", "Indie Music"]
  brandRelationship: {
    originStory: string;
    coreAffinity: string;
    productUsage: string;
  };
}
```

### 2.2. Task: Update Database Logic

-   **File to Modify:** `api/mongodb.js`
-   **Action:** The backend database actions will be updated to handle the new, richer `Persona` object.
    -   **`save-persona` action:** Modify this action to correctly receive and save the entire new `Persona` object structure to the `personas` collection in MongoDB.
    -   **`auto-generate-persona` action:** The AI prompt in this action will be updated to generate the new, richer fields (`backstory`, `voice`, etc.) to provide a more complete starting point for the user.

### 2.3. Task: Upgrade Persona Editor UI

-   **Component to Modify:** `src/components/PersonasDisplay.tsx`
-   **Action:** The existing persona creation/editing form will be replaced with a more comprehensive "Persona Editor" interface.
    -   This new interface will be tabbed or sectioned to match the "Persona Bible" structure (e.g., "Identity," "Voice," "Backstory").
    -   New reusable components will be created:
        -   `src/components/VoiceTuner.tsx`: Will contain sliders and tag-input fields for defining the `voice` object.
        -   `src/components/TagInput.tsx`: A generic component for managing arrays of strings, to be used for `knowledgeBase` and `linguisticRules`.
        -   The `backstory` and `brandRelationship` fields will use larger `<textarea>` elements to encourage detailed input.

---

## 3. Phase 2: Implement the Guided Prompt Builder

**Objective:** Leverage the new Persona Core to dramatically improve content quality by abstracting the complexity of advanced prompting away from the user.

### 3.1. Task: Create Backend Prompt Constructor

-   **File to Modify:** `api/gemini.js`
-   **Action:** A new internal helper function, `constructBelievablePersonaPrompt`, will be created.
    -   **Logic:**
        1.  It will accept a simple `objective` (from the user) and a `personaId`.
        2.  It will fetch the complete, rich `Persona` object from MongoDB.
        3.  It will dynamically assemble a detailed, multi-layered prompt string using the persona's data (voice, backstory, interests, etc.), the user's objective, and real-time context (like the current date).
        4.  This assembled prompt will follow the "layered, role-playing" structure defined in the strategy guide, including negative constraints.

### 3.2. Task: Create New Generation Endpoint

-   **File to Modify:** `api/gemini.js`
-   **Action:** A new action, `generate-in-character-post`, will be added.
    -   This action will be responsible for calling `constructBelievablePersonaPrompt` to get the full prompt, and then sending that prompt to the Gemini API for generation.

### 3.3. Task: Redesign Frontend Generation UI

-   **Components to Modify:** `src/components/MediaPlanWizardModal.tsx`, `src/components/PostDetailModal.tsx` (and any other content generation surfaces).
-   **Action:** The current freeform "Prompt" `<textarea>` will be replaced by the "Guided Prompt Builder" UI.
    -   This UI will consist of a few simple fields:
        -   `Objective`: A text field for the user's core goal.
        -   `Platform`: A dropdown to select the target social media platform.
        -   `Keywords`: An optional tag input for specific terms to include.
    -   The "Generate" button in these modals will now trigger a new function in `geminiService.ts` that calls the `generate-in-character-post` backend action.

---

## 4. Phase 3: Integrate Content Strategy & Workflow

**Objective:** Build the management layer around the core generation engine to facilitate a strategic, end-to-end workflow.

### 4.1. Task: Implement Content Pillars

-   **Database:** A new field, `contentPillars: [{ name: string, targetPercentage: number }]`, will be added to the schema for the `brands` collection.
-   **Backend (`api/mongodb.js`):** The `save-settings` action will be updated to allow management of this new field.
-   **UI (`src/components/SettingsModal.tsx`):** A new UI section will be added to the Settings modal for creating and managing `contentPillars`.
-   **Data Model (`types.ts`):** An optional `pillar: string` field will be added to the `PostInfo` interface.
-   **Generation UI:** The "Guided Prompt Builder" UI (from Phase 2) will be updated to include a mandatory dropdown for selecting a `pillar`, which will be passed to the backend during generation.

### 4.2. Task: Enhance Calendar & Workflow

-   **Data Model (`types.ts`):** The `PostInfo` interface will be enhanced with a `status: 'draft' | 'needs_review' | 'approved' | 'scheduled'` field, with `'draft'` as the default for all newly generated posts.
-   **UI (`src/components/PostCard.tsx`, `src/components/CalendarView.tsx`):** These components will be updated to visually represent the `pillar` (e.g., a colored tag) and `status` of each post.
-   **UI (`src/components/PostDetailModal.tsx`):** Controls (e.g., a dropdown menu) will be added to allow a user to change a post's `status`.
-   **Backend (`api/mongodb.js`):** The `update-media-plan-post` action will be updated to handle modifications to the `pillar` and `status` fields.
