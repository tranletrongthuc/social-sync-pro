# Model Tracking Implementation Plan

## Overview
This document details the implementation of model tracking across the SocialSync Pro application. The goal is to track which AI model generated each piece of content and display this information clearly in the UI.

## Current State
- Content is generated without tracking the model that created it
- Users have no visibility into which model produced specific content
- No database fields exist to store model information

## Target State
- Each generated piece of content stores the model name that created it
- Model information is displayed as clear labels on all content components
- All generated content types (media plans, personas, viral ideas, etc.) support model tracking

## Implementation Plan

### Phase 1: Database Schema Updates
1. Add model tracking fields to existing database collections
2. Handle backward compatibility for existing content

### Phase 2: Backend Service Modifications
1. Update generation services to capture model info during creation
2. Modify prompt builders, response processors, and AI service calls
3. Ensure model info is stored with generated content

### Phase 3: Frontend Component Updates
1. Modify components to display model labels
2. Update types to include model information
3. Ensure UI displays are clear and consistent

### Phase 4: Testing
1. Verify model tracking works for all content types
2. Test backward compatibility with existing content
3. Ensure no performance regressions

## Technical Details

### Database Schema Changes

#### Media Plan Posts Collection
Add `modelUsed` field to each `MediaPlanPost` document:
```json
{
  "id": "string",
  "brandId": "string",
  "content": "string",
  "contentType": "string",
  "mediaPrompt": "array|string",
  "imageUrls": "string",
  "modelUsed": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Media Plan Groups Collection
Add `modelUsed` field to media plan group documents:
```json
{
  "id": "string",
  "brandId": "string",
  "groupName": "string",
  "posts": "array of MediaPlanPost references",
  "modelUsed": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Personas Collection
Add `modelUsed` field to each `Persona` document:
```json
{
  "id": "string",
  "brandId": "string",
  "name": "string",
  "description": "string",
  "characteristics": "object",
  "modelUsed": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### Strategy Hub (Trends and Ideas) Collection
Add `modelUsed` field to trend documents:
```json
{
  "id": "string",
  "brandId": "string",
  "topic": "string",
  "description": "string",
  "tags": "array",
  "modelUsed": "string",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### TypeScript Interface Updates

#### In types.ts
```typescript
interface MediaPlanPost {
  id: string;
  brandId: string;
  content: string;
  contentType: string;
  mediaPrompt: string | string[];
  imageUrls: string;
  imageKeys: string[]; // for carousel posts
  imageUrlsArray: string[]; // for carousel posts
  modelUsed?: string; // newly added
  createdAt: Date;
  updatedAt: Date;
}

interface MediaPlanGroup {
  id: string;
  brandId: string;
  groupName: string;
  posts: MediaPlanPost[];
  modelUsed?: string; // newly added
  createdAt: Date;
  updatedAt: Date;
}

interface Persona {
  id: string;
  brandId: string;
  name: string;
  description: string;
  characteristics: PersonaCharacteristics;
  modelUsed?: string; // newly added
  createdAt: Date;
  updatedAt: Date;
}

interface Trend {
  id: string;
  brandId: string;
  topic: string;
  description: string;
  category: string;
  tags: string[];
  source: 'industry' | 'global';
  modelUsed?: string; // newly added
  createdAt: Date;
  updatedAt: Date;
  // existing trend metadata fields...
}
```

### Backend Implementation

#### 1. Update server_lib Generation Services
Modify `server_lib/generationService.js` to capture and return model information:

```javascript
async function generateMediaPlanGroup(brandId, generationOptions) {
  // existing logic...
  
  // Capture the model used
  const modelUsed = generationOptions.model; // or however it's determined
  
  // Generate the content using the model
  const response = await callAIService(prompt, modelUsed);
  
  // Process the response
  const processedContent = processResponse(response);
  
  // Add modelUsed to each generated post
  processedContent.forEach(post => {
    post.modelUsed = modelUsed;
  });
  
  // Save to database with model information
  await saveToDatabase(processedContent, modelUsed);
  
  return {
    posts: processedContent,
    modelUsed: modelUsed
  };
}
```

#### 2. Update MongoDB API
Modify `api/mongodb.js` to handle the new `modelUsed` field in save operations:

```javascript
case 'save-media-plan-group':
  const { mediaPlanGroup, modelUsed } = req.body;
  // Add modelUsed to each post if not already present
  mediaPlanGroup.posts = mediaPlanGroup.posts.map(post => ({
    ...post,
    modelUsed: post.modelUsed || modelUsed
  }));
  // existing save logic...
  break;
```

#### 3. Update Response Processors
Modify `server_lib/responseProcessor.js` to preserve model information:

```javascript
function processMediaPlanResponse(response, modelUsed) {
  // existing processing logic...
  
  // Add modelUsed to each processed post
  const processedPosts = posts.map(post => ({
    ...post,
    modelUsed: modelUsed
  }));
  
  return processedPosts;
}
```

### Frontend Implementation

#### 1. Update Components to Display Model Labels
Create a reusable ModelLabel component:

```tsx
// src/components/ModelLabel.tsx
import React from 'react';

interface ModelLabelProps {
  model: string;
  size?: 'small' | 'medium';
}

const ModelLabel: React.FC<ModelLabelProps> = ({ model, size = 'medium' }) => {
  if (!model) return null;
  
  const displayModel = model.replace(/[:\-_]/g, ' ').toUpperCase();
  
  const sizeClasses = size === 'small' 
    ? 'text-xs px-2 py-1 rounded' 
    : 'text-sm px-3 py-1.5 rounded-md';
  
  return (
    <span className={`inline-block ${sizeClasses} bg-blue-100 text-blue-800 font-medium`}>
      {displayModel}
    </span>
  );
};

export default ModelLabel;
```

#### 2. Update Existing Components
Modify each content display component to show the model label:

In `PostCard.tsx`:
```tsx
import ModelLabel from './ModelLabel';

// In the component render:
<div className="mt-2 flex flex-wrap gap-2">
  {post.modelUsed && <ModelLabel model={post.modelUsed} size="small" />}
  {/* existing content */}
</div>
```

In `PersonaCard.tsx`:
```tsx
import ModelLabel from './ModelLabel';

// In the component render:
<div className="mt-2">
  {persona.modelUsed && <ModelLabel model={persona.modelUsed} />}
  {/* existing content */}
</div>
```

In `TrendListItem.tsx`:
```tsx
import ModelLabel from './ModelLabel';

// In the component render:
<div className="flex items-center gap-2 mt-1">
  {trend.modelUsed && <ModelLabel model={trend.modelUsed} size="small" />}
  {/* existing content */}
</div>
```

## Implementation Sequence

### Step 1: Update Types
1. Modify `types.ts` to include `modelUsed` fields

### Step 2: Update Backend
1. Update `server_lib/generationService.js` to capture model info
2. Update `server_lib/responseProcessor.js` to preserve model info
3. Update `api/mongodb.js` to store model info
4. Update other backend services as needed

### Step 3: Update Frontend Components
1. Create `ModelLabel.tsx` component
2. Update `PostCard.tsx` to display model labels
3. Update `PersonaCard.tsx` to display model labels
4. Update `TrendListItem.tsx` to display model labels
5. Update other content display components

### Step 4: Test Implementation
1. Generate new content and verify model tracking works
2. Verify existing content still displays correctly (backward compatibility)
3. Test across all content generation paths

## Backward Compatibility
- Set modelUsed to "Unknown" or null for existing content
- Make modelUsed field optional in TypeScript interfaces
- Update UI to handle missing model information gracefully