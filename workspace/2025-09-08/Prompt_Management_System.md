# Prompt Management System in SocialSync Pro

## Overview

The Prompt Management System in SocialSync Pro is a sophisticated feature that allows administrators and users to customize the AI prompts used throughout the application. This system enables fine-grained control over how the AI generates content, allowing for brand-specific customization while maintaining a structured hierarchy of settings.

## Current Implementation

### Architecture

The system follows a hierarchical approach:

1. **Global Admin Defaults**: Stored in the `adminSettings` collection in MongoDB
2. **Brand-Specific Overrides**: Stored in each brand's document in the `brands` collection
3. **Runtime Resolution**: The application loads brand-specific settings, falling back to global defaults when no override exists

### Data Structure

The prompt configuration is organized in a nested structure within the `Settings` type:

```typescript
interface Settings {
  prompts: {
    autoGeneratePersona: {
      systemInstruction: string;
      mainPrompt: string;
    };
    generateInCharacterPost: {
      rolePlayInstruction: string;
      // ... other fields
    };
    mediaPlanGeneration: {
      systemInstruction: string;
      // ... other fields
    };
    simple: {
      refinePost: string;
      generateBrandProfile: string;
      // ... other simple prompts
    };
    contentPackage: {
      taskInstruction: string;
      pillarContentInstruction: string;
      repurposedContentInstruction: string;
      mediaPromptInstruction: string;
      jsonOutputInstruction: string;
    };
  };
}
```

### Variable Substitution

When prompts are loaded from the database, they still contain placeholders like `{variableName}`. The service layer (specifically `geminiService.ts`) is responsible for substituting these placeholders with actual values using `.replace()` calls before sending the prompts to the AI API.

For example, in the `generateContentPackage` function:

```typescript
const combinedPrompt = [
  personaInstruction,
  productInstruction,
  customizationInstruction,
  p.taskInstruction.replace('{sanitizedIdeaTitle}', sanitizedIdeaTitle),
  p.pillarContentInstruction
    .replace(/{pillarPlatform}/g, pillarPlatform)
    .replace('{idea.targetAudience}', idea.targetAudience || 'N/A'),
  // ... other replacements
].join('\n\n');
```

### UI Components

The system includes dedicated UI components for managing prompts:

1. **AdminPage.tsx**: Provides global prompt management in the admin panel
2. **SettingsModal.tsx**: Allows brand-specific prompt customization
3. **PromptManager.tsx**: The core component that renders editable text areas for each prompt

## Current Features

### Hierarchical Settings Management

- Administrators can define global default prompts
- Users can override specific prompts for their brand
- The system clearly shows when a prompt has been customized
- Users can easily reset prompts to global defaults

### Real-time Comparison

The UI shows both the customized prompt and the global default side-by-side, making it easy to see what has been changed.

### Rich Text Editing

The prompt editor provides a spacious textarea for each prompt, allowing for complex, multi-line prompt templates.

## Known Issues

### Variable Management

The current implementation requires explicit `.replace()` calls in the service layer for each placeholder. If a new variable is added to a prompt template but the service layer isn't updated to substitute it, the placeholder will remain in the prompt sent to the AI.

### Error Handling

There's limited validation to ensure all placeholders in a prompt are properly substituted, which could lead to unexpected behavior if substitutions are missed.

## Future Improvements

### 1. Automated Variable Substitution System

#### Problem
The current approach requires manual maintenance of `.replace()` calls for each placeholder, which is error-prone and doesn't scale well.

#### Solution
Implement a more comprehensive variable substitution system that:

1. Automatically detects placeholders in prompt templates
2. Provides a registry of available variables and their sources
3. Performs substitution automatically without explicit `.replace()` calls

#### Implementation Plan

1. **Variable Registry**: Create a centralized registry that maps variable names to their data sources:
   ```typescript
interface VariableRegistry {
     'persona.nickName': (context) => context.persona?.nickName,
     'brand.name': (context) => context.brand?.name,
     // ... other variables
   }
   ```

2. **Template Parser**: Implement a parser that can identify placeholders in templates:
   ```typescript
function extractPlaceholders(template: string): string[] {
     const regex = /\\{([^}]+)\\}/g;
     const matches = [];
     let match;
     while ((match = regex.exec(template)) !== null) {
       matches.push(match[1]);
     }
     return matches;
   }
   ```

3. **Automatic Substitution**: Create a function that automatically substitutes all placeholders:
   ```typescript
function substituteVariables(template: string, context: any): string {
     const placeholders = extractPlaceholders(template);
     let result = template;
     
     for (const placeholder of placeholders) {
       const resolver = VariableRegistry[placeholder];
       if (resolver) {
         const value = resolver(context) || 'N/A';
         result = result.replace(new RegExp(`\\\\{${placeholder}\\\\}`, 'g'), value);
       }
     }
     
     return result;
   }
   ```

### 2. Enhanced Validation and Error Handling

#### Problem
Currently, there's limited validation to ensure all placeholders are properly substituted.

#### Solution
Implement comprehensive validation that:

1. Checks that all placeholders in a prompt are available in the context
2. Warns about unused context variables
3. Provides detailed error messages when substitution fails

#### Implementation Plan

