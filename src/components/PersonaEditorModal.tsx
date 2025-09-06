import React, { useState, useEffect, useId } from 'react';
import type { Persona } from '../../types';
import { Button, Input, TextArea } from './ui';
import TagInput from './TagInput';

interface PersonaEditorModalProps {
  isOpen: boolean;
  persona: Persona | null;
  onClose: () => void;
  onSave: (persona: Persona) => void;
  language: string;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => {
    const inputId = useId();
    return (
        <div className="mb-4">
            <label htmlFor={inputId} className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
            <Input id={inputId} {...props} className="p-1 text-sm w-full"/>
        </div>
    );
};

const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & {label: string}> = ({label, ...props}) => {
    const textareaId = useId();
    return (
        <div className="mb-4">
            <label htmlFor={textareaId} className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
            <TextArea id={textareaId} {...props} className="p-1 text-sm w-full"/>
        </div>
    );
};

const PersonaEditorModal: React.FC<PersonaEditorModalProps> = ({ isOpen, persona, onClose, onSave, language }) => {
  const [editedPersona, setEditedPersona] = useState<Persona | null>(persona);
  const [activeTab, setActiveTab] = useState('identity');

  useEffect(() => {
    setEditedPersona(persona);
  }, [persona]);

  if (!isOpen || !editedPersona) return null;

  const T = {
    'Việt Nam': {
      title: 'Chỉnh sửa Persona',
      save: 'Lưu thay đổi',
      cancel: 'Hủy',
      tabIdentity: 'Nhận dạng',
      tabVoice: 'Giọng nói & Tính cách',
      tabKnowledge: 'Kiến thức & Sở thích',
      tabBrand: 'Quan hệ Thương hiệu',
      // Field Labels
      nickName: 'Tên Persona',
      age: 'Tuổi',
      location: 'Địa điểm',
      occupation: 'Nghề nghiệp',
      backstory: 'Câu chuyện nền',
      personalityTraits: 'Nét tính cách',
      linguisticRules: 'Quy tắc ngôn ngữ',
      knowledgeBase: 'Cơ sở kiến thức (Sở thích, Mối quan tâm)',
      originStory: 'Câu chuyện nguồn gốc',
      coreAffinity: 'Sự tương đồng cốt lõi',
      productUsage: 'Cách sử dụng sản phẩm',
    },
    'English': {
      title: 'Edit Persona',
      save: 'Save Changes',
      cancel: 'Cancel',
      tabIdentity: 'Identity',
      tabVoice: 'Voice & Personality',
      tabKnowledge: 'Knowledge & Interests',
      tabBrand: 'Brand Relationship',
      // Field Labels
      nickName: 'Persona Name',
      age: 'Age',
      location: 'Location',
      occupation: 'Occupation',
      backstory: 'Backstory',
      personalityTraits: 'Personality Traits',
      linguisticRules: 'Linguistic Rules',
      knowledgeBase: 'Knowledge Base (Hobbies, Interests)',
      originStory: 'Origin Story',
      coreAffinity: 'Core Affinity',
      productUsage: 'Product Usage',
    }
  };
  const texts = (T as any)[language] || T['English'];

  const handleSave = () => {
    if (editedPersona) {
      onSave(editedPersona);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');

    if (section && field) {
        setEditedPersona(prev => prev ? { ...prev, [section]: { ...prev[section as keyof Persona] as object, [field]: value } } as Persona : null);
    } else {
        setEditedPersona(prev => prev ? { ...prev, [name]: value } as Persona : null);
    }
  };

  const handleNestedNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.');
    if (section && field) {
        setEditedPersona(prev => prev ? { ...prev, [section]: { ...prev[section as keyof Persona] as object, [field]: parseInt(value, 10) || 0 } } as Persona : null);
    }
  };

  const handleTagsChange = (name: string, tags: string[]) => {
    const [section, field] = name.split('.');
    if (section && field) {
        setEditedPersona(prev => prev ? { ...prev, [section]: { ...prev[section as keyof Persona] as object, [field]: tags } } as Persona : null);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'identity':
        return (
          <div>
            <InputField label={texts.nickName} name="nickName" value={editedPersona.nickName} onChange={handleChange} />
            <InputField label={texts.age} name="demographics.age" type="number" value={editedPersona.demographics?.age || ''} onChange={handleNestedNumberChange} />
            <InputField label={texts.location} name="demographics.location" value={editedPersona.demographics?.location || ''} onChange={handleChange} />
            <InputField label={texts.occupation} name="demographics.occupation" value={editedPersona.demographics?.occupation || ''} onChange={handleChange} />
            <TextAreaField label={texts.backstory} name="backstory" value={editedPersona.backstory || ''} onChange={handleChange} rows={5} />
          </div>
        );
      case 'voice':
        return (
            <div>
                <TagInput label={texts.personalityTraits} tags={editedPersona.voice?.personalityTraits || []} setTags={(tags) => handleTagsChange('voice.personalityTraits', tags)} placeholder='Add trait and press Enter...' />
                <TagInput label={texts.linguisticRules} tags={editedPersona.voice?.linguisticRules || []} setTags={(tags) => handleTagsChange('voice.linguisticRules', tags)} placeholder='Add rule and press Enter...' />
            </div>
        );
      case 'knowledge':
        return (
            <div>
                <TagInput label={texts.knowledgeBase} tags={editedPersona.knowledgeBase || []} setTags={(tags) => setEditedPersona(p => p ? {...p, knowledgeBase: tags} : null)} placeholder='Add interest and press Enter...' />
            </div>
        );
      case 'brand':
        return (
            <div>
                <TextAreaField label={texts.originStory} name="brandRelationship.originStory" value={editedPersona.brandRelationship?.originStory || ''} onChange={handleChange} rows={3} />
                <TextAreaField label={texts.coreAffinity} name="brandRelationship.coreAffinity" value={editedPersona.brandRelationship?.coreAffinity || ''} onChange={handleChange} rows={3} />
                <TextAreaField label={texts.productUsage} name="brandRelationship.productUsage" value={editedPersona.brandRelationship?.productUsage || ''} onChange={handleChange} rows={3} />
            </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
      { id: 'identity', label: texts.tabIdentity },
      { id: 'voice', label: texts.tabVoice },
      { id: 'knowledge', label: texts.tabKnowledge },
      { id: 'brand', label: texts.tabBrand },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">{texts.title}</h2>
        </div>
        <div className='flex-grow flex'>
            <div className='w-1/4 border-r bg-gray-50'>
                <nav className='p-4'>
                    <ul>
                        {tabs.map(tab => (
                            <li key={tab.id}>
                                <button 
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === tab.id 
                                        ? 'bg-brand-green text-white' 
                                        : 'text-gray-600 hover:bg-gray-200'
                                    }`}>
                                    {tab.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            <div className='w-3/4 p-6 overflow-y-auto'>
                {renderContent()}
            </div>
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-4">
          <Button variant="tertiary" onClick={onClose}>{texts.cancel}</Button>
          <Button onClick={handleSave}>{texts.save}</Button>
        </div>
      </div>
    </div>
  );
};

export default PersonaEditorModal;
