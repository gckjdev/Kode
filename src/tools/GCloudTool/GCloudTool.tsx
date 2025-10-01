import React from 'react'
import { Tool, ToolUseContext } from '@tool'
import type { ToolResult } from '@tool'
import { DESCRIPTION, TOOL_NAME_FOR_PROMPT, DETAILED_PROMPT } from './prompt'
import { GCloudApiClient } from './GCloudApiClient'
import { GCloudOperations } from './operations'
import { gcloudInputSchema, GCloudInput, GCloudToolOutput } from './types'
import { formatOutputForAssistant } from './formatters'
import { GCloudToolResultComponent, GCloudToolRejectedMessage, GCloudToolUseMessage } from './components'

export const GCloudTool = {
  name: TOOL_NAME_FOR_PROMPT,
  
  async description() {
    return DESCRIPTION
  },
  
  userFacingName: () => 'Google Cloud SDK',
  
  inputSchema: gcloudInputSchema,
  
  isReadOnly: () => false,
  
  isConcurrencySafe: () => false,
  
  async isEnabled() {
    try {
      const apiClient = new GCloudApiClient()
      return await apiClient.isGCloudAvailable()
    } catch (error) {
      return false
    }
  },
  
  needsPermissions() {
    return true
  },
  
  async prompt() {
    return DETAILED_PROMPT
  },
  
  renderResultForAssistant(output: GCloudToolOutput) {
    return formatOutputForAssistant(output)
  },
  
  renderToolUseMessage(input: GCloudInput) {
    const command = input.command.startsWith('gcloud ') ? input.command : `gcloud ${input.command}`
    return `Executing Google Cloud SDK command: ${command}`
  },
  
  renderToolUseRejectedMessage() {
    return React.createElement(GCloudToolRejectedMessage)
  },
  
  renderToolResultMessage(output: GCloudToolOutput) {
    return React.createElement(GCloudToolResultComponent, { result: output })
  },
  
  async *call(
    input: GCloudInput,
    context: ToolUseContext
  ): AsyncGenerator<ToolResult> {
    try {
      // Initialize API client and operations
      const apiClient = new GCloudApiClient()
      const operations = new GCloudOperations(apiClient)
      
      // Check if gcloud is available
      const isAvailable = await apiClient.isGCloudAvailable()
      if (!isAvailable) {
        const result: GCloudToolOutput = {
          command: input.command,
          success: false,
          error: 'Google Cloud SDK not found. Please install it from https://cloud.google.com/sdk/docs/install',
          suggestions: [
            'Install Google Cloud SDK',
            'Add gcloud to your PATH'
          ]
        }
        
        yield {
          type: 'result',
          data: result,
          resultForAssistant: this.renderResultForAssistant(result)
        }
        return
      }
      
      // Check authentication status first
      const authStatus = await operations.checkAuthenticationStatus()
      
      // If not authenticated and command is not an auth command, show auth error
      if (!authStatus.success && !input.command.startsWith('auth ') && !input.command.includes('auth ')) {
        yield {
          type: 'result',
          data: authStatus,
          resultForAssistant: this.renderResultForAssistant(authStatus)
        }
        return
      }
      
      // Execute command
      const result = await operations.executeCommand(input)
      
      yield {
        type: 'result',
        data: result,
        resultForAssistant: this.renderResultForAssistant(result)
      }
    } catch (error) {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error)
      const result: GCloudToolOutput = {
        command: input.command,
        success: false,
        error: `Unexpected error: ${errorMessage}`
      }
      
      yield {
        type: 'result',
        data: result,
        resultForAssistant: this.renderResultForAssistant(result)
      }
    }
  }
} satisfies Tool
