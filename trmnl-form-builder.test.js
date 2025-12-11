import { describe, it, expect, beforeAll } from 'vitest'
import './trmnl-form-builder.js'

describe('TRMNL Form Builder', () => {
  it('should register the custom element', () => {
    expect(customElements.get('trmnl-form-builder')).toBeDefined()
  })
})