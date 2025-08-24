
import React, { useState, useEffect } from 'react';
import type { MediaPlanPost, SchedulingPost } from '../types';
import { Button } from './ui';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (postInfo: SchedulingPost, scheduleDate: string) => void;
  isScheduling: boolean;
  schedulingPost: SchedulingPost | null;
  language: string;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSchedule, isScheduling, schedulingPost, language }) => {
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
    if (schedulingPost?.post.scheduledAt) {
      const d = new Date(schedulingPost.post.scheduledAt);
      setScheduleDate(d.toISOString().split('T')[0]);
      setScheduleTime(d.toTimeString().substring(0, 5));
    } else {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
      setScheduleDate(now.toISOString().split('T')[0]);
      setScheduleTime(now.toTimeString().substring(0, 5));
    }
  }, [schedulingPost]);

  if (!isOpen || !schedulingPost) return null;

  const handleSchedule = () => {
    const combinedDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
    onSchedule(schedulingPost, combinedDateTime.toISOString());
  };
  
  const T = {
    'Việt Nam': {
        title: 'Lên lịch bài đăng',
        schedule_for: 'Lên lịch cho:',
        date: 'Ngày',
        time: 'Thời gian',
        cancel: 'Hủy bỏ',
        schedule: 'Lên lịch',
        scheduling: 'Đang lên lịch...',
    },
    'English': {
        title: 'Schedule Post',
        schedule_for: 'Schedule for:',
        date: 'Date',
        time: 'Time',
        cancel: 'Cancel',
        schedule: 'Schedule Post',
        scheduling: 'Scheduling...',
    }
  };
  const texts = (T as any)[language] || T['English'];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 border border-gray-200 m-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900">{texts.title}</h2>
        <p className="text-gray-500 font-serif mt-2">{texts.schedule_for} "{schedulingPost.post.title}"</p>
        
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="schedule-date" className="block text-sm font-medium text-gray-700">{texts.date}</label>
              <input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-green focus:border-brand-green sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="schedule-time" className="block text-sm font-medium text-gray-700">{texts.time}</label>
              <input
                id="schedule-time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-green focus:border-brand-green sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-gray-200">
          <Button type="button" onClick={onClose} variant="tertiary" disabled={isScheduling}>
            {texts.cancel}
          </Button>
          <Button onClick={handleSchedule} disabled={isScheduling}>
            {isScheduling ? (
              <>
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                {texts.scheduling}
              </>
            ) : (
              texts.schedule
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleModal;
