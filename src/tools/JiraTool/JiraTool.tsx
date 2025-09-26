import { Box, Text } from 'ink'
import React from 'react'
import { z } from 'zod'
import fetch from 'node-fetch'
import { Cost } from '@components/Cost'
import { FallbackToolUseRejectedMessage } from '@components/FallbackToolUseRejectedMessage'
import { Tool, ToolUseContext } from '@tool'
import { DESCRIPTION, TOOL_NAME_FOR_PROMPT } from './prompt'
import { getGlobalConfig } from '@utils/config'
import { logError } from '@utils/log'

const inputSchema = z.strictObject({
  operation: z.enum(['get', 'create', 'update']).describe('The operation to perform'),
  
  // For get and update operations
  ticketKey: z.string().optional().describe('The JIRA ticket key (e.g., PROJ-123) - required for get and update operations'),
  
  // For create operation
  project: z.string().optional().describe('Project key for creating tickets'),
  issueType: z.string().optional().describe('Issue type (e.g., Bug, Task, Story) - required for create operation'),
  
  // Common fields for create and update
  summary: z.string().optional().describe('Ticket summary/title'),
  description: z.string().optional().describe('Ticket description'),
  assignee: z.string().optional().describe('Assignee username or email'),
  priority: z.string().optional().describe('Priority name (e.g., High, Medium, Low)'),
  labels: z.array(z.string()).optional().describe('Array of labels to add'),
  components: z.array(z.string()).optional().describe('Array of component names'),
  
  // For update operation
  status: z.string().optional().describe('Status to transition to'),
  customFields: z.record(z.any()).optional().describe('Custom field updates as key-value pairs'),
})

type Input = z.infer<typeof inputSchema>

interface JiraConfig {
  baseUrl: string
  username: string
  apiToken: string
}

interface JiraTicket {
  key: string
  id: string
  fields: {
    summary: string
    description?: string
    status: {
      name: string
      statusCategory: {
        name: string
      }
    }
    assignee?: {
      displayName: string
      emailAddress: string
    }
    reporter: {
      displayName: string
      emailAddress: string
    }
    priority: {
      name: string
    }
    issuetype: {
      name: string
    }
    project: {
      key: string
      name: string
    }
    created: string
    updated: string
    labels: string[]
    components: Array<{
      name: string
    }>
  }
}

type Output = {
  operation: string
  success: boolean
  ticket?: JiraTicket
  ticketKey?: string
  message?: string
  error?: string
}

async function getJiraConfig(): Promise<JiraConfig> {
  const config = getGlobalConfig()
  
  const jiraConfig = config.jira
  if (!jiraConfig) {
    throw new Error('JIRA configuration not found. Please configure JIRA settings in your .kode.json file.')
  }
  
  if (!jiraConfig.baseUrl || !jiraConfig.username || !jiraConfig.apiToken) {
    throw new Error('Incomplete JIRA configuration. Please ensure baseUrl, username, and apiToken are set.')
  }
  
  return jiraConfig as JiraConfig
}

async function makeJiraRequest(
  config: JiraConfig,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' = 'GET',
  body?: any
): Promise<any> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/rest/api/3/${endpoint}`
  const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64')
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `JIRA API error (${response.status}): ${response.statusText}`
    
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.errorMessages) {
        errorMessage += ` - ${errorJson.errorMessages.join(', ')}`
      }
      if (errorJson.errors) {
        const errorDetails = Object.entries(errorJson.errors).map(([key, value]) => `${key}: ${value}`).join(', ')
        errorMessage += ` - ${errorDetails}`
      }
    } catch {
      errorMessage += ` - ${errorText}`
    }
    
    throw new Error(errorMessage)
  }
  
  return response.json()
}

async function getTicket(config: JiraConfig, ticketKey: string): Promise<JiraTicket> {
  return makeJiraRequest(config, `issue/${ticketKey}`, 'GET')
}

async function createTicket(config: JiraConfig, input: Input): Promise<{ key: string }> {
  if (!input.project || !input.issueType || !input.summary) {
    throw new Error('project, issueType, and summary are required for creating tickets')
  }
  
  const fields: any = {
    project: {
      key: input.project
    },
    issuetype: {
      name: input.issueType
    },
    summary: input.summary,
  }
  
  if (input.description) {
    fields.description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: input.description
            }
          ]
        }
      ]
    }
  }
  
  if (input.assignee) {
    fields.assignee = {
      name: input.assignee
    }
  }
  
  if (input.priority) {
    fields.priority = {
      name: input.priority
    }
  }
  
  if (input.labels && input.labels.length > 0) {
    fields.labels = input.labels
  }
  
  if (input.components && input.components.length > 0) {
    fields.components = input.components.map(name => ({ name }))
  }
  
  return makeJiraRequest(config, 'issue', 'POST', { fields })
}

async function updateTicket(config: JiraConfig, input: Input): Promise<void> {
  if (!input.ticketKey) {
    throw new Error('ticketKey is required for updating tickets')
  }
  
  const fields: any = {}
  
  if (input.summary) {
    fields.summary = input.summary
  }
  
  if (input.description) {
    fields.description = {
      type: 'doc',
      version: 1,
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: input.description
            }
          ]
        }
      ]
    }
  }
  
  if (input.assignee) {
    fields.assignee = {
      name: input.assignee
    }
  }
  
  if (input.priority) {
    fields.priority = {
      name: input.priority
    }
  }
  
  if (input.labels) {
    fields.labels = input.labels
  }
  
  if (input.components) {
    fields.components = input.components.map(name => ({ name }))
  }
  
  if (input.customFields) {
    Object.assign(fields, input.customFields)
  }
  
  const updateBody: any = {}
  
  if (Object.keys(fields).length > 0) {
    updateBody.fields = fields
  }
  
  // Handle status transitions separately
  if (input.status) {
    // First get available transitions
    const transitions = await makeJiraRequest(config, `issue/${input.ticketKey}/transitions`, 'GET')
    const targetTransition = transitions.transitions.find((t: any) => 
      t.to.name.toLowerCase() === input.status!.toLowerCase()
    )
    
    if (targetTransition) {
      await makeJiraRequest(config, `issue/${input.ticketKey}/transitions`, 'POST', {
        transition: {
          id: targetTransition.id
        }
      })
    } else {
      throw new Error(`Status transition to "${input.status}" not available for ticket ${input.ticketKey}`)
    }
  }
  
  if (Object.keys(updateBody).length > 0) {
    await makeJiraRequest(config, `issue/${input.ticketKey}`, 'PUT', updateBody)
  }
}

export const JiraTool = {
  name: TOOL_NAME_FOR_PROMPT,
  async description() {
    return DESCRIPTION
  },
  userFacingName: () => 'JIRA',
  inputSchema,
  isReadOnly: () => false,
  isConcurrencySafe: () => true,
  async isEnabled() {
    return true
  },
  needsPermissions() {
    return true
  },
  async prompt() {
    return DESCRIPTION
  },
  renderResultForAssistant(output: Output) {
    if (!output.success) {
      return `JIRA operation failed: ${output.error}`
    }
    
    switch (output.operation) {
      case 'get':
        if (output.ticket) {
          const ticket = output.ticket
          return `JIRA Ticket ${ticket.key}:
Title: ${ticket.fields.summary}
Status: ${ticket.fields.status.name}
Type: ${ticket.fields.issuetype.name}
Project: ${ticket.fields.project.name} (${ticket.fields.project.key})
Priority: ${ticket.fields.priority.name}
Assignee: ${ticket.fields.assignee?.displayName || 'Unassigned'}
Reporter: ${ticket.fields.reporter.displayName}
Created: ${ticket.fields.created}
Updated: ${ticket.fields.updated}
Labels: ${ticket.fields.labels.join(', ') || 'None'}
Components: ${ticket.fields.components.map(c => c.name).join(', ') || 'None'}

Description:
${ticket.fields.description || 'No description'}`
        }
        break
      case 'create':
        return `Successfully created JIRA ticket: ${output.ticketKey}`
      case 'update':
        return `Successfully updated JIRA ticket: ${output.ticketKey}`
    }
    
    return output.message || 'JIRA operation completed successfully'
  },
  renderToolUseMessage(input: Input, options: { verbose: boolean }) {
    switch (input.operation) {
      case 'get':
        return `Getting JIRA ticket ${input.ticketKey}`
      case 'create':
        return `Creating JIRA ticket in project ${input.project}: ${input.summary}`
      case 'update':
        return `Updating JIRA ticket ${input.ticketKey}`
      default:
        return `Performing JIRA operation: ${input.operation}`
    }
  },
  renderToolUseRejectedMessage() {
    return React.createElement(FallbackToolUseRejectedMessage, {
      toolName: 'JIRA',
      reason: 'Permission denied',
    })
  },
  renderToolResultMessage(output: Output) {
    const theme = { success: 'green', error: 'red', info: 'blue' }
    
    return React.createElement(Box, { flexDirection: 'column' },
      React.createElement(Text, { 
        color: output.success ? theme.success : theme.error 
      }, 
        output.success ? '✓ JIRA operation completed' : '✗ JIRA operation failed'
      ),
      output.message && React.createElement(Text, null, output.message),
      output.error && React.createElement(Text, { color: theme.error }, output.error),
      output.ticketKey && React.createElement(Text, { color: theme.info }, 
        `Ticket: ${output.ticketKey}`
      )
    )
  },
  async *call(input: Input, context: ToolUseContext) {
    try {
      const config = await getJiraConfig()
      let result: Output
      
      switch (input.operation) {
        case 'get':
          if (!input.ticketKey) {
            throw new Error('ticketKey is required for get operation')
          }
          
          const ticket = await getTicket(config, input.ticketKey)
          result = {
            operation: 'get',
            success: true,
            ticket,
            ticketKey: ticket.key
          }
          break
          
        case 'create':
          const createdTicket = await createTicket(config, input)
          result = {
            operation: 'create',
            success: true,
            ticketKey: createdTicket.key,
            message: `Successfully created ticket ${createdTicket.key}`
          }
          break
          
        case 'update':
          await updateTicket(config, input)
          result = {
            operation: 'update',
            success: true,
            ticketKey: input.ticketKey,
            message: `Successfully updated ticket ${input.ticketKey}`
          }
          break
          
        default:
          throw new Error(`Unknown operation: ${input.operation}`)
      }
      
      yield {
        type: 'result',
        data: result,
        resultForAssistant: JiraTool.renderResultForAssistant(result)
      }
      
    } catch (error) {
      logError(error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      const result: Output = {
        operation: input.operation,
        success: false,
        error: errorMessage
      }
      
      yield {
        type: 'result',
        data: result,
        resultForAssistant: JiraTool.renderResultForAssistant(result)
      }
    }
  }
} satisfies Tool
