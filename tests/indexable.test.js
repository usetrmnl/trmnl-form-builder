import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../trmnl-form-builder.js';

describe('indexable select fields', () => {
  let element;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    element = document.createElement('trmnl-form-builder');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  function checkbox(field) {
    element.selectedFieldId = field.id;
    element.updateConfigPanel();
    return element.shadowRoot.querySelector('input[data-prop="indexable"]');
  }

  function importYaml(yaml) {
    element.importYaml();
    document.getElementById('yamlImportTextarea').value = yaml;
    document.getElementById('confirmImportBtn').click();
  }

  const yaml = `- keyname: newspaper
  field_type: select
  name: Newspaper
  indexable: true
  options:
  - The Tennessean: tennessean
  - The New York Times: nyt`;

  it('renders an unchecked checkbox immediately after multiple on select fields', () => {
    element.addField('select');
    const input = checkbox(element.fields[0]);
    expect(input).not.toBeNull();
    expect(input.checked).toBe(false);
    expect(input.parentElement.textContent).toContain('Indexed in recipe search');
    const properties = element.fieldTypes.select.properties;
    expect(properties[properties.indexOf('multiple') + 1]).toBe('indexable');
  });

  it.each(['string', 'xhrSelect', 'xhrSelectSearch', 'plugin_instance_select'])(
    'does not offer indexable on %s fields', (type) => {
      element.addField(type);
      expect(checkbox(element.fields[0])).toBeNull();
    }
  );

  it('writes a YAML boolean when checked and omits the key when unchecked', () => {
    element.addField('select');
    const input = checkbox(element.fields[0]);
    expect(input).not.toBeNull();
    input.click();
    expect(element.fields[0].indexable).toBe(true);
    expect(element.getYaml()).toContain('  indexable: true');
    input.click();
    expect(element.getYaml()).not.toContain('indexable:');
  });

  it('clears the previous selection when a different select is checked', () => {
    element.addField('select');
    element.addField('select');
    const [first, second] = element.fields;
    const firstInput = checkbox(first);
    expect(firstInput).not.toBeNull();
    firstInput.click();
    checkbox(second).click();
    expect(first.indexable).toBeFalsy();
    expect(second.indexable).toBe(true);
    expect(element.getYaml().match(/indexable: true/g)).toHaveLength(1);
    expect(checkbox(first).checked).toBe(false);
    expect(checkbox(second).checked).toBe(true);
  });

  it('preserves an imported indexable select and its option labels and values', () => {
    importYaml(yaml);
    expect(element.fields[0].indexable).toBe(true);
    expect(checkbox(element.fields[0])).not.toBeNull();
    expect(checkbox(element.fields[0]).checked).toBe(true);
    expect(element.getYaml()).toContain('  indexable: true');
    expect(element.parseYaml(element.getYaml())[0].options).toEqual([
      { 'The Tennessean': 'tennessean' }, { 'The New York Times': 'nyt' }
    ]);
  });

  it('keeps only the first indexed select when importing multiple markers', () => {
    importYaml(`${yaml}\n${yaml.replace('newspaper', 'comic')}`);
    expect(element.fields[0].indexable).toBe(true);
    expect(element.fields[1].indexable).toBeFalsy();
    expect(element.getYaml().match(/indexable: true/g)).toHaveLength(1);
  });

  it('does not let a non-select marker displace an imported indexed select', () => {
    importYaml(`${yaml.replace('field_type: select', 'field_type: string')}\n${yaml.replace('newspaper', 'comic')}`);
    expect(element.fields[0].indexable).toBeFalsy();
    expect(element.fields[1].indexable).toBe(true);
    expect(element.getYaml().match(/indexable: true/g)).toHaveLength(1);
  });

  it('normalizes multiple markers through the public setFields API without mutating its input', () => {
    const fields = [
      { id: 'one', keyname: 'one', field_type: 'select', name: 'One', indexable: true },
      { id: 'two', keyname: 'two', field_type: 'select', name: 'Two', indexable: true }
    ];
    element.setFields(fields);
    expect(element.fields[0].indexable).toBe(true);
    expect(element.fields[1].indexable).toBeFalsy();
    expect(fields[1].indexable).toBe(true);
  });

  it('does not copy the indexable marker when duplicating a field', () => {
    importYaml(yaml);
    element.duplicateField(element.fields[0].id);
    expect(element.fields[0].indexable).toBe(true);
    expect(element.fields[1].indexable).toBeFalsy();
    expect(element.fields[1].options).toEqual(element.fields[0].options);
    expect(element.getYaml().match(/indexable: true/g)).toHaveLength(1);
  });

  it.each(['false', '"true"', '"false"'])('does not enable indexing for imported %s', (value) => {
    importYaml(yaml.replace('indexable: true', `indexable: ${value}`));
    expect(element.getYaml()).not.toContain('indexable:');
    expect(checkbox(element.fields[0])).not.toBeNull();
    expect(checkbox(element.fields[0]).checked).toBe(false);
  });

  it('never exports indexable for non-select fields', () => {
    element.addField('string');
    element.fields[0].indexable = true;
    expect(element.getYaml()).not.toContain('indexable:');
  });
});
