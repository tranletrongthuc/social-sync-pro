# SocialSync Pro: Feature and Function Descriptions

This document provides a detailed breakdown of the core features and functions within the SocialSync Pro application, described using the 5W1H (What, Who, When, Where, Why, How) format.

---

## 1. AI Services Administration

*   **What:** A comprehensive admin panel for full CRUD (Create, Read, Update, Delete) management of AI services and their supported models.
*   **Who:** The Application Administrator.
*   **When:** When new AI providers or models become available, or when existing ones need to be updated or decommissioned from the platform.
*   **Where:** The feature is accessed via the `/admin` route in the application.
*   **Why:** To provide centralized control over the AI capabilities offered to users, ensuring that only approved, tested, and compatible AI models are available for content generation. This allows the platform to adapt to the evolving AI landscape without requiring code changes.
*   **How:** The Admin navigates to the admin panel, where they can view a list of existing AI services (e.g., Gemini, OpenRouter). They can add a new service by filling out a form, edit an existing one, or delete it. Within each service, they can add, edit, or remove specific models (e.g., `gemini-1.5-pro`, `claude-3-opus`), defining their capabilities. These changes are saved to a central database (Airtable) and are immediately reflected in the settings available to end-users.

---

## 2. Backend-for-Frontend (BFF) Architecture

*   **What:** An architectural pattern implemented as an intermediary Node.js server. It handles all network requests between the user's browser (frontend) and all external third-party APIs (like Gemini, Airtable, Facebook, etc.).
*   **Who:** This is a backend feature that serves the entire application and all its users, though it is managed by developers.
*   **When:** It is used continuously, every time the frontend needs to fetch or send data to an external service.
*   **Where:** It operates server-side, with frontend requests being directed to the application's own `/api/*` endpoints instead of directly to external domains.
*   **Why:** To significantly improve security by abstracting away sensitive API keys from the client-side code. It also centralizes API logic, simplifies error handling, and creates opportunities for server-side caching and rate limiting, making the application more scalable and robust.
*   **How:** The frontend code (e.g., `bffService.ts`) makes a request to a local endpoint like `/api/gemini/generate`. The BFF server, running on Vercel as a Serverless Function, receives this request. It then attaches the necessary secret API key (stored securely as an environment variable) and forwards the request to the actual Google Gemini API. Once the external API responds, the BFF processes the response and sends it back to the frontend.

---

## 3. Project Management (Load, Save & Export)

*   **What:** A suite of functions that allows users to save their entire project state, load it back from a central repository (Airtable), and export specific assets like brand kits and media plans into common file formats.
*   **Who:** The end-user (e.g., social media manager, marketer).
*   **When:** When a user wants to back up their work, resume a previous session, or use their generated brand assets in external applications like Microsoft Word or Excel.
*   **Where:** Buttons for these actions ("Load from Airtable", "Save Project", "Export Brand Kit", "Export Plan") are located in the main application interface, often within specific tabs like "Brand Kit" or "Media Plan".
*   **Why:** To provide data persistence, portability, and interoperability. Users can work across different sessions without losing data and can easily share or integrate their strategic assets into their broader business workflows.
*   **How:** A user clicks "Load from Airtable" to open a modal and select their brand, which fetches the data and populates the app. Clicking "Save Project" triggers a download of a `.ssproj` file containing the entire application state. Clicking "Export Brand Kit" or "Export Plan" generates and downloads a `.docx` or `.xlsx` file, respectively.

---

## 4. Brand Kit Generation

*   **What:** An automated workflow that generates a complete brand identity, including a brand profile, logo concepts, and color palettes, from a single user-provided idea.
*   **Who:** The end-user, particularly when starting a new project.
*   **When:** At the beginning of a new project or when a user needs to quickly develop a foundational brand identity for a new business or campaign idea.
*   **Where:** The process starts in the "Idea Profiler" section and the results are displayed in the "Brand Profiler" and "Brand Kit" tabs within the main display.
*   **Why:** To dramatically accelerate the brand creation process. It empowers users to move from a simple concept to a visually and strategically defined brand in minutes, eliminating the need for extensive manual brainstorming and design work.
*   **How:** The user enters a business concept into a text field in the "Idea Profiler". The application sends this idea to an AI service via the BFF, which then generates a detailed brand profile (mission, vision, values). Subsequently, it generates visual assets like logo concepts and color palettes, which are then displayed to the user in the "Brand Kit" tab.

---

## 5. Media Plan Generation & Management

*   **What:** A feature for creating, organizing, and managing strategic content calendars, known as Media Plans.
*   **Who:** The end-user.
*   **When:** When a user needs to plan a content strategy for a specific campaign, product launch, or time period.
*   **Where:** This is managed in the "Media Plan" tab. New plans are created using the "Media Plan Wizard" modal.
*   **Why:** To provide a structured way to plan and organize social media content. It ensures that posts are aligned with strategic goals, target the correct audience (via Personas), and are scheduled across the appropriate platforms.
*   **How:** The user clicks "New Plan" to launch a wizard. Inside the wizard, they provide a central theme or prompt, select target social media platforms, and assign a Persona. The system then uses AI to generate a complete media plan, which is a list of post ideas that appear in the content feed. The user can create and switch between multiple media plans.

