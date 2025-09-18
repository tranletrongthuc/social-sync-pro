# Background Task Processing Implementation Plan

Moving long-running generative tasks to a background process is the industry-standard solution for this problem. It dramatically improves user experience by providing a non-blocking, responsive UI and enhances system resilience.

Here is a technical solution outlining how to implement this asynchronous architecture within your existing project structure.

### 1. Architectural Overview

The core idea is to decouple the task request from its execution using a message queue. This changes the workflow from a synchronous "request-wait-response" model to an asynchronous "request-process-notify" model.

Here's the proposed data flow:

1.  **Enqueue:** The Frontend sends a request to a new API endpoint to *start* a task. The API immediately adds the task to a **Job Queue** and returns a unique `taskId` to the frontend.
2.  **Process:** A background worker, triggered by the Job Queue, picks up the task. It performs the long-running generative work (e.g., calling the Gemini API).
3.  **Update:** As the worker processes the task, it updates the task's status (`queued` -> `in_progress` -> `completed`/`failed`) in your MongoDB database.
4.  **Poll & Notify:** The Frontend, now free, periodically asks the backend for the status of the task using the `taskId`. When the status is `completed`, the frontend shows a notification to the user.
    - **Note:** For a more advanced, real-time experience, this polling mechanism can be upgraded to use **WebSockets** in a future iteration to push status updates directly to the client.


### 2. Recommended Technology

Given your Vercel-based stack, I recommend using **Upstash QStash**. It's a serverless-first message queue designed specifically for this use case. It's easy to integrate and can call a Vercel Serverless Function (acting as our "worker") via a webhook.

### 3. Detailed Workflow (Example: "Generate Media Plan")

Let's walk through how this would work for generating a new media plan.

#### **Step 1: Enqueueing the Task**

*   **Frontend (`MediaPlanWizardModal.tsx` -> `useMediaPlanManagement.ts`):**
    *   When the user clicks "Generate Plan", the `onGenerate` handler is called.
    *   Instead of directly calling the `textGenerationService`, it will now call a new function, e.g., `createBackgroundTask`.
    *   This function makes a `POST` request to a new API endpoint: `/api/jobs?action=create`.
    *   The request body contains the task details:
        ```json
        {
          "type": "GENERATE_MEDIA_PLAN",
          "payload": { "objective": "...", "keywords": [...], "settings": {...} }
        }
        ```
    *   The frontend immediately receives a response like `{ "taskId": "some-unique-id-123" }` and adds the task to a local state.
    *   The frontend then adds this `taskId` to a local state (e.g., in a global context or a hook) to track active background tasks and can show a small, non-blocking indicator in the UI (e.g., "1 task in progress..."). The wizard modal can now be closed.

*   **Backend (`api/jobs.js` - New File):**
    *   This new serverless function handles the `action=create` request.
    *   It generates a unique `taskId`.
    *   It saves a new document to a new `tasks` collection in MongoDB with `status: 'queued'`.
    *   It then pushes a message to QStash containing the `taskId` and the processing webhook URL (e.g., `https://your-app.vercel.app/api/jobs?action=process`).
    *   It immediately returns the `202 Accepted` response with the `taskId`.

#### **Step 2: Background Processing**

*   **QStash & Backend Worker (`api/jobs.js`):**
    *   QStash calls your `POST /api/jobs?action=process` webhook with the task payload.
    *   This function has a longer execution timeout, suitable for generative tasks.
    *   It first updates the task's status in MongoDB to `processing` and sets the `currentStep` to "Analyzing keywords...".
    *   It then executes the original long-running logic (e.g., calls `textGenerationService.generateMediaPlanGroup`).
    *   Upon successful completion, it saves the result (the new media plan) to the `mediaPlanGroups` collection.
    *   Finally, it updates the task document in MongoDB to `status: 'completed'`, sets `progress: 100`, and stores a reference to the result, e.g., `result: { mediaPlanGroupId: '...' }`. If it fails, it sets the status to `failed` and stores the error message.

#### **Step 3: Status Tracking & User Notification**

