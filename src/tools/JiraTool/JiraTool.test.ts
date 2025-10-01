import { describe, it, expect } from 'bun:test'
import { z } from 'zod'
import { JiraTool } from './JiraTool'
import { JiraApiClient } from './JiraApiClient'
import { JiraOperations } from './operations'

describe('JiraTool', () => {
  describe('Tool Configuration', () => {
    it('should have correct tool properties', () => {
      expect(JiraTool.name).toBe('jira')
      expect(JiraTool.userFacingName()).toBe('JIRA')
      expect(JiraTool.isReadOnly()).toBe(false)
      expect(JiraTool.isConcurrencySafe()).toBe(true)
      expect(JiraTool.needsPermissions()).toBe(true)
    })

    it('should be enabled by default', async () => {
      const isEnabled = await JiraTool.isEnabled()
      expect(isEnabled).toBe(true)
    })

    it('should return description', async () => {
      const description = await JiraTool.description()
      expect(description).toContain('JIRA')
      expect(typeof description).toBe('string')
      expect(description.length).toBeGreaterThan(0)
    })

    it('should return prompt', async () => {
      const prompt = await JiraTool.prompt()
      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(0)
    })
  })

  describe('Input Schema Validation', () => {
    it('should validate get operation input', () => {
      const validInput = {
        operation: 'get' as const,
        ticketKey: 'TEST-123'
      }

      const result = JiraTool.inputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.operation).toBe('get')
        expect(result.data.ticketKey).toBe('TEST-123')
      }
    })

    it('should validate create operation input', () => {
      const validInput = {
        operation: 'create' as const,
        project: 'TEST',
        issueType: 'Bug',
        summary: 'Test issue',
        description: 'Test description',
        priority: 'High',
        labels: ['test'],
        components: ['Frontend']
      }

      const result = JiraTool.inputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.operation).toBe('create')
        expect(result.data.project).toBe('TEST')
        expect(result.data.issueType).toBe('Bug')
        expect(result.data.summary).toBe('Test issue')
      }
    })

    it('should validate update operation input', () => {
      const validInput = {
        operation: 'update' as const,
        ticketKey: 'TEST-123',
        summary: 'Updated summary',
        status: 'In Progress',
        customFields: { customfield_10001: 'value' }
      }

      const result = JiraTool.inputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.operation).toBe('update')
        expect(result.data.ticketKey).toBe('TEST-123')
        expect(result.data.summary).toBe('Updated summary')
      }
    })

    it('should reject invalid operation', () => {
      const invalidInput = {
        operation: 'invalid'
      }

      const result = JiraTool.inputSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should handle optional fields correctly', () => {
      const minimalInput = {
        operation: 'get' as const
      }

      const result = JiraTool.inputSchema.safeParse(minimalInput)
      expect(result.success).toBe(true)
    })

    it('should validate arrays correctly', () => {
      const inputWithArrays = {
        operation: 'create' as const,
        project: 'TEST',
        issueType: 'Bug',
        summary: 'Test',
        labels: ['bug', 'urgent', 'frontend'],
        components: ['UI', 'API', 'Database']
      }

      const result = JiraTool.inputSchema.safeParse(inputWithArrays)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(Array.isArray(result.data.labels)).toBe(true)
        expect(Array.isArray(result.data.components)).toBe(true)
        expect(result.data.labels).toHaveLength(3)
        expect(result.data.components).toHaveLength(3)
      }
    })
  })

  describe('Rendering Methods', () => {
    it('should render tool use message for get operation', () => {
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const message = JiraTool.renderToolUseMessage(input)
      expect(message).toBe('Getting JIRA ticket TEST-123')
    })

    it('should render tool use message for create operation', () => {
      const input = {
        operation: 'create' as const,
        project: 'TEST',
        summary: 'New issue',
        issueType: 'Bug'
      }
      const message = JiraTool.renderToolUseMessage(input)
      expect(message).toBe('Creating JIRA ticket in project TEST: New issue')
    })

    it('should render tool use message for create operation without project', () => {
      const input = {
        operation: 'create' as const,
        summary: 'New issue',
        issueType: 'Bug'
      }
      const message = JiraTool.renderToolUseMessage(input)
      expect(message).toBe('Creating JIRA ticket: New issue')
    })

    it('should render tool use message for update operation', () => {
      const input = { operation: 'update' as const, ticketKey: 'TEST-123' }
      const message = JiraTool.renderToolUseMessage(input)
      expect(message).toBe('Updating JIRA ticket TEST-123')
    })

    it('should render tool use message for unknown operation', () => {
      const input = { operation: 'unknown' as any }
      const message = JiraTool.renderToolUseMessage(input)
      expect(message).toBe('Performing JIRA operation: unknown')
    })

    it('should render successful get result for assistant', () => {
      const mockTicket = {
        key: 'TEST-123',
        id: '12345',
        fields: {
          summary: 'Test ticket',
          description: 'Test description',
          status: { name: 'Open', statusCategory: { name: 'To Do' } },
          assignee: { displayName: 'John Doe', emailAddress: 'john@example.com' },
          reporter: { displayName: 'Jane Smith', emailAddress: 'jane@example.com' },
          priority: { name: 'High' },
          issuetype: { name: 'Bug' },
          project: { key: 'TEST', name: 'Test Project' },
          created: '2025-01-01T10:00:00.000Z',
          updated: '2025-01-01T12:00:00.000Z',
          labels: ['bug', 'urgent'],
          components: [{ name: 'Frontend' }, { name: 'API' }]
        }
      }

      const output = {
        operation: 'get',
        success: true,
        ticket: mockTicket,
        ticketKey: 'TEST-123'
      }

      const result = JiraTool.renderResultForAssistant(output)
      expect(result).toContain('JIRA Ticket TEST-123:')
      expect(result).toContain('Title: Test ticket')
      expect(result).toContain('Status: Open')
      expect(result).toContain('Priority: High')
      expect(result).toContain('Assignee: John Doe')
      expect(result).toContain('Labels: bug, urgent')
      expect(result).toContain('Components: Frontend, API')
    })

    it('should render error result for assistant', () => {
      const output = {
        operation: 'get',
        success: false,
        error: 'Ticket not found'
      }

      const result = JiraTool.renderResultForAssistant(output)
      expect(result).toBe('JIRA operation failed (get): Ticket not found')
    })

    it('should render create success result', () => {
      const output = {
        operation: 'create',
        success: true,
        ticketKey: 'TEST-124'
      }

      const result = JiraTool.renderResultForAssistant(output)
      expect(result).toBe('Successfully created JIRA ticket: TEST-124')
    })

    it('should render update success result', () => {
      const output = {
        operation: 'update',
        success: true,
        ticketKey: 'TEST-123'
      }

      const result = JiraTool.renderResultForAssistant(output)
      expect(result).toBe('Successfully updated JIRA ticket: TEST-123')
    })

    it('should handle ticket with no assignee', () => {
      const mockTicket = {
        key: 'TEST-123',
        id: '12345',
        fields: {
          summary: 'Test ticket',
          status: { name: 'Open', statusCategory: { name: 'To Do' } },
          assignee: undefined,
          reporter: { displayName: 'Jane Smith', emailAddress: 'jane@example.com' },
          priority: { name: 'High' },
          issuetype: { name: 'Bug' },
          project: { key: 'TEST', name: 'Test Project' },
          created: '2025-01-01T10:00:00.000Z',
          updated: '2025-01-01T12:00:00.000Z',
          labels: [],
          components: []
        }
      }

      const output = {
        operation: 'get',
        success: true,
        ticket: mockTicket,
        ticketKey: 'TEST-123'
      }

      const result = JiraTool.renderResultForAssistant(output)
      expect(result).toContain('Assignee: Unassigned')
      expect(result).toContain('Labels: None')
      expect(result).toContain('Components: None')
    })

    it('should render rejected permission message', () => {
      const element = JiraTool.renderToolUseRejectedMessage()
      expect(element).toBeDefined()
      expect(element.type).toBeDefined()
    })

    it('should render tool result message component', () => {
      const output = {
        operation: 'get',
        success: true,
        ticketKey: 'TEST-123',
        message: 'Test message'
      }

      const element = JiraTool.renderToolResultMessage(output)
      expect(element).toBeDefined()
      expect(element.type).toBeDefined()
    })
  })

  describe('Tool Interface Compliance', () => {
    it('should implement all required Tool interface methods', () => {
      expect(typeof JiraTool.name).toBe('string')
      expect(typeof JiraTool.description).toBe('function')
      expect(typeof JiraTool.userFacingName).toBe('function')
      expect(typeof JiraTool.inputSchema).toBe('object')
      expect(typeof JiraTool.isReadOnly).toBe('function')
      expect(typeof JiraTool.isConcurrencySafe).toBe('function')
      expect(typeof JiraTool.isEnabled).toBe('function')
      expect(typeof JiraTool.needsPermissions).toBe('function')
      expect(typeof JiraTool.prompt).toBe('function')
      expect(typeof JiraTool.renderResultForAssistant).toBe('function')
      expect(typeof JiraTool.renderToolUseMessage).toBe('function')
      expect(typeof JiraTool.renderToolUseRejectedMessage).toBe('function')
      expect(typeof JiraTool.renderToolResultMessage).toBe('function')
      expect(typeof JiraTool.call).toBe('function')
    })

    it('should have proper input schema structure', () => {
      const schema = JiraTool.inputSchema
      expect(schema).toBeDefined()
      expect(schema._def).toBeDefined()
      expect(schema._def.typeName).toBe(z.ZodFirstPartyTypeKind.ZodObject)
    })
  })

  describe('Module Dependencies', () => {
    it('should import JiraApiClient correctly', () => {
      expect(JiraApiClient).toBeDefined()
      expect(typeof JiraApiClient).toBe('function')
    })

    it('should import JiraOperations correctly', () => {
      expect(JiraOperations).toBeDefined()
      expect(typeof JiraOperations).toBe('function')
    })
  })

  describe('Error Handling and Validation', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        {},
        { operation: 'invalid' },
        { operation: 'get', ticketKey: '' },
        { operation: 'create', project: '', issueType: '', summary: '' }
      ]

      malformedInputs.forEach(input => {
        const result = JiraTool.inputSchema.safeParse(input)
        if (result.success) {
          // If parsing succeeds, the data should be reasonable
          expect(['get', 'create', 'update']).toContain(result.data.operation)
        }
      })
    })

    it('should provide meaningful error messages', () => {
      const errorOutput = {
        operation: 'get',
        success: false,
        error: 'Configuration error: Missing JIRA credentials'
      }
      const result = JiraTool.renderResultForAssistant(errorOutput)
      expect(result).toContain('failed')
      expect(result).toContain('Configuration error')
    })
  })

  describe('First Principles Engineering Compliance', () => {
    it('should follow clear naming and structure', () => {
      expect(JiraTool.name).toBe('jira')
      expect(JiraTool.userFacingName()).toBe('JIRA')
      expect(JiraTool.isReadOnly()).toBe(false)
      expect(JiraTool.needsPermissions()).toBe(true)
    })

    it('should maintain focused responsibility', () => {
      const operations = JiraTool.inputSchema.shape.operation._def.values
      expect(operations).toEqual(['get', 'create', 'update'])
    })

    it('should provide clear error messages for self-diagnosis', () => {
      const errorOutput = {
        operation: 'get',
        success: false,
        error: 'JIRA configuration not found. Please configure JIRA settings in your .kode.json file.'
      }
      const result = JiraTool.renderResultForAssistant(errorOutput)
      expect(result).toContain('configuration not found')
      expect(result).toContain('.kode.json')
    })

    it('should support empirical validation', () => {
      expect(typeof JiraTool.renderResultForAssistant).toBe('function')
      expect(typeof JiraTool.renderToolResultMessage).toBe('function')

      const errorOutput = { operation: 'test', success: false, error: 'Test error' }
      const result = JiraTool.renderResultForAssistant(errorOutput)
      expect(result).toContain('failed')
      expect(result).toContain('Test error')
    })
  })
})