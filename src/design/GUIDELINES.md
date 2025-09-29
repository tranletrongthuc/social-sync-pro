# SocialSync Pro Design System Guidelines

## Purpose
This document establishes consistent design patterns and component usage across the SocialSync Pro application to ensure a cohesive user experience.

## Color Palette
All colors should be referenced from the design tokens file:
- Primary brand color: `colors.brandGreen.DEFAULT` (#10B981)
- Secondary brand color: `colors.brandBlue.DEFAULT` (#3B82F6)
- Grays: Use the `colors.gray` scale (50-900)
- Status colors: `colors.status` (success, warning, error, info)

## Typography
Use the typography scale from design tokens:
- Headings: `typography.fontSize.xl` and above
- Body text: `typography.fontSize.base`
- Labels/small text: `typography.fontSize.sm` or `typography.fontSize.xs`

## Spacing
Use the spacing scale from design tokens:
- `spacing.xs` (4px) - Tiny gaps
- `spacing.sm` (8px) - Small gaps
- `spacing.md` (16px) - Default gaps
- `spacing.lg` (24px) - Large gaps
- `spacing.xl` (32px) - Extra large gaps

## Components

### Buttons
**Use Cases:**
- Primary actions (save, create, submit) - Use `variant="primary"`
- Secondary actions (cancel, back) - Use `variant="secondary"`
- Tertiary actions (optional features) - Use `variant="tertiary"`
- Destructive actions (delete) - Use `variant="danger"`

**Sizes:**
- Small (`size="sm"`) - For compact interfaces
- Medium (`size="md"`) - Default size
- Large (`size="lg"`) - For prominent actions

**Best Practices:**
- Always use `loading` prop when performing async operations
- Use `fullWidth` for form submission buttons
- Include icons when they enhance understanding
- Maintain consistent sizing within a view

### Cards
**Variants:**
- Default (`variant="default"`) - Standard content containers
- Elevated (`variant="elevated"`) - For important or highlighted content
- Outlined (`variant="outlined"`) - For subtle sections
- Compact (`variant="compact"`) - For dense information displays

**Best Practices:**
- Use consistent padding (`p-4` for default, `p-3` for compact)
- Include headers for titled content sections
- Add footers for action buttons
- Use hoverable cards for clickable items

### Labels
**Variants:**
- Default (`variant="default"`) - General purpose tags
- Success (`variant="success"`) - Positive status indicators
- Warning (`variant="warning"`) - Cautionary information
- Error (`variant="error"`) - Problem indicators
- Info (`variant="info"`) - Informative tags
- Brand (`variant="brand"`) - Brand-aligned indicators

**Sizes:**
- Small (`size="sm"`) - For tight spaces
- Medium (`size="md"`) - Default size
- Large (`size="lg"`) - For emphasis

### Sidebars
**Variants:**
- Default (`variant="default"`) - Standard sidebar width (320px)
- Compact (`variant="compact"`) - Narrow sidebar (256px)
- Navigation (`variant="navigation"`) - Specialized navigation sidebar

**Best Practices:**
- Include collapsible functionality when appropriate
- Use headers for titled sections
- Add footers for persistent actions
- Maintain consistent width across views

### Scrollable Areas
**Best Practices:**
- Always use the ScrollableArea component for custom scrollable sections
- Hide scrollbars for decorative elements
- Show scrollbars for functional content areas
- Set appropriate max-height constraints
- Use horizontal scrolling when content exceeds width

### Forms
**Structure:**
- Wrap forms in the Form component
- Group related fields in FormGroup
- Use FormField for labeled inputs
- Include error messaging in FormField

**Best Practices:**
- Always associate labels with inputs
- Provide clear error messaging
- Use helper text for guidance
- Mark required fields appropriately

## Layout Consistency

### Spacing Rules
1. Maintain `spacing.md` (16px) between major sections
2. Use `spacing.sm` (8px) between related elements
3. Apply `spacing.lg` (24px) between distinct content blocks

### Alignment
1. Left-align text content for readability
2. Center-align form elements in dialogs
3. Right-align numerical data
4. Maintain consistent vertical rhythm

## Responsive Design

### Breakpoints
- Mobile: Below 640px (`breakpoints.sm`)
- Tablet: 640px to 1024px (`breakpoints.sm` to `breakpoints.lg`)
- Desktop: Above 1024px (`breakpoints.lg`)

### Best Practices
1. Stack elements vertically on mobile
2. Maintain touch-friendly tap targets (44px minimum)
3. Prioritize essential content on smaller screens
4. Use collapsible menus for navigation

## Accessibility

### Color Contrast
1. Maintain 4.5:1 contrast ratio for text
2. Use accessible color combinations from the palette
3. Test with color blindness simulators

### Focus Management
1. Ensure keyboard navigation is possible
2. Provide visible focus indicators
3. Maintain logical tab order
4. Use ARIA attributes where appropriate

## Performance

### Best Practices
1. Use semantic HTML elements
2. Minimize custom styling overrides
3. Leverage CSS utility classes
4. Avoid complex nested selectors
5. Use appropriate component variants