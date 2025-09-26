# QStash Integration Guide

## Overview
This document explains how the QStash integration works in the SocialSync Pro application for background task processing.

## Environment Variables
The following environment variables are required for QStash integration:
- `QSTASH_CURRENT_SIGNING_KEY` - Current signing key from QStash
- `QSTASH_NEXT_SIGNING_KEY` - Next signing key from QStash  
- `QSTASH_TOKEN` - QStash authentication token
- `VERCEL_ENV` - Set to 'production' in production environment
- `NEXT_PUBLIC_SITE_URL` or `VERCEL_URL` - Public URL of the application

## How It Works
1. When a background task is created, the system detects if it's running in production
2. In production: The task is published to QStash for reliable background processing
3. In development: The task uses self-invocation (local background processing)
4. The process endpoint verifies QStash signatures to ensure requests are legitimate
5. Task status is tracked in MongoDB and updated throughout the process

## Task Flow
1. Client creates a task via `/api/jobs?action=create`
2. Task is saved to MongoDB with status 'queued'
3. In production, QStash is called to process the task asynchronously
4. QStash eventually calls `/api/jobs?action=process` with verification
5. The task is processed and status is updated to 'completed' or 'failed'

## Error Handling
- Rate limiting is enforced (1 task/minute per user)
- QStash signature verification ensures security
- Failed tasks are marked with error details in the database
- Retry logic is available up to maxRetries (3 by default)