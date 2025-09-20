import React from 'react';
import { BackgroundTask } from '../types/task.types';

interface TaskStatusIndicatorProps {
  tasks: Record<string, any>;
  onTaskClick?: (taskId: string) => void;
}

const TaskStatusIndicator: React.FC<TaskStatusIndicatorProps> = ({ tasks, onTaskClick }) => {
  const activeTasks = Object.values(tasks).filter(
    task => task.status === 'queued' || task.status === 'processing'
  );

  if (activeTasks.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <h3 className="font-semibold text-gray-800 mb-2">Active Tasks</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {activeTasks.map((task: any) => (
            <div 
              key={task.taskId}
              className="border border-gray-200 rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => onTaskClick?.(task.taskId)}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {task.type?.replace(/_/g, ' ') || 'Task'}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  task.status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                  task.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {task.status}
                </span>
              </div>
              
              {task.progress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
              )}
              
              {task.currentStep && (
                <p className="text-xs text-gray-600 truncate">{task.currentStep}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskStatusIndicator;