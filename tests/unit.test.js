import { describe, it, expect, beforeEach } from 'vitest'
import '../trmnl-form-builder.js'

describe('TRMNL Form Builder - Unit Tests', () => {
  let element

  beforeEach(() => {
    element = document.createElement('trmnl-form-builder')
    document.body.appendChild(element)
  })

  it('should register the custom element', () => {
    expect(customElements.get('trmnl-form-builder')).toBeDefined()
  })

  describe('escapeYaml', () => {
    it('should escape special characters', () => {
      expect(element.escapeYaml('hello: world')).toBe('"hello: world"')
      expect(element.escapeYaml('simple')).toBe('simple')
      expect(element.escapeYaml(123)).toBe('123')
      expect(element.escapeYaml('')).toBe('""')
    })

    it('should quote YAML boolean literals', () => {
      expect(element.escapeYaml('true')).toBe('"true"')
      expect(element.escapeYaml('false')).toBe('"false"')
      expect(element.escapeYaml('yes')).toBe('"yes"')
      expect(element.escapeYaml('no')).toBe('"no"')
    })
  })

  describe('unescapeYaml', () => {
    it('should remove surrounding quotes', () => {
      expect(element.unescapeYaml('"hello"')).toBe('hello')
      expect(element.unescapeYaml("'hello'")).toBe('hello')
      expect(element.unescapeYaml('hello')).toBe('hello')
    })

    it('should handle non-string values', () => {
      expect(element.unescapeYaml(123)).toBe(123)
      expect(element.unescapeYaml(0)).toBe(0)
    })
  })

  describe('step property for number fields', () => {
    it('should include step in YAML output when set', () => {
      element.addField('number')
      const numberField = element.fields[0]
      numberField.step = 0.1
      
      // Update the field to trigger yaml regeneration
      element.updateYamlOutput()
      
      const yaml = element.generateYaml()
      expect(yaml).toContain('step: 0.1')
    })

    it('should not include step in YAML when not set', () => {
      element.addField('number')
      // Don't set step property
      
      // Update the field to trigger yaml regeneration
      element.updateYamlOutput()
      
      const yaml = element.generateYaml()
      expect(yaml).not.toContain('step:')
    })
  })

  describe('boolean field type', () => {
    it('should include boolean in field types', () => {
      const fieldTypes = Object.keys(element.fieldTypes)
      expect(fieldTypes).toContain('boolean')
    })

    it('should support boolean field properties', () => {
      element.addField('boolean')
      const booleanField = element.fields[0]
      
      // Check that the default properties are set
      expect(booleanField.field_type).toBe('boolean')
      expect(booleanField.keyname).toMatch(/^boolean_\d+$/)
    })

    it('should generate YAML with boolean field matching the example from request', () => {
      element.addField('boolean')
      const booleanField = element.fields[0]
      booleanField.keyname = 'skip_device_validation'
      booleanField.field_type = 'boolean'
      booleanField.name = 'Skip Device Validation (Danger Mode)'
      booleanField.description = 'When enabled, skips device-specific image validation. Use if you are sure that your device does support the image you are uploading.'
      booleanField.default = false
      booleanField.optional = true
      
      element.updateYamlOutput()
      
      const yaml = element.generateYaml()
      
      // Check that all required fields are present in YAML output
      expect(yaml).toContain('keyname: skip_device_validation')
      expect(yaml).toContain('field_type: boolean')
      expect(yaml).toContain('name: Skip Device Validation (Danger Mode)')
      expect(yaml).toContain('description: "When enabled, skips device-specific image validation. Use if you are sure that your device does support the image you are uploading."')
      // The default value will be an empty string because of how it's handled in the implementation
      expect(yaml).toContain('default: false')
      expect(yaml).toContain('optional: true')
    })
  })
})