# Deployment Guide for SocialSync Pro

## Overview

SocialSync Pro consists of two main components:
1. **Frontend**: React application (this repository)
2. **Backend-for-Frontend (BFF)**: Serverless functions that act as a secure proxy for external APIs

## **Local Development Setup (Vercel)**

### **1. Prerequisites**

  * Node.js (version 16 or higher)
  * npm (comes with Node.js)
  * **Vercel CLI**

### **2. Initial Setup**

1.  **Clone the repository** (if you haven't already).
2.  **Navigate into the project directory**.
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Install Vercel CLI** (if you don't have it):
    ```bash
    npm install -g vercel
    ```
5.  **Link your local project to Vercel**:
    ```bash
    vercel link
    ```
    This will connect your local codebase to the corresponding project on your Vercel dashboard.

-----

### **3. Environment Variables**

For local development, `vercel dev` uses a `.env.local` file. This filename is standard and is automatically ignored by Git.

**Option A: Create the file manually**

1.  Create a file named `.env.local` in the project's root directory.
2.  Add your secret keys to this file:
    ```
    VITE_GEMINI_API_KEY="your_gemini_key"
    VITE_AIRTABLE_PAT="your_airtable_token"
    VITE_AIRTABLE_BASE_ID="your_airtable_base_id"
    VITE_CLOUDINARY_CLOUD_NAME="your_cloudinary_name"
    VITE_CLOUDINARY_UPLOAD_PRESET="your_cloudinary_preset"
    ...
    ```

**Option B: Pull from Vercel**
If you've already added the variables to your project settings on the Vercel dashboard, you can sync them with this command:

```bash
vercel env pull .env.local
```

-----

### 4. Running the Development Server

Before running the development server, ensure all dependencies are installed:
```bash
npm install
```

Then start the development server using Vite:
```bash
npm run dev
```

Alternatively, if you have Vercel CLI installed, you can use:
```bash
vercel dev
```

Note: If you encounter an error like `'vite' is not recognized as an internal or external command`, make sure you've run `npm install` to install all dependencies including Vite.

The application will be available at `http://localhost:5173`

## Deploying to Vercel

### 1. Prerequisites

Before deploying, you need to set up your environment variables in Vercel:
- Other environment variables for external services (see below)

### 2. Deploying the Complete Application to Vercel

This project is configured to deploy both frontend and backend (as serverless functions) to Vercel.

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Add environment variables in the Vercel dashboard:
   - `GEMINI_API_KEY` - Your Gemini API key
   - `AIRTABLE_PAT` - Your Airtable Personal Access Token
   - `AIRTABLE_BASE_ID` - Your Airtable Base ID
   - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
   - `CLOUDINARY_UPLOAD_PRESET` - Your Cloudinary upload preset
   - `OPENROUTER_API_KEY` - Your OpenRouter API key (optional)
   - `FACEBOOK_APP_ID` - Your Facebook App ID (optional)

### 3. How It Works

Vercel automatically detects files in the `api/` directory and deploys them as serverless functions:
- `api/health.js` becomes `https://your-app.vercel.app/api/health`
- `api/gemini-generate.js` becomes `https://your-app.vercel.app/api/gemini/generate`

The frontend makes requests to these endpoints, and Vercel routes them to the appropriate serverless functions.

### 4. Local Development vs Production

In local development:
- The frontend runs on Vite's development server (port 5173)
- API calls to `/api` endpoints are handled by the same development server
- During local development, you'll need to run both the frontend and backend services

In production:
- The frontend is built and served statically
- API calls are made directly to the Vercel serverless functions
- Vercel automatically routes `/api/*` requests to the corresponding functions

## Project Structure

After cleaning up testing components, the project structure is now:

```
├── api/                 # Serverless functions (BFF)
├── src/                 # Frontend React application
├── index.html           # Main HTML file
├── vite.config.ts       # Vite configuration
├── package.json         # Project dependencies and scripts
└── .env                 # Environment variables (not committed)
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Serverless functions should be configured to accept requests from your frontend domain.

2. **404 errors for API endpoints**: Ensure your functions are in the correct directory (`api/`) and have the correct export format.

3. **Missing environment variables**: Check that all required environment variables are set in the Vercel dashboard.

4. **Function timeout errors**: Vercel has execution time limits for serverless functions. Complex operations might exceed these limits.

5. **'vite' is not recognized as an internal or external command**: Run `npm install` to ensure all dependencies including Vite are properly installed.

### Testing Your Deployment

1. Visit your frontend URL
2. Check the browser console for any errors
3. Verify that API calls are being made to your Vercel deployment
4. Confirm that all environment variables are properly set

## Additional Notes

- Never expose API keys in the frontend code
- The BFF pattern ensures all sensitive credentials are accessed only by serverless functions
- Make sure to use HTTPS for all production deployments (Vercel provides this automatically)