1. **Pre-substitution Validation**:
   ```typescript
function validatePrompt(template: string, context: any): ValidationResult {
     const placeholders = extractPlaceholders(template);
     const missing = [];
     
     for (const placeholder of placeholders) {
       if (!VariableRegistry[placeholder]) {
         missing.push(placeholder);
       }
     }
     
     return {
       isValid: missing.length === 0,
       missingVariables: missing,
       message: missing.length > 0 
         ? `Missing variables: ${missing.join(', ')}` 
         : 'All variables accounted for'
     };
   }
   ```

2. **Post-substitution Validation**:
   ```typescript
function checkForUnsubstitutedPlaceholders(result: string): boolean {
     return /\\{[^}]+\\}/.test(result);
   }
   ```

### 3. Prompt Versioning and Migration

#### Problem
As the application evolves, prompt templates may need to change, but existing customizations should be preserved.

#### Solution
Implement a versioning system for prompts that:

1. Tracks changes to default prompt templates
2. Automatically migrates custom prompts when templates change
3. Provides clear upgrade paths for users

#### Implementation Plan

1. **Version Tracking**:
   ```typescript
interface PromptTemplate {
     content: string;
     version: string;
     lastModified: Date;
     changelog: string[];
   }
   ```

2. **Migration System**:
   ```typescript
interface PromptMigration {
     fromVersion: string;
     toVersion: string;
     migrate: (template: string) => string;
   }
   ```

### 4. Prompt Testing and Preview

#### Problem
Users cannot easily test how their prompt changes will affect AI output.

#### Solution
Add a prompt testing interface that:

1. Allows users to preview prompt substitutions
2. Provides a test execution environment
3. Shows sample AI output based on the prompt

#### Implementation Plan

1. **Preview Interface**:
   - Show substituted prompt with sample data
   - Highlight variables and their values
   - Display a warning for unsubstituted placeholders

2. **Test Execution**:
   - Allow execution against a test AI model
   - Show sample output
   - Provide comparison with previous versions

### 5. Collaborative Prompt Development

#### Problem
Teams working on the same brand may want to collaborate on prompt development.

#### Solution
Implement collaborative features that:

1. Track prompt change history
2. Allow multiple users to work on prompts simultaneously
3. Provide merge conflict resolution

#### Implementation Plan

1. **Change Tracking**:
   ```typescript
interface PromptChange {
     userId: string;
     timestamp: Date;
     oldValue: string;
     newValue: string;
     comment?: string;
   }
   ```

2. **Collaboration Features**:
   - Locking mechanism to prevent conflicts
   - Real-time collaboration with operational transforms
   - Merge conflict resolution UI

### 6. Prompt Performance Analytics

#### Problem
Users cannot easily determine which prompts are most effective.

#### Solution
Add analytics to track:

1. Prompt usage frequency
2. AI response quality metrics
3. User satisfaction scores

#### Implementation Plan

1. **Metrics Collection**:
   ```typescript
interface PromptAnalytics {
     promptId: string;
     executionCount: number;
     averageResponseTime: number;
     userRatings: number[];
     lastUsed: Date;
   }
   ```

2. **Dashboard**:
   - Prompt effectiveness ranking
   - Usage trends over time
   - Comparative analysis

### 7. Prompt Template Marketplace

#### Problem
Users may want to share or discover effective prompt templates.

#### Solution
Create a marketplace for:

1. Sharing prompt templates
2. Discovering community-contributed templates
3. Rating and reviewing templates

#### Implementation Plan

1. **Template Metadata**:
   ```typescript
interface PromptTemplate {
     id: string;
     name: string;
     description: string;
     category: string;
     author: string;
     rating: number;
     downloadCount: number;
     template: string;
     variables: string[];
   }
   ```

2. **Marketplace Features**:
   - Search and filtering
   - Ratings and reviews
   - Easy import/export

## Implementation Roadmap

### Phase 1: Automated Variable Substitution (Q1 2026)
1. Implement variable registry
2. Create template parser
3. Build automatic substitution system
4. Update service layer to use new system

### Phase 2: Enhanced Validation (Q2 2026)
1. Add pre-substitution validation
2. Implement post-substitution checks
3. Create detailed error reporting

### Phase 3: Prompt Testing (Q3 2026)
1. Build preview interface
2. Add test execution capabilities
3. Implement change tracking

### Phase 4: Advanced Features (Q4 2026+)
1. Add versioning and migration
2. Implement collaborative features
3. Create analytics dashboard
4. Launch template marketplace

## Benefits of Improvements

1. **Reduced Maintenance**: Automatic variable substitution eliminates the need for manual `.replace()` calls
2. **Improved Reliability**: Enhanced validation prevents errors from unsubstituted placeholders
3. **Better User Experience**: Testing features allow users to preview changes before applying them
4. **Scalability**: Versioning and migration support long-term prompt evolution
5. **Collaboration**: Team features enable多人协作 on prompt development
6. **Performance Insights**: Analytics help identify the most effective prompts
7. **Community Engagement**: Marketplace encourages sharing and discovery of best practices

## Conclusion

The current Prompt Management System in SocialSync Pro provides a solid foundation for customizing AI behavior. The proposed improvements will enhance its reliability, usability, and scalability while maintaining the flexibility that makes it valuable to users. By implementing these enhancements in phases, we can deliver value incrementally while building toward a comprehensive prompt management solution.