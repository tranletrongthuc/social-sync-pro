# Deployment Guide for SocialSync Pro

## Overview

SocialSync Pro consists of two main components:
1. **Frontend**: React application (this repository)
2. **Backend-for-Frontend (BFF)**: Serverless functions that act as a secure proxy for external APIs

## Deploying to Vercel

### 1. Prerequisites

Before deploying, you need to set up your environment variables in Vercel:
- `VITE_BFF_URL` - The URL of your Vercel deployment (usually automatic)
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
- The frontend runs on Vite with a proxy to `/api` endpoints
- API calls are handled by the Vite development server

In production:
- The frontend is built and served statically
- API calls are made directly to the Vercel serverless functions
- Vercel automatically routes `/api/*` requests to the corresponding functions

## Troubleshooting

### Common Issues

1. **CORS errors**: Serverless functions should be configured to accept requests from your frontend domain.

2. **404 errors for API endpoints**: Ensure your functions are in the correct directory (`api/`) and have the correct export format.

3. **Missing environment variables**: Check that all required environment variables are set in the Vercel dashboard.

4. **Function timeout errors**: Vercel has execution time limits for serverless functions. Complex operations might exceed these limits.

### Testing Your Deployment

1. Visit your frontend URL
2. Check the browser console for any errors
3. Verify that API calls are being made to your Vercel deployment
4. Confirm that all environment variables are properly set

## Additional Notes

- Never expose API keys in the frontend code
- The BFF pattern ensures all sensitive credentials are accessed only by serverless functions
- Make sure to use HTTPS for all production deployments (Vercel provides this automatically)