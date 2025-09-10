import React, { useState, useEffect } from 'react';
import type { Persona } from '../../types';
import { Button, Checkbox } from './ui';

interface AutoPersonaResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (personas: Partial<Persona>[]) => void;
  personaData: Partial<Persona>[] | null;
  language: string;
}

const AutoPersonaResultModal: React.FC<AutoPersonaResultModalProps> = ({ isOpen, onClose, onSave, personaData, language }) => {
  const [selectedPersonas, setSelectedPersonas] = useState<(Partial<Persona> & { tempId: string })[]>([]);
  const [personasWithIds, setPersonasWithIds] = useState<(Partial<Persona> & { tempId: string })[]>([]);

  useEffect(() => {
    if (personaData) {
      // Assign a temporary client-side ID for selection handling
      const personasWithId = personaData.map(p => ({ ...p, tempId: crypto.randomUUID() }));
      setPersonasWithIds(personasWithId);
      setSelectedPersonas([]);
    }
  }, [personaData]);

  if (!isOpen || !personaData) return null;

  const handleToggleSelection = (personaToToggle: Partial<Persona> & { tempId: string }) => {
    setSelectedPersonas(prev =>
      prev.some(p => p.tempId === personaToToggle.tempId)
        ? prev.filter(p => p.tempId !== personaToToggle.tempId)
        : [...prev, personaToToggle]
    );
  };

  const handleSave = () => {
    onSave(selectedPersonas);
  };

  const T = {
    'Việt Nam': {
      title: "AI đã tạo các Persona sau",
      subtitle: "Chọn những persona bạn muốn lưu vào dự án của mình.",
      save: "Lưu các Persona đã chọn",
      cancel: "Hủy",
      backstory: "Câu chuyện nền",
      personality: "Tính cách & Giọng nói",
    },
    'English': {
      title: "AI Generated Personas",
      subtitle: "Select the personas you want to save to your project.",
      save: "Save Selected Personas",
      cancel: "Cancel",
      backstory: "Backstory",
      personality: "Personality & Voice",
    }
  };
  const texts = T[language as keyof typeof T] || T['English'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <h2 className="text-2xl font-bold mb-1">{texts.title}</h2>
        <p className="text-gray-500 mb-4">{texts.subtitle}</p>
        <div className="overflow-y-auto flex-grow pr-2 space-y-4">
          {personasWithIds.map((persona, index) => (
            <GeneratedPersonaCard
              key={persona.tempId}
              persona={persona}
              isSelected={selectedPersonas.some(p => p.tempId === persona.tempId)}
              onToggleSelection={handleToggleSelection}
              texts={texts}
            />
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-4 pt-4 border-t border-gray-200">
          <Button variant="tertiary" onClick={onClose}>{texts.cancel}</Button>
          <Button onClick={handleSave} disabled={selectedPersonas.length === 0}>{texts.save} ({selectedPersonas.length})</Button>
        </div>
      </div>
    </div>
  );
};

const GeneratedPersonaCard: React.FC<{ 
  persona: Partial<Persona> & { tempId: string }; 
  isSelected: boolean; 
  onToggleSelection: (p: Partial<Persona> & { tempId: string }) => void;
  texts: any;
}> = ({ persona, isSelected, onToggleSelection, texts }) => {
  return (
    <div className={`border rounded-lg p-4 transition-all ${isSelected ? 'border-brand-green bg-green-50/50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start gap-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(persona)}
          id={`persona-checkbox-${persona.tempId}`}
          className="mt-1"
        />
        <div className="flex-grow">
          <label htmlFor={`persona-checkbox-${persona.tempId}`} className="cursor-pointer">
            <h3 className="font-bold text-lg text-gray-900">{persona.nickName}</h3>
            <p className="text-sm text-gray-600">{`${persona.demographics?.age}, ${persona.demographics?.occupation}`}</p>
          </label>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <InfoSection title={texts.backstory} content={<p>{persona.backstory}</p>} />
            <InfoSection title={texts.personality} content={<ul className="list-disc list-inside text-xs">{(persona.voice?.personalityTraits || []).map((c, i) => <li key={i}>{c}</li>)}</ul>} />
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoSection: React.FC<{ title: string; content: React.ReactNode }> = ({ title, content }) => {
  if (!content) return null;
  return (
    <div>
      <h4 className="font-semibold text-gray-700">{title}</h4>
      <div className="mt-1 text-gray-600 font-serif text-xs">{content}</div>
    </div>
  );
};

export default AutoPersonaResultModal;