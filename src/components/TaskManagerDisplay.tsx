import React from 'react';
import { BackgroundTask } from '../types/task.types';
import StandardPageView from './StandardPageView';
import { RefreshIcon } from './icons';
import ModelLabel from './ModelLabel';

interface TaskManagerDisplayProps {
  tasks: BackgroundTask[];
  isLoading: boolean;
  language: string;
  mongoBrandId: string | null;
  onLoadData?: (brandId: string) => Promise<void>;
}

const TaskManagerDisplay: React.FC<TaskManagerDisplayProps> = ({ tasks, isLoading, language, mongoBrandId, onLoadData }) => {
  const T = {
    'Việt Nam': {
      title: 'Quản lý Tác vụ',
      subtitle: 'Xem trạng thái và lịch sử của các tác vụ nền.',
      taskType: 'Loại Tác vụ',
      status: 'Trạng thái',
      progress: 'Tiến trình',
      modelUsed: 'Mô hình sử dụng',
      createdAt: 'Ngày tạo',
      noTasks: 'Không có tác vụ nào được tìm thấy.',
      loading: 'Đang tải tác vụ...',
    },
    'English': {
      title: 'Task Manager',
      subtitle: 'View the status and history of background tasks.',
      taskType: 'Task Type',
      status: 'Status',
      progress: 'Progress',
      modelUsed: 'Model Used',
      createdAt: 'Created At',
      noTasks: 'No tasks found.',
      loading: 'Loading tasks...',
    }
  };
  const texts = T[language as keyof typeof T] || T['English'];

  const getStatusColor = (status: BackgroundTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'queued':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <StandardPageView 
      title={texts.title} 
      subtitle={texts.subtitle}
      actions={
        <button 
          onClick={() => onLoadData && mongoBrandId && onLoadData(mongoBrandId)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Refresh data"
          disabled={isLoading}
        >
          <RefreshIcon className={`h-4 w-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-4 text-gray-600">{texts.loading}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-gray-500 py-16">
            <p>{texts.noTasks}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.taskType}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.status}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.progress}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.modelUsed}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.createdAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.taskId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{task.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${task.progress}%` }}></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.payload?.modelUsed ? <ModelLabel model={task.payload.modelUsed} size="small" /> : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(task.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </StandardPageView>
  );
};

export default TaskManagerDisplay;
