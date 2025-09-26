import React, { createContext, useContext, useReducer, useCallback, useState } from 'react';
import { taskService } from '../services/taskService';
import { useTaskPolling } from '../hooks/useTaskPolling';
import { BackgroundTask } from '../types/task.types';

// Task state interface
interface TaskState {
  tasks: Record<string, BackgroundTask>;
  notifications: Record<string, BackgroundTask>;
  taskList: BackgroundTask[];
}

// Action types
type TaskAction =
  | { type: 'ADD_TASK'; payload: BackgroundTask }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<BackgroundTask> } }
  | { type: 'REMOVE_TASK'; payload: { taskId: string } }
  | { type: 'ADD_NOTIFICATION'; payload: BackgroundTask }
  | { type: 'REMOVE_NOTIFICATION'; payload: { taskId: string } }
  | { type: 'SET_TASK_LIST'; payload: BackgroundTask[] }
  | { type: 'CLEAR_ALL' };

// Initial state
const initialState: TaskState = {
  tasks: {},
  notifications: {},
  taskList: [],
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

    case 'SET_TASK_LIST':
      return { ...state, taskList: action.payload };
      
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
  taskList: BackgroundTask[];
  isLoadingTasks: boolean;
  loadTasks: (brandId: string) => Promise<void>;
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
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const { addTask: addPollingTask, removeTask: removePollingTask } = useTaskPolling();

  const loadTasks = useCallback(async (brandId: string) => {
    if (!brandId) return;
    setIsLoadingTasks(true);
    try {
        const fetchedTasks = await taskService.listTasks(brandId);
        dispatch({ type: 'SET_TASK_LIST', payload: fetchedTasks });
    } catch (err) {
        console.error("Could not load tasks.", err);
        // Optionally set an error state here
    } finally {
        setIsLoadingTasks(false);
    }
  }, []);
  
  const addTask = useCallback((task: BackgroundTask) => {
    dispatch({ type: 'ADD_TASK', payload: task });
    addPollingTask(task.taskId);
  }, [addPollingTask]);
  
  const updateTask = useCallback((taskId: string, updates: Partial<BackgroundTask>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
  }, []);
  
  const removeTask = useCallback((taskId: string) => {
    dispatch({ type: 'REMOVE_TASK', payload: { taskId } });
    removePollingTask(taskId);
  }, [removePollingTask]);
  
  const addNotification = useCallback((task: BackgroundTask) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: task });
  }, []);
  
  const removeNotification = useCallback((taskId: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: { taskId } });
  }, []);
  
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);
  
  const startPolling = useCallback((taskId: string) => {
    addPollingTask(taskId);
  }, [addPollingTask]);
  
  return (
    <TaskContext.Provider
      value={{
        tasks: state.tasks,
        notifications: state.notifications,
        taskList: state.taskList,
        isLoadingTasks,
        loadTasks,
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