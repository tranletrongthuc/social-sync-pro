
import React, { useState } from 'react';
import { Button, Input } from './ui';
import { CalendarIcon } from './icons';

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (startDate: string, intervalDays: number, intervalHours: number, intervalMinutes: number) => void;
  isScheduling: boolean;
  selectedCount: number;
  language: string;
}

const BulkScheduleModal: React.FC<BulkScheduleModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
  isScheduling,
  selectedCount,
  language
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
  const [intervalDays, setIntervalDays] = useState(1);
  const [intervalHours, setIntervalHours] = useState(0);
  const [intervalMinutes, setIntervalMinutes] = useState(0);

  if (!isOpen) return null;

  const handleSchedule = () => {
    const combinedDateTime = new Date(`${date}T${time}:00`);
    onSchedule(combinedDateTime.toISOString(), intervalDays, intervalHours, intervalMinutes);
  };
  
  const T = {
    'Việt Nam': {
        title: 'Lên lịch hàng loạt',
        subtitle: `Bạn sắp xếp lịch cho ${selectedCount} bài đăng. Đặt thời gian bắt đầu và khoảng cách giữa các bài đăng.`,
        start_date: 'Ngày bắt đầu',
        start_time: 'Thời gian bắt đầu',
        interval: 'Khoảng cách giữa các bài đăng',
        days: 'Ngày',
        hours: 'Giờ',
        minutes: 'Phút',
        cancel: 'Hủy bỏ',
        schedule: 'Lên lịch tất cả',
        scheduling: 'Đang lên lịch...',
    },
    'English': {
        title: 'Bulk Schedule Posts',
        subtitle: `You are scheduling ${selectedCount} posts. Set the start time and the interval between them.`,
        start_date: 'Start Date',
        start_time: 'Start Time',
        interval: 'Interval Between Posts',
        days: 'Days',
        hours: 'Hours',
        minutes: 'Minutes',
        cancel: 'Cancel',
        schedule: 'Schedule All',
        scheduling: 'Scheduling...',
    }
  };
  const texts = (T as any)[language] || T['English'];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8 border border-gray-200 m-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><CalendarIcon className="h-7 w-7 text-brand-green"/> {texts.title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-3xl">&times;</button>
        </div>
        <p className="text-gray-500 font-serif mt-2">{texts.subtitle}</p>
        
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{texts.start_date} & {texts.start_time}</label>
            <div className="grid grid-cols-2 gap-4 mt-1">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
              <label className="block text-sm font-medium text-gray-700">{texts.interval}</label>
              <div className="grid grid-cols-3 gap-4 mt-1">
                  <div>
                      <Input type="number" min="0" value={intervalDays} onChange={(e) => setIntervalDays(Number(e.target.value) || 0)} />
                      <span className="text-xs text-gray-500 ml-1">{texts.days}</span>
                  </div>
                  <div>
                      <Input type="number" min="0" max="23" value={intervalHours} onChange={(e) => setIntervalHours(Number(e.target.value) || 0)} />
                      <span className="text-xs text-gray-500 ml-1">{texts.hours}</span>
                  </div>
                   <div>
                      <Input type="number" min="0" max="59" value={intervalMinutes} onChange={(e) => setIntervalMinutes(Number(e.target.value) || 0)} />
                      <span className="text-xs text-gray-500 ml-1">{texts.minutes}</span>
                  </div>
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

export default BulkScheduleModal;