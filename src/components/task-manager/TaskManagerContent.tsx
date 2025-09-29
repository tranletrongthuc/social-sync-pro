import React from 'react';
import type { BackgroundTask } from '../../types/task.types';
import TaskManagerDisplay from '../TaskManagerDisplay';
import StandardPageView from '../StandardPageView';
import { RefreshIcon } from '../icons';

interface TaskManagerContentProps {
  tasks: BackgroundTask[];
  isLoading: boolean;
  language: string;
  mongoBrandId: string | null;
  onLoadData?: (brandId: string) => Promise<void>;
  onRefresh?: () => Promise<void> | void;
  onCancelTask: (taskId: string) => void;
  onRetryTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const TaskManagerContent: React.FC<TaskManagerContentProps> = (props) => {
  const T = {
    'Việt Nam': {
      title: "Quản lý Tác vụ",
      description: "Theo dõi tiến độ các tác vụ nền",
      refresh: "Làm mới",
      loading: "Đang tải..."
    },
    'English': {
      title: "Task Manager",
      description: "Track background task progress",
      refresh: "Refresh",
      loading: "Loading..."
    }
  };
  const texts = (T as any)[props.language] || T['English'];

  return (
    <StandardPageView
      title={texts.title}
      subtitle={texts.description}
      actions={
        <div className="flex flex-row gap-2">
          <button 
            onClick={props.onRefresh}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Refresh data"
            disabled={props.isLoading}
          >
            <RefreshIcon className={`h-5 w-5 text-gray-600 ${props.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <TaskManagerDisplay
        tasks={props.tasks}
        isLoading={props.isLoading}
        language={props.language}
        mongoBrandId={props.mongoBrandId}
        onLoadData={props.onLoadData}
        onCancelTask={props.onCancelTask}
        onRetryTask={props.onRetryTask}
        onDeleteTask={props.onDeleteTask}
      />
    </StandardPageView>
  );
};

export default TaskManagerContent;