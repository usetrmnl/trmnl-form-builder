# AGENTS.md

## Build/Lint/Test Commands

### Running Tests
- `pnpm test` - Run all tests once
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run test:ui` - Run tests with Vitest UI
- `pnpm run test:coverage` - Run tests with coverage report
- `pnpm test -- --reporter=verbose` - Run single test with verbose output

### Build Commands
- `pnpm run build` - No explicit build command found, project is a single JS file
- The main output file is `trmnl-form-builder.js`

### Linting
No explicit linting commands found. Project appears to use standard JavaScript without linter configuration.

## Code Style Guidelines

### Imports
- Uses ES modules with `import` statements
- No specific import ordering requirements identified
- Component is registered as a custom element using `customElements.define()`

### Formatting
- Uses standard JavaScript formatting conventions
- Indentation appears to be 2 spaces (based on code review)
- No specific formatter configured (prettier, eslint, etc.)

### Types
- No explicit type definitions found
- Uses vanilla JavaScript without TypeScript
- Properties are set directly on elements

### Naming Conventions
- Component name: `trmnl-form-builder`
- Method names follow camelCase convention
- Property names follow camelCase convention
- Constants are uppercase with underscores when appropriate

### Error Handling
- Basic error handling through try/catch blocks where needed
- Validation of inputs and edge cases in functions like escapeYaml
- No comprehensive error logging or centralized error handling pattern

### Code Structure
- Single JavaScript file implementation
- Uses class-based component structure for custom element
- Modular approach with separate methods for different functionality
- Self-contained component with no external dependencies beyond browser APIs

### Testing
- Unit tests using Vitest framework
- Tests cover core functionality like YAML escaping/unescaping
- Tests use `describe`, `it`, and `expect` patterns
- Tests run in jsdom environment to simulate browser context

### Field Types
The form builder supports various field types including:
- string, textarea, number, email, url, password, select, checkbox, radio, author_bio
- xhrSelect and xhrSelectSearch for dynamic dropdowns with dependencies
- Special fields like copyable and copyable_webhook_url

### Depends On Functionality
Fields can depend on other xhrSelect fields using the `depends_on` property. When a field has a `depends_on` property:
- The referenced parent field must be an xhrSelect type
- The parent field must appear before the child field in the form
- If these conditions are not met, the depends_on reference is automatically cleared
- This functionality ensures that dynamic dropdowns only load options when their dependencies are satisfied

### YAML Generation
The component generates YAML configuration files for form definitions with proper escaping of special characters and handling of complex data types including:
- String values with proper quoting
- Label:Value pairs in select options
- Special handling for boolean literals and other YAML reserved words
- Proper indentation and structure according to YAML standards

### Additional Notes
- Component uses custom element API (`customElements.define`)
- Implements shadow DOM for encapsulation
- Follows web standards for component development
- No build tools or transpilation steps identified