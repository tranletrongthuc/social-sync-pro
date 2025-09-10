import React, { useState, useEffect } from 'react';
import { Button, Input } from './ui';
import { TrashIcon, PencilIcon, PlusIcon, ChevronLeftIcon } from './icons';
import sampleAIServices from '../sampleAIServices';
import { saveAIModelToDatabase as saveAIModel, deleteAIModelFromDatabase as deleteAIModel, loadSettingsDataFromDatabase as loadSettingsData, saveAdminDefaultsToDatabase } from '../services/databaseService';
import type { Settings, AIService, AIModel } from '../../types';
import PromptManager from './PromptManager';

// Define a simplified model type for the form state
type EditableAIModel = Omit<AIModel, 'id'> & { id?: string };

interface AdminPageProps {
  onLogout?: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onLogout }) => {
  const [services, setServices] = useState<AIService[]>([]);
  const [editingModel, setEditingModel] = useState<EditableAIModel | null>(null);
  const [newModel, setNewModel] = useState<EditableAIModel>({ 
    name: '', 
    provider: '', 
    capabilities: [],
    service: ''
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [appSettings, setAppSettings] = useState<Settings | null>(null);
  const [activeTab, setActiveTab] = useState('settings');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { services: loadedServices, adminSettings } = await loadSettingsData();
      setServices(loadedServices);
      setAppSettings(adminSettings);
    } catch (err) {
      setError('Failed to load admin configuration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddModel = async () => {
    if (!newModel.name.trim() || !newModel.service.trim()) return;
    
    try {
      await saveAIModel(newModel as AIModel);
      setNewModel({ name: '', provider: '', capabilities: [], service: '' });
      setSuccessMessage(`Model "${newModel.name}" added successfully.`);
      fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to add AI model');
      console.error('Error adding AI model:', err);
    }
  };

  const handleUpdateModel = async () => {
    if (!editingModel) return;
    
    try {
      await saveAIModel(editingModel as AIModel);
      setEditingModel(null);
      setSuccessMessage(`Model "${editingModel.name}" updated successfully.`);
      fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to update AI model');
      console.error('Error updating AI model:', err);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!window.confirm('Are you sure you want to delete this model?')) return;
    try {
      await deleteAIModel(modelId);
      setSuccessMessage('Model deleted successfully.');
      fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to delete AI model');
      console.error('Error deleting AI model:', err);
    }
  };

  const handleLoadSampleData = async () => {
    if (!window.confirm('This will replace all existing models with the sample data. Continue?')) {
      return;
    }
    
    try {
      const sampleModels = sampleAIServices.flatMap(service => 
        service.models.map(model => ({...model, service: service.name}))
      );

      for (const model of sampleModels) {
        await saveAIModel(model as AIModel);
      }
      
      setSuccessMessage('Sample models loaded successfully.');
      fetchData(); // Refresh data
    } catch (err) {
      setError('Failed to load sample data');
      console.error('Error loading sample data:', err);
    }
  };

  const handleSaveAppSettings = async (settingsToSave: Settings | null) => {
    if (!settingsToSave) return;
    try {
      await saveAdminDefaultsToDatabase(settingsToSave);
      setSuccessMessage('Application settings saved successfully!');
      setError(null);
    } catch (err) {
      const errorMessage = 'Failed to save application settings: ' + (err instanceof Error ? err.message : 'Unknown error');
      setError(errorMessage);
      setSuccessMessage(null);
      console.error(errorMessage, err);
    }
  };

  const handleSavePrompts = async (newSettings: Settings) => {
    setIsSaving(true);
    await handleSaveAppSettings(newSettings);
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Admin Configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              onClick={handleLoadSampleData}
              variant="tertiary"
              className="flex items-center gap-2"
            >
              Load Sample Data
            </Button>
                      {onLogout && (
            <Button 
              onClick={onLogout}
              variant="tertiary"
              className="flex items-center gap-2"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Logout
            </Button>
          )}
          </div>
        </div>
        
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
        {successMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{successMessage}</div>}
        
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('settings')}
              className={`${ 
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Global Settings
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`${ 
                activeTab === 'models'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              AI Models
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`${ 
                activeTab === 'prompts'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Prompt Management
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'settings' && appSettings && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Global Application Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Language</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={appSettings.language} 
                    onChange={(e) => setAppSettings({...appSettings, language: e.target.value})}
                  >
                    <option value="English">English</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Total Posts Per Month</label>
                  <Input 
                    type="number"
                    value={appSettings.totalPostsPerMonth} 
                    onChange={(e) => setAppSettings({...appSettings, totalPostsPerMonth: parseInt(e.target.value) || 30})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Media Prompt Suffix</label>
                  <Input 
                    value={appSettings.mediaPromptSuffix} 
                    onChange={(e) => setAppSettings({...appSettings, mediaPromptSuffix: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate Content Kit</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    rows={4}
                    value={appSettings.affiliateContentKit}
                    onChange={(e) => setAppSettings({...appSettings, affiliateContentKit: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Text Generation Model</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={appSettings.textGenerationModel} 
                    onChange={(e) => setAppSettings({...appSettings, textGenerationModel: e.target.value})}
                  >
                    {/* Extract text-capable models from services */}
                    {services.flatMap(service => 
                      service.models
                        .filter(model => model.capabilities.includes('text'))
                        .map(model => (
                          <option key={`${service.name}-${model.name}`} value={model.name}>
                            {service.name} - {model.name}
                          </option>
                        ))
                    )}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Image Generation Model</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={appSettings.imageGenerationModel} 
                    onChange={(e) => setAppSettings({...appSettings, imageGenerationModel: e.target.value})}
                  >
                    {/* Extract image-capable models from services */}
                    {services.flatMap(service => 
                      service.models
                        .filter(model => model.capabilities.includes('image'))
                        .map(model => (
                          <option key={`${service.name}-${model.name}`} value={model.name}>
                            {service.name} - {model.name}
                          </option>
                        ))
                    )}
                  </select>
                </div>
              </div>
              <Button className="mt-4" onClick={() => handleSaveAppSettings(appSettings)}>Save Global Settings</Button>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Manage AI Models</h2>
                {/* Simplified Add/Edit Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-medium mb-3">{editingModel ? 'Edit Model' : 'Add New Model'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <Input placeholder="Service (e.g. Google)" value={editingModel?.service || newModel.service} onChange={(e) => editingModel ? setEditingModel({...editingModel, service: e.target.value}) : setNewModel({...newModel, service: e.target.value})} />
                        <Input placeholder="Model Name" value={editingModel?.name || newModel.name} onChange={(e) => editingModel ? setEditingModel({...editingModel, name: e.target.value}) : setNewModel({...newModel, name: e.target.value})} />
                        <Input placeholder="Provider" value={editingModel?.provider || newModel.provider} onChange={(e) => editingModel ? setEditingModel({...editingModel, provider: e.target.value}) : setNewModel({...newModel, provider: e.target.value})} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capabilities</label>
                            <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white">
                                {(['text', 'image', 'vision'] as const).map(cap => (
                                    <label key={cap} className="inline-flex items-center"><input type="checkbox" className="rounded" checked={(editingModel?.capabilities || newModel.capabilities).includes(cap)} onChange={(e) => {
                                        const currentCaps = editingModel?.capabilities || newModel.capabilities;
                                        const newCaps = e.target.checked ? [...currentCaps, cap] : currentCaps.filter(c => c !== cap);
                                        editingModel ? setEditingModel({...editingModel, capabilities: newCaps}) : setNewModel({...newModel, capabilities: newCaps});
                                    }} /><span className="ml-1 text-sm">{cap}</span></label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <Button onClick={editingModel ? handleUpdateModel : handleAddModel}>{editingModel ? 'Update Model' : 'Add Model'}</Button>
                        {editingModel && <Button variant="tertiary" onClick={() => setEditingModel(null)}>Cancel</Button>}
                    </div>
                </div>

                {/* Models List Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capabilities</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {services.flatMap(s => s.models).map(model => (
                                <tr key={model.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{services.find(s => s.models.some(m => m.id === model.id))?.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.provider}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{(Array.isArray(model.capabilities) ? model.capabilities : []).join(', ')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <Button variant="tertiary" onClick={() => setEditingModel(model)}><PencilIcon className="h-4 w-4" /></Button>
                                            <Button variant="tertiary" onClick={() => handleDeleteModel(model.id)}><TrashIcon className="h-4 w-4 text-red-600" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {activeTab === 'prompts' && appSettings && (
            <PromptManager 
              settings={appSettings}
              adminSettings={appSettings}
              onSave={handleSavePrompts}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;