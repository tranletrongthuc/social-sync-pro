 # Top 10 Features to Drive Virality and Affiliate Sales

 This document outlines 10 new or improved features for SocialSync Pro. The features are derived from the principles in the "Bí Quyết Nổi Bật và Viral" guide and are strategically designed to help users achieve the affiliate sales goal of 20,000,000 VND in commission within two months. Each feature is described in the 5W1H format with a detailed implementation plan for developers.

## Feature Prioritization & Grouping
 
 To achieve the 2-month goal, features are grouped by strategic purpose and prioritized based on an Impact vs. Effort analysis.
 
 *   **P0 - Critical:** Must-have. High impact, low-to-medium effort. These are the quick wins that directly address the core principles of virality and discoverability.
 *   **P1 - High:** Very important. High impact, but may require more effort. These features build the strategic foundation for effective sales-driven content.
 *   **P2 - Medium:** Good to have. These features focus on long-term optimization and systematic reuse of successful content.
 *   **P3 - Low:** Nice to have. Creative enhancements that are less critical for the immediate sales goal.
 
 ---
 
 ### Group 1: Foundational Quick Wins (Implement First)
 
 These are low-effort, high-impact enhancements that can be implemented quickly to get immediate results in content performance and discoverability.

*   **Feature 1: "Viral Hook" Generator**
    *   **Priority:** P0 - Critical
    *   **Rationale:** Tackles the most critical part of a video: the first 3-5 seconds. Improving hooks directly impacts watch time, a primary signal for the algorithm.

*   **Feature 3: "Familiar-to-Novel" Content Angle Suggester**
    *   **Priority:** P0 - Critical
    *   **Rationale:** A very low-effort way (a simple toggle) to generate more unique and attention-grabbing ideas, helping content stand out in a crowded feed.
 
 *   **Feature 4: "4-Keyword" Headline Booster**
     *   **Priority:** P0 - Critical
     *   **Rationale:** Directly applies a "guaranteed 10k+ views" formula from the source material. It's a very low-effort change with a high potential return on investment.
 
 *   **Feature 12: SEO & Hashtag Optimizer**
     *   **Priority:** P0 - Critical
     *   **Rationale:** Directly addresses TikTok SEO, a key principle for discoverability. Improving how content is found by the right audience is crucial for the sales funnel.
 

 
 ---
 
 ### Group 2: Strategic Content Generation (Implement Second)
 
 These features help users create more targeted, persuasive, and data-driven content, which is essential for moving an audience from awareness to conversion.
 
*   **Feature 2: "Customer Insight" Miner**
    *   **Priority:** P1 - High
    *   **Rationale:** This is the foundation for all persuasive content. Understanding the customer's deep-seated motivations and barriers is key to crafting copy that converts.

 *   **Feature 5: "Micro-Niche" Content Refiner**
     *   **Priority:** P1 - High
     *   **Rationale:** Improves content-market fit, ensuring the algorithm delivers content to the most receptive audience, which increases engagement and lead quality.

 *   **Feature 7: "Comparison Format" Post Generator**
     *   **Priority:** P1 - High
     *   **Rationale:** Creates powerful "Before/After" social proof content, which is highly effective for demonstrating product value and driving direct sales conversions.
 
 *   **Feature 10: "Authenticity & Emotion" Polish**
     *   **Priority:** P1 - High
     *   **Rationale:** Authenticity is a core theme for virality in the source material. This feature helps build a loyal community that trusts the creator's recommendations.
 
 *   **Feature 15: Outlier Hook Analyzer**
     *   **Priority:** P1 - High
     *   **Rationale:** Provides concrete, data-driven inspiration by deconstructing what is *proven* to work in a specific niche, reducing guesswork.
 
 ---
 
 ### Group 3: Systematic Optimization & Reuse (Implement Third)
 
 These features are about creating a feedback loop of success. They are powerful for long-term growth but require more implementation effort and are best used after initial successful content has been identified.
 
 *   **Feature 8: "Viral Headline" Library**
     *   **Priority:** P2 - Medium
     *   **Rationale:** Allows users to systematically replicate what works. It's more of a long-term optimization tool.
 
 *   **Feature 11: "Viral Content" Templatizer**
     *   **Priority:** P2 - Medium
     *   **Rationale:** The most powerful tool for replicating success, but also the most complex to build. Best implemented once users have content worth templatizing.
 
 *   **Feature 13: Persona Interview Simulator**
     *   **Priority:** P2 - Medium
     *   **Rationale:** An advanced, interactive version of the "Customer Insight Miner". It's high-effort and the core goal can be achieved with the simpler Feature #2 first.
 
 ---
 
 ### Group 4: Creative & Educational Enhancements (Implement Last)
 
 These features add creative flair and build authority but are less critical for the immediate, short-term goal of driving affiliate sales.
 
 *   **Feature 6: "Real-Life Scenario" Injector**
     *   **Priority:** P2 - Medium
     *   **Rationale:** Increases relatability and top-of-funnel engagement, but is less focused on the "Consideration" and "Decision" stages of the sales funnel.

 *   **Feature 9: "Complex-to-Simple" Explainer**
     *   **Priority:** P2 - Medium
     *   **Rationale:** Excellent for building brand authority, but less direct in driving immediate sales compared to other features.
 
 *   **Feature 14: Humor & Meme Injector**
     *   **Priority:** P3 - Low
     *   **Rationale:** Fun and great for awareness, but not a critical driver for the 2-month commission goal.

 ---

 ## 1. "Viral Hook" Generator

 *   **What:** An AI-powered tool that generates a "Hook Trifecta" (Visual, Text, and Audio hooks) for any given content idea. This is based on the principle that the first 3-5 seconds are critical to stopping a user from scrolling.
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** The Social Media Manager or Content Creator.
 *   **When:** During the post-refinement stage, when turning a generated idea into a final piece of content.
 *   **Where:** Inside the `PostDetailModal`, as a new "Generate Hooks" button or tab.
 *   **Why:** To dramatically increase the initial engagement and watch-time of video content, which is a primary driver for the algorithm to push the content to a wider audience, thus feeding the top of the sales funnel.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `generate-hooks`.
         *   **Input:** `{ postTopic: string, persona: Persona }`.
         *   **Prompt Engineering:** The prompt should instruct the AI to return a JSON object with three keys: `visualHook`, `textHook`, and `audioHook`.
             *   `visualHook`: "Suggest a dynamic, attention-grabbing physical action or visual effect for the first 3 seconds of a video about [postTopic]."
             *   `textHook`: "Suggest 3-5 short, punchy on-screen text overlays (under 10 words) for a video about [postTopic]."
             *   `audioHook`: "Suggest a type of trending sound (e.g., 'a popular interview soundbite') or a specific opening voiceover line that creates curiosity for a video about [postTopic]."
     2.  **Frontend Service (`textGenerationService.ts`):**
         *   Create a new function: `generateViralHooks({ topic, persona, settings })`.
         *   This function will call the new `generate-hooks` BFF endpoint and process the JSON response.
     3.  **Frontend UI (`PostDetailModal.tsx`):**
         *   Add a new "✨ Generate Hooks" button next to the "Generate Image" button.
         *   On click, call a new handler function `handleGenerateHooks`.
         *   Display a loading state while the hooks are being generated.
         *   Render the results in a new, dismissible section within the modal, with each hook type (Visual, Text, Audio) clearly labeled and its suggestions listed with copy-to-clipboard buttons.
     4.  **State Management (`useMediaPlanManagement.ts` or similar hook):**
         *   Add state to manage the loading status (`isGeneratingHooks`) and the results (`generatedHooks`).
         *   Implement the `handleGenerateHooks` function to orchestrate the call to the service and update the UI.

 ---

 ## 2. "Customer Insight" Miner

 *   **What:** An AI tool that analyzes a target Persona and an affiliate product to generate potential "Customer Insides" (deep-seated motivations, barriers, and difficulties).
 *   **Type:** New Standalone Feature (Requires new components and UI sections)
 *   **Who:** The Marketing Strategist or Affiliate Marketer.
 *   **When:** During strategic planning, when creating a new Funnel Campaign, or when creating a Content Package from the Affiliate Vault.
 *   **Where:** A new "Insight Miner" tab within the `PersonasDisplay` and integrated as a step in the `Funnel Campaign Wizard`.
 *   **Why:** To create highly persuasive "Consideration" and "Decision" stage content that addresses the customer's core, often unstated, needs and objections, leading to higher conversion rates.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `mine-customer-insights`.
         *   **Input:** `{ persona: Persona, product: AffiliateLink }`.
         *   **Prompt Engineering:** Instruct the AI to analyze the persona's demographics, pain points, and goals in relation to the product's features. The AI must return a JSON object with three keys: `motivations` (Why would they *truly* want this?), `barriers` (What's stopping them from buying?), and `difficulties` (What problem does this solve that their current solution doesn't?).
     2.  **Frontend Service (`textGenerationService.ts`):**
         *   Create a new function: `mineCustomerInsights({ persona, product, settings })`.
     3.  **Frontend UI (New Component: `InsightMiner.tsx`):**
         *   Create a new component that takes a `Persona` and `AffiliateLink` as props.
         *   It will have a "Mine Insights" button that triggers the generation.
         *   It will display the results in three columns: Motivations, Barriers, and Difficulties.
     4.  **Integration:**
         *   In `PersonasDisplay.tsx`, add a tab to show the `InsightMiner` for the selected persona (the user can select a product to analyze).
         *   In the `Funnel Campaign Wizard`, after the user selects a Persona and a Product, add a new (optional) step that displays the `InsightMiner` results to help them guide the AI for the "Decision" stage content.

 ---

 ## 3. "Familiar-to-Novel" Content Angle Suggester

 *   **What:** An AI tool that takes a common topic and suggests novel, attention-grabbing angles by changing the context, props, or location.
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** The Content Creator.
 *   **When:** In the "Strategy Hub" when generating ideas from a trend or product.
 *   **Where:** A new option or button within the "Generate Ideas" flow.
 *   **Why:** To create unique "Awareness" content that stands out from the competition, preventing "scroll fatigue" and increasing the chances of virality.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Modify the existing `generate-viral-ideas` action (or create a new one).
         *   **Input:** `{ topic: string, makeItNovel: boolean }`.
         *   **Prompt Engineering:** If `makeItNovel` is true, add the following instruction to the prompt: "For the given topic, suggest 3-5 creative content angles that make a familiar concept feel new and interesting. Do this by suggesting changes to the following: 1. **Context** (e.g., do the activity in an unusual place), 2. **Props** (e.g., use a strange or unique object), 3. **Format** (e.g., present it as a comparison or a POV video)."
     2.  **Frontend Service (`textGenerationService.ts`):**
         *   Update the `generateViralIdeas` function to accept a `makeItNovel` boolean.
     3.  **Frontend UI (`StrategyDisplay.tsx`):**
         *   Next to the "Generate Ideas" button, add a checkbox or toggle switch labeled "Apply 'Familiar-to-Novel' Strategy".
         *   Pass the state of this toggle to the `handleGenerateIdeas` function.
     4.  **State Management (`useStrategyManagement.ts`):**
         *   Update `handleGenerateIdeas` to accept the `makeItNovel` flag and pass it to the service layer.

 ---

 ## 4. "4-Keyword" Headline Booster

 *   **What:** An AI tool that rewrites a post's title to incorporate one of the four proven viral keywords: "Newest," "Fastest," "Curiosity-provoking," or "Trustworthy."
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** The Content Creator.
 *   **When:** During post refinement in the `PostDetailModal`.
 *   **Where:** A new "Headline Booster" button next to the post title field.
 *   **Why:** To apply a proven formula for increasing views and click-through rates on "Awareness" and "Consideration" content, as the source material claims this can guarantee 10k+ views.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `boost-headline`.
         *   **Input:** `{ originalTitle: string, keyword: 'Newest' | 'Fastest' | 'Curiosity' | 'Trustworthy' }`.
         *   **Prompt Engineering:** Create four prompt variations. Example for "Fastest": "Rewrite the following headline to emphasize speed and efficiency: '[originalTitle]'." Example for "Curiosity": "Rewrite the following headline to be more curiosity-provoking and make people want to know the answer: '[originalTitle]'."
     2.  **Frontend Service (`textGenerationService.ts`):**
         *   Create a new function: `boostHeadline({ originalTitle, keyword, settings })`.
     3.  **Frontend UI (`PostDetailModal.tsx`):**
         *   Add a small "Boost" or "✨" icon button next to the post's title input field.
         *   On click, open a small dropdown or popover with four buttons: "Newest," "Fastest," "Curiosity," "Trustworthy."
         *   When a keyword button is clicked, call a handler that passes the current title and the selected keyword to the service.
         *   Update the title field with the AI-generated response.

 ---

 ## 5. "Micro-Niche" Content Refiner

 *   **What:** An AI tool that takes a broad topic and a target Persona, then suggests several more specific "micro-niches" to improve targeting.
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** The Content Strategist or Creator.
 *   **When:** During the creation of a new Media Plan or Funnel Campaign.
 *   **Where:** An additional (optional) step in the `MediaPlanWizardModal` or `FunnelCampaignWizard`.
 *   **Why:** To improve content-market fit and help the social media platform's algorithm deliver the content to the most receptive audience, increasing engagement, follower conversion, and sales lead quality.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `suggest-micro-niches`.
         *   **Input:** `{ broadTopic: string, persona: Persona }`.
         *   **Prompt Engineering:** "Given the broad topic '[broadTopic]' and the target persona (Age: [persona.age], Occupation: [persona.occupation], Pain Points: [persona.painPoints]), generate 5 specific 'micro-niche' content ideas. A micro-niche is a highly specific version of the broad topic tailored to the persona. For example, if the topic is 'gym routine', a micro-niche could be 'a 20-minute dumbbell-only routine for a busy working mom'."
     2.  **Frontend Service (`textGenerationService.ts`):**
         *   Create a new function: `suggestMicroNiches({ broadTopic, persona, settings })`.
     3.  **Frontend UI (`MediaPlanWizardModal.tsx`):**
         *   After the user enters their main prompt/topic and selects a persona, add a new button: "Refine with Micro-Niches (Optional)".
         *   Clicking this opens a new modal or view that shows the generated list of micro-niche suggestions.
         *   The user can then click on one of the suggestions to replace their original broad topic before generating the full media plan.

 ---

 ## 6. "Real-Life Scenario" Injector

 *   **What:** An AI feature that suggests incorporating common, relatable life scenarios (e.g., office dynamics, relationships, financial struggles) into a content idea to broaden its appeal.
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** The Content Creator.
 *   **When:** When generating ideas in the Strategy Hub or refining a post in the `PostDetailModal`.
 *   **Where:** A new option in the "Generate Ideas" flow and a "Make it Relatable" button in the post editor.
 *   **Why:** To tap into universal human experiences, which increases the likelihood of shares, comments ("this is so me!"), and overall engagement, thereby widening the top of the sales funnel.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `make-relatable`.
         *   **Input:** `{ contentIdea: string }`.
         *   **Prompt Engineering:** "Take the following content idea: '[contentIdea]'. Suggest 3 ways to frame this idea within a common, relatable real-life scenario. Focus on scenarios related to work (e.g., boss-employee relations), romantic relationships, friendships, or personal finance. For example, if the idea is 'how to take a good photo', a scenario could be 'when your boss asks you to take a photo vs. when they pay you for it'."
     2.  **Frontend UI (`PostDetailModal.tsx`):**
         *   In the "Guided Prompt Builder" section, add a new button: "Make it Relatable".
         *   When clicked, it calls the `make-relatable` service and displays the suggestions, which the user can then incorporate into their objective.

 ---

 ## 7. "Comparison Format" Post Generator

 *   **What:** A new content template/wizard that specifically generates a post script in a "Before/After," "Expectation vs. Reality," or "My Old Way vs. My New Way" format, centered around an affiliate product.
 *   **Type:** Major Enhancement (Creates a new, structured content type)
 *   **Who:** The Affiliate Marketer.
 *   **When:** When creating a "Content Package" from the Affiliate Vault.
 *   **Where:** A new option in the "Generate Content Package" flow.
 *   **Why:** To create powerful social proof and clearly demonstrate a product's value proposition in a visually compelling and shareable format, which is highly effective for driving conversions.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `generate-comparison-post`.
         *   **Input:** `{ product: AffiliateLink, persona: Persona, comparisonType: 'Before/After' | 'Expectation/Reality' }`.
         *   **Prompt Engineering:** "Generate a short video script for [persona.nickName]. The script should be a '[comparisonType]' comparison. The 'Before' state should describe a common problem the persona faces. The 'After' state should show how '[product.name]' solves that problem. The tone should be authentic and relatable."
     2.  **Frontend UI (`AffiliateVaultDisplay.tsx`):**
         *   When a user clicks "Generate Ideas" on a product, instead of going straight to the Strategy Hub, open a modal.
         *   This modal will have two options: "Generate General Ideas" (current flow) and "Generate Comparison Post".
         *   If "Generate Comparison Post" is chosen, show another small selection for the comparison type, then trigger the generation. The output will be a new post added to a new or existing media plan.

 ---

 ## 8. "Viral Headline" Library

 *   **What:** A feature to save, categorize, and reuse successful or high-performing headlines.
 *   **Type:** New Standalone Feature (Requires new components and database collections)
 *   **Who:** The Social Media Manager.
 *   **When:** After a post has performed well, and when creating new content.
 *   **Where:** A new "Viral Library" tab in the "Strategy Hub" and an option to use a saved headline format in the `MediaPlanWizardModal`.
 *   **Why:** To create a feedback loop of success, allowing users to systematically replicate what works and reduce the guesswork in content creation.
 *   **How (Implementation Steps):**
     1.  **Database (`api/mongodb.js` & `types.ts`):**
         *   Create a new collection: `viralHeadlines`.
         *   Define the `ViralHeadline` type: `{ id: string, brandId: string, headline: string, category: string, notes: string }`.
         *   Add new backend actions: `save-viral-headline`, `load-viral-headlines`, `delete-viral-headline`.
     2.  **Frontend UI (`PostDetailModal.tsx`):**
         *   Add a "Save to Viral Library" button (e.g., a star icon) next to the post title. Clicking it opens a small modal to add a category and notes before saving.
     3.  **Frontend UI (New Component: `ViralLibraryDisplay.tsx`):**
         *   Create a new component to be displayed in a new "Viral Library" tab in the `StrategyHub`.
         *   This component will list all saved headlines, allowing for search, filtering by category, and deletion.
     4.  **Integration (`MediaPlanWizardModal.tsx`):**
         *   In the wizard, add an option: "Use a headline format from my Viral Library".
         *   This will show a dropdown of saved headlines. When one is selected, its text is passed to the AI in the prompt with the instruction: "Generate content based on this successful headline format: '[selectedHeadline]'."

 ---

 ## 9. "Complex-to-Simple" Explainer

 *   **What:** An AI tool that takes a complex topic, technical feature, or professional knowledge and generates a script that explains it using simple, real-world analogies.
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** A Marketer for a technical product or an expert sharing their knowledge.
 *   **When:** When creating educational "Consideration" stage content.
 *   **Where:** A new tool in the "Strategy Hub" or a "Simplify" button in the `PostDetailModal`.
 *   **Why:** To build brand authority and trust by making complex information accessible and valuable to a broader audience, which is crucial for them to trust a "Decision" stage recommendation.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `simplify-topic`.
         *   **Input:** `{ complexTopic: string, persona: Persona }`.
         *   **Prompt Engineering:** "Explain the following complex topic in simple terms for '[persona.nickName]'. Use a relatable, real-world analogy to make it easy to understand. Topic: '[complexTopic]'."
     2.  **Frontend UI (`PostDetailModal.tsx`):**
         *   In the "Guided Prompt Builder", add a "Simplify Topic" button.
         *   When clicked, it opens a small modal asking for the complex topic.
         *   The AI-generated simple explanation is then returned, which the user can use as the basis for their post content.

 ---

 ## 10. "Authenticity & Emotion" Polish

 *   **What:** A specific "Refine Content" option that prompts the AI to make a post sound more personal, less polished, and more emotionally resonant.
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** The Content Creator.
 *   **When:** As a final step before scheduling or publishing a post.
 *   **Where:** An additional option within the "Guided Prompt Builder" in `PostDetailModal`.
 *   **Why:** To build a stronger, more loyal community by creating content that feels human and relatable, which is key for the "Retention" stage of the funnel and for building long-term brand advocates.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Modify the `generate-in-character-post` action or create a new `polish-for-authenticity` action.
         *   **Input:** `{ postContent: string, persona: Persona }`.
         *   **Prompt Engineering:** Add a specific instruction: "Review the following post written by [persona.nickName]. Rewrite it to sound more authentic and emotional. Add a small, relatable imperfection or a moment of vulnerability. Make it sound less like a perfect advertisement and more like a real person sharing their thoughts. Post: '[postContent]'."
     2.  **Frontend UI (`PostDetailModal.tsx`):**
         *   In the "Guided Prompt Builder", alongside the main "Generate" button, add a new button: "Polish for Authenticity".
         *   This button takes the *current* text in the post editor and sends it to the backend for the authenticity polish, then replaces the content with the new version.

         *   This button takes the *current* text in the post editor and sends it to the backend for the authenticity polish, then replaces the content with the new version.
 
 ---
 
 ## 11. "Viral Content" Templatizer
 
 *   **What:** An AI tool that analyzes a user's high-performing post (or a provided example URL) and extracts its core structure (hook type, content format, CTA style) into a reusable template.
 *   **Type:** New Standalone Feature (Requires new components and database collections)
 *   **Who:** The Social Media Manager or Content Strategist.
 *   **When:** After a post has proven to be successful, during the planning phase for new content.
 *   **Where:** A new "Create Template from Post" button in the `PostDetailModal` and a new "Viral Templates" tab in the Strategy Hub.
 *   **Why:** To systematically replicate success ("Tái tạo và nhân rộng các video viral"). This allows users to create a "series" of content with a proven format, increasing efficiency and the probability of repeated success, which is key for consistent lead generation.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `templatize-post`.
         *   **Input:** `{ postContent: string, postTitle: string, postPlatform: string }`.
         *   **Prompt Engineering:** "Analyze the following social media post. Extract its core reusable structure into a template. Return a JSON object with three keys: `hookStyle` (e.g., 'Question-based text hook', 'Surprising visual action'), `contentFormat` (e.g., '3-point listicle', 'Problem-solution story', 'Comparison'), and `ctaStyle` (e.g., 'Asks for comments', 'Directs to link in bio'). Post Title: [postTitle], Content: [postContent]."
     2.  **Database (`api/mongodb.js` & `types.ts`):**
         *   Create a new collection: `viralTemplates`.
         *   Define `ViralTemplate` type: `{ id: string, brandId: string, name: string, hookStyle: string, contentFormat: string, ctaStyle: string, notes: string }`.
         *   Add backend actions: `save-viral-template`, `load-viral-templates`, `delete-viral-template`.
     3.  **Frontend UI (`PostDetailModal.tsx`):**
         *   Add a "Create Template" button. On click, it calls the `templatize-post` service.
         *   The results are shown in a new modal where the user can name the template and add notes before saving it to the `viralTemplates` collection.
     4.  **Frontend UI (New Component: `ViralTemplatesDisplay.tsx`):**
         *   Create a new component for a "Viral Templates" tab in the Strategy Hub. It will list saved templates.
     5.  **Integration (`MediaPlanWizardModal.tsx`):**
         *   Add an option: "Use a Viral Template".
         *   This shows a dropdown of saved templates. When one is selected, its properties are passed to the AI prompt: "Generate a new media plan based on the following successful content structure: Hook Style: [template.hookStyle], Content Format: [template.contentFormat], CTA Style: [template.ctaStyle]."
 
 ---
 
 ## 12. SEO & Hashtag Optimizer
 
 *   **What:** An AI tool that generates SEO-friendly keywords for the post description and a tiered set of hashtags based on the post's content and target persona.
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** The Content Creator.
 *   **When:** During post refinement in the `PostDetailModal`.
 *   **Where:** A new "Optimize SEO & Hashtags" button.
 *   **Why:** To improve the discoverability of content (TikTok SEO) and ensure it reaches the most relevant audience, increasing views, follower conversion, and the quality of leads for the sales funnel.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `optimize-seo`.
         *   **Input:** `{ postContent: string, persona: Persona }`.
         *   **Prompt Engineering:** "Analyze the following post content and target persona. Generate a JSON object with two keys: `seoKeywords` (a comma-separated string of 5-7 SEO keywords to include in the post description) and `hashtags` (a JSON object with three keys: `broad` (3-5 high-volume hashtags), `niche` (3-5 medium-volume hashtags relevant to the persona's interests), and `specific` (2-3 highly specific hashtags for this exact post)). Post: [postContent], Persona: [persona.nickName], Interests: [persona.knowledgeBase]."
     2.  **Frontend Service (`textGenerationService.ts`):**
         *   Create a new function: `optimizeSeoAndHashtags({ postContent, persona, settings })`.
     3.  **Frontend UI (`PostDetailModal.tsx`):**
         *   Add a new "Optimize SEO" button.
         *   On click, display a loading state.
         *   Render the results in a new section. Display `seoKeywords` as a string the user can copy. Display the `hashtags` in three categorized lists (`Broad`, `Niche`, `Specific`) with copy-to-clipboard buttons for each category and for all hashtags combined.
 
 ---
 
 ## 13. Persona Interview Simulator
 
 *   **What:** An interactive, chat-like interface where a user can "interview" their AI-generated persona to uncover deeper "insides" (motivations, barriers, difficulties).
 *   **Type:** New Standalone Feature (Requires new components and UI sections)
 *   **Who:** The Marketing Strategist or Content Creator.
 *   **When:** During strategic planning or when seeking inspiration for highly targeted content.
 *   **Where:** A new "Interview Persona" button within the `PersonasDisplay` tab, which opens a full-screen modal or a new page.
 *   **Why:** To provide a dynamic and qualitative way to find customer "insides," which is a core principle for creating viral content that resonates deeply and drives conversions. It's a more interactive version of the "Customer Insight Miner".
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Modify the `generate-in-character-post` action to be more generic, or create a new `chat-with-persona` action.
         *   **Input:** `{ persona: Persona, conversationHistory: [{ role: 'user' | 'model', parts: [{ text: string }] }], userQuestion: string }`.
         *   **Prompt Engineering:** "You are role-playing as {persona.nickName}. Your full profile is: {JSON.stringify(persona)}. The user is interviewing you. Based on your personality and the conversation history, answer the user's latest question authentically. Conversation History: [conversationHistory]. User's Question: [userQuestion]. Your Answer:"
     2.  **Frontend UI (New Component: `PersonaInterviewModal.tsx`):**
         *   Create a new full-screen modal component that takes a `Persona` object as a prop.
         *   It will have a chat interface (message display area, text input, send button).
         *   Maintain a `conversationHistory` array in its state.
     3.  **Frontend Logic:**
         *   When the user sends a message, add it to the `conversationHistory`.
         *   Call a new service function `chatWithPersona({ persona, conversationHistory, userQuestion })`.
         *   Display a "thinking..." indicator.
         *   When the AI response is received, add it to the `conversationHistory` and render it in the chat window.
     4.  **Integration (`PersonasDisplay.tsx`):**
         *   On each persona card, add an "Interview" button that opens the `PersonaInterviewModal` with that persona's data.
 
 ---
 
 ## 14. Humor & Meme Injector
 
 *   **What:** An AI tool that suggests funny angles, relatable jokes, or currently trending meme formats that can be applied to a user's content topic.
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** The Content Creator looking to make "Awareness" stage content.
 *   **When:** During idea generation or post refinement.
 *   **Where:** A new "Make it Funny" button in the `PostDetailModal`'s Guided Prompt Builder.
 *   **Why:** To create entertaining "Awareness" content that is highly shareable ("Vui thì phải thật vui"). Humor is a powerful tool for capturing attention at the top of the funnel and building a positive brand association.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `inject-humor`.
         *   **Input:** `{ topic: string, useSearch: true }`.
         *   **Prompt Engineering:** "You are a viral content creator and meme expert. For the topic '[topic]', suggest 3 ways to make it funny. For each suggestion, provide a 'type' ('Joke', 'Skit Idea', or 'Meme Format') and a 'description'. For 'Meme Format', use your search tool to find a currently popular meme and explain how to apply it to the topic."
     2.  **Frontend Service (`textGenerationService.ts`):**
         *   Create a new function: `injectHumor({ topic, settings })`.
     3.  **Frontend UI (`PostDetailModal.tsx`):**
         *   In the "Guided Prompt Builder", add a "Make it Funny" button.
         *   On click, it calls the service with the post's current title/topic.
         *   The suggestions are displayed in a dismissible section, with each suggestion showing its `type` and `description`.
 
 ---
 
 ## 15. Outlier Hook Analyzer
 
 *   **What:** An AI tool that uses internet search to find and analyze 3-5 real-world examples of top-performing "hooks" (the first 3-5 seconds of a video) for a given niche or topic.
 *   **Type:** Integrated Improvement (Enhances an existing feature)
 *   **Who:** The Content Creator or Strategist.
 *   **When:** During the initial idea generation phase in the Strategy Hub.
 *   **Where:** A new "Analyze Hooks" button next to a trend in the `StrategyDisplay` component.
 *   **Why:** To deconstruct what is *proven* to work for stopping the scroll in a specific niche ("Tìm và sử dụng 'outlier hooks'"). This provides concrete, data-driven inspiration for creating high-engagement "Awareness" content.
 *   **How (Implementation Steps):**
     1.  **Backend (`api/gemini.js`):**
         *   Create a new action: `analyze-hooks`.
         *   **Input:** `{ topic: string, useSearch: true }`.
         *   **Prompt Engineering:** "Use your search tool to find 3-5 highly-viewed TikTok or Instagram Reel videos about '[topic]'. For each video, analyze ONLY the first 3 seconds. Return a JSON array where each object has two keys: `hookDescription` (a description of the visual and text hook used, e.g., 'A person points to text on screen that says 'You're doing X wrong'') and `reasonForSuccess` (a brief analysis of why this hook is effective, e.g., 'Creates immediate curiosity and challenges the viewer')."
     2.  **Frontend Service (`textGenerationService.ts`):**
         *   Create a new function: `analyzeOutlierHooks({ topic, settings })`.
     3.  **Frontend UI (`StrategyDisplay.tsx`):**
         *   In the `MainContentArea` where trend details are shown, add a new button "Analyze Top Hooks".
         *   On click, it calls the service with the trend's topic.
         *   The results are displayed in a new modal or a tab, listing each analyzed hook with its description and reason for success.
         *   On click, it calls the service with the trend's topic.
         *   The results are displayed in a new modal or a tab, listing each analyzed hook with its description and reason for success.
 
 ---