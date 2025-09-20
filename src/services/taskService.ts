import { BackgroundTask, TaskType, TaskPayload } from '../types/task.types';

// Base API function
const apiRequest = async (url: string, options: RequestInit = {}) => {
  console.log('[TaskService] Making API request to:', url, options);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      // Add auth headers if needed
    },
    ...options,
  });

  console.log('[TaskService] API response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[TaskService] API request failed with error:', errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log('[TaskService] API request successful, response:', result);
  return result;
};

// Task Service
export const taskService = {
  // Create a new background task
  createBackgroundTask: async (
    type: TaskType,
    payload: TaskPayload,
    brandId: string,
    priority: 'low' | 'normal' | 'high' = 'normal'
  ): Promise<{ taskId: string }> => {
    // In a real implementation, you would get the userId from the auth context
    const userId = 'current-user-id'; // Placeholder
    
    console.log('TaskService: Creating background task with type:', type, 'brandId:', brandId);
    
    try {
      const response = await apiRequest('/api/index.js?service=jobs&action=create', {
        method: 'POST',
        body: JSON.stringify({ type, payload, userId, brandId, priority }),
      });
      
      console.log('TaskService: Task created successfully with ID:', response.taskId);
      return response;
    } catch (error) {
      console.error('TaskService: Error creating background task:', error);
      throw error;
    }
  },

  // Get task status
  getStatus: async (taskId: string): Promise<{
    taskId: string;
    status: BackgroundTask['status'];
    progress: number;
    currentStep?: string;
    result?: any;
    error?: string;
  }> => {
    try {
      const response = await apiRequest(`/api/index.js?service=jobs&action=status&taskId=${taskId}`, {
        method: 'GET',
      });
      
      return response;
    } catch (error) {
      console.error(`TaskService: Error getting status for task ${taskId}:`, error);
      throw error;
    }
  },

  // Cancel a task
  cancelTask: async (taskId: string): Promise<{ success: boolean }> => {
    // In a real implementation, you would get the userId from the auth context
    const userId = 'current-user-id'; // Placeholder
    
    try {
      const response = await apiRequest('/api/index.js?service=jobs&action=cancel', {
        method: 'POST',
        body: JSON.stringify({ taskId, userId }),
      });
      
      return response;
    } catch (error) {
      console.error(`TaskService: Error canceling task ${taskId}:`, error);
      throw error;
    }
  },
};