import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from './AdminPage';

// Mock the icons
jest.mock('./icons', () => ({
  TrashIcon: () => <div data-testid="trash-icon" />,
  PencilIcon: () => <div data-testid="pencil-icon" />,
  PlusIcon: () => <div data-testid="plus-icon" />
}));

// Mock the UI components
jest.mock('./ui', () => ({
  Button: ({ children, onClick, className, variant }: any) => (
    <button 
      onClick={onClick} 
      className={className} 
      data-variant={variant}
      data-testid="button"
    >
      {children}
    </button>
  ),
  Input: ({ placeholder, value, onChange }: any) => (
    <input 
      placeholder={placeholder} 
      value={value} 
      onChange={onChange} 
      data-testid="input"
    />
  )
}));

describe('AdminPage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('renders admin page with title', () => {
    render(<AdminPage />);
    
    expect(screen.getByText('AI Services Administration')).toBeInTheDocument();
    expect(screen.getByText('Add New AI Service')).toBeInTheDocument();
  });

  test('adds a new service', () => {
    render(<AdminPage />);
    
    // Fill in service form
    const inputs = screen.getAllByTestId('input');
    fireEvent.change(inputs[0], { target: { value: 'Test Service' } });
    fireEvent.change(inputs[1], { target: { value: 'A test service' } });
    
    // Click add button
    const addButton = screen.getByText('Add Service');
    fireEvent.click(addButton);
    
    // Check if service appears
    expect(screen.getByText('Test Service')).toBeInTheDocument();
    expect(screen.getByText('A test service')).toBeInTheDocument();
  });

  test('adds a model to a service', () => {
    render(<AdminPage />);
    
    // Add a service first
    const inputs = screen.getAllByTestId('input');
    fireEvent.change(inputs[0], { target: { value: 'Test Service' } });
    fireEvent.change(inputs[1], { target: { value: 'A test service' } });
    
    const addButton = screen.getByText('Add Service');
    fireEvent.click(addButton);
    
    // Fill in model form
    const modelInputs = screen.getAllByTestId('input');
    fireEvent.change(modelInputs[2], { target: { value: 'Test Model' } });
    fireEvent.change(modelInputs[3], { target: { value: 'Test Provider' } });
    fireEvent.change(modelInputs[4], { target: { value: 'text, image' } });
    
    // Click add model button
    const addModelButton = screen.getByText('Add Model');
    fireEvent.click(addModelButton);
    
    // Check if model appears
    expect(screen.getByText('Test Model')).toBeInTheDocument();
    expect(screen.getByText('Test Provider')).toBeInTheDocument();
    expect(screen.getByText('text, image')).toBeInTheDocument();
  });

  test('loads sample data', () => {
    render(<AdminPage />);
    
    // Click load sample data button
    const loadSampleButton = screen.getByText('Load Sample Data');
    fireEvent.click(loadSampleButton);
    
    // Check if sample services are loaded
    expect(screen.getByText('Google AI')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
  });
});