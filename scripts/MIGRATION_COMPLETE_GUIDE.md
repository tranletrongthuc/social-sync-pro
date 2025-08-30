# SocialSync Pro MongoDB Migration - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Benefits of Migration](#benefits-of-migration)
3. [Migration Tools](#migration-tools)
4. [Preparation](#preparation)
5. [Migration Process](#migration-process)
6. [Verification](#verification)
7. [Post-Migration](#post-migration)
8. [Troubleshooting](#troubleshooting)

## Overview

This guide provides complete instructions for migrating your SocialSync Pro data from Airtable to MongoDB. The migration preserves all your existing data while switching the underlying database technology for improved performance and cost-effectiveness.

## Benefits of Migration

### Performance Improvements
- **5-10x Faster Queries**: MongoDB's native indexing outperforms Airtable's API
- **Improved Pagination**: Native database pagination for large datasets
- **Better Concurrency**: Handle more simultaneous users without rate limiting

### Cost Savings
- **Eliminate Airtable Limits**: No more record count restrictions ($20/month base cost)
- **Reduced API Calls**: More efficient data retrieval reduces API usage
- **Lower Monthly Costs**: MongoDB Atlas free tier often suffices for small teams

### Enhanced Features
- **Advanced Querying**: Complex queries previously impossible with Airtable
- **Better Analytics**: More sophisticated reporting capabilities
- **Improved Reliability**: Fewer timeout errors and rate limiting issues

## Migration Tools

All migration tools are located in the `scripts/` directory:

1. **Connection Test**: `npm run test:mongodb`
2. **Database Initialization**: `npm run init:mongodb`
3. **Dry Run Migration**: `npm run migrate:dry-run`
4. **Full Migration**: `npm run migrate`
5. **Migration Status Check**: `npm run check:migration`
6. **Implementation Test**: `npm run test:mongodb:impl`

## Preparation

### 1. Environment Setup

Create a `.env` file in your project root:

```env
# Airtable credentials
AIRTABLE_PAT=your_airtable_personal_access_token
AIRTABLE_BASE_ID=your_airtable_base_id

# MongoDB connection
MONGODB_URI=your_mongodb_connection_string
```

### 2. MongoDB Setup

1. Create a MongoDB Atlas account (or use an existing one)
2. Create a new cluster (free tier is sufficient for most users)
3. Whitelist your IP address (or 0.0.0.0/0 for development)
4. Create a database user with read/write permissions
5. Get your connection string from the "Connect" button

### 3. Airtable Access

Ensure your Airtable Personal Access Token (PAT) has access to your SocialSync Pro base.

## Migration Process

### Step 1: Test Connections

```bash
# Test MongoDB connection
npm run test:mongodb

# Optional: Initialize MongoDB database structure
npm run init:mongodb
```

### Step 2: Dry Run Migration

Perform a test migration to see what data will be exported:

```bash
npm run migrate:dry-run
```

This exports your Airtable data to JSON files in the `exports/` directory without importing to MongoDB.

### Step 3: Review Exported Data

Check the `exports/` directory to verify your data was correctly exported:

```bash
ls -la exports/
```

### Step 4: Full Migration

Run the complete migration:

```bash
npm run migrate
```

This exports data from Airtable and imports it into MongoDB.

### Step 5: Check Migration Status

Verify the migration was successful:

```bash
npm run check:migration
```

## Verification

### 1. Check MongoDB Collections

Use MongoDB Compass or a similar tool to verify your data:

1. Connect to your MongoDB instance
2. Check that all expected collections exist
3. Verify document counts match expectations
4. Spot-check sample documents for data integrity

### 2. Run Application Tests

1. Start your SocialSync Pro application
2. Navigate to various sections to verify data loads correctly
3. Perform CRUD operations to ensure data persistence works
4. Test export/import functionality

### 3. Performance Comparison

Compare loading times before and after migration:
- Brand Kit loading
- Media Plan rendering
- Strategy Hub data loading
- Affiliate Vault access

## Post-Migration

### 1. Update Application Configuration

Modify your application to use MongoDB instead of Airtable:

1. Update environment variables to point to MongoDB
2. Remove Airtable-specific configuration
3. Verify all integrations still work correctly

### 2. Monitor Performance

1. Watch for any error messages in the console
2. Monitor response times for data-intensive operations
3. Check MongoDB Atlas dashboard for resource utilization

### 3. Clean Up

1. Archive exported JSON files (keep as backup)
2. Update documentation to reflect MongoDB usage
3. Notify team members of the migration completion

## Troubleshooting

### Common Issues

#### 1. Authentication Errors
```
Error: Please set MONGODB_URI environment variable
```
**Solution**: Verify your `.env` file contains the correct MongoDB URI

#### 2. Connection Timeouts
```
MongoNetworkError: connection timed out
```
**Solution**: 
- Check your internet connection
- Verify MongoDB Atlas IP whitelist includes your address
- Check if your corporate firewall blocks MongoDB connections

#### 3. Rate Limiting
```
Error: Rate limit exceeded
```
**Solution**: 
- This comes from Airtable during export
- The migration script automatically handles rate limiting with delays
- Large databases may take longer to export

#### 4. Missing Collections
```
Warning: Collection brands not found
```
**Solution**: 
- Run `npm run init:mongodb` to create all expected collections
- Verify your MongoDB connection string points to the correct database

### Getting Help

If you encounter issues:

1. **Check Console Output**: Look for specific error messages
2. **Verify Environment Variables**: Ensure all required variables are set
3. **Test Connections Separately**: Use `npm run test:mongodb` to isolate MongoDB issues
4. **Check Export Files**: Verify data was exported correctly in dry-run mode
5. **Contact Support**: Reach out for assistance with persistent issues

## Rollback Plan

If issues occur after migration:

1. **Revert to Airtable**: Update environment variables to point back to Airtable
2. **Restore from Backup**: Use exported JSON files to restore data if needed
3. **Contact Support**: Reach out for assistance with any migration issues

## Support Resources

- [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md) - Complete migration instructions
- [MIGRATION_SUMMARY.md](../MIGRATION_SUMMARY.md) - Overview of benefits and process
- [scripts/README.md](README.md) - Tool-specific documentation
- Individual script files - Detailed implementation notes

## Next Steps

Once migration is complete:

1. Begin enjoying MongoDB performance benefits
2. Explore advanced querying capabilities
3. Implement enhanced analytics features
4. Consider horizontal scaling for future growth

The migration preserves all your hard work while unlocking the superior performance and capabilities of MongoDB.