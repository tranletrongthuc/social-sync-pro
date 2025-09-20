import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { useTaskPolling } from '../hooks/useTaskPolling';
import { BackgroundTask } from '../types/task.types';

// Task state interface
interface TaskState {
  tasks: Record<string, BackgroundTask>;
  notifications: Record<string, BackgroundTask>;
}

// Action types
type TaskAction =
  | { type: 'ADD_TASK'; payload: BackgroundTask }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<BackgroundTask> } }
  | { type: 'REMOVE_TASK'; payload: { taskId: string } }
  | { type: 'ADD_NOTIFICATION'; payload: BackgroundTask }
  | { type: 'REMOVE_NOTIFICATION'; payload: { taskId: string } }
  | { type: 'CLEAR_ALL' };

// Initial state
const initialState: TaskState = {
  tasks: {},
  notifications: {}
};

// Reducer
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskId]: action.payload
        }
      };
      
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskId]: {
            ...state.tasks[action.payload.taskId],
            ...action.payload.updates,
            updatedAt: new Date()
          }
        }
      };
      
    case 'REMOVE_TASK':
      const { [action.payload.taskId]: removedTask, ...remainingTasks } = state.tasks;
      return {
        ...state,
        tasks: remainingTasks
      };
      
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: {
          ...state.notifications,
          [action.payload.taskId]: action.payload
        }
      };
      
    case 'REMOVE_NOTIFICATION':
      const { [action.payload.taskId]: removedNotification, ...remainingNotifications } = state.notifications;
      return {
        ...state,
        notifications: remainingNotifications
      };
      
    case 'CLEAR_ALL':
      return initialState;
      
    default:
      return state;
  }
}

// Context
interface TaskContextType {
  tasks: Record<string, BackgroundTask>;
  notifications: Record<string, BackgroundTask>;
  addTask: (task: BackgroundTask) => void;
  updateTask: (taskId: string, updates: Partial<BackgroundTask>) => void;
  removeTask: (taskId: string) => void;
  addNotification: (task: BackgroundTask) => void;
  removeNotification: (taskId: string) => void;
  clearAll: () => void;
  startPolling: (taskId: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Provider component
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const { tasks: pollingTasks, addTask: addPollingTask, removeTask: removePollingTask } = useTaskPolling();
  
  // Add a task
  const addTask = useCallback((task: BackgroundTask) => {
    console.log('[TaskContext] Adding task:', task);
    dispatch({ type: 'ADD_TASK', payload: task });
    // Start polling for this task
    addPollingTask(task.taskId);
  }, [addPollingTask]);
  
  // Update a task
  const updateTask = useCallback((taskId: string, updates: Partial<BackgroundTask>) => {
    console.log('[TaskContext] Updating task:', taskId, updates);
    dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
  }, []);
  
  // Remove a task
  const removeTask = useCallback((taskId: string) => {
    console.log('[TaskContext] Removing task:', taskId);
    dispatch({ type: 'REMOVE_TASK', payload: { taskId } });
    // Stop polling for this task
    removePollingTask(taskId);
  }, [removePollingTask]);
  
  // Add a notification
  const addNotification = useCallback((task: BackgroundTask) => {
    console.log('[TaskContext] Adding notification for task:', task.taskId);
    dispatch({ type: 'ADD_NOTIFICATION', payload: task });
  }, []);
  
  // Remove a notification
  const removeNotification = useCallback((taskId: string) => {
    console.log('[TaskContext] Removing notification for task:', taskId);
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: { taskId } });
  }, []);
  
  // Clear all tasks and notifications
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);
  
  // Start polling for a task (already handled by addTask)
  const startPolling = useCallback((taskId: string) => {
    // Polling is automatically started when a task is added
  }, []);
  
  return (
    <TaskContext.Provider
      value={{
        tasks: state.tasks,
        notifications: state.notifications,
        addTask,
        updateTask,
        removeTask,
        addNotification,
        removeNotification,
        clearAll,
        startPolling
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

// Hook to use the task context
export const useTaskManager = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskManager must be used within a TaskProvider');
  }
  return context;
};