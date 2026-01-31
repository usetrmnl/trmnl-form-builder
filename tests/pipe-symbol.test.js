/**
 * Test Suite for TRMNL Form Builder - Pipe Symbol YAML Support
 * 
 * Tests validation of the pipe symbol (|) for multiline string values in YAML,
 * particularly for the 'code' field_type with default values.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../trmnl-form-builder.js';

describe('TRMLYamlForm - Pipe Symbol YAML Support', () => {
  let formBuilder;

  beforeEach(() => {
    // Create a fresh instance of the form builder
    formBuilder = document.createElement('trmnl-form-builder');
    document.body.appendChild(formBuilder);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(formBuilder);
  });

  describe('parseYaml with pipe symbol multiline strings', () => {
    test('should parse code field with pipe symbol multiline default value', () => {
      const yamlInput = `- keyname: example_field
  field_type: code
  rows: 8
  name: Example Field
  default: |
    {
      "Example": "Replace" 
    }`;

      const result = formBuilder.parseYaml(yamlInput);

      expect(result).toHaveLength(1);
      expect(result[0].keyname).toBe('example_field');
      expect(result[0].field_type).toBe('code');
      expect(result[0].rows).toBe(8);
      expect(result[0].name).toBe('Example Field');
      
      // The default value should preserve the multiline formatting
      const expectedDefault = '{\n  "Example": "Replace" \n}';
      expect(result[0].default).toBe(expectedDefault);
    });

    test('should parse multiple code fields with pipe symbol defaults', () => {
      const yamlInput = `- keyname: json_config
  field_type: code
  rows: 5
  name: JSON Configuration
  default: |
    {
      "key": "value"
    }
- keyname: html_template
  field_type: code
  rows: 10
  name: HTML Template
  default: |
    <div>
      <h1>Title</h1>
    </div>`;

      const result = formBuilder.parseYaml(yamlInput);

      expect(result).toHaveLength(2);
      
      // First field
      expect(result[0].keyname).toBe('json_config');
      expect(result[0].default).toBe('{\n  "key": "value"\n}');
      
      // Second field
      expect(result[1].keyname).toBe('html_template');
      expect(result[1].default).toBe('<div>\n  <h1>Title</h1>\n</div>');
    });

    test('should handle pipe symbol with various indentation levels', () => {
      const yamlInput = `- keyname: nested_example
  field_type: code
  name: Nested Example
  default: |
    function example() {
      if (true) {
        console.log("nested");
      }
    }`;

      const result = formBuilder.parseYaml(yamlInput);

      expect(result).toHaveLength(1);
      expect(result[0].default).toContain('function example()');
      expect(result[0].default).toContain('  if (true)');
      expect(result[0].default).toContain('    console.log("nested")');
    });

    test('should handle empty lines within pipe symbol content', () => {
      const yamlInput = `- keyname: code_with_blank_lines
  field_type: code
  name: Code With Blanks
  default: |
    line 1
    
    line 3
    
    line 5`;

      const result = formBuilder.parseYaml(yamlInput);

      expect(result).toHaveLength(1);
      const lines = result[0].default.split('\n');
      expect(lines).toHaveLength(5);
      expect(lines[0]).toBe('line 1');
      expect(lines[1]).toBe('');
      expect(lines[2]).toBe('line 3');
      expect(lines[3]).toBe('');
      expect(lines[4]).toBe('line 5');
    });

    test('should handle pipe symbol for text field type', () => {
      const yamlInput = `- keyname: multiline_text
  field_type: text
  name: Multiline Text
  default: |
    This is line 1
    This is line 2
    This is line 3`;

      const result = formBuilder.parseYaml(yamlInput);

      expect(result).toHaveLength(1);
      expect(result[0].field_type).toBe('text');
      expect(result[0].default).toBe('This is line 1\nThis is line 2\nThis is line 3');
    });

    test('should preserve special characters in pipe symbol content', () => {
      const yamlInput = `- keyname: special_chars
  field_type: code
  name: Special Characters
  default: |
    {"key": "value with 'quotes' and \\"escapes\\""}
    <tag attr="value">
    symbols: @ # $ % & * ( )`;

      const result = formBuilder.parseYaml(yamlInput);

      expect(result).toHaveLength(1);
      expect(result[0].default).toContain('\'quotes\'');
      expect(result[0].default).toContain('<tag attr="value">');
      expect(result[0].default).toContain('@ # $ % & *');
    });

    test('should handle pipe symbol mixed with other field properties', () => {
      const yamlInput = `- keyname: mixed_field
  field_type: code
  rows: 12
  name: Mixed Properties
  help_text: This is a helpful description
  optional: true
  default: |
    // Default code here
    const x = 1;
  placeholder: Enter your code here`;

      const result = formBuilder.parseYaml(yamlInput);

      expect(result).toHaveLength(1);
      expect(result[0].keyname).toBe('mixed_field');
      expect(result[0].rows).toBe(12);
      expect(result[0].optional).toBe(true);
      expect(result[0].default).toBe('// Default code here\nconst x = 1;');
      expect(result[0].placeholder).toBe('Enter your code here');
    });

    test('should handle pipe symbol with trailing spaces', () => {
      const yamlInput = `- keyname: trailing_spaces
  field_type: code
  name: Trailing Spaces
  default: |
    line with trailing space   
    another line`;

      const result = formBuilder.parseYaml(yamlInput);

      expect(result).toHaveLength(1);
      // Trailing spaces should be preserved in the multiline string
      expect(result[0].default).toBe('line with trailing space   \nanother line');
    });

    test('should differentiate between pipe symbol and regular single-line values', () => {
      const yamlInput = `- keyname: single_line
  field_type: string
  name: Single Line
  default: simple value
- keyname: multi_line
  field_type: code
  name: Multi Line
  default: |
    multi
    line
    value`;

      const result = formBuilder.parseYaml(yamlInput);

      expect(result).toHaveLength(2);
      expect(result[0].default).toBe('simple value');
      expect(result[1].default).toBe('multi\nline\nvalue');
    });
  });

  describe('generateYaml with pipe symbol output', () => {
    test('should generate YAML with pipe symbol for multiline code defaults', () => {
      const fields = [{
        id: 'field_1',
        keyname: 'example_field',
        field_type: 'code',
        rows: 8,
        name: 'Example Field',
        default: '{\n  "Example": "Replace"\n}'
      }];

      formBuilder.setFields(fields);
      const yamlOutput = formBuilder.getYaml();

      expect(yamlOutput).toContain('- keyname: example_field');
      expect(yamlOutput).toContain('field_type: code');
      expect(yamlOutput).toContain('default: |');
      expect(yamlOutput).toContain('  {');
      expect(yamlOutput).toContain('    "Example": "Replace"');
      expect(yamlOutput).toContain('  }');
    });

    test('should not use pipe symbol for single-line defaults', () => {
      const fields = [{
        id: 'field_1',
        keyname: 'simple_field',
        field_type: 'string',
        name: 'Simple Field',
        default: 'single line value'
      }];

      formBuilder.setFields(fields);
      const yamlOutput = formBuilder.getYaml();

      expect(yamlOutput).toContain('default: single line value');
      expect(yamlOutput).not.toContain('default: |');
    });
  });

  describe('round-trip parsing (parse -> generate -> parse)', () => {
    test('should maintain pipe symbol multiline values through round-trip', () => {
      const originalYaml = `- keyname: round_trip_test
  field_type: code
  rows: 6
  name: Round Trip Test
  default: |
    {
      "test": "value",
      "number": 42
    }`;

      // Parse the YAML
      const parsed = formBuilder.parseYaml(originalYaml);
      
      // Set fields and generate new YAML
      formBuilder.setFields(parsed);
      const generatedYaml = formBuilder.getYaml();
      
      // Parse the generated YAML
      const reparsed = formBuilder.parseYaml(generatedYaml);

      // The default value should remain the same
      expect(reparsed[0].default).toBe(parsed[0].default);
      expect(reparsed[0].default).toContain('\n');
      expect(reparsed[0].default).toContain('"test": "value"');
    });
  });
});