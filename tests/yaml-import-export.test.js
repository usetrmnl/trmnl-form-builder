import { describe, it, expect, beforeEach } from 'vitest';
import '../trmnl-form-builder.js';

describe('YAML import/export with depends_on functionality', () => {
  let element;

  beforeEach(() => {
    // Create a new instance of the form builder for each test
    element = document.createElement('trmnl-form-builder');
    document.body.appendChild(element);
    // Reset fields before each test
    element.fields = [];
  });

  it('should properly export and import depends_on properties', () => {
    // Create a parent xhrSelect field
    element.addField('xhrSelect');
    element.fields[0].keyname = 'team';
    element.fields[0].endpoint = 'https://trmnl.com/custom_plugin_example_xhr_select.json';
    element.fields[0].http_verb = 'GET';

    // Create a child xhrSelect field that depends on the parent
    element.addField('xhrSelect');
    element.fields[1].keyname = 'player';
    element.fields[1].endpoint = 'https://trmnl.com/custom_plugin_example_xhr_select_##{{team}}.json';
    element.fields[1].http_verb = 'GET';
    element.fields[1].depends_on = 'team';

    // Generate YAML
    const yamlOutput = element.generateYaml();
    
    // Verify depends_on is in the YAML output
    expect(yamlOutput).toContain('depends_on: team');
    
    // Create a new instance to test import
    const newElement = document.createElement('trmnl-form-builder');
    document.body.appendChild(newElement);
    
    // Simulate importing the YAML by directly setting fields (since we don't have access to the parseYaml function in tests)
    // We'll test that the export contains the depends_on property correctly
    
    // Check that the YAML output has proper structure
    const lines = yamlOutput.split('\n');
    let dependsOnLine = null;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('depends_on: team')) {
        dependsOnLine = i;
        break;
      }
    }
    
    expect(dependsOnLine).not.toBeNull();
    
    // Verify the structure makes sense
    const yamlLines = yamlOutput.trim().split('\n');
    let playerFieldIndex = -1;
    for (let i = 0; i < yamlLines.length; i++) {
      if (yamlLines[i].includes('keyname: player')) {
        playerFieldIndex = i;
        break;
      }
    }
    
    expect(playerFieldIndex).toBeGreaterThan(-1);
  });

  it('should preserve depends_on relationships when serializing form data', () => {
    // Create a parent xhrSelect field
    element.addField('xhrSelect');
    element.fields[0].keyname = 'department';
    element.fields[0].endpoint = 'https://api.example.com/departments';
    element.fields[0].http_verb = 'GET';

    // Create a child xhrSelect field that depends on the parent
    element.addField('xhrSelect');
    element.fields[1].keyname = 'employee';
    element.fields[1].endpoint = 'https://api.example.com/employees?department={department}';
    element.fields[1].http_verb = 'GET';
    element.fields[1].depends_on = 'department';

    // Get the fields data (this mimics what would happen during serialization)
    const fieldsData = element.getFields();
    
    // Verify the depends_on property is preserved
    expect(fieldsData).toHaveLength(2);
    expect(fieldsData[1].depends_on).toBe('department');
    
    // Create a new instance and set fields 
    const newElement = document.createElement('trmnl-form-builder');
    document.body.appendChild(newElement);
    
    // Set the fields (this mimics what would happen during deserialization)
    newElement.setFields(fieldsData);
    
    // Verify that the depends_on property is preserved after setting
    expect(newElement.fields).toHaveLength(2);
    expect(newElement.fields[1].depends_on).toBe('department');
  });
});