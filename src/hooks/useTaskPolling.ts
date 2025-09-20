import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';

interface TaskStatus {
  taskId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying';
  progress: number;
  currentStep?: string;
  result?: any;
  error?: string;
}

export const useTaskPolling = () => {
  const [tasks, setTasks] = useState<Record<string, TaskStatus>>({});
  const [activeTaskIds, setActiveTaskIds] = useState<string[]>([]);

  // Add a task to track
  const addTask = useCallback((taskId: string) => {
    setActiveTaskIds(prev => [...prev, taskId]);
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        taskId,
        status: 'queued',
        progress: 0
      }
    }));
  }, []);

  // Remove a task from tracking
  const removeTask = useCallback((taskId: string) => {
    setActiveTaskIds(prev => prev.filter(id => id !== taskId));
    setTasks(prev => {
      const newTasks = { ...prev };
      delete newTasks[taskId];
      return newTasks;
    });
  }, []);

  // Update a task status
  const updateTask = useCallback((taskId: string, updates: Partial<TaskStatus>) => {
    setTasks(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...updates
      }
    }));
  }, []);

  // Poll for task status with exponential backoff
  const pollWithBackoff = useCallback(async (taskId: string, attempt = 1) => {
    console.log(`[TaskPolling] Polling task ${taskId}, attempt ${attempt}`);
    
    try {
      const status = await taskService.getStatus(taskId);
      
      console.log(`[TaskPolling] Received status for task ${taskId}:`, status);
      
      updateTask(taskId, status);

      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        console.log(`[TaskPolling] Task ${taskId} finished with status ${status.status}`);
        // Task is finished, remove from active tasks after a delay to show completion
        setTimeout(() => {
          removeTask(taskId);
        }, 5000); // Keep completed tasks visible for 5 seconds
      } else if (attempt < 10) {
        // Continue polling with exponential backoff
        const delayMs = Math.min(1000 * Math.pow(1.5, attempt), 30000); // Cap at 30s
        console.log(`[TaskPolling] Scheduling next poll for task ${taskId} in ${delayMs}ms`);
        setTimeout(() => pollWithBackoff(taskId, attempt + 1), delayMs);
      } else {
        console.warn(`[TaskPolling] Max attempts reached for task ${taskId}`);
      }
    } catch (error) {
      console.error(`[TaskPolling] Error polling task ${taskId}:`, error);
      // Continue polling even if there's an error
      if (attempt < 10) {
        const delayMs = Math.min(1000 * Math.pow(1.5, attempt), 30000); // Cap at 30s
        console.log(`[TaskPolling] Scheduling retry for task ${taskId} in ${delayMs}ms`);
        setTimeout(() => pollWithBackoff(taskId, attempt + 1), delayMs);
      }
    }
  }, [removeTask, updateTask]);

  // Start polling for all active tasks
  useEffect(() => {
    activeTaskIds.forEach(taskId => {
      // Start polling immediately for the first attempt
      pollWithBackoff(taskId, 1);
    });
  }, [activeTaskIds, pollWithBackoff]);

  return {
    tasks,
    addTask,
    removeTask,
    updateTask,
    activeTaskIds
  };
};