
import React, { useState } from 'react';
import { Button, TextArea } from './ui';
import { SparklesIcon } from './icons';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateProfile: (idea: string) => void;
  isLoading: boolean;
  language: string;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onGenerateProfile, isLoading, language }) => {
  const [idea, setIdea] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      onGenerateProfile(idea);
    }
  };

  const texts = {
    'Việt Nam': {
      title: "Tạo dự án mới",
      subtitle: "Bắt đầu với ý tưởng kinh doanh của bạn. Chúng tôi sẽ tạo ra hồ sơ thương hiệu từ đó.",
      placeholder: "Vd: Một hộp đăng ký hàng tháng cho đồ chơi chó thân thiện với môi trường, được sản xuất tại địa phương và bền vững.",
      generateButton: 'Tạo hồ sơ thương hiệu',
      generateButtonLoading: 'Đang tạo...',
      cancel: "Hủy bỏ",
    },
    'English': {
      title: "Create New Project",
      subtitle: "Start with your business idea. We'll generate a brand profile from it.",
      placeholder: 'e.g., A subscription box for eco-friendly dog toys, locally made and sustainable.',
      generateButton: 'Generate Brand Profile',
      generateButtonLoading: 'Generating...',
      cancel: "Cancel",
    }
  };
  const currentTexts = (texts as any)[language] || texts['English'];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8 border border-gray-200 m-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-gray-900">{currentTexts.title}</h2>
        <p className="text-gray-500 font-serif mt-1">{currentTexts.subtitle}</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <TextArea
            id="idea"
            name="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            required
            placeholder={currentTexts.placeholder}
            rows={4}
            className="text-lg p-4"
          />
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <Button type="button" variant="tertiary" onClick={onClose} disabled={isLoading}>
              {currentTexts.cancel}
            </Button>
            <Button type="submit" disabled={isLoading || !idea.trim()} className="flex items-center justify-center gap-2">
                {isLoading ? (
                    currentTexts.generateButtonLoading
                ) : (
                    <>
                        <SparklesIcon className="h-5 w-5" />
                        {currentTexts.generateButton}
                    </>
                )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
