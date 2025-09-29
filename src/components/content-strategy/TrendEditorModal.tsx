import React, { useState, useEffect } from 'react';
import type { Trend } from '../../../types';
import { Button, Input, TextArea } from '../ui';

interface TrendEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trend: Trend) => void;
  trend: Trend | null;
  language: string;
}

const TrendEditorModal: React.FC<TrendEditorModalProps> = ({ isOpen, onClose, onSave, trend, language }) => {
  const [editedTrend, setEditedTrend] = useState<Trend | null>(trend);

  useEffect(() => {
    setEditedTrend(trend);
  }, [trend]);

  const T = {
    'Việt Nam': {
      editTrend: 'Chỉnh sửa Xu hướng',
      addTrend: 'Thêm Xu hướng mới',
      topic: 'Chủ đề',
      industry: 'Ngành',
      keywords: 'Từ khóa (phân cách bằng dấu phẩy)',
      analysis: 'Phân tích',
      notes: 'Ghi chú',
      save: 'Lưu',
      cancel: 'Hủy',
    },
    'English': {
      editTrend: 'Edit Trend',
      addTrend: 'Add New Trend',
      topic: 'Topic',
      industry: 'Industry',
      keywords: 'Keywords (comma-separated)',
      analysis: 'Analysis',
      notes: 'Notes',
      save: 'Save',
      cancel: 'Cancel',
    },
  };
  const texts = T[language as keyof typeof T] || T['English'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedTrend(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keywords = e.target.value.split(',').map(k => k.trim());
    setEditedTrend(prev => prev ? { ...prev, keywords } : null);
  };

  const handleSave = () => {
    if (editedTrend) {
      onSave(editedTrend);
    }
  };

  if (!isOpen || !editedTrend) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">{trend?.id ? texts.editTrend : texts.addTrend}</h2>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <InputField label={texts.topic} name="topic" value={editedTrend.topic} onChange={handleChange} required />
          <InputField label={texts.industry} name="industry" value={editedTrend.industry} onChange={handleChange} />
          <InputField label={texts.keywords} name="keywords" value={(editedTrend.keywords || []).join(', ')} onChange={handleKeywordsChange} />
          <TextAreaField label={texts.analysis} name="analysis" value={editedTrend.analysis} onChange={handleChange} />
          <TextAreaField label={texts.notes} name="notes" value={editedTrend.notes} onChange={handleChange} />
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="tertiary" onClick={onClose}>{texts.cancel}</Button>
          <Button onClick={handleSave}>{texts.save}</Button>
        </div>
      </div>
    </div>
  );
};

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
        <Input {...props} className="w-full" />
    </div>
);

const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
        <TextArea {...props} className="w-full" rows={4} />
    </div>
);

export default TrendEditorModal;
