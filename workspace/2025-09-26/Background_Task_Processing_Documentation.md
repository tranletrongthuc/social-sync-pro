# Background Task Processing Implementation

## Overview

This implementation introduces background task processing to improve user experience by moving long-running generative tasks to the background. Users can now initiate tasks and continue using the application while the tasks are processed asynchronously.

## Key Components

### 1. Task Types
The system supports several types of background tasks:
- `GENERATE_MEDIA_PLAN`
- `GENERATE_BRAND_KIT`
- `AUTO_GENERATE_PERSONAS`
- `GENERATE_CONTENT_PACKAGE`
- `GENERATE_FUNNEL_CAMPAIGN`
- `GENERATE_VIRAL_IDEAS`
- `GENERATE_FACEBOOK_TRENDS`
- `GENERATE_TRENDS`
- `GENERATE_GLOBAL_TRENDS`
- `GENERATE_IDEAS_FROM_PRODUCT`

### 2. Data Structures

#### BackgroundTask Interface
```typescript
interface BackgroundTask {
  taskId: string;
  userId: string;
  brandId: string;
  type: TaskType;
  payload: TaskPayload;
  status: TaskStatus;
  progress: number;
  currentStep?: string;
  steps?: TaskStep[];
  priority: 'low' | 'normal' | 'high';
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
  actualDuration?: number;
  lastError?: string;
  retryCount: number;
  maxRetries: number;
  result?: {
    mediaPlanGroupId?: string;
    brandKitId?: string;
    personaSetId?: string;
    [key: string]: any;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. API Endpoints

#### `/api/jobs`
- `POST /api/jobs?action=create` - Create a new background task
- `POST /api/jobs?action=process` - Process a task (QStash webhook)
- `GET /api/jobs?action=status&taskId={taskId}` - Get task status
- `POST /api/jobs?action=cancel` - Cancel a task

### 4. Frontend Services

#### taskService
Provides methods for interacting with the background task system:
- `createBackgroundTask` - Create a new task
- `getStatus` - Get task status
- `cancelTask` - Cancel a task

#### useTaskPolling Hook
Manages task polling with exponential backoff to efficiently track task status.

#### TaskContext
Global state management for tasks and notifications.

### 5. UI Components

#### TaskStatusIndicator
Displays active tasks in a floating panel at the bottom right of the screen.

#### TaskNotification
Shows notifications when tasks are completed, failed, or cancelled.

## Implementation Details

### 1. Task Creation
When a user initiates a long-running task (e.g., generating a media plan), the system:
1. Creates a background task with the necessary parameters
2. Immediately returns control to the user
3. Shows a notification that the task has started

### 2. Task Processing
Tasks are processed asynchronously:
1. QStash handles task queuing and delivery
2. The `/api/jobs?action=process` endpoint executes the actual work
3. Task status is updated in the database throughout the process

### 3. Task Monitoring
The frontend monitors task progress:
1. Uses exponential backoff polling to check status
2. Updates UI in real-time as tasks progress
3. Shows notifications when tasks complete

## Benefits

1. **Improved User Experience** - No more frozen screens during long operations
2. **Better Error Handling** - Tasks can be retried automatically
3. **Progress Tracking** - Users can see real-time progress of their tasks
4. **Scalability** - System can handle multiple concurrent tasks
5. **Resource Management** - Rate limiting prevents system overload

## Comprehensive Logging

The system includes extensive logging at every level to ensure proper tracing of task execution:

### Frontend Logging
- `[BackgroundTask]` - Logs in the useMediaPlanManagement hook
- `[TaskService]` - Logs in the task service API calls
- `[TaskPolling]` - Logs in the useTaskPolling hook
- `[TaskContext]` - Logs in the TaskContext provider
- `[App]` - Logs in the main App component

### Backend Logging
- `[API/Jobs]` - Logs in the `/api/jobs` endpoint handlers

This comprehensive logging allows developers to trace the exact flow of actions:
1. User initiates a task → `[BackgroundTask] handleGenerateMediaPlanGroup called`
2. Task creation request → `[TaskService] Making API request to: /api/jobs`
3. API receives request → `[API/Jobs] Received request with action: create`
4. Task is saved to database → `[API/Jobs] Saving task document to database`
5. Task processing begins → `[API/Jobs] Processing task with request body`
6. Task status updates → `[API/Jobs] Updated task status to processing/completed`
7. Frontend polling → `[TaskPolling] Polling task {taskId}, attempt {attempt}`
8. UI updates → `[TaskContext] Adding/Updating/Removing task`

## Future Enhancements

1. **WebSocket Integration** - Replace polling with real-time updates
2. **Task Prioritization** - Premium users get higher priority processing
3. **Detailed Progress Tracking** - Show granular steps within each task
4. **Task History** - Allow users to view completed tasks
5. **Batch Operations** - Support for processing multiple tasks together

## Testing Instructions

To test the background task processing system:

1. Navigate to the Media Plan section
2. Click "Generate Media Plan"
3. Fill in the required information and click "Generate"
4. You should see:
   - A notification that the task has started
   - The task appearing in the task status indicator
   - The task progressing through different states (queued, processing, completed)
   - A final notification when the task is complete

The system now successfully moves all generative tasks to the background, allowing users to continue working while their content is being generated.