import { describe, it, expect, beforeEach } from 'vitest'
import '../trmnl-form-builder.js'

describe('TRMNL Form Builder - YAML Operations', () => {
  let element

  beforeEach(() => {
    element = document.createElement('trmnl-form-builder')
    document.body.appendChild(element)
  })

  describe('Field Operations', () => {
    it('should add a new field', () => {
      expect(element.fields).toHaveLength(0)
      
      element.addField('string')
      
      expect(element.fields).toHaveLength(1)
      expect(element.fields[0].field_type).toBe('string')
      expect(element.fields[0].keyname).toMatch(/^string_\d{4}$/)
      expect(element.fields[0].name).toBe('String')
      expect(element.selectedFieldId).toBe(element.fields[0].id)
    })

    it('should prevent duplicate author_bio fields', () => {
      element.addField('author_bio')
      expect(element.fields).toHaveLength(1)
      
      // Try to add another author_bio
      element.addField('author_bio')
      
      // Should still only have 1 field
      expect(element.fields).toHaveLength(1)
    })

    it('should delete a field', () => {
      element.addField('string')
      element.addField('number')
      expect(element.fields).toHaveLength(2)
      
      const firstFieldId = element.fields[0].id
      element.deleteField(firstFieldId)
      
      expect(element.fields).toHaveLength(1)
      expect(element.fields[0].field_type).toBe('number')
    })

    it('should update selectedFieldId after deletion', () => {
      element.addField('string')
      element.addField('number')
      const firstFieldId = element.fields[0].id
      
      element.selectedFieldId = firstFieldId
      element.deleteField(firstFieldId)
      
      // Should select the first remaining field
      expect(element.selectedFieldId).toBe(element.fields[0].id)
    })

    it('should duplicate a field with new keyname', () => {
      element.addField('string')
      const originalField = element.fields[0]
      originalField.placeholder = 'test placeholder'
      originalField.description = 'test description'
      
      element.duplicateField(originalField.id)
      
      expect(element.fields).toHaveLength(2)
      expect(element.fields[1].field_type).toBe('string')
      expect(element.fields[1].placeholder).toBe('test placeholder')
      expect(element.fields[1].description).toBe('test description')
      expect(element.fields[1].keyname).not.toBe(originalField.keyname)
      expect(element.fields[1].id).not.toBe(originalField.id)
    })

    it('should not duplicate author_bio field', () => {
      element.addField('author_bio')
      const authorBioId = element.fields[0].id
      
      element.duplicateField(authorBioId)
      
      // Should still only have 1 field
      expect(element.fields).toHaveLength(1)
    })
  })

  describe('YAML Generation - Edge Cases', () => {
    beforeEach(() => {
      // Need to initialize nextFieldId
      element.nextFieldId = 1
    })

    it('should generate YAML with empty default value', () => {
      element.fields = [{
        id: 'field_1',
        keyname: 'test',
        field_type: 'string',
        name: 'Test Field',
        default: ''
      }]

      const yaml = element.generateYaml()
      
      expect(yaml).toContain('default: ""')
    })

    it('should generate YAML with min/max values', () => {
      element.fields = [{
        id: 'field_1',
        keyname: 'age',
        field_type: 'number',
        name: 'Age',
        min: 0,
        max: 100
      }]

      const yaml = element.generateYaml()
      
      expect(yaml).toContain('min: 0')
      expect(yaml).toContain('max: 100')
    })

    it('should generate YAML with maxlength and rows', () => {
      element.fields = [{
        id: 'field_1',
        keyname: 'bio',
        field_type: 'text',
        name: 'Bio',
        maxlength: 500,
        rows: 10
      }]

      const yaml = element.generateYaml()
      
      expect(yaml).toContain('maxlength: 500')
      expect(yaml).toContain('rows: 10')
    })

    it('should generate YAML with multiple flag', () => {
      element.fields = [{
        id: 'field_1',
        keyname: 'tags',
        field_type: 'select',
        name: 'Tags',
        options: ['tag1', 'tag2'],
        multiple: true
      }]

      const yaml = element.generateYaml()
      
      expect(yaml).toContain('multiple: true')
    })

    it('should generate YAML with http_verb for XHR fields', () => {
      element.fields = [{
        id: 'field_1',
        keyname: 'dynamic',
        field_type: 'xhrSelect',
        name: 'Dynamic Select',
        endpoint: 'https://api.example.com/data',
        http_verb: 'POST'
      }]

      const yaml = element.generateYaml()
      
      expect(yaml).toContain('http_verb: POST')
    })

    it('should default http_verb to GET for XHR fields', () => {
      element.fields = [{
        id: 'field_1',
        keyname: 'dynamic',
        field_type: 'xhrSelect',
        name: 'Dynamic Select',
        endpoint: 'https://api.example.com/data'
      }]

      const yaml = element.generateYaml()
      
      expect(yaml).toContain('http_verb: GET')
    })

    it('should generate YAML with optional flag', () => {
      element.fields = [{
        id: 'field_1',
        keyname: 'nickname',
        field_type: 'string',
        name: 'Nickname',
        optional: true
      }]

      const yaml = element.generateYaml()
      
      expect(yaml).toContain('optional: true')
    })

    it('should omit default when not set', () => {
      element.fields = [{
        id: 'field_1',
        keyname: 'test',
        field_type: 'string',
        name: 'Test Field'
      }]

      const yaml = element.generateYaml()
      
      expect(yaml).not.toContain('default:')
    })

    it('should generate empty YAML comment when no fields', () => {
      element.fields = []
      
      const yaml = element.generateYaml()
      
      expect(yaml).toBe('# No fields defined yet')
    })
  })

  describe('Helper Methods', () => {
    describe('escapeYaml', () => {
      it('should quote strings with special YAML characters', () => {
        expect(element.escapeYaml('hello: world')).toBe('"hello: world"')
        expect(element.escapeYaml('hello# comment')).toBe('"hello# comment"')
        expect(element.escapeYaml('hello[array]')).toBe('"hello[array]"')
        expect(element.escapeYaml('hello{object}')).toBe('"hello{object}"')
        expect(element.escapeYaml('hello,comma')).toBe('"hello,comma"')
        expect(element.escapeYaml('hello&ampersand')).toBe('"hello&ampersand"')
        expect(element.escapeYaml('hello*asterisk')).toBe('"hello*asterisk"')
      })

      it('should quote YAML boolean literals', () => {
        expect(element.escapeYaml('true')).toBe('"true"')
        expect(element.escapeYaml('false')).toBe('"false"')
        expect(element.escapeYaml('yes')).toBe('"yes"')
        expect(element.escapeYaml('no')).toBe('"no"')
        expect(element.escapeYaml('on')).toBe('"on"')
        expect(element.escapeYaml('off')).toBe('"off"')
        expect(element.escapeYaml('TRUE')).toBe('"TRUE"')
        expect(element.escapeYaml('FALSE')).toBe('"FALSE"')
      })

      it('should quote numeric strings', () => {
        expect(element.escapeYaml('123')).toBe('"123"')
        expect(element.escapeYaml('456')).toBe('"456"')
      })

      it('should quote strings with leading/trailing spaces', () => {
        expect(element.escapeYaml(' leading')).toBe('" leading"')
        expect(element.escapeYaml('trailing ')).toBe('"trailing "')
      })

      it('should not quote simple strings', () => {
        expect(element.escapeYaml('simple')).toBe('simple')
        expect(element.escapeYaml('hello_world')).toBe('hello_world')
        expect(element.escapeYaml('camelCase')).toBe('camelCase')
      })

      it('should convert numbers to strings', () => {
        expect(element.escapeYaml(123)).toBe('123')
        expect(element.escapeYaml(0)).toBe('0')
        expect(element.escapeYaml(3.14)).toBe('3.14')
      })

      it('should handle empty strings', () => {
        expect(element.escapeYaml('')).toBe('""')
        expect(element.escapeYaml(null)).toBe('""')
        expect(element.escapeYaml(undefined)).toBe('""')
      })

      it('should escape quotes in strings', () => {
        expect(element.escapeYaml('say "hello"')).toBe('"say \\"hello\\""')
      })
    })

    describe('unescapeYaml', () => {
      it('should remove surrounding quotes', () => {
        expect(element.unescapeYaml('"hello"')).toBe('hello')
        expect(element.unescapeYaml("'hello'")).toBe('hello')
      })

      it('should unescape escaped quotes', () => {
        expect(element.unescapeYaml('"say \\"hello\\""')).toBe('say "hello"')
      })

      it('should handle strings without quotes', () => {
        expect(element.unescapeYaml('hello')).toBe('hello')
      })

      it('should handle numbers', () => {
        expect(element.unescapeYaml(123)).toBe(123)
        expect(element.unescapeYaml(0)).toBe(0)
      })

      it('should handle empty strings', () => {
        expect(element.unescapeYaml('')).toBe('')
        expect(element.unescapeYaml('""')).toBe('')
      })
    })

    describe('getFallbackCategories', () => {
      it('should return array of category strings', () => {
        const categories = element.getFallbackCategories()
        
        expect(Array.isArray(categories)).toBe(true)
        expect(categories.length).toBeGreaterThan(0)
        expect(categories).toContain('analytics')
        expect(categories).toContain('productivity')
        expect(categories).toContain('finance')
      })
    })
  })

  describe('Parsing Edge Cases', () => {
    it('should parse boolean values correctly', () => {
      const yaml = `- keyname: test
  field_type: string
  name: Test
  optional: true`

      const fields = element.parseYaml(yaml)
      
      expect(fields[0].optional).toBe(true)
    })

    it('should parse numeric values correctly', () => {
      const yaml = `- keyname: age
  field_type: number
  name: Age
  min: 0
  max: 100
  default: 18`

      const fields = element.parseYaml(yaml)
      
      expect(fields[0].min).toBe(0)
      expect(fields[0].max).toBe(100)
      expect(fields[0].default).toBe(18)
    })

    it('should parse empty string default correctly', () => {
      const yaml = `- keyname: test
  field_type: string
  name: Test
  default: ""`

      const fields = element.parseYaml(yaml)
      
      expect(fields[0].default).toBe('')
    })

    it('should handle fields with HTML in descriptions', () => {
      const yaml = `- keyname: test
  field_type: string
  name: Test
  description: "Click <a href='https://example.com'>here</a> for more info"`

      const fields = element.parseYaml(yaml)
      
      expect(fields[0].description).toContain('<a href')
      expect(fields[0].description).toContain('https://example.com')
    })
  })
})