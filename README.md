# SocialSync Pro 2.1

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js

1. Install frontend dependencies:
   `npm install`
2. Install backend dependencies:
   `cd server && npm install`
3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. (Optional) Set the `VITE_ADMIN_PASSWORD` in [.env.local](.env.local) to your preferred admin password (defaults to 'admin123')
5. Set Airtable and Cloudinary credentials in the server's [.env](server/.env) file
6. Run the backend (BFF):
   `cd server && npm start`
7. Run the frontend app:
   `npm run dev`

## Backend-for-Frontend (BFF) Layer

SocialSync Pro now includes a dedicated Backend-for-Frontend (BFF) service that acts as an intermediary between the client-side application and numerous third-party services (Airtable, Gemini, Facebook, Cloudinary). This architecture provides several key benefits:

- **Security**: API keys are kept secure on the backend rather than exposed in the frontend
- **Centralized Logic**: All external API communications are handled in one place
- **Caching Opportunities**: Future enhancements can implement server-side caching
- **Rate Limiting**: Better control over API usage and request throttling

The BFF is implemented with Node.js and Express, and provides proxy endpoints for all external services.

## Admin Panel

To access the admin panel, navigate to `/admin` in your browser. Use the configured admin password (or 'admin123' if not configured) to log in.

The admin panel allows you to:
- Manage AI services and their supported models
- Configure text and image generation models
- Set up provider capabilities

Sample data is available to help you get started quickly.

## Database Migration (Airtable to MongoDB)

SocialSync Pro now supports MongoDB as an alternative to Airtable for data storage. The migration tools allow you to seamlessly move your data from Airtable to MongoDB without any code changes.

### Benefits of MongoDB Migration

1. **Better Performance**: Faster data queries and operations
2. **Higher Scalability**: Handle larger datasets more efficiently
3. **Cost Savings**: Eliminate Airtable's record and attachment limits
4. **Enhanced Features**: Advanced querying and indexing capabilities

### Migration Process

1. **Prepare Your Environment**: Set up MongoDB and configure environment variables
2. **Run Migration Tools**: Use the provided scripts to migrate your data
3. **Verify Migration**: Confirm all data has been transferred correctly
4. **Switch to MongoDB**: Update your application to use MongoDB

For detailed migration instructions, see:
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Complete migration instructions
- [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md) - Overview of benefits and process
- [scripts/README.md](scripts/README.md) - Tool-specific documentation

### Zero Code Change Requirement

The MongoDB migration is designed to work with your existing codebase without any modifications. All API contracts remain identical, ensuring seamless operation after migration.
