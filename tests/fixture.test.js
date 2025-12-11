import { describe, it, expect, beforeEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import '../trmnl-form-builder.js'

describe('TRMNL Form Builder - Fixture Tests', () => {
  let element

  beforeEach(() => {
    element = document.createElement('trmnl-form-builder')
    document.body.appendChild(element)
  })

  describe('Weather Plugin Fixture', () => {
    it('should parse weather plugin YAML correctly', () => {
      const yamlContent = readFileSync(
        join(process.cwd(), 'test-fixtures', 'weather.yml'),
        'utf-8'
      )

      const fields = element.parseYaml(yamlContent)

      // Should have 5 fields
      expect(fields).toHaveLength(5)

      // Check author_bio field
      expect(fields[0].keyname).toBe('bio')
      expect(fields[0].field_type).toBe('author_bio')
      expect(fields[0].category).toBe('life,personal')

      // Check select field with label:value options
      const tempUnitField = fields[3]
      expect(tempUnitField.keyname).toBe('temp_unit')
      expect(tempUnitField.field_type).toBe('select')
      expect(tempUnitField.default).toBe('fahrenheit')
      expect(tempUnitField.options).toHaveLength(2)
      expect(tempUnitField.options[0]).toEqual({ 'Celsius': 'celsius' })
      expect(tempUnitField.options[1]).toEqual({ 'Fahrenheit': 'fahrenheit' })

      // Check optional field
      const locationField = fields[4]
      expect(locationField.keyname).toBe('location_name')
      expect(locationField.optional).toBe(true)
    })

    it('should round-trip weather plugin YAML correctly', () => {
      const yamlContent = readFileSync(
        join(process.cwd(), 'test-fixtures', 'weather.yml'),
        'utf-8'
      )

      // Parse the YAML
      const fields = element.parseYaml(yamlContent)
      
      // Set fields on element
      element.fields = fields.map((fieldData, index) => ({
        id: `field_${index}`,
        ...fieldData
      }))

      // Generate YAML back
      const generatedYaml = element.generateYaml()

      // Parse again
      const reparsedFields = element.parseYaml(generatedYaml)

      // Should have same number of fields
      expect(reparsedFields).toHaveLength(fields.length)

      // Check critical properties are preserved
      expect(reparsedFields[3].options).toEqual(fields[3].options)
      expect(reparsedFields[4].optional).toBe(fields[4].optional)
    })
  })
})