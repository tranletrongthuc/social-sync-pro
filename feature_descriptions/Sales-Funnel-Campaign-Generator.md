### **Prompt: New Feature Specification for an AI-Powered Sales Funnel Campaign Generator**

**1. Feature Name:**
AI-Powered Sales Funnel Campaign Generator

**2. Objective & Goal:**
To evolve beyond single post and media plan generation by introducing a strategic, multi-stage campaign builder. This feature will empower users to automatically generate a comprehensive content strategy based on a classic 4-stage sales funnel (Awareness, Prospect/Consideration, Decision, Action). The goal is to help users move customers from initial contact to conversion by creating targeted content for each stage of their journey, leveraging the app's existing features like Personas and the Affiliate Vault.

**3. Core User Story:**
"As a Social Media Manager, I want to automatically generate a complete, multi-stage sales funnel campaign for a specific product or goal, so that I can strategically guide my audience from awareness to purchase without having to manually plan content for each stage of the customer journey."

**4. Detailed Functional Requirements & User Flow:**

**4.1. Entry Point:**
-   A new button, "Create Funnel Campaign," will be added within the **"Media Plan"** tab, next to the "New Plan" button.

**4.2. The Funnel Campaign Wizard (Modal Interface):**
When the user clicks the button, a multi-step wizard will appear:

**Step 1: Define Campaign Goal**
-   **Campaign Name:** A text field for the user to name their campaign (e.g., "Q4 Dark Roast Coffee Launch").
-   **Primary Objective/Product:** The user can choose one of two options:
    -   **Promote a Product:** A dropdown menu dynamically populated with items from the user's **"Affiliate Vault"**. Selecting a product will make it the central focus of the "Decision" stage content.
    -   **General Goal:** A text prompt field where the user can describe a broader goal (e.g., "Increase newsletter sign-ups for our marketing agency").
-   **Target Audience:** A mandatory dropdown to select a pre-defined **"Persona"**. The AI will use this persona to tailor the tone, style, and content for all generated posts.
-   **Campaign Duration:** A selection for the campaign length (e.g., 1 Week, 2 Weeks, 1 Month). This will determine the total number of posts generated.

**Step 2: AI Generation & Review**
-   After the user clicks "Generate Funnel," the system will use AI to create a new, structured **Media Plan**.
-   This Media Plan will be automatically populated with post ideas, but critically, these posts will be categorized and tagged into four distinct sections corresponding to the sales funnel stages:
    -   **Stage 1: Awareness (Top-of-Funnel):**
        -   **Content Type:** The AI will generate educational, engaging, and non-promotional content ideas. Examples: "5 surprising benefits of dark roast coffee," "A poll: How do you take your morning coffee?", "Behind-the-scenes look at our bean sourcing."
        -   **Goal:** To attract the target Persona and build brand recognition.
    -   **Stage 2: Prospect / Consideration (Middle-of-Funnel):**
        -   **Content Type:** The AI will generate content designed to nurture leads and build trust. It should suggest creating content that drives traffic to a user-provided link (like a blog or landing page). Examples: "Read our new blog post: A deep dive into coffee roasting profiles," "Download our free guide to brewing the perfect espresso," "Webinar announcement: A Q&A with our head roaster."
        -   **Goal:** To capture user interest and establish authority.
    -   **Stage 3: Decision (Bottom-of-Funnel):**
        -   **Content Type:** The AI will generate direct, persuasive content focused on the product selected from the **Affiliate Vault** or the user's general goal. Examples: "Why our Dark Roast is the top choice for coffee lovers," "Limited Time Offer: Get 20% off your first subscription box," "Customer Testimonial: See what Jane Doe says about our coffee." The affiliate link should be automatically suggested for inclusion in these posts.
        -   **Goal:** To convert interested prospects into customers.
    -   **Stage 4: Action / Retention (Post-Purchase):**
        -   **Content Type:** The AI will generate content to reinforce the purchase decision and build community. Examples: "Thank you to all our new subscribers! Show us how you're enjoying your coffee with #SocialSyncCoffee," "Ask for reviews: Loved your purchase? Leave us a review!", "User-generated content prompt: What's the most creative way you've used our beans?"
        -   **Goal:** To create loyal customers and brand advocates.

**4.3. Output & Integration with Existing Features:**
-   The output will be a single, new **Media Plan** in the user's feed.
-   Inside the plan, posts will be visually distinguished (e.g., with colored tags or section headers like "Awareness Stage") to indicate which part of the funnel they belong to.
-   Crucially, **every generated post must be a standard `Post` object**. This ensures that the user can click on any post and use the existing **"Refine Content"** and **"Generate Image"** buttons to perfect it.
-   The entire generated plan can be scheduled (single or bulk) and published using the existing **Scheduling and Publishing** functionality.

**5. Key Technical & UI/UX Considerations:**
-   **Backend:** A new BFF endpoint (e.g., `POST /api/campaign/generate-funnel`) needs to be created to handle the logic for this multi-stage generation. It will orchestrate multiple calls to the AI service (e.g., Gemini) with different instructions for each funnel stage.
-   **UI:** The wizard should be clean and intuitive. The output Media Plan must clearly and visually separate the posts by their funnel stage.
-   **Data Model:** No major changes to the Airtable schema are expected, as the feature leverages existing `MediaPlan`, `Post`, `Persona`, and `AffiliateVault` structures. A new field on the `Post` object, such as `funnelStage`, could be added to store the stage tag.

**6. Acceptance Criteria:**
-   A user can successfully generate a new Media Plan from the "Create Funnel Campaign" wizard.
-   The generated Media Plan contains posts that are clearly categorized into the four funnel stages (Awareness, Consideration, Decision, Action).
-   The content of the posts in each stage logically aligns with the purpose of that stage.
-   If a product from the Affiliate Vault is selected, the "Decision" stage posts are clearly focused on promoting that specific product.
-   All generated posts are fully editable using the existing "Refine Content" and "Generate Image" features.