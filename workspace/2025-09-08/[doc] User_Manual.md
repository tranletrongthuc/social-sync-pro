# SocialSync Pro: User Manual

**Version:** 2.0
**Welcome!** This guide will walk you through the features of SocialSync Pro and help you get started on your journey to creating amazing, AI-powered social media content.

---

## 1. Getting Started

Your work in SocialSync Pro is organized by **Brand**. The first screen gives you three ways to begin:

1.  **Start from an Idea:** If you're creating a new brand from scratch, simply type your business concept into the text box and let the AI build a complete brand profile and starter content for you.
2.  **Load from Database:** If you have existing brands saved to the database, they will appear in a list. Click on a brand to load it.
3.  **Load Project File:** If you have a `.ssproj` backup file, click the "Load from File" button to select and open it.

### 1.1. The Main Interface

Once a project is loaded, you'll see the main dashboard, which is organized into several tabs on the left:

-   **Brand Kit:** Your brand's core identity, including mission, values, logo concepts, and color palettes.
-   **Personas:** Define the AI characters who will represent your brand. This is a crucial step for high-quality content.
-   **Strategy Hub:** Plan your content strategy with trends and ideas.
-   **Affiliate Vault:** Manage your promotional product links and generate content packages.
-   **Media Plan:** Your content calendar. View posts in a list, or switch to the **Calendar View** for a visual schedule.
-   **Posts:** A feed-style view of all posts across all your media plans.

---

## 2. Core Workflow: From Idea to Published Post

Follow these steps for a complete content creation journey.

### Step 1: Define Your Personas
The quality of your AI-generated content depends heavily on the personas you define.

1.  Navigate to the **"Personas"** tab.
2.  **Auto-Generate (Recommended):** Click the **"Auto-Generate"** button. The AI will use your brand's Mission and USP (defined in the Brand Kit tab) to create three diverse, detailed personas for you. A modal will appear allowing you to select which ones to save.
3.  **Manual Creation:** Click **"Add New Persona"**. A modal will open allowing you to define every aspect of the persona, from their backstory and demographics to their unique voice and knowledge base.
4.  **Connect Accounts:** For each persona, you can connect their social media accounts (e.g., Facebook Page) to enable direct publishing.

### Step 2: Create a Media Plan
A Media Plan is your content calendar for a specific campaign or content pillar.

1.  Navigate to the **"Media Plan"** tab.
2.  Click the **"New Plan"** button. The Media Plan Wizard will appear.
3.  **Fill out the wizard:**
    -   **Content Pillar:** Select a pillar (e.g., "Educational", "Behind the Scenes"). This is a mandatory step that guides the AI.
    -   **Guided Prompt:** Instead of a simple prompt, you now use the Guided Prompt Builder. Provide a clear **Objective** and optional **Keywords**.
    -   **Platforms & Persona:** Select the target social media channels and the persona who will be the "author" of this content.
4.  Click **"Generate Plan"**. The AI will populate your feed with a list of post ideas for this campaign, written in the voice of your selected persona.

### Step 3: Refine and Guide Your Posts
Now you can turn those ideas into finished posts.

1.  In the Media Plan feed, click on any post card to open its details.
2.  **Guided Prompt Builder:** The AI has already written a first draft. To refine it, use the "Rewrite with Persona" section. Change the objective, add keywords, and click the **"Generate"** button. The AI will rewrite the post using the full context of the assigned persona.
3.  **Generate an Image:** Click the **"Generate Image"** button. The AI will create an image based on the post's content and the persona's visual style. The prompts for this are now hyper-detailed to create realistic photos.
4.  You can edit the text manually in the text box at any time.
5.  Click **"Save"** to update the post.

### Step 4: Schedule or Publish Your Post
Once your post is ready, it's time to get it out there.

1.  Open the detail view for your finished post.
2.  **To Schedule:**
    -   Click the **"Schedule"** button.
    -   Select a future date and time from the calendar.
    -   Click **"Confirm"**. The post's status will change to "Scheduled". You can also drag-and-drop posts in the Calendar View to reschedule them.
3.  **To Publish Immediately:**
    -   Click the **"Publish Now"** button.
    -   The post will be published directly to the connected social media page for that persona. Its status will change to "Published".

---

## 3. Settings & Configuration

You have deep control over how the AI behaves. Click the **Gear Icon** in the top-right menu to open the **Settings Modal**.

### 3.1. General Settings
Here you can control basic application behavior:
-   **Language:** Set the language for the UI and for AI content generation.
-   **AI Models:** Choose the default text and image generation models.
-   **Posts per Month:** Set the default number of posts for new media plans.

### 3.2. Prompt Management
This is the most powerful feature for advanced users.
1.  In the Settings Modal, click the **"Prompts"** tab.
2.  You will see a list of every master prompt the application uses, from generating a brand kit to writing an affiliate comment.
3.  You can edit these prompts to change the AI's tone, style, and output format.
4.  The manager shows you the **Global Default** prompt and your **Customized** version side-by-side, so you can always reference the original.

---

## 4. Admin Panel

For system administrators, the Admin Panel provides global control over the application.

1.  Access the panel by navigating to `/admin` in your browser.
2.  After logging in, you can:
    -   **Manage Global Settings:** Set the default settings that all new brands will inherit.
    -   **Manage AI Models:** Add or remove AI models from the list available to users.
    -   **Manage Global Prompts:** Edit the master prompts for the entire application.

---

## 5. Frequently Asked Questions (FAQ)

**Q: Can I edit the text of a post after the AI generates it?**
**A:** Yes! Simply click into the text box for any post and edit it just like a normal text document.

**Q: How do I connect my social media accounts?**
**A:** Social account connection is managed through the **Persona** assigned to your Media Plan. In the "Personas" tab, edit a persona and look for the social connection options.

**Q: My generated images don't look realistic.**
**A:** The AI's image generation is guided by detailed prompts. You can customize these prompts in **Settings -> Prompts -> Media Plan Generation -> Hyper-Detailed Image Prompt Guide**. Following the guide there for what makes a good prompt will dramatically improve image quality.
