# SocialSync Pro Database Migration Tools

This directory contains tools to help you set up your SocialSync Pro data in MongoDB.

## Available Tools

### 1. Test MongoDB Connection
Verifies that your MongoDB connection string is working correctly.

```bash
npm run test:mongodb
```

### 2. Initialize MongoDB Database
Sets up the MongoDB database with proper collections and indexes.

```bash
npm run init:mongodb
```

### 3. Dry Run Migration
Exports data to JSON files without importing to MongoDB. This is useful for verifying what data will be processed.

```bash
npm run migrate:dry-run
```

### 4. Full Migration
Exports data and imports it into MongoDB.

```bash
npm run migrate
```

## Environment Variables

Create a `.env` file in the project root with:

```env
# MongoDB connection
MONGODB_URI=your_mongodb_connection_string
```

## Migration Process

1. **Test your MongoDB connection**:
   ```bash
   npm run test:mongodb
   ```

2. **Initialize MongoDB database** (optional but recommended):
   ```bash
   npm run init:mongodb
   ```

3. **Perform a dry run** to see what data will be exported:
   ```bash
   npm run migrate:dry-run
   ```

4. **Check the exported data** in the `exports/` directory.

5. **Run the full migration**:
   ```bash
   npm run migrate
   ```

## What Data Gets Migrated?

The migration handles all core SocialSync Pro data:
- Brands and brand assets
- Media plans and posts
- Affiliate products
- Personas and social accounts
- Trends and ideas
- AI services and models
- Settings

## After Migration

Once migration is complete, your application will use MongoDB for all data operations while maintaining full compatibility with the existing codebase.

## Troubleshooting

If you encounter issues:

1. **Verify your environment variables** are set correctly
2. **Check MongoDB connection** with `npm run test:mongodb`
3. **Check the console output** for specific error messages

## Support

For additional help, refer to the main MIGRATION_GUIDE.md file in the project root.