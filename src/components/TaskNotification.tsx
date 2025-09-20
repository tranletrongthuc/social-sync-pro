import React, { useEffect } from 'react';

interface TaskNotificationProps {
  task: any;
  onClose: () => void;
  onViewResult: (taskId: string) => void;
}

const TaskNotification: React.FC<TaskNotificationProps> = ({ task, onClose, onViewResult }) => {
  useEffect(() => {
    // Auto-close notification after 5 seconds for completed/failed tasks
    if (task.status === 'completed' || task.status === 'failed') {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [task.status, onClose]);

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed': return '✓';
      case 'failed': return '✗';
      case 'cancelled': return '∅';
      default: return '⋯';
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return 'Processing';
    }
  };

  return (
    <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ${getStatusColor().split(' ')[2]} mb-4 transition duration-300 ease-in-out`}>
      <div className="rounded-lg shadow-xs overflow-hidden">
        <div className="p-4">
          <div className="flex items-start">
            <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${getStatusColor()}`}>
              <span className="text-xs font-bold">{getStatusIcon()}</span>
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium text-gray-900">
                {task.type?.replace(/_/g, ' ') || 'Task'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {getStatusText()}
                {task.progress > 0 && ` • ${task.progress}%`}
              </p>
              {task.currentStep && (
                <p className="mt-1 text-sm text-gray-500 truncate">
                  {task.currentStep}
                </p>
              )}
              {task.error && (
                <p className="mt-1 text-sm text-red-500 truncate">
                  Error: {task.error}
                </p>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button 
                onClick={onClose}
                className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        {(task.status === 'completed' || task.status === 'failed') && (
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {task.status === 'completed' && task.result && (
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                onClick={() => onViewResult(task.taskId)}
              >
                View Result
              </button>
            )}
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskNotification;