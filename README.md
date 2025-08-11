# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Optional) Set the `VITE_ADMIN_PASSWORD` in [.env.local](.env.local) to your preferred admin password (defaults to 'admin123')
4. Run the app:
   `npm run dev`

## Admin Panel

To access the admin panel, navigate to `/admin` in your browser. Use the configured admin password (or 'admin123' if not configured) to log in.

The admin panel allows you to:
- Manage AI services and their supported models
- Configure text and image generation models
- Set up provider capabilities

Sample data is available to help you get started quickly.
