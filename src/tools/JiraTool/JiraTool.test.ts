import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test'

// Mock the modules before importing
mock.module('@utils/config', () => ({
  getGlobalConfig: mock(() => Promise.resolve({}))
}))

mock.module('@utils/log', () => ({
  logError: mock(() => {})
}))

mock.module('node-fetch', () => ({
  default: mock(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  }))
}))

// Import after mocking
import { JiraTool } from './JiraTool'
import { getGlobalConfig } from '@utils/config'
import { logError } from '@utils/log'
import fetch from 'node-fetch'

// Get references to the mocked functions
const mockGetGlobalConfig = getGlobalConfig as any
const mockLogError = logError as any
const mockFetch = fetch as any

describe('JiraTool', () => {
  const mockConfig = {
    jira: {
      baseUrl: 'https://test.atlassian.net',
      username: 'test@example.com',
      apiToken: 'test-token'
    }
  }

  const mockContext = {
    messageId: 'test-message-id',
    abortController: new AbortController(),
    readFileTimestamps: {},
    options: { verbose: true }
  }

  const mockTicket = {
    key: 'TEST-123',
    id: '12345',
    fields: {
      summary: 'Test ticket',
      description: 'Test description',
      status: {
        name: 'Open',
        statusCategory: {
          name: 'To Do'
        }
      },
      assignee: {
        displayName: 'John Doe',
        emailAddress: 'john@example.com'
      },
      reporter: {
        displayName: 'Jane Smith',
        emailAddress: 'jane@example.com'
      },
      priority: {
        name: 'High'
      },
      issuetype: {
        name: 'Bug'
      },
      project: {
        key: 'TEST',
        name: 'Test Project'
      },
      created: '2025-01-01T10:00:00.000Z',
      updated: '2025-01-01T12:00:00.000Z',
      labels: ['bug', 'urgent'],
      components: [
        { name: 'Frontend' },
        { name: 'API' }
      ]
    }
  }

  beforeEach(() => {
    // Reset mocks
    mockGetGlobalConfig.mockClear?.()
    mockLogError.mockClear?.()
    mockFetch.mockClear?.()
    
    // Set default return values
    mockGetGlobalConfig.mockImplementation?.(() => Promise.resolve(mockConfig))
    mockFetch.mockImplementation?.(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({})
    }))
  })

  afterEach(() => {
    mockGetGlobalConfig.mockReset?.()
    mockLogError.mockReset?.()
    mockFetch.mockReset?.()
  })

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
    })

    it('should reject invalid operation', () => {
      const invalidInput = {
        operation: 'invalid'
      }
      
      const result = JiraTool.inputSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('Configuration Handling', () => {
    it('should throw error when JIRA config is missing', async () => {
      mockGetGlobalConfig.mockImplementation?.(() => Promise.resolve({}))
      
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toContain('JIRA configuration not found')
    })

    it('should throw error when JIRA config is incomplete', async () => {
      mockGetGlobalConfig.mockImplementation?.(() => Promise.resolve({
        jira: {
          baseUrl: 'https://test.atlassian.net'
          // missing username and apiToken
        }
      }))
      
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toContain('Incomplete JIRA configuration')
    })
  })

  describe('Get Operation', () => {
    beforeEach(() => {
      mockFetch.mockImplementation?.(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTicket)
      }))
    })

    it('should successfully get a ticket', async () => {
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(true)
      expect(result.value.data.ticket).toEqual(mockTicket)
      expect(result.value.data.ticketKey).toBe('TEST-123')
    })

    it('should make correct API call for get operation', async () => {
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const generator = JiraTool.call(input, mockContext)
      await generator.next()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/TEST-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      )
    })

    it('should require ticketKey for get operation', async () => {
      const input = { operation: 'get' as const }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toContain('ticketKey is required')
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('{"errorMessages":["Issue does not exist"]}')
      } as any)
      
      const input = { operation: 'get' as const, ticketKey: 'INVALID-123' }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toContain('JIRA API error (404)')
      expect(result.value.data.error).toContain('Issue does not exist')
    })
  })

  describe('Create Operation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ key: 'TEST-124' })
      } as any)
    })

    it('should successfully create a ticket', async () => {
      const input = {
        operation: 'create' as const,
        project: 'TEST',
        issueType: 'Bug',
        summary: 'New test issue'
      }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(true)
      expect(result.value.data.ticketKey).toBe('TEST-124')
    })

    it('should make correct API call for create operation', async () => {
      const input = {
        operation: 'create' as const,
        project: 'TEST',
        issueType: 'Bug',
        summary: 'New test issue',
        description: 'Test description',
        priority: 'High',
        labels: ['test'],
        components: ['Frontend']
      }
      const generator = JiraTool.call(input, mockContext)
      await generator.next()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"summary":"New test issue"')
        })
      )
    })

    it('should require project, issueType, and summary for create operation', async () => {
      const input = { operation: 'create' as const, project: 'TEST' }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toContain('project, issueType, and summary are required')
    })

    it('should format description as Atlassian Document Format', async () => {
      const input = {
        operation: 'create' as const,
        project: 'TEST',
        issueType: 'Bug',
        summary: 'Test issue',
        description: 'Test description'
      }
      const generator = JiraTool.call(input, mockContext)
      await generator.next()
      
      const callArgs = mockFetch.mock.calls[0][1]
      const body = JSON.parse(callArgs.body as string)
      
      expect(body.fields.description).toEqual({
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{
            type: 'text',
            text: 'Test description'
          }]
        }]
      })
    })
  })

  describe('Update Operation', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      } as any)
    })

    it('should successfully update a ticket', async () => {
      const input = {
        operation: 'update' as const,
        ticketKey: 'TEST-123',
        summary: 'Updated summary'
      }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(true)
      expect(result.value.data.ticketKey).toBe('TEST-123')
    })

    it('should require ticketKey for update operation', async () => {
      const input = { operation: 'update' as const, summary: 'Updated' }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toContain('ticketKey is required')
    })

    it('should handle status transitions', async () => {
      // Mock transitions API call
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            transitions: [
              { id: '21', to: { name: 'In Progress' } }
            ]
          })
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        } as any)
      
      const input = {
        operation: 'update' as const,
        ticketKey: 'TEST-123',
        status: 'In Progress'
      }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.data.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledTimes(2)
      
      // Check transitions API call
      expect(mockFetch).toHaveBeenNthCalledWith(1,
        'https://test.atlassian.net/rest/api/3/issue/TEST-123/transitions',
        expect.objectContaining({ method: 'GET' })
      )
      
      // Check transition execution
      expect(mockFetch).toHaveBeenNthCalledWith(2,
        'https://test.atlassian.net/rest/api/3/issue/TEST-123/transitions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"id":"21"')
        })
      )
    })

    it('should handle invalid status transitions', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          transitions: [
            { id: '21', to: { name: 'In Progress' } }
          ]
        })
      } as any)
      
      const input = {
        operation: 'update' as const,
        ticketKey: 'TEST-123',
        status: 'Invalid Status'
      }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toContain('Status transition to "Invalid Status" not available')
    })
  })

  describe('Rendering Methods', () => {
    it('should render tool use message correctly', () => {
      const getInput = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const createInput = { operation: 'create' as const, project: 'TEST', summary: 'New issue' }
      const updateInput = { operation: 'update' as const, ticketKey: 'TEST-123' }
      
      expect(JiraTool.renderToolUseMessage(getInput, { verbose: true }))
        .toBe('Getting JIRA ticket TEST-123')
      expect(JiraTool.renderToolUseMessage(createInput, { verbose: true }))
        .toBe('Creating JIRA ticket in project TEST: New issue')
      expect(JiraTool.renderToolUseMessage(updateInput, { verbose: true }))
        .toBe('Updating JIRA ticket TEST-123')
    })

    it('should render successful result for assistant', () => {
      const successOutput = {
        operation: 'get',
        success: true,
        ticket: mockTicket,
        ticketKey: 'TEST-123'
      }
      
      const result = JiraTool.renderResultForAssistant(successOutput)
      expect(result).toContain('JIRA Ticket TEST-123:')
      expect(result).toContain('Title: Test ticket')
      expect(result).toContain('Status: Open')
      expect(result).toContain('Priority: High')
    })

    it('should render error result for assistant', () => {
      const errorOutput = {
        operation: 'get',
        success: false,
        error: 'Ticket not found'
      }
      
      const result = JiraTool.renderResultForAssistant(errorOutput)
      expect(result).toBe('JIRA operation failed: Ticket not found')
    })

    it('should render create success result', () => {
      const createOutput = {
        operation: 'create',
        success: true,
        ticketKey: 'TEST-124'
      }
      
      const result = JiraTool.renderResultForAssistant(createOutput)
      expect(result).toBe('Successfully created JIRA ticket: TEST-124')
    })

    it('should render update success result', () => {
      const updateOutput = {
        operation: 'update',
        success: true,
        ticketKey: 'TEST-123'
      }
      
      const result = JiraTool.renderResultForAssistant(updateOutput)
      expect(result).toBe('Successfully updated JIRA ticket: TEST-123')
    })
  })

  describe('Error Handling', () => {
    it('should log errors and return error result', async () => {
      const error = new Error('Network error')
      mockFetch.mockRejectedValue(error)
      
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(mockLogError).toHaveBeenCalledWith(error)
      expect(result.value.type).toBe('result')
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toBe('Network error')
    })

    it('should handle unknown operations', async () => {
      const input = { operation: 'unknown' as any }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toContain('Unknown operation: unknown')
    })

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValue('String error')
      
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const generator = JiraTool.call(input, mockContext)
      const result = await generator.next()
      
      expect(result.value.data.success).toBe(false)
      expect(result.value.data.error).toBe('String error')
    })
  })

  describe('Authentication', () => {
    it('should create correct Basic Auth header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTicket)
      } as any)
      
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const generator = JiraTool.call(input, mockContext)
      await generator.next()
      
      const expectedAuth = Buffer.from('test@example.com:test-token').toString('base64')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Basic ${expectedAuth}`
          })
        })
      )
    })
  })

  describe('URL Construction', () => {
    it('should handle base URLs with trailing slashes', async () => {
      mockGetGlobalConfig.mockResolvedValue({
        jira: {
          baseUrl: 'https://test.atlassian.net/',
          username: 'test@example.com',
          apiToken: 'test-token'
        }
      })
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTicket)
      } as any)
      
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const generator = JiraTool.call(input, mockContext)
      await generator.next()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/TEST-123',
        expect.any(Object)
      )
    })

    it('should handle base URLs with multiple trailing slashes', async () => {
      mockGetGlobalConfig.mockResolvedValue({
        jira: {
          baseUrl: 'https://test.atlassian.net///',
          username: 'test@example.com',
          apiToken: 'test-token'
        }
      })
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTicket)
      } as any)
      
      const input = { operation: 'get' as const, ticketKey: 'TEST-123' }
      const generator = JiraTool.call(input, mockContext)
      await generator.next()
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.atlassian.net/rest/api/3/issue/TEST-123',
        expect.any(Object)
      )
    })
  })
})
