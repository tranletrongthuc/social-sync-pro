import { BackgroundTask, TaskType, TaskPayload } from '../types/task.types';

// Base API function
const apiRequest = async (url: string, options: RequestInit = {}) => {
  console.log('[TaskService] Making API request to:', url, options);
  
  const finalOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);

    console.log('[TaskService] API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[TaskService] API request failed with error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('[TaskService] API request successful, response:', result);
    return result;
  } catch (error) {
    console.error('[TaskService] Network error in API request:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach the server. Please check your connection.');
    }
    throw error;
  }
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

  // List all tasks for a brand
  listTasks: async (brandId: string): Promise<BackgroundTask[]> => {
    console.log('TaskService: Listing tasks for brandId:', brandId);
    
    if (!brandId) {
      console.warn('TaskService: Missing brandId in listTasks');
      return [];
    }
    
    try {
      const response = await apiRequest(`/api/index.js?service=jobs&action=list&brandId=${brandId}`, {
        method: 'GET',
      });
      
      console.log(`TaskService: Found ${response.length || 0} tasks for brand ${brandId}`);
      return response || [];
    } catch (error) {
      console.error(`TaskService: Error listing tasks for brand ${brandId}:`, error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // List all media plan groups for a brand
  listMediaPlanGroups: async (brandId: string): Promise<{ id: string, name: string, prompt: string, source?: string, productImages?: any[], personaId?: string }[]> => {
    console.log('TaskService: Listing media plan groups for brandId:', brandId);
    
    if (!brandId) {
      console.warn('TaskService: Missing brandId in listMediaPlanGroups');
      return [];
    }
    
    try {
      const response = await apiRequest(`/api/mongodb?action=list-media-plan-groups&brandId=${brandId}`, {
        method: 'GET',
      });
      
      console.log(`TaskService: Found ${response.groups?.length || 0} media plan groups for brand ${brandId}`);
      return response.groups || [];
    } catch (error) {
      console.error(`TaskService: Error listing media plan groups for brand ${brandId}:`, error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },
};