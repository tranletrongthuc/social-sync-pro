import React, { useState, KeyboardEvent } from 'react';
import { XIcon, PlusIcon } from './icons';

interface TagInputProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  label: string;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, setTags, label, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      event.preventDefault();
      setTags([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="mb-4">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="flex flex-wrap items-center w-full p-2 mt-1 text-sm border border-gray-300 rounded-md">
        {tags.map((tag, index) => (
          <div key={index} className="flex items-center bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-sm font-medium mr-2 mb-1">
            <span>{tag}</span>
            <button onClick={() => removeTag(index)} className="ml-2 text-gray-500 hover:text-gray-800">
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-grow bg-transparent focus:outline-none p-1"
          placeholder={placeholder || 'Add a tag and press Enter...'}
        />
      </div>
    </div>
  );
};

export default TagInput;