*   **Frontend (e.g., a new `useTaskPolling` hook with Exponential Backoff):**
    *   This hook runs in the main `App.tsx`. It maintains a list of active `taskId`s.
    *   Instead of polling at a fixed interval, it uses an **exponential backoff** strategy to reduce server load and improve efficiency.
        ```javascript
        // Example of exponential backoff polling logic
        const pollWithBackoff = (taskId, attempt = 1) => {
          // Start with a 1s delay, increase by 1.5x each time, cap at 30s.
          const delay = Math.min(1000 * Math.pow(1.5, attempt), 30000);
          
          setTimeout(() => {
            checkStatus(taskId).then(task => {
              if (task.status === 'completed' || task.status === 'failed') {
                showNotification(task);
                // Stop polling for this task
              } else if (attempt < 20) { // Stop after a reasonable number of attempts
                pollWithBackoff(taskId, attempt + 1);
              }
            });
          }, delay);
        };
        ```
    *   The backend `action=status` endpoint queries the `tasks` collection and returns the current status for the requested IDs.
    *   When the hook detects a task's status has changed to `completed` or `failed`:
        *   It removes the task from the active polling list.
        *   It triggers a UI notification using a "Smart Notification" strategy (e.g., immediate for failures, slightly delayed for success to batch multiple completions).
        *   A success toast could say: "Your media plan is ready!" with a "View" button. Clicking this button would call `onSelectPlan(result.mediaPlanGroupId)` and switch to the 'mediaPlan' tab.

### 4. Required Changes Summary

#### **A. Database (MongoDB)**

Create a new `tasks` collection with an enhanced schema to support detailed tracking, error handling, and orchestration.

```typescript
interface EnhancedBackgroundTask {
  _id: ObjectId;
  taskId: string;       // Unique, indexed ID for the task
  userId: string;       // CRITICAL: ID of the user who initiated the task
  brandId: string;
  type: 'GENERATE_MEDIA_PLAN' | 'GENERATE_BRAND_KIT' | 'AUTO_GENERATE_PERSONAS'; // etc.
  payload: any;         // Input data for the task

  // --- Status & Progress Tracking ---
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying';
  progress: number;     // 0-100
  currentStep?: string; // e.g., "Analyzing keywords", "Generating content"
  
  // --- Orchestration ---
  steps?: { name: string; status: 'pending' | 'running' | 'completed' | 'failed'; }[];
  currentStepIndex?: number;

  // --- Queue Management & Timing ---
  priority: 'low' | 'normal' | 'high';
  queuedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;

  // --- Results & Error Handling ---
  result?: any;         // Result data (e.g., { mediaPlanGroupId: '...' })
  lastError?: string;   // Last error message on failure
  retryCount: number;
  maxRetries: number;

  // --- Audit Trail ---
  createdAt: Date;
  updatedAt: Date;
}

// Recommended Indexes:
// 1. Compound index on [userId, status] for efficient user-specific status queries.
// 2. TTL (Time-To-Live) index on `completedAt` to automatically clean up old, completed tasks after a set period (e.g., 30 days).
```

#### **B. Backend (Vercel)**

*   Create a new API file: `/api/jobs.js`.
*   Implement three actions within it:
    1.  `create`: Adds a job to the queue and returns a `taskId`.
    2.  `process`: The webhook that QStash calls to run the actual job.
    3.  `status`: A simple endpoint for the frontend to poll for task status.

#### **C. Frontend (`src/`)**

1.  **Service Layer:** Create a `taskService.ts` to abstract the API calls to `/api/jobs`.
2.  **State Management:**
    *   In `App.tsx`, create a state to hold active background tasks: `const [backgroundTasks, setBackgroundTasks] = useState<Task[]>([]);`
    *   Create a `useTaskPolling` custom hook to manage status checks.
3.  **UI Components:**
    *   Create a `TaskStatusIndicator.tsx` component to display in the `Header.tsx`.
    *   Update your `Toast.tsx` system to handle actionable notifications.
4.  **Logic Refactoring:**
    *   Modify the primary action handlers (e.g., `handleGenerateMediaPlan`, `handleGenerateKit` in your custom hooks) to call the new `taskService.createBackgroundTask` instead of the direct generation function.

This architecture provides a scalable and user-friendly solution that completely frees up the UI, allowing users to continue their work while the AI performs its magic in the background.
