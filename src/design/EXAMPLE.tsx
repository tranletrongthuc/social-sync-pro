// Example demonstrating proper use of the design system
import React from 'react';
import { Button, Card, Label, Sidebar, Form } from '../design';

// This is an example component showing how to use the design system components
// It should serve as a reference for other developers

const DesignSystemExample: React.FC = () => {
  return (
    <div className="flex h-screen">
      {/* Sidebar Example */}
      <Sidebar 
        variant="default"
        header={<h2 className="text-lg font-semibold">Navigation</h2>}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Settings
            </Button>
            <Button variant="danger" size="sm">
              Logout
            </Button>
          </div>
        }
      >
        <nav className="space-y-1">
          <Button variant="ghost" className="w-full justify-start">
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Content
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Analytics
          </Button>
        </nav>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Design System Examples</h1>
            <p className="text-gray-600">
              This page demonstrates the proper use of standardized components.
            </p>
          </div>

          {/* Button Examples */}
          <Card 
            variant="default" 
            className="mb-6"
            header={<h2 className="text-xl font-semibold">Buttons</h2>}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="tertiary">Tertiary Button</Button>
              <Button variant="danger">Danger Button</Button>
              <Button variant="warning">Warning Button</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="primary" size="sm">Small Button</Button>
              <Button variant="primary" size="md">Medium Button</Button>
              <Button variant="primary" size="lg">Large Button</Button>
            </div>
            
            <div className="mt-4">
              <Button variant="primary" fullWidth>
                Full Width Button
              </Button>
            </div>
          </Card>

          {/* Card Examples */}
          <Card 
            variant="default" 
            className="mb-6"
            header={<h2 className="text-xl font-semibold">Cards</h2>}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="default">
                <h3 className="font-semibold mb-2">Default Card</h3>
                <p className="text-gray-600">
                  This is a standard card with default styling.
                </p>
              </Card>
              
              <Card variant="elevated">
                <h3 className="font-semibold mb-2">Elevated Card</h3>
                <p className="text-gray-600">
                  This card has elevation for emphasis.
                </p>
              </Card>
              
              <Card variant="outlined">
                <h3 className="font-semibold mb-2">Outlined Card</h3>
                <p className="text-gray-600">
                  This card uses an outline instead of a background.
                </p>
              </Card>
              
              <Card variant="compact">
                <h3 className="font-semibold mb-1">Compact Card</h3>
                <p className="text-gray-600 text-sm">
                  This card uses compact spacing.
                </p>
              </Card>
            </div>
          </Card>

          {/* Label Examples */}
          <Card 
            variant="default" 
            className="mb-6"
            header={<h2 className="text-xl font-semibold">Labels</h2>}
          >
            <div className="flex flex-wrap gap-2">
              <Label variant="default">Default</Label>
              <Label variant="success">Success</Label>
              <Label variant="warning">Warning</Label>
              <Label variant="error">Error</Label>
              <Label variant="info">Info</Label>
              <Label variant="brand">Brand</Label>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <Label variant="default" size="sm">Small</Label>
              <Label variant="default" size="md">Medium</Label>
              <Label variant="default" size="lg">Large</Label>
            </div>
          </Card>

          {/* Form Example */}
          <Card 
            variant="default"
            header={<h2 className="text-xl font-semibold">Forms</h2>}
          >
            <Form>
              <Form.Group>
                <Form.Field label="Name" required>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="Enter your name"
                  />
                </Form.Field>
                
                <Form.Field label="Email" helperText="We'll never share your email.">
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="Enter your email"
                  />
                </Form.Field>
                
                <div className="flex gap-3">
                  <Button variant="primary">Submit</Button>
                  <Button variant="secondary">Cancel</Button>
                </div>
              </Form.Group>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DesignSystemExample;