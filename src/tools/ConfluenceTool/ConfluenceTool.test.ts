import { describe, it, expect } from 'bun:test'
import { z } from 'zod'
import { ConfluenceTool } from './ConfluenceTool'

describe('ConfluenceTool', () => {
  describe('Tool Configuration', () => {
    it('should have correct tool properties', () => {
      expect(ConfluenceTool.name).toBe('confluence')
      expect(ConfluenceTool.userFacingName()).toBe('Confluence')
      expect(ConfluenceTool.isReadOnly()).toBe(false)
      expect(ConfluenceTool.isConcurrencySafe()).toBe(true)
      expect(ConfluenceTool.needsPermissions()).toBe(true)
    })

    it('should be enabled by default', async () => {
      const isEnabled = await ConfluenceTool.isEnabled()
      expect(isEnabled).toBe(true)
    })

    it('should return description', async () => {
      const description = await ConfluenceTool.description()
      expect(description).toContain('Confluence')
      expect(typeof description).toBe('string')
      expect(description.length).toBeGreaterThan(0)
    })

    it('should return prompt', async () => {
      const prompt = await ConfluenceTool.prompt()
      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(0)
    })
  })

  describe('Input Schema Validation', () => {
    describe('Operation Validation', () => {
      it('should validate get operation input', () => {
        const validInput = {
          operation: 'get' as const,
          pageId: '123456'
        }

        const result = ConfluenceTool.inputSchema.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.operation).toBe('get')
          expect(result.data.pageId).toBe('123456')
        }
      })

      it('should validate create operation input', () => {
        const validInput = {
          operation: 'create' as const,
          title: 'Test Page',
          spaceKey: 'DOCS',
          content: '<p>Test content</p>',
          labels: ['test', 'automation']
        }

        const result = ConfluenceTool.inputSchema.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.operation).toBe('create')
          expect(result.data.title).toBe('Test Page')
          expect(result.data.spaceKey).toBe('DOCS')
          expect(result.data.content).toBe('<p>Test content</p>')
        }
      })

      it('should validate update operation input', () => {
        const validInput = {
          operation: 'update' as const,
          pageId: '123456',
          title: 'Updated Title',
          content: '<p>Updated content</p>',
          contentFormat: 'storage' as const
        }

        const result = ConfluenceTool.inputSchema.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.operation).toBe('update')
          expect(result.data.pageId).toBe('123456')
          expect(result.data.title).toBe('Updated Title')
        }
      })

      it('should validate search operation input', () => {
        const validInput = {
          operation: 'search' as const,
          query: 'project documentation',
          searchSpace: 'DOCS',
          limit: 25
        }

        const result = ConfluenceTool.inputSchema.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.operation).toBe('search')
          expect(result.data.query).toBe('project documentation')
          expect(result.data.searchSpace).toBe('DOCS')
        }
      })

      it('should validate list operation input', () => {
        const validInput = {
          operation: 'list' as const,
          spaceKey: 'DOCS',
          contentType: 'page' as const,
          orderBy: 'modified' as const,
          limit: 50
        }

        const result = ConfluenceTool.inputSchema.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.operation).toBe('list')
          expect(result.data.spaceKey).toBe('DOCS')
          expect(result.data.contentType).toBe('page')
        }
      })

      it('should validate spaces operation input', () => {
        const validInput = {
          operation: 'spaces' as const,
          limit: 20,
          expand: ['description', 'homepage']
        }

        const result = ConfluenceTool.inputSchema.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.operation).toBe('spaces')
          expect(result.data.limit).toBe(20)
          expect(result.data.expand).toEqual(['description', 'homepage'])
        }
      })

      it('should validate attachments operation input', () => {
        const validInput = {
          operation: 'attachments' as const,
          pageId: '123456'
        }

        const result = ConfluenceTool.inputSchema.safeParse(validInput)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.operation).toBe('attachments')
          expect(result.data.pageId).toBe('123456')
        }
      })

      it('should reject invalid operation', () => {
        const invalidInput = {
          operation: 'invalid'
        }

        const result = ConfluenceTool.inputSchema.safeParse(invalidInput)
        expect(result.success).toBe(false)
      })
    })

    describe('Field Validation', () => {
      it('should handle optional fields correctly', () => {
        const minimalInput = {
          operation: 'spaces' as const
        }

        const result = ConfluenceTool.inputSchema.safeParse(minimalInput)
        expect(result.success).toBe(true)
      })

      it('should validate arrays correctly', () => {
        const inputWithArrays = {
          operation: 'create' as const,
          title: 'Test Page',
          spaceKey: 'DOCS',
          content: '<p>Test</p>',
          labels: ['test', 'automation', 'confluence'],
          expand: ['body.storage', 'version', 'metadata.labels']
        }

        const result = ConfluenceTool.inputSchema.safeParse(inputWithArrays)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(Array.isArray(result.data.labels)).toBe(true)
          expect(Array.isArray(result.data.expand)).toBe(true)
          expect(result.data.labels).toHaveLength(3)
          expect(result.data.expand).toHaveLength(3)
        }
      })

      it('should validate numeric constraints', () => {
        const inputWithNumbers = {
          operation: 'search' as const,
          query: 'test',
          limit: 50,
          start: 25
        }

        const result = ConfluenceTool.inputSchema.safeParse(inputWithNumbers)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.limit).toBe(50)
          expect(result.data.start).toBe(25)
        }
      })

      it('should reject invalid numeric values', () => {
        const invalidLimit = {
          operation: 'search' as const,
          query: 'test',
          limit: 150 // Max is 100
        }

        const result = ConfluenceTool.inputSchema.safeParse(invalidLimit)
        expect(result.success).toBe(false)
      })

      it('should reject negative start values', () => {
        const negativeStart = {
          operation: 'search' as const,
          query: 'test',
          start: -1
        }

        const result = ConfluenceTool.inputSchema.safeParse(negativeStart)
        expect(result.success).toBe(false)
      })
    })

    describe('Content Format Support', () => {
      it('should support different content formats in schema', () => {
        const formatField = ConfluenceTool.inputSchema.shape.contentFormat
        expect(formatField._def.innerType._def.values).toEqual(['storage', 'view', 'wiki'])
      })

      it('should support search type filtering', () => {
        const searchTypeField = ConfluenceTool.inputSchema.shape.searchType
        expect(searchTypeField._def.innerType._def.values).toEqual(['page', 'blogpost', 'attachment', 'space'])
      })

      it('should support content type filtering for lists', () => {
        const contentTypeField = ConfluenceTool.inputSchema.shape.contentType
        expect(contentTypeField._def.innerType._def.values).toEqual(['page', 'blogpost'])
      })

      it('should support ordering options', () => {
        const orderByField = ConfluenceTool.inputSchema.shape.orderBy
        expect(orderByField._def.innerType._def.values).toEqual(['title', 'created', 'modified'])
      })
    })
  })

  describe('Rendering Methods', () => {
    describe('Tool Use Messages', () => {
      it('should render tool use message for get operation', () => {
        const input = { operation: 'get' as const, pageId: '123456' }
        const message = ConfluenceTool.renderToolUseMessage(input)
        expect(message).toBe('Getting Confluence page 123456')
      })

      it('should render tool use message for get by title', () => {
        const input = {
          operation: 'get' as const,
          pageTitle: 'Test Page',
          spaceKey: 'DOCS'
        }
        const message = ConfluenceTool.renderToolUseMessage(input)
        expect(message).toBe('Getting Confluence page "Test Page" from space DOCS')
      })

      it('should render tool use message for create operation', () => {
        const input = {
          operation: 'create' as const,
          title: 'New Page',
          spaceKey: 'DOCS'
        }
        const message = ConfluenceTool.renderToolUseMessage(input)
        expect(message).toBe('Creating Confluence page "New Page" in space DOCS')
      })

      it('should render tool use message for update operation', () => {
        const input = { operation: 'update' as const, pageId: '123456' }
        const message = ConfluenceTool.renderToolUseMessage(input)
        expect(message).toBe('Updating Confluence page 123456')
      })

      it('should render tool use message for search operation', () => {
        const input = {
          operation: 'search' as const,
          query: 'documentation',
          searchSpace: 'DOCS'
        }
        const message = ConfluenceTool.renderToolUseMessage(input)
        expect(message).toBe('Searching Confluence for "documentation" in space DOCS')
      })

      it('should render tool use message for list operation', () => {
        const input = { operation: 'list' as const, spaceKey: 'DOCS' }
        const message = ConfluenceTool.renderToolUseMessage(input)
        expect(message).toBe('Listing content in Confluence space DOCS')
      })

      it('should render tool use message for spaces operation', () => {
        const input = { operation: 'spaces' as const }
        const message = ConfluenceTool.renderToolUseMessage(input)
        expect(message).toBe('Listing Confluence spaces')
      })

      it('should render tool use message for attachments operation', () => {
        const input = { operation: 'attachments' as const, pageId: '123456' }
        const message = ConfluenceTool.renderToolUseMessage(input)
        expect(message).toBe('Listing attachments for Confluence page 123456')
      })

      it('should render tool use message with instance suffix', () => {
        const input = {
          operation: 'get' as const,
          pageId: '123456',
          instance: 'company'
        }
        const message = ConfluenceTool.renderToolUseMessage(input)
        expect(message).toBe('Getting Confluence page 123456 (company)')
      })
    })

    describe('Result Messages for Assistant', () => {
      it('should render successful get result for assistant', () => {
        const mockPage = {
          id: '123456',
          type: 'page' as const,
          status: 'current' as const,
          title: 'Test Page',
          space: {
            id: 'space1',
            key: 'DOCS',
            name: 'Documentation',
            type: 'global',
            status: 'current'
          },
          version: {
            number: 1,
            when: '2025-01-01T10:00:00.000Z',
            by: {
              type: 'known' as const,
              displayName: 'John Doe',
              email: 'john@example.com'
            },
            minorEdit: false
          },
          metadata: {
            labels: [{ name: 'test' }, { name: 'documentation' }],
            properties: {},
            frontend_url: 'https://company.atlassian.net/wiki/spaces/DOCS/pages/123456',
            created: '2025-01-01T09:00:00.000Z',
            createdBy: {
              type: 'known' as const,
              displayName: 'Jane Smith',
              email: 'jane@example.com'
            }
          },
          body: {
            storage: {
              value: '<p>This is test content for the page.</p>',
              representation: 'storage'
            }
          }
        }

        const output = {
          operation: 'get',
          success: true,
          page: mockPage
        }

        const result = ConfluenceTool.renderResultForAssistant(output)
        expect(result).toContain('**Test Page** (123456)')
        expect(result).toContain('Space: Documentation (DOCS)')
        expect(result).toContain('Status: current')
        expect(result).toContain('Version: 1')
        expect(result).toContain('Labels: test, documentation')
        expect(result).toContain('Content Preview:')
        expect(result).toContain('This is test content for the page.')
      })

      it('should render error result for assistant', () => {
        const output = {
          operation: 'get',
          success: false,
          error: 'Page not found'
        }

        const result = ConfluenceTool.renderResultForAssistant(output)
        expect(result).toBe('Confluence operation failed: Page not found')
      })

      it('should render create success result', () => {
        const mockPage = {
          id: '789012',
          title: 'New Test Page',
          metadata: {
            frontend_url: 'https://company.atlassian.net/wiki/spaces/DOCS/pages/789012'
          }
        }

        const output = {
          operation: 'create',
          success: true,
          page: mockPage
        }

        const result = ConfluenceTool.renderResultForAssistant(output)
        expect(result).toContain('Successfully created Confluence page: New Test Page (789012)')
        expect(result).toContain('URL: https://company.atlassian.net/wiki/spaces/DOCS/pages/789012')
      })

      it('should render update success result', () => {
        const mockPage = {
          id: '123456',
          title: 'Updated Test Page',
          version: { number: 2 },
          metadata: {
            frontend_url: 'https://company.atlassian.net/wiki/spaces/DOCS/pages/123456'
          }
        }

        const output = {
          operation: 'update',
          success: true,
          page: mockPage
        }

        const result = ConfluenceTool.renderResultForAssistant(output)
        expect(result).toContain('Successfully updated Confluence page: Updated Test Page (123456)')
        expect(result).toContain('Version: 2')
        expect(result).toContain('URL: https://company.atlassian.net/wiki/spaces/DOCS/pages/123456')
      })

      it('should render search results', () => {
        const mockSearchResults = {
          results: [
            {
              title: 'First Result',
              excerpt: 'This is the first search result excerpt',
              url: 'https://company.atlassian.net/wiki/spaces/DOCS/pages/111111',
              content: {} as any,
              entityType: 'content' as const,
              lastModified: '2025-01-01T10:00:00.000Z',
              friendlyLastModified: '1 hour ago'
            },
            {
              title: 'Second Result',
              excerpt: 'This is the second search result excerpt',
              url: 'https://company.atlassian.net/wiki/spaces/DOCS/pages/222222',
              content: {} as any,
              entityType: 'content' as const,
              lastModified: '2025-01-01T09:00:00.000Z',
              friendlyLastModified: '2 hours ago'
            }
          ],
          start: 0,
          limit: 25,
          size: 2,
          totalSize: 2,
          cqlQuery: 'text ~ "documentation"',
          searchDuration: 150
        }

        const output = {
          operation: 'search',
          success: true,
          searchResults: mockSearchResults
        }

        const result = ConfluenceTool.renderResultForAssistant(output)
        expect(result).toContain('Found 2 results (showing 2)')
        expect(result).toContain('1. **First Result**')
        expect(result).toContain('This is the first search result excerpt')
        expect(result).toContain('2. **Second Result**')
        expect(result).toContain('This is the second search result excerpt')
      })

      it('should handle empty search results', () => {
        const emptySearchResults = {
          results: [],
          start: 0,
          limit: 25,
          size: 0,
          totalSize: 0,
          cqlQuery: 'text ~ "nonexistent"',
          searchDuration: 50
        }

        const output = {
          operation: 'search',
          success: true,
          searchResults: emptySearchResults
        }

        const result = ConfluenceTool.renderResultForAssistant(output)
        expect(result).toBe('Found 0 results (showing 0)')
      })
    })

    describe('UI Components', () => {
      it('should render rejected permission message', () => {
        const element = ConfluenceTool.renderToolUseRejectedMessage()
        expect(element).toBeDefined()
        expect(element.type).toBeDefined()
      })

      it('should render tool result message component', () => {
        const output = {
          operation: 'get',
          success: true,
          pageId: '123456',
          message: 'Test message'
        }

        const element = ConfluenceTool.renderToolResultMessage(output)
        expect(element).toBeDefined()
        expect(element.type).toBeDefined()
      })
    })
  })

  describe('Multi-Instance Support', () => {
    it('should support instance parameter in schema', () => {
      const instanceField = ConfluenceTool.inputSchema.shape.instance
      expect(instanceField).toBeDefined()
      expect(instanceField.isOptional()).toBe(true)
    })

    it('should render instance information in tool use messages', () => {
      const input = {
        operation: 'get' as const,
        pageId: '123456',
        instance: 'production'
      }
      const message = ConfluenceTool.renderToolUseMessage(input)
      expect(message).toContain('(production)')
    })
  })

  describe('Tool Interface Compliance', () => {
    it('should implement all required Tool interface methods', () => {
      expect(typeof ConfluenceTool.name).toBe('string')
      expect(typeof ConfluenceTool.description).toBe('function')
      expect(typeof ConfluenceTool.userFacingName).toBe('function')
      expect(typeof ConfluenceTool.inputSchema).toBe('object')
      expect(typeof ConfluenceTool.isReadOnly).toBe('function')
      expect(typeof ConfluenceTool.isConcurrencySafe).toBe('function')
      expect(typeof ConfluenceTool.isEnabled).toBe('function')
      expect(typeof ConfluenceTool.needsPermissions).toBe('function')
      expect(typeof ConfluenceTool.prompt).toBe('function')
      expect(typeof ConfluenceTool.renderResultForAssistant).toBe('function')
      expect(typeof ConfluenceTool.renderToolUseMessage).toBe('function')
      expect(typeof ConfluenceTool.renderToolUseRejectedMessage).toBe('function')
      expect(typeof ConfluenceTool.renderToolResultMessage).toBe('function')
      expect(typeof ConfluenceTool.call).toBe('function')
    })

    it('should have proper input schema structure', () => {
      const schema = ConfluenceTool.inputSchema
      expect(schema).toBeDefined()
      expect(schema._def).toBeDefined()
      expect(schema._def.typeName).toBe('ZodObject')
    })

    it('should have correct operation enum values', () => {
      const operationField = ConfluenceTool.inputSchema.shape.operation
      expect(operationField._def.values).toEqual([
        'get', 'create', 'update', 'search', 'list', 'spaces', 'attachments'
      ])
    })
  })

  describe('Error Handling and Validation', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        {},
        { operation: 'invalid' },
        { operation: 'get', pageId: '' },
        { operation: 'create', title: '', spaceKey: '', content: '' }
      ]

      malformedInputs.forEach(input => {
        const result = ConfluenceTool.inputSchema.safeParse(input)
        if (result.success) {
          // If parsing succeeds, the data should be reasonable
          const validOperations = ['get', 'create', 'update', 'search', 'list', 'spaces', 'attachments']
          expect(validOperations).toContain(result.data.operation)
        }
      })
    })

    it('should provide meaningful error messages', () => {
      const errorOutput = {
        operation: 'get',
        success: false,
        error: 'Configuration error: Missing Confluence credentials'
      }
      const result = ConfluenceTool.renderResultForAssistant(errorOutput)
      expect(result).toContain('failed')
      expect(result).toContain('Configuration error')
    })

    it('should handle missing page data gracefully', () => {
      const output = {
        operation: 'get',
        success: true,
        page: null
      }

      // Should not throw and should handle null/undefined gracefully
      expect(() => {
        const result = ConfluenceTool.renderResultForAssistant(output)
        expect(typeof result).toBe('string')
      }).not.toThrow()
    })
  })

  describe('First Principles Engineering Compliance', () => {
    it('should follow clear naming and structure', () => {
      expect(ConfluenceTool.name).toBe('confluence')
      expect(ConfluenceTool.userFacingName()).toBe('Confluence')
      expect(ConfluenceTool.isReadOnly()).toBe(false)
      expect(ConfluenceTool.needsPermissions()).toBe(true)
    })

    it('should maintain focused responsibility', () => {
      const operations = ConfluenceTool.inputSchema.shape.operation._def.values
      expect(operations).toEqual([
        'get', 'create', 'update', 'search', 'list', 'spaces', 'attachments'
      ])
    })

    it('should provide clear error messages for self-diagnosis', () => {
      const errorOutput = {
        operation: 'get',
        success: false,
        error: 'Confluence configuration not found. Please configure Confluence settings in your .kode.json file.'
      }
      const result = ConfluenceTool.renderResultForAssistant(errorOutput)
      expect(result).toContain('configuration not found')
      expect(result).toContain('.kode.json')
    })

    it('should support empirical validation', () => {
      expect(typeof ConfluenceTool.renderResultForAssistant).toBe('function')
      expect(typeof ConfluenceTool.renderToolResultMessage).toBe('function')

      const errorOutput = { operation: 'test', success: false, error: 'Test error' }
      const result = ConfluenceTool.renderResultForAssistant(errorOutput)
      expect(result).toContain('failed')
      expect(result).toContain('Test error')
    })

    it('should demonstrate tool mastery and integration', () => {
      expect(ConfluenceTool.isConcurrencySafe()).toBe(true)
      expect(ConfluenceTool.needsPermissions()).toBe(true)

      const operations = ConfluenceTool.inputSchema.shape.operation._def.values
      expect(operations.length).toBeGreaterThan(5)
    })
  })
})