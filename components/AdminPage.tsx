import React, { useState, useEffect } from 'react';
import { Button, Input } from './ui';
import { TrashIcon, PencilIcon, PlusIcon } from './icons';
import sampleAIServices from '../sampleAIServices';
import { saveAIService, deleteAIService, saveAIModel, deleteAIModel, loadAIServices } from '../services/airtableService';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
}

interface AIService {
  id: string;
  name: string;
  description: string;
  models: AIModel[];
}

// Define our own simple types instead of using Pick
interface NewService {
  name: string;
  description: string;
  models: AIModel[];
}

interface NewModel {
  name: string;
  provider: string;
  capabilities: string[];
}

const AdminPage: React.FC = () => {
  const [services, setServices] = useState<AIService[]>([]);
  const [editingService, setEditingService] = useState<AIService | null>(null);
  const [newService, setNewService] = useState<NewService>({ 
    name: '', 
    description: '', 
    models: [] 
  });
  
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [newModel, setNewModel] = useState<NewModel>({ 
    name: '', 
    provider: '', 
    capabilities: [] 
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Airtable on component mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const loadedServices = await loadAIServices();
        setServices(loadedServices);
      } catch (err) {
        setError('Failed to load AI services: ' + (err instanceof Error ? err.message : 'Unknown error'));
        console.error('Error loading AI services:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadServices();
  }, []);

  const handleAddService = async () => {
    if (!newService.name.trim()) return;
    
    try {
      const service: Omit<AIService, 'models'> = {
        id: Date.now().toString(),
        name: newService.name,
        description: newService.description,
      };
      
      await saveAIService(service);
      setServices([...services, { ...service, models: [] }]);
      setNewService({ name: '', description: '', models: [] });
    } catch (err) {
      setError('Failed to add AI service');
      console.error('Error adding AI service:', err);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    
    try {
      await saveAIService(editingService);
      setServices(services.map(s => s.id === editingService.id ? editingService : s));
      setEditingService(null);
    } catch (err) {
      setError('Failed to update AI service');
      console.error('Error updating AI service:', err);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteAIService(id);
      setServices(services.filter(s => s.id !== id));
    } catch (err) {
      setError('Failed to delete AI service');
      console.error('Error deleting AI service:', err);
    }
  };

  const handleAddModel = async (serviceId: string) => {
    if (!newModel.name.trim()) return;
    
    try {
      const model: AIModel = {
        id: Date.now().toString(),
        name: newModel.name,
        provider: newModel.provider,
        capabilities: newModel.capabilities,
      };
      
      await saveAIModel(model, serviceId);
      
      setServices(services.map(service => {
        if (service.id === serviceId) {
          return {
            ...service,
            models: [...service.models, model]
          };
        }
        return service;
      }));
      
      setNewModel({ name: '', provider: '', capabilities: [] });
    } catch (err) {
      setError('Failed to add AI model');
      console.error('Error adding AI model:', err);
    }
  };

  const handleUpdateModel = async (serviceId: string) => {
    if (!editingModel) return;
    
    try {
      await saveAIModel(editingModel, serviceId);
      
      setServices(services.map(service => {
        if (service.id === serviceId) {
          return {
            ...service,
            models: service.models.map(m => m.id === editingModel.id ? editingModel : m)
          };
        }
        return service;
      }));
      
      setEditingModel(null);
    } catch (err) {
      setError('Failed to update AI model');
      console.error('Error updating AI model:', err);
    }
  };

  const handleDeleteModel = async (serviceId: string, modelId: string) => {
    try {
      await deleteAIModel(modelId);
      
      setServices(services.map(service => {
        if (service.id === serviceId) {
          return {
            ...service,
            models: service.models.filter(m => m.id !== modelId)
          };
        }
        return service;
      }));
    } catch (err) {
      setError('Failed to delete AI model');
      console.error('Error deleting AI model:', err);
    }
  };

  const handleLoadSampleData = async () => {
    if (services.length > 0 && !window.confirm('This will replace all existing services. Continue?')) {
      return;
    }
    
    try {
      // Save sample services to Airtable
      for (const service of sampleAIServices) {
        await saveAIService(
          { id: service.id, name: service.name, description: service.description }
        );
        
        // Save models for this service
        for (const model of service.models) {
          await saveAIModel(model, service.id);
        }
      }
      
      // Reload services to reflect changes
      const loadedServices = await loadAIServices();
      setServices(loadedServices);
    } catch (err) {
      setError('Failed to load sample data');
      console.error('Error loading sample data:', err);
    }
  };

  const handleLogout = () => {
    // Clear authentication status
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">AI Services Administration</h1>
          <div className="flex gap-2">
            <Button 
              onClick={handleLoadSampleData}
              variant="tertiary"
              className="flex items-center gap-2"
            >
              Load Sample Data
            </Button>
            <Button 
              onClick={handleLogout}
              variant="tertiary"
              className="flex items-center gap-2"
            >
              Logout
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* Add New Service */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New AI Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Service Name"
              value={newService.name}
              onChange={(e) => setNewService({...newService, name: e.target.value})}
            />
            <Input
              placeholder="Description"
              value={newService.description}
              onChange={(e) => setNewService({...newService, description: e.target.value})}
            />
          </div>
          <Button 
            className="mt-4 flex items-center gap-2"
            onClick={handleAddService}
          >
            <PlusIcon className="h-5 w-5" />
            Add Service
          </Button>
        </div>

        {/* Services List */}
        <div className="space-y-6">
          {services.map(service => (
            <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                {editingService?.id === service.id ? (
                  // Edit Service Form
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Edit Service</h2>
                    <Input
                      placeholder="Service Name"
                      value={editingService.name}
                      onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                    />
                    <Input
                      placeholder="Description"
                      value={editingService.description}
                      onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateService}>Save</Button>
                      <Button variant="tertiary" onClick={() => setEditingService(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  // Service Display
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{service.name}</h2>
                      <p className="text-gray-600 mt-1">{service.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="tertiary" 
                        onClick={() => setEditingService(service)}
                        className="flex items-center gap-1"
                      >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="tertiary" 
                        onClick={() => handleDeleteService(service.id)}
                        className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Models Section */}
              <div className="border-t border-gray-200 p-6">
                <h3 className="text-lg font-medium mb-4">Models</h3>
                
                {/* Add New Model */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-3">Add New Model</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Model Name"
                      value={newModel.name}
                      onChange={(e) => setNewModel({...newModel, name: e.target.value})}
                    />
                    <Input
                      placeholder="Provider"
                      value={newModel.provider}
                      onChange={(e) => setNewModel({...newModel, provider: e.target.value})}
                    />
                    <Input
                      placeholder="Capabilities (comma separated)"
                      value={newModel.capabilities.join(', ')}
                      onChange={(e) => setNewModel({
                        ...newModel, 
                        capabilities: e.target.value
                          .split(',')
                          .map(c => c.trim())
                          .filter(c => c)
                          .filter(c => ['text', 'image', 'audio', 'video', 'code'].includes(c))
                      })}
                    />
                  </div>
                  <Button 
                    className="mt-3 flex items-center gap-2"
                    onClick={() => handleAddModel(service.id)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Model
                  </Button>
                </div>
                
                {/* Models List */}
                {service.models.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capabilities</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {service.models.map(model => (
                          <tr key={model.id}>
                            {editingModel?.id === model.id ? (
                              // Edit Model Row
                              <td colSpan={4} className="px-6 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <Input
                                    placeholder="Model Name"
                                    value={editingModel.name}
                                    onChange={(e) => setEditingModel({...editingModel, name: e.target.value})}
                                  />
                                  <Input
                                    placeholder="Provider"
                                    value={editingModel.provider}
                                    onChange={(e) => setEditingModel({...editingModel, provider: e.target.value})}
                                  />
                                  <Input
                                    placeholder="Capabilities"
                                    value={editingModel.capabilities.join(', ')}
                                    onChange={(e) => setEditingModel({
                                      ...editingModel, 
                                      capabilities: e.target.value
                                        .split(',')
                                        .map(c => c.trim())
                                        .filter(c => c)
                                        .filter(c => ['text', 'image', 'audio', 'video', 'code'].includes(c))
                                    })}
                                  />
                                  <div className="flex gap-2">
                                    <Button onClick={() => handleUpdateModel(service.id)}>Save</Button>
                                    <Button variant="tertiary" onClick={() => setEditingModel(null)}>Cancel</Button>
                                  </div>
                                </div>
                              </td>
                            ) : (
                              // Display Model Row
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.provider}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                  {model.capabilities.join(', ')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="tertiary" 
                                      onClick={() => setEditingModel(model)}
                                      className="flex items-center gap-1"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="tertiary" 
                                      onClick={() => handleDeleteModel(service.id, model.id)}
                                      className="flex items-center gap-1 text-red-600 hover:bg-red-50"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No models added for this service yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {services.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No AI services configured yet. Add your first service above.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;