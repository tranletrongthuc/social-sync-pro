import React, { useState, useEffect } from 'react';
import { Settings, Prompts } from '../../types';

interface PromptManagerProps {
  settings: Settings;
  adminSettings: Settings | null;
  onSave: (settings: Settings) => void;
  isSaving: boolean;
}

const PromptManager: React.FC<PromptManagerProps> = ({ settings, adminSettings, onSave, isSaving }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [activeCategory, setActiveCategory] = useState<string>('simple');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handlePromptChange = (category: keyof Prompts, key: string, value: string) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev };
      if (!newSettings.prompts) {
        (newSettings.prompts as any) = {};
      }
      if (!newSettings.prompts[category]) {
        (newSettings.prompts[category] as any) = {};
      }
      (newSettings.prompts[category] as any)[key] = value;
      return newSettings;
    });
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  const handleResetToDefault = (category: keyof Prompts, key: string) => {
    if (adminSettings?.prompts?.[category]?.[key]) {
      handlePromptChange(category, key, adminSettings.prompts[category][key]);
    }
  };

  if (!localSettings || !localSettings.prompts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600">Loading prompts...</p>
        </div>
      </div>
    );
  }

  // Get categories and filter based on search term
  const categories = Object.keys(localSettings.prompts);
  const filteredCategories = categories.filter(category => 
    category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    Object.keys(localSettings.prompts[category as keyof Prompts]).some(key => 
      key.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // If we have a search term and no matches, show a message
  if (searchTerm && filteredCategories.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="inline-block w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
          <p className="text-gray-500">Try adjusting your search term</p>
          <button 
            onClick={() => setSearchTerm('')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Clear search
          </button>
        </div>
      </div>
    );
  }

  // Ensure active category is valid
  const validActiveCategory = filteredCategories.includes(activeCategory) ? activeCategory : (filteredCategories[0] || 'simple');

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Prompt Configuration</h2>
            <p className="mt-1 text-gray-600">Customize AI prompts for different features</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save All Prompts'}
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="mt-6">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 py-2 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {/* Sidebar - Categories */}
        <div className="md:w-64 border-r border-gray-200 bg-gray-50">
          <nav className="flex flex-col h-full">
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prompt Categories</h3>
              <ul className="mt-2 space-y-1">
                {filteredCategories.map(category => (
                  <li key={category}>
                    <button
                      onClick={() => setActiveCategory(category)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                        validActiveCategory === category
                          ? 'bg-indigo-100 text-indigo-800 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        {/* Main Content - Prompts */}
        <div className="flex-1">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 capitalize">
                {validActiveCategory.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure prompts for {validActiveCategory.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}
              </p>
            </div>

            <div className="space-y-8">
              {Object.keys(localSettings.prompts[validActiveCategory as keyof Prompts])
                .filter(key => 
                  searchTerm === '' || 
                  key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (localSettings.prompts[validActiveCategory as keyof Prompts] as any)[key].toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(key => (
                <div key={key} className="border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <button
                        onClick={() => handleResetToDefault(validActiveCategory as keyof Prompts, key)}
                        className="text-xs text-indigo-600 hover:text-indigo-900 flex items-center"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Reset to default
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <textarea
                      className="w-full p-3 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono"
                      rows={8}
                      value={(localSettings.prompts[validActiveCategory as keyof Prompts] as any)[key]}
                      onChange={(e) => handlePromptChange(validActiveCategory as keyof Prompts, key, e.target.value)}
                      placeholder="Enter prompt template..."
                    />
                    {adminSettings && (
                      <div className="mt-3">
                        <details className="text-xs">
                          <summary className="text-indigo-600 cursor-pointer hover:text-indigo-800">
                            View default prompt
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-100 rounded-md text-gray-700 whitespace-pre-wrap break-words text-xs overflow-auto max-h-40">
                            {(adminSettings.prompts[validActiveCategory as keyof Prompts] as any)?.[key] || 'No default available'}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(localSettings.prompts[validActiveCategory as keyof Prompts]).filter(key => 
              searchTerm === '' || 
              key.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (localSettings.prompts[validActiveCategory as keyof Prompts] as any)[key].toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="inline-block w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
                <p className="text-gray-500">No prompts match your search in this category</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Customize AI prompts to match your brand voice and requirements
          </p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 text-sm flex items-center"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save All Prompts'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptManager;