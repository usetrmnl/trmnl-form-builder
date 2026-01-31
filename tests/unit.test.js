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
})