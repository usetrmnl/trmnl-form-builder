# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a standalone Web Component for building TRMNL custom plugin form fields. It's a single-file JavaScript component (`trmnl-form-builder.js`, ~2400 lines) that registers as `<trmnl-form-builder>` and provides a visual form builder that outputs YAML configuration files. The component has no JavaScript dependencies and only requires Tailwind CSS for styling.

## Commands

### Testing
- `pnpm test` - Run all tests once
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:ui` - Run tests with Vitest UI
- `pnpm run test:coverage` - Run tests with coverage report

### Development
- No build step required - the component is a single vanilla JS file
- Open `index.html` in a browser to test the component locally
- The component uses ES modules and the Custom Elements API

## Architecture

### Component Structure

The entire component is implemented as a single `TRMLYamlForm` class that extends `HTMLElement`. Key architectural points:

1. **Shadow DOM**: Uses Shadow DOM for style encapsulation with all styles defined inline in the component
2. **State Management**: Fields array (`this.fields`) holds all form field definitions, each with a unique ID
3. **Reactive Rendering**: Changes trigger `render()` which regenerates the entire UI and YAML output
4. **No External Dependencies**: Pure vanilla JavaScript with no bundler or transpilation

### Field Types System

Fields are defined in `this.fieldTypes` (around line 115) with a consistent structure:
```javascript
{
  category: 'TEXT INPUT',  // Groups fields in the UI
  name: 'String',          // Display name
  description: 'Single line text',
  properties: ['default', 'placeholder', 'optional']  // Available settings
}
```

Each field type has different allowed properties. Property definitions are in `this.propertyDefinitions` (around line 63) which describe how to render each setting (text input, checkbox, textarea, etc.).

### Property Overrides

Field types can override generic property definitions using objects instead of strings:
```javascript
properties: [
  {
    key: 'default',
    placeholder: 'YYYY-MM-DD',
    help: 'Can also be set to "today"'
  },
  'optional'
]
```

This allows field-specific behavior for common properties like `default`.

### Key Methods

- `addField(fieldType)` (line ~904) - Creates a new field with auto-generated ID and keyname
- `deleteField(fieldId)` (line ~2000) - Removes field and cleans up dependencies
- `generateYaml()` (line ~1735) - Converts fields array to YAML string
- `render()` (line ~256) - Regenerates entire UI including field list, config panel, and YAML output

### YAML Generation

The YAML generation logic includes:
- **Escaping**: `escapeYaml()` handles special characters, colons, quotes, and YAML reserved words (true/false/yes/no)
- **Label:Value pairs**: Select options support "Label:Value" format that splits on first colon
- **Conditional properties**: Only includes properties that are set (not empty/undefined)
- **Proper indentation**: Uses 2-space indentation for nested structures

### depends_on System

xhrSelect fields can depend on other xhrSelect fields using `depends_on` property:
- Parent field must be an xhrSelect type
- Parent must appear before child in the field list
- When parent is deleted or reordered after child, `depends_on` is automatically cleared
- Validation happens in `generateYaml()` with toast notifications for cleared dependencies

### Author Bio Field

Special field type with unique logic:
- Can only have ONE author_bio field per form
- Automatically prevents adding more than one
- Has custom category selection UI (max 2 categories)
- Categories loaded from `https://trmnl.com/api/categories` with fallback list
- Category selection uses pill UI rendered by `renderCategoryPills()`

### Public API

Component exposes methods for programmatic control (line ~2381):
- `getYaml()` - Returns generated YAML string
- `getFields()` - Returns current fields array
- `setFields(fields)` - Loads fields from array and re-renders
- `clear()` - Removes all fields

### Locales

Component includes list of supported locales (`this.locales` around line 37) based on trmnl-i18n. These are used for plugin internationalization.

## Testing

Tests use Vitest with jsdom environment to simulate browser APIs:
- `unit.test.js` - Tests for YAML escaping/unescaping, step property, boolean field type
- `depends-on.test.js` - Tests for dependency validation between fields
- `yaml-operations.test.js` - Tests for YAML import/export functionality
- `pipe-symbol.test.js` - Tests for pipe character handling in YAML
- `fixture.test.js` - Tests using complete form fixtures
- `api-reorder.test.js` - Tests for field reordering logic

Tests create component instances with `document.createElement('trmnl-form-builder')` and call methods directly.

## Known Issues

From README.md:
- Import functionality doesn't properly parse more complex YAML structures with `|` or `>` multiline operators
