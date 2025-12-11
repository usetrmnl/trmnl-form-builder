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

  describe('Locales Fixture', () => {
    it('should parse i18n description fields correctly', () => {
      const yamlContent = readFileSync(
        join(process.cwd(), 'test-fixtures', 'locales.yml'),
        'utf-8'
      )

      const fields = element.parseYaml(yamlContent)

      // Should have 2 fields
      expect(fields).toHaveLength(2)

      // Check author_bio with multiple locales
      const authorBio = fields[0]
      expect(authorBio.keyname).toBe('author_bio')
      expect(authorBio.field_type).toBe('author_bio')
      expect(authorBio.description).toContain('View the contents of a public Trello board')
      
      // Check all locale descriptions exist
      expect(authorBio['description-de']).toContain('Zeigen Sie den Inhalt')
      expect(authorBio['description-nl']).toContain('Bekijk de inhoud')
      expect(authorBio['description-fr']).toContain('Affichez le contenu')
      expect(authorBio['description-it']).toContain('Visualizzare il contenuto')
      expect(authorBio['description-es-ES']).toContain('Vea el contenido')

      // Check board_id field with locales
      const boardId = fields[1]
      expect(boardId.keyname).toBe('board_id')
      expect(boardId.field_type).toBe('string')
      expect(boardId.placeholder).toBe('efhMgP6E')
      expect(boardId['description-de']).toBeDefined()
      expect(boardId['description-nl']).toBeDefined()
      expect(boardId['description-fr']).toBeDefined()
      expect(boardId['description-it']).toBeDefined()
      expect(boardId['description-es-ES']).toBeDefined()
    })

    it('should round-trip locales YAML correctly', () => {
      const yamlContent = readFileSync(
        join(process.cwd(), 'test-fixtures', 'locales.yml'),
        'utf-8'
      )

      const fields = element.parseYaml(yamlContent)
      
      element.fields = fields.map((fieldData, index) => ({
        id: `field_${index}`,
        ...fieldData
      }))

      const generatedYaml = element.generateYaml()
      const reparsedFields = element.parseYaml(generatedYaml)

      // Verify all locales are preserved
      expect(reparsedFields[0]['description-de']).toBe(fields[0]['description-de'])
      expect(reparsedFields[0]['description-nl']).toBe(fields[0]['description-nl'])
      expect(reparsedFields[0]['description-fr']).toBe(fields[0]['description-fr'])
      expect(reparsedFields[0]['description-it']).toBe(fields[0]['description-it'])
      expect(reparsedFields[0]['description-es-ES']).toBe(fields[0]['description-es-ES'])
    })
  })

  describe('Conditional Validation Fixture', () => {
    it('should parse conditional validation correctly', () => {
      const yamlContent = readFileSync(
        join(process.cwd(), 'test-fixtures', 'conditional.yml'),
        'utf-8'
      )

      const fields = element.parseYaml(yamlContent)

      // Should have 4 fields
      expect(fields).toHaveLength(4)

      // Check select field with conditional validation
      const selectField = fields[0]
      expect(selectField.keyname).toBe('select')
      expect(selectField.field_type).toBe('select')
      expect(selectField.options).toEqual(['a', 'b', 'c'])
      
      // Verify conditional_validation structure
      expect(selectField.conditional_validation).toHaveLength(3)
      
      // Check first condition: when 'a', hide text_b and text_c
      expect(selectField.conditional_validation[0]).toEqual({
        when: 'a',
        hidden: ['text_b', 'text_c']
      })
      
      // Check second condition: when 'b', hide text_a and text_c
      expect(selectField.conditional_validation[1]).toEqual({
        when: 'b',
        hidden: ['text_a', 'text_c']
      })
      
      // Check third condition: when 'c', hide text_a and text_b
      expect(selectField.conditional_validation[2]).toEqual({
        when: 'c',
        hidden: ['text_a', 'text_b']
      })

      // Check other fields exist
      expect(fields[1].keyname).toBe('text_a')
      expect(fields[2].keyname).toBe('text_b')
      expect(fields[3].keyname).toBe('text_c')
    })

    it('should round-trip conditional validation YAML correctly', () => {
      const yamlContent = readFileSync(
        join(process.cwd(), 'test-fixtures', 'conditional.yml'),
        'utf-8'
      )

      const fields = element.parseYaml(yamlContent)
      
      element.fields = fields.map((fieldData, index) => ({
        id: `field_${index}`,
        ...fieldData
      }))

      const generatedYaml = element.generateYaml()
      const reparsedFields = element.parseYaml(generatedYaml)

      // Verify conditional validation is preserved exactly
      expect(reparsedFields[0].conditional_validation).toEqual(
        fields[0].conditional_validation
      )
    })
  })
})