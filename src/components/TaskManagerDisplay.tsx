import React, { useState } from 'react';
import { BackgroundTask } from '../types/task.types';
import GenericTabTemplate from './GenericTabTemplate';
import { RefreshIcon, DotsVerticalIcon, TrashIcon, ArrowPathIcon as RetryIcon, XIcon as CancelIcon } from './icons';
import RefreshButton from './RefreshButton';
import ModelLabel from './ModelLabel';
import { Card, Label, Button } from '../design/components';
import type { LabelVariant } from '../design/components/Label';

const TaskActions: React.FC<{ task: BackgroundTask; onCancel: (id: string) => void; onRetry: (id: string) => void; onDelete: (id: string) => void; retryingTaskId: string | null; }> = ({ task, onCancel, onRetry, onDelete, retryingTaskId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canCancel = task.status === 'queued' || task.status === 'processing';
  const canRetry = task.status === 'failed';
  const canDelete = task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-full hover:bg-gray-200">
        <DotsVerticalIcon className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {canCancel && <button onClick={() => { onCancel(task.taskId); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><CancelIcon className="h-4 w-4"/> Cancel</button>}
            {canRetry && <button 
              onClick={() => { onRetry(task.taskId); setIsOpen(false); }} 
              disabled={retryingTaskId === task.taskId}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RetryIcon className="h-4 w-4"/>
              {retryingTaskId === task.taskId ? 'Retrying...' : 'Retry'}
            </button>}
            {canDelete && <button onClick={() => { onDelete(task.taskId); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><TrashIcon className="h-4 w-4"/> Delete</button>}
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskManagerDisplayProps {
  tasks: BackgroundTask[];
  isLoading: boolean;
  language: string;
  mongoBrandId: string | null;
  onLoadData?: (brandId: string) => Promise<void>;
  onCancelTask: (taskId: string) => void;
  onRetryTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  retryingTaskId?: string | null;
}

const TaskManagerDisplay: React.FC<TaskManagerDisplayProps> = ({ tasks, isLoading, language, mongoBrandId, onLoadData, onCancelTask, onRetryTask, onDeleteTask, retryingTaskId = null }) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set<string>());

  const handleToggleAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map(t => t.taskId)));
    }
  };

  const handleToggleOne = (taskId: string) => {
    const newSelection = new Set(selectedTaskIds);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTaskIds(newSelection);
  };

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

  const getStatusVariant = (status: BackgroundTask['status']): LabelVariant => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'warning';
      case 'processing': return 'info';
      case 'queued':
      default:
        return 'default';
    }
  };

  const actionButtons = (
    <RefreshButton 
      onClick={() => onLoadData && mongoBrandId && onLoadData(mongoBrandId)}
      isLoading={isLoading}
      language={language}
    />
  );

  return (
    <GenericTabTemplate 
      title={texts.title} 
      subtitle={texts.subtitle}
      actionButtons={actionButtons}
      isLoading={isLoading}
    >
      <div className="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto">
        {tasks.length === 0 && !isLoading ? (
          <Card variant="outlined" className="text-center py-16">
            <p className="text-gray-500">{texts.noTasks}</p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" 
                        checked={tasks.length > 0 && selectedTaskIds.size === tasks.length}
                        onChange={handleToggleAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.taskType}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.status}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.progress}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.modelUsed}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{texts.createdAt}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <tr key={task.taskId} className={`${selectedTaskIds.has(task.taskId) ? 'bg-green-50' : ''}`}>
                      <td className="px-6 py-4">
                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green" 
                          checked={selectedTaskIds.has(task.taskId)}
                          onChange={() => handleToggleOne(task.taskId)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">{task.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Label variant={getStatusVariant(task.status)} size="sm">
                          {task.status}
                        </Label>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        <TaskActions task={task} onCancel={onCancelTask} onRetry={onRetryTask} onDelete={onDeleteTask} retryingTaskId={retryingTaskId} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </GenericTabTemplate>
  );
};

export default TaskManagerDisplay;