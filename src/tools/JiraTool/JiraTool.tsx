import React from 'react'
import { z } from 'zod'
import { Tool } from '@tool'
import { DESCRIPTION, TOOL_NAME_FOR_PROMPT } from './prompt'
import { logError } from '@utils/log'
import { JiraApiClient, JiraApiError } from './JiraApiClient'
import { JiraOperations } from './operations'
import {
  JiraToolResultComponent,
  JiraToolRejectedMessage,
  JiraToolUseMessage,
  JiraToolResult
} from './components'
import {
  formatTicketForAssistant,
  formatOperationMessage,
  formatSuccessMessage,
  formatErrorMessage
} from './formatters'
import { TicketFields } from './fieldBuilders'

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
  customFields: z.record(z.unknown()).optional().describe('Custom field updates as key-value pairs'),
})

type Input = z.infer<typeof inputSchema>
type Output = JiraToolResult

function convertInputToTicketFields(input: Input): TicketFields {
  return {
    project: input.project,
    issueType: input.issueType,
    summary: input.summary,
    description: input.description,
    assignee: input.assignee,
    priority: input.priority,
    labels: input.labels,
    components: input.components,
    status: input.status,
    customFields: input.customFields,
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
      return formatErrorMessage(output.operation, output.error || 'Unknown error')
    }

    switch (output.operation) {
      case 'get':
        return output.ticket ? formatTicketForAssistant(output.ticket) : formatSuccessMessage(output.operation)
      case 'create':
      case 'update':
        return formatSuccessMessage(output.operation, output.ticketKey)
      default:
        return output.message || 'JIRA operation completed successfully'
    }
  },
  renderToolUseMessage(input: Input) {
    return formatOperationMessage(input.operation, input.ticketKey, input.summary, input.project)
  },
  renderToolUseRejectedMessage() {
    return React.createElement(JiraToolRejectedMessage)
  },
  renderToolResultMessage(output: Output) {
    return React.createElement(JiraToolResultComponent, { result: output })
  },
  async *call(input: Input) {
    const client = new JiraApiClient()
    const operations = new JiraOperations(client)

    try {
      let result: Output

      switch (input.operation) {
        case 'get':
          if (!input.ticketKey) {
            throw new JiraApiError('ticketKey is required for get operation')
          }

          const ticket = await operations.getTicket(input.ticketKey)
          result = {
            operation: 'get',
            success: true,
            ticket,
            ticketKey: ticket.key
          }
          break

        case 'create':
          const ticketFields = convertInputToTicketFields(input)
          const createdTicket = await operations.createTicket(ticketFields)
          result = {
            operation: 'create',
            success: true,
            ticketKey: createdTicket.key,
            message: formatSuccessMessage('create', createdTicket.key)
          }
          break

        case 'update':
          if (!input.ticketKey) {
            throw new JiraApiError('ticketKey is required for update operation')
          }

          const updateFields = convertInputToTicketFields(input)
          await operations.updateTicket(input.ticketKey, updateFields)
          result = {
            operation: 'update',
            success: true,
            ticketKey: input.ticketKey,
            message: formatSuccessMessage('update', input.ticketKey)
          }
          break

        default:
          throw new JiraApiError(`Unknown operation: ${input.operation}`)
      }

      yield {
        type: 'result',
        data: result,
        resultForAssistant: this.renderResultForAssistant(result)
      }

    } catch (error) {
      logError(error)

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const result: Output = {
        operation: input.operation,
        success: false,
        error: errorMessage
      }

      yield {
        type: 'result',
        data: result,
        resultForAssistant: this.renderResultForAssistant(result)
      }
    }
  }
} satisfies Tool
