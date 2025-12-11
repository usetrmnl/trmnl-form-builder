import { describe, it, expect, beforeEach } from 'vitest'
import '../trmnl-form-builder.js'

describe('TRMNL Form Builder - Public API and Reordering', () => {
  let element

  beforeEach(() => {
    element = document.createElement('trmnl-form-builder')
    document.body.appendChild(element)
    element.nextFieldId = 1
  })

  describe('Public API Methods', () => {
    describe('getYaml()', () => {
      it('should return generated YAML string', () => {
        element.fields = [
          {
            id: 'field_1',
            keyname: 'test',
            field_type: 'string',
            name: 'Test Field'
          }
        ]

        const yaml = element.getYaml()
        
        expect(yaml).toContain('- keyname: test')
        expect(yaml).toContain('field_type: string')
        expect(yaml).toContain('name: Test Field')
      })

      it('should return empty comment when no fields', () => {
        const yaml = element.getYaml()
        
        expect(yaml).toBe('# No fields defined yet')
      })
    })

    describe('getFields()', () => {
      it('should return deep copy of fields array', () => {
        element.fields = [
          {
            id: 'field_1',
            keyname: 'test',
            field_type: 'string',
            name: 'Test Field',
            options: ['a', 'b']
          }
        ]

        const fields = element.getFields()
        
        expect(fields).toHaveLength(1)
        expect(fields[0].keyname).toBe('test')
        
        // Verify it's a deep copy (not reference)
        fields[0].keyname = 'modified'
        fields[0].options.push('c')
        
        expect(element.fields[0].keyname).toBe('test')
        expect(element.fields[0].options).toEqual(['a', 'b'])
      })

      it('should return empty array when no fields', () => {
        const fields = element.getFields()
        
        expect(fields).toEqual([])
      })
    })

    describe('setFields()', () => {
      it('should set fields from array', () => {
        const newFields = [
          {
            id: 'field_1',
            keyname: 'name',
            field_type: 'string',
            name: 'Name'
          },
          {
            id: 'field_2',
            keyname: 'age',
            field_type: 'number',
            name: 'Age'
          }
        ]

        element.setFields(newFields)
        
        expect(element.fields).toHaveLength(2)
        expect(element.fields[0].keyname).toBe('name')
        expect(element.fields[1].keyname).toBe('age')
      })

      it('should set selectedFieldId to first field', () => {
        const newFields = [
          {
            id: 'field_1',
            keyname: 'test',
            field_type: 'string',
            name: 'Test'
          }
        ]

        element.setFields(newFields)
        
        expect(element.selectedFieldId).toBe('field_1')
      })

      it('should create deep copy of provided fields', () => {
        const newFields = [
          {
            id: 'field_1',
            keyname: 'test',
            field_type: 'string',
            name: 'Test',
            options: ['a', 'b']
          }
        ]

        element.setFields(newFields)
        
        // Modify original array
        newFields[0].keyname = 'modified'
        newFields[0].options.push('c')
        
        // Element's fields should be unchanged
        expect(element.fields[0].keyname).toBe('test')
        expect(element.fields[0].options).toEqual(['a', 'b'])
      })

      it('should handle empty array', () => {
        element.fields = [{ id: 'field_1', keyname: 'test' }]
        
        element.setFields([])
        
        expect(element.fields).toEqual([])
        expect(element.selectedFieldId).toBeNull()
      })
    })

    describe('clear()', () => {
      it('should reset all state', () => {
        // Set up some state
        element.fields = [
          { id: 'field_1', keyname: 'test' },
          { id: 'field_2', keyname: 'test2' }
        ]
        element.selectedFieldId = 'field_1'
        element.draggedFieldId = 'field_2'
        element.draggedFromIndex = 1
        element.nextFieldId = 10

        element.clear()

        expect(element.fields).toEqual([])
        expect(element.selectedFieldId).toBeNull()
        expect(element.draggedFieldId).toBeNull()
        expect(element.draggedFromIndex).toBeNull()
        expect(element.nextFieldId).toBe(1)
      })

      it('should work when already empty', () => {
        element.clear()
        
        expect(element.fields).toEqual([])
        expect(element.selectedFieldId).toBeNull()
      })
    })
  })

  describe('Field Reordering', () => {
    beforeEach(() => {
      element.fields = [
        { id: 'field_1', keyname: 'first', field_type: 'string', name: 'First' },
        { id: 'field_2', keyname: 'second', field_type: 'string', name: 'Second' },
        { id: 'field_3', keyname: 'third', field_type: 'string', name: 'Third' },
        { id: 'field_4', keyname: 'fourth', field_type: 'string', name: 'Fourth' }
      ]
    })

    it('should move field forward in list', () => {
      // Move field_1 to position of field_3 (index 2)
      element.reorderFields('field_1', 'field_3')
      
      expect(element.fields[0].keyname).toBe('second')
      expect(element.fields[1].keyname).toBe('third')
      expect(element.fields[2].keyname).toBe('first')
      expect(element.fields[3].keyname).toBe('fourth')
    })

    it('should move field backward in list', () => {
      // Move field_4 to position of field_2 (index 1)
      element.reorderFields('field_4', 'field_2')
      
      expect(element.fields[0].keyname).toBe('first')
      expect(element.fields[1].keyname).toBe('fourth')
      expect(element.fields[2].keyname).toBe('second')
      expect(element.fields[3].keyname).toBe('third')
    })

    it('should move field to beginning', () => {
      // Move field_3 to position of field_1 (index 0)
      element.reorderFields('field_3', 'field_1')
      
      expect(element.fields[0].keyname).toBe('third')
      expect(element.fields[1].keyname).toBe('first')
      expect(element.fields[2].keyname).toBe('second')
      expect(element.fields[3].keyname).toBe('fourth')
    })

    it('should move field to end', () => {
      // Move field_1 to position of field_4 (index 3)
      element.reorderFields('field_1', 'field_4')
      
      expect(element.fields[0].keyname).toBe('second')
      expect(element.fields[1].keyname).toBe('third')
      expect(element.fields[2].keyname).toBe('fourth')
      expect(element.fields[3].keyname).toBe('first')
    })

    it('should handle invalid field IDs gracefully', () => {
      const originalOrder = element.fields.map(f => f.keyname)
      
      // Try to reorder with non-existent IDs
      element.reorderFields('invalid_1', 'field_2')
      
      // Order should remain unchanged
      expect(element.fields.map(f => f.keyname)).toEqual(originalOrder)
    })

    it('should handle same source and target', () => {
      const originalOrder = element.fields.map(f => f.keyname)
      
      // Try to reorder field to its own position
      element.reorderFields('field_2', 'field_2')
      
      // Order should remain unchanged
      expect(element.fields.map(f => f.keyname)).toEqual(originalOrder)
    })

    it('should preserve all field properties during reorder', () => {
      element.fields[0].description = 'Important description'
      element.fields[0].optional = true
      element.fields[0].options = ['a', 'b', 'c']
      
      element.reorderFields('field_1', 'field_3')
      
      const movedField = element.fields[2]
      expect(movedField.keyname).toBe('first')
      expect(movedField.description).toBe('Important description')
      expect(movedField.optional).toBe(true)
      expect(movedField.options).toEqual(['a', 'b', 'c'])
    })
  })

  describe('Integration - API with Reordering', () => {
    it('should maintain field order through getFields/setFields cycle', () => {
      element.fields = [
        { id: 'field_1', keyname: 'first', field_type: 'string', name: 'First' },
        { id: 'field_2', keyname: 'second', field_type: 'string', name: 'Second' },
        { id: 'field_3', keyname: 'third', field_type: 'string', name: 'Third' }
      ]

      // Reorder
      element.reorderFields('field_3', 'field_1')

      // Get fields
      const fields = element.getFields()
      expect(fields[0].keyname).toBe('third')
      expect(fields[1].keyname).toBe('first')
      expect(fields[2].keyname).toBe('second')

      // Clear and set back
      element.clear()
      element.setFields(fields)

      // Order should be preserved
      expect(element.fields[0].keyname).toBe('third')
      expect(element.fields[1].keyname).toBe('first')
      expect(element.fields[2].keyname).toBe('second')
    })

    it('should export reordered fields in correct YAML order', () => {
      element.fields = [
        { id: 'field_1', keyname: 'first', field_type: 'string', name: 'First' },
        { id: 'field_2', keyname: 'second', field_type: 'string', name: 'Second' },
        { id: 'field_3', keyname: 'third', field_type: 'string', name: 'Third' }
      ]

      // Reorder
      element.reorderFields('field_3', 'field_1')

      const yaml = element.getYaml()
      
      // Check order in YAML
      const thirdPos = yaml.indexOf('keyname: third')
      const firstPos = yaml.indexOf('keyname: first')
      const secondPos = yaml.indexOf('keyname: second')

      expect(thirdPos).toBeLessThan(firstPos)
      expect(firstPos).toBeLessThan(secondPos)
    })
  })
})