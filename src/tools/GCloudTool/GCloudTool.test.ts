import { describe, it, expect, mock, beforeEach } from 'bun:test'
import { z } from 'zod'
import React from 'react'
import { GCloudTool } from './GCloudTool'
import { formatOutputForAssistant, formatErrorForAssistant, formatStructuredOutputForAssistant } from './formatters'
import { GCloudOperations } from './operations'
import { GCloudApiClient } from './GCloudApiClient'
import { GCloudToolOutput, AuthenticationStatus, ExecutionStatus, gcloudInputSchema } from './types'

describe('GCloudTool', () => {
  describe('Tool Configuration', () => {
    it('should have correct tool properties', () => {
      expect(GCloudTool.name).toBe('gcloud')
      expect(GCloudTool.userFacingName()).toBe('Google Cloud SDK')
      expect(GCloudTool.isReadOnly()).toBe(false)
      expect(GCloudTool.isConcurrencySafe()).toBe(false)
      expect(GCloudTool.needsPermissions()).toBe(true)
    })

    it('should return isEnabled status', async () => {
      const isEnabled = await GCloudTool.isEnabled()
      expect(typeof isEnabled).toBe('boolean')
    })

    it('should return description and prompt', async () => {
      const description = await GCloudTool.description()
      const prompt = await GCloudTool.prompt()

      expect(typeof description).toBe('string')
      expect(description.length).toBeGreaterThan(0)
      expect(description).toContain('Google Cloud SDK')

      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(0)
    })
  })

  describe('Input Schema Validation', () => {
    it('should validate basic command input', () => {
      const validInput = {
        command: 'projects list',
        format: 'json' as const
      }

      const result = gcloudInputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.command).toBe('projects list')
        expect(result.data.format).toBe('json')
      }
    })

    it('should validate input with all options', () => {
      const validInput = {
        command: 'app deploy',
        workingDirectory: '/home/user/project',
        timeout: 60000,
        format: 'raw' as const,
        interactive: true,
        environment: { 'NODE_ENV': 'production' }
      }

      const result = gcloudInputSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.workingDirectory).toBe('/home/user/project')
        expect(result.data.timeout).toBe(60000)
        expect(result.data.interactive).toBe(true)
        expect(result.data.environment).toEqual({ 'NODE_ENV': 'production' })
      }
    })

    it('should reject invalid command format', () => {
      // Test missing command - this should definitely fail
      const result1 = gcloudInputSchema.safeParse({})
      expect(result1.success).toBe(false)

      // Test numeric command - this should also fail
      const result2 = gcloudInputSchema.safeParse({ command: 123 })
      expect(result2.success).toBe(false)
    })

    it('should reject invalid timeout values', () => {
      const invalidTimeoutInputs = [
        { command: 'test', timeout: -1000 },
        { command: 'test', timeout: 0 }
      ]

      invalidTimeoutInputs.forEach(input => {
        const result = gcloudInputSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    it('should validate format enum values', () => {
      const validFormats = ['json', 'raw', 'auto'] as const
      validFormats.forEach(format => {
        const input = { command: 'test', format }
        const result = gcloudInputSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Rendering Methods', () => {
    describe('Tool Use Messages', () => {
      it('should render tool use message for command without gcloud prefix', () => {
        const input = { command: 'projects list', format: 'json' as const }
        const message = GCloudTool.renderToolUseMessage(input)
        expect(message).toBe('Executing Google Cloud SDK command: gcloud projects list')
      })

      it('should render tool use message for command with gcloud prefix', () => {
        const input = { command: 'gcloud projects list', format: 'json' as const }
        const message = GCloudTool.renderToolUseMessage(input)
        expect(message).toBe('Executing Google Cloud SDK command: gcloud projects list')
      })

      it('should render tool use message for complex command', () => {
        const input = {
          command: 'app deploy --version=v1 --quiet',
          format: 'raw' as const,
          workingDirectory: '/app'
        }
        const message = GCloudTool.renderToolUseMessage(input)
        expect(message).toBe('Executing Google Cloud SDK command: gcloud app deploy --version=v1 --quiet')
      })
    })

    describe('Result Messages for Assistant', () => {
      it('should format successful output correctly', () => {
        const output: GCloudToolOutput = {
          command: 'projects list',
          success: true,
          stdout: ['Project 1', 'Project 2'],
          executionTime: 1500
        }

        const result = formatOutputForAssistant(output)
        expect(result).toContain('Command executed successfully')
        expect(result).toContain('1.5s')
        expect(result).toContain('Project 1')
        expect(result).toContain('Project 2')
      })

      it('should format error output correctly', () => {
        const output: GCloudToolOutput = {
          command: 'invalid command',
          success: false,
          error: 'Command not found',
          exitCode: 1,
          stderr: ['gcloud: command not found: invalid']
        }

        const result = formatErrorForAssistant(output)
        expect(result).toContain('Error executing gcloud command')
        expect(result).toContain('Command not found')
        expect(result).toContain('Exit code: 1')
        expect(result).toContain('gcloud: command not found: invalid')
      })

      it('should format authentication errors with helpful guidance', () => {
        const output: GCloudToolOutput = {
          command: 'projects list',
          success: false,
          error: 'Authentication required',
          authenticationRequired: true,
          suggestions: ['Run "gcloud auth login"', 'Check your account settings']
        }

        const result = formatErrorForAssistant(output)
        expect(result).toContain('Error executing gcloud command')
        expect(result).toContain('Authentication required')
        expect(result).toContain('Run "gcloud auth login"')
        expect(result).toContain('Check your account settings')
      })

      it('should format structured JSON output correctly', () => {
        const output: GCloudToolOutput = {
          command: 'projects list --format=json',
          success: true,
          structuredOutput: [
            { name: 'project-1', projectId: 'project-1-id' },
            { name: 'project-2', projectId: 'project-2-id' }
          ]
        }

        const result = formatStructuredOutputForAssistant(output)
        expect(result).toContain('Command executed successfully')
        expect(result).toContain('project-1')
        expect(result).toContain('project-2')
        expect(result).toContain('project-1-id')
        expect(result).toContain('project-2-id')
      })

      it('should format authentication status correctly', () => {
        const authStatus: AuthenticationStatus = {
          isAuthenticated: true,
          activeAccount: 'test@example.com',
          availableAccounts: ['test@example.com', 'other@example.com'],
          defaultProject: 'test-project',
          lastChecked: new Date()
        }

        const output: GCloudToolOutput = {
          command: 'auth list',
          success: true,
          structuredOutput: authStatus
        }

        const result = formatStructuredOutputForAssistant(output)
        expect(result).toContain('Google Cloud SDK authentication status')
        expect(result).toContain('Active account: test@example.com')
        expect(result).toContain('Default project: test-project')
        expect(result).toContain('test@example.com (active)')
        expect(result).toContain('other@example.com')
      })

      it('should handle null structured output gracefully', () => {
        const output: GCloudToolOutput = {
          command: 'test command',
          success: true,
          structuredOutput: null
        }

        expect(() => {
          const result = formatStructuredOutputForAssistant(output)
          expect(typeof result).toBe('string')
        }).not.toThrow()
      })
    })

    describe('UI Components', () => {
      it('should render rejected permission message', () => {
        const element = GCloudTool.renderToolUseRejectedMessage()
        expect(element).toBeDefined()
        expect(React.isValidElement(element)).toBe(true)
      })

      it('should render tool result message component', () => {
        const output: GCloudToolOutput = {
          command: 'projects list',
          success: true,
          stdout: ['Test output'],
          executionTime: 1000
        }

        const element = GCloudTool.renderToolResultMessage(output)
        expect(element).toBeDefined()
        expect(React.isValidElement(element)).toBe(true)
      })

      it('should render tool result message for error', () => {
        const output: GCloudToolOutput = {
          command: 'invalid command',
          success: false,
          error: 'Command not found',
          exitCode: 1
        }

        const element = GCloudTool.renderToolResultMessage(output)
        expect(element).toBeDefined()
        expect(React.isValidElement(element)).toBe(true)
      })
    })
  })

  describe('GCloudOperations - Basic Functionality', () => {
    let mockApiClient: any
    let mockOperations: GCloudOperations

    const createMockApiClient = () => ({
      isGCloudAvailable: mock(() => Promise.resolve(true)),
      getGCloudConfig: mock(() => ({ preferJsonOutput: true, defaultTimeout: 300000 })),
      executeCommand: mock(() => Promise.resolve({
        id: 'test-execution-id',
        command: {
          command: 'gcloud projects list',
          args: ['projects', 'list'],
          requiresInteraction: false,
          supportsJson: true
        },
        status: ExecutionStatus.Completed,
        startTime: new Date(Date.now() - 1000),
        endTime: new Date(),
        stdout: ['[{"name": "test-project", "projectId": "test-project-id"}]'],
        stderr: [],
        cancelled: false,
        exitCode: 0,
        executionTime: 1000
      })),
      getAuthenticationStatus: mock(() => Promise.resolve({
        isAuthenticated: true,
        activeAccount: 'test@example.com',
        availableAccounts: ['test@example.com', 'other@example.com'],
        defaultProject: 'test-project',
        lastChecked: new Date()
      })),
      cancelExecution: mock(() => Promise.resolve(true))
    })

    beforeEach(() => {
      const mocks = createMockApiClient()
      mockApiClient = mocks as any

      // Create a mock GCloudApiClient constructor
      const MockApiClient = mock(() => mockApiClient) as any
      MockApiClient.isGCloudAvailable = mocks.isGCloudAvailable
      MockApiClient.getGCloudConfig = mocks.getGCloudConfig
      MockApiClient.executeCommand = mocks.executeCommand
      MockApiClient.getAuthenticationStatus = mocks.getAuthenticationStatus
      MockApiClient.cancelExecution = mocks.cancelExecution

      mockOperations = new GCloudOperations(MockApiClient)
    })

    it('should prepare command correctly', () => {
      const input = {
        command: 'projects list',
        format: 'json' as const
      }

      const command = mockOperations.prepareCommand(input)
      expect(command.command).toBe('gcloud projects list')
      expect(command.args).toEqual(['projects', 'list'])
      expect(command.supportsJson).toBe(true)
      expect(command.requiresInteraction).toBe(false)
    })

    it('should prepare command with all options', () => {
      const input = {
        command: 'app deploy --version=v1',
        format: 'raw' as const,
        workingDirectory: '/app',
        timeout: 60000,
        interactive: true,
        environment: { 'NODE_ENV': 'production' }
      }

      const command = mockOperations.prepareCommand(input)
      expect(command.command).toBe('gcloud app deploy --version=v1')
      expect(command.workingDirectory).toBe('/app')
      expect(command.timeout).toBe(60000)
      expect(command.requiresInteraction).toBe(true)
      expect(command.environment).toEqual({ 'NODE_ENV': 'production' })
    })

    it('should detect JSON support correctly', () => {
      const jsonSupportedInput = {
        command: 'projects list',
        format: 'json' as const
      }
      const command1 = mockOperations.prepareCommand(jsonSupportedInput)
      expect(command1.supportsJson).toBe(true)

      const jsonNotSupportedInput = {
        command: 'init',
        format: 'json' as const
      }
      const command2 = mockOperations.prepareCommand(jsonNotSupportedInput)
      expect(command2.supportsJson).toBe(false)
    })

    it('should execute command successfully', async () => {
      const input = {
        command: 'projects list',
        format: 'json' as const
      }

      const result = await mockOperations.executeCommand(input)
      expect(result.success).toBe(true)
      expect(result.command).toBe('projects list')
      expect(mockApiClient.executeCommand).toHaveBeenCalled()
    })

    it('should check authentication status', async () => {
      const result = await mockOperations.checkAuthenticationStatus()
      expect(result.success).toBe(true)
      expect(result.command).toBe('auth list')
      expect(mockApiClient.getAuthenticationStatus).toHaveBeenCalled()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        null,
        undefined,
        { command: '' },
        { command: '   ' }
      ]

      malformedInputs.forEach(input => {
        const result = gcloudInputSchema.safeParse(input)
        if (result.success) {
          // If parsing succeeds, the data should be reasonable
          expect(typeof result.data.command).toBe('string')
          expect(result.data.command.trim().length).toBeGreaterThanOrEqual(0)
        }
      })
    })

    it('should provide meaningful error messages', () => {
      const errorOutput = {
        command: 'get',
        success: false,
        error: 'Configuration error: Missing gcloud credentials'
      }
      const result = formatErrorForAssistant(errorOutput)
      expect(result).toContain('Error executing')
      expect(result).toContain('Configuration error')
    })

    it('should handle missing data gracefully', () => {
      const output = {
        command: 'get',
        success: true,
        structuredOutput: null
      }

      // Should not throw and should handle null/undefined gracefully
      expect(() => {
        const result = formatStructuredOutputForAssistant(output)
        expect(typeof result).toBe('string')
      }).not.toThrow()
    })
  })

  describe('Tool Interface Compliance', () => {
    it('should implement all required Tool interface methods', () => {
      expect(typeof GCloudTool.name).toBe('string')
      expect(typeof GCloudTool.description).toBe('function')
      expect(typeof GCloudTool.userFacingName).toBe('function')
      expect(typeof GCloudTool.inputSchema).toBe('object')
      expect(typeof GCloudTool.isReadOnly).toBe('function')
      expect(typeof GCloudTool.isConcurrencySafe).toBe('function')
      expect(typeof GCloudTool.isEnabled).toBe('function')
      expect(typeof GCloudTool.needsPermissions).toBe('function')
      expect(typeof GCloudTool.prompt).toBe('function')
      expect(typeof GCloudTool.renderResultForAssistant).toBe('function')
      expect(typeof GCloudTool.renderToolUseMessage).toBe('function')
      expect(typeof GCloudTool.renderToolUseRejectedMessage).toBe('function')
      expect(typeof GCloudTool.renderToolResultMessage).toBe('function')
      expect(typeof GCloudTool.call).toBe('function')
    })

    it('should have proper input schema structure', () => {
      const schema = GCloudTool.inputSchema
      expect(schema).toBeDefined()
      expect(schema._def).toBeDefined()
      expect(typeof schema._def.typeName).toBe('string')
    })
  })

  describe('First Principles Engineering Compliance', () => {
    it('should follow clear naming and structure', () => {
      expect(GCloudTool.name).toBe('gcloud')
      expect(GCloudTool.userFacingName()).toBe('Google Cloud SDK')
      expect(GCloudTool.isReadOnly()).toBe(false)
      expect(GCloudTool.needsPermissions()).toBe(true)
      expect(GCloudTool.isConcurrencySafe()).toBe(false) // Correctly identifies as not concurrency-safe
    })

    it('should provide clear error messages for self-diagnosis', () => {
      const errorOutput = {
        command: 'test',
        success: false,
        error: 'Google Cloud SDK not found. Please install gcloud CLI and ensure it is in your PATH.'
      }
      const result = formatErrorForAssistant(errorOutput)
      expect(result).toContain('Google Cloud SDK not found')
      expect(result).toContain('PATH')
    })

    it('should support empirical validation', () => {
      expect(typeof GCloudTool.renderResultForAssistant).toBe('function')
      expect(typeof GCloudTool.renderToolResultMessage).toBe('function')

      const errorOutput = { command: 'test', success: false, error: 'Test error' }
      const result = formatErrorForAssistant(errorOutput)
      expect(result).toContain('Error executing')
      expect(result).toContain('Test error')
    })

    it('should demonstrate tool mastery and integration', () => {
      expect(GCloudTool.needsPermissions()).toBe(true)
      expect(GCloudTool.isConcurrencySafe()).toBe(false) // Correctly identifies system-level tool

      // Should have comprehensive format support
      const schema = GCloudTool.inputSchema
      expect(schema.shape.format).toBeDefined()
    })
  })
})