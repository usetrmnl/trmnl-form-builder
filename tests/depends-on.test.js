import { describe, it, expect, beforeEach } from 'vitest';
import '../trmnl-form-builder.js';

describe('depends_on functionality', () => {
  let element;

  beforeEach(() => {
    // Create a new instance of the form builder for each test
    element = document.createElement('trmnl-form-builder');
    document.body.appendChild(element);
    // Reset fields before each test
    element.fields = [];
  });

  it('should add depends_on property to xhrSelect fields', () => {
    // Create a parent xhrSelect field with a base endpoint
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

    const yaml = element.generateYaml();
    
    expect(yaml).toContain('depends_on: team');
    expect(yaml).toContain('endpoint: "https://trmnl.com/custom_plugin_example_xhr_select_##{{team}}.json"');
  });

  it('should maintain depends_on reference when parent exists and is xhrSelect', () => {
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

    const yaml = element.generateYaml();
    
    expect(yaml).toContain('depends_on: team');
    expect(yaml).toContain('endpoint: "https://trmnl.com/custom_plugin_example_xhr_select_##{{team}}.json"');
  });

  it('should handle multiple fields depending on the same parent', () => {
    // Create a parent xhrSelect field
    element.addField('xhrSelect');
    element.fields[0].keyname = 'team';
    element.fields[0].endpoint = 'https://trmnl.com/custom_plugin_example_xhr_select.json';
    element.fields[0].http_verb = 'GET';

    // Create two child xhrSelect fields that depend on the same parent
    element.addField('xhrSelect');
    element.fields[1].keyname = 'player';
    element.fields[1].endpoint = 'https://trmnl.com/custom_plugin_example_xhr_select_##{{team}}.json';
    element.fields[1].http_verb = 'GET';
    element.fields[1].depends_on = 'team';

    element.addField('xhrSelect');
    element.fields[2].keyname = 'coach';
    element.fields[2].endpoint = 'https://trmnl.com/custom_plugin_example_xhr_select_##{{team}}_coach.json';
    element.fields[2].http_verb = 'GET';
    element.fields[2].depends_on = 'team';

    const yaml = element.generateYaml();
    
    expect(yaml).toContain('depends_on: team');
    expect(yaml).toContain('endpoint: "https://trmnl.com/custom_plugin_example_xhr_select_##{{team}}.json"');
    expect(yaml).toContain('endpoint: "https://trmnl.com/custom_plugin_example_xhr_select_##{{team}}_coach.json"');
  });
});