---

## 6. Post Generation and Refinement

*   **What:** A set of tools for creating and improving the text and visuals for individual social media posts within a media plan.
*   **Who:** The end-user.
*   **When:** During the content creation phase, after a media plan with post ideas has been generated.
*   **Where:** These actions are performed within the `PostDetailModal`, which opens when a user clicks on a specific post card in the media plan feed.
*   **Why:** To enable the rapid creation of high-quality, engaging, and visually appealing content. The refinement and image generation features allow for quick iterations, ensuring the final post is polished and effective.
*   **How:** From a post's detail view, the user can click "Refine Content" to have an AI model rewrite and improve the post's text. They can click "Generate Image" to create a relevant, AI-generated image for the post. The updated text and new image are then displayed directly on the post card.

---

## 7. Strategy Hub (Trend & Idea Management)

*   **What:** A dedicated workspace for strategic planning. It allows users to discover industry trends, generate content ideas based on those trends, and create comprehensive content packages for specific products.
*   **Who:** The end-user.
*   **When:** During the initial strategic planning phase of a campaign, before a detailed media plan is created.
*   **Where:** This feature is located in the "Strategy Hub" tab of the application.
*   **Why:** To ensure that content is not created in a vacuum. It helps align content with current market trends and strategic business goals (like promoting an affiliate product), leading to more relevant and impactful campaigns.
*   **How:** A user can manually add a trend or use the "Facebook Strategy Automation" tool to automatically discover trends for an industry. For any given trend, they can click "Generate Ideas" to get a list of content angles. From the "Affiliate Vault," they can select a product to generate a "Content Package," which creates a new trend and a dedicated media plan focused on promoting that product.

---

## 8. Affiliate Vault (Link Management)

*   **What:** A centralized repository for users to store, manage, and import their affiliate product links.
*   **Who:** The end-user, especially those involved in affiliate marketing.
*   **When:** When a user needs to manage a list of products they want to promote across their social media content.
*   **Where:** This feature is located in the "Affiliate Vault" tab.
*   **Why:** To streamline the process of integrating affiliate marketing into content creation. By keeping all links in one place, it's easy to access them and associate them with content packages and individual posts.
*   **How:** The user can manually add new affiliate links by filling out a form with details like the product name and URL. They can also edit or delete existing links. For bulk additions, they can use the "Import from File" feature to upload a CSV or Excel file containing their affiliate link data.

---

## 9. Persona Management

*   **What:** A feature to create, define, and manage detailed profiles of target audience personas.
*   **Who:** The end-user.
*   **When:** When defining the target audience for a campaign to ensure the content's tone and style are appropriate.
*   **Where:** This is managed in the "Personas" tab. The created personas are then assigned to media plans.
*   **Why:** To create more effective and resonant content. By generating content for a specific persona, the AI can tailor its language, tone, and style to better connect with that segment of the audience.
*   **How:** The user navigates to the "Personas" tab and clicks "Add Persona." They fill out a form with details about the target individual (e.g., demographics, interests, pain points) and can upload an avatar. This saved persona can then be selected from a dropdown menu when creating or editing a Media Plan.

---

## 10. Scheduling and Publishing

*   **What:** A set of tools to either schedule posts for a future date and time or publish them immediately to a connected social media account.
*   **Who:** The end-user.
*   **When:** When a piece of content is finalized and ready to be deployed as part of a live campaign.
*   **Where:** Actions are available from the `PostDetailModal` for individual posts or via a bulk action bar in the main media plan feed for multiple posts.
*   **Why:** To automate the final step of the content lifecycle. Scheduling allows for consistent content delivery without manual intervention, while direct publishing streamlines the process of getting content live quickly.
*   **How:** To schedule a single post, the user clicks the "Schedule" button and uses a date-time picker. For bulk scheduling, the user selects multiple posts, clicks the bulk "Schedule" button, and sets a start time and posting interval. To publish, the user clicks "Publish Now" on a post within a plan that is assigned to a persona with a connected social account.

---

## 11. User-Level Settings Management

*   **What:** A configuration modal that allows individual users to customize application settings specifically for their brand, overriding the global defaults set by the administrator.
*   **Who:** The end-user.
*   **When:** When a user wants to use a different AI model for generation than the default, or when they need to adjust other brand-specific configurations.
*   **Where:** This is accessed via a "Settings" button in the main UI, which opens the `SettingsModal`.
*   **Why:** To provide flexibility and personalization at the brand level. It allows users to tailor the tool to their specific needs and preferences without affecting the global configuration for all other users.
*   **How:** The user opens the Settings modal, which loads their brand's currently saved settings. They can modify values, such as selecting a different AI service or model from the dropdown lists (which are populated by the Admin). When they click "Save," these new settings are stored and applied only to their brand.
