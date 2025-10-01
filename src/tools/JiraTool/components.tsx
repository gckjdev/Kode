import React from 'react'
import { Box, Text } from 'ink'
import { FallbackToolUseRejectedMessage } from '@components/FallbackToolUseRejectedMessage'
import { JiraTicket } from './types'

export interface JiraToolResult {
  operation: string
  success: boolean
  ticket?: JiraTicket
  ticketKey?: string
  message?: string
  error?: string
}

export interface JiraToolInput {
  operation: string
  ticketKey?: string
  project?: string
  summary?: string
}

const theme = {
  success: 'green',
  error: 'red',
  info: 'blue',
  warning: 'yellow'
} as const

export function JiraToolResultComponent({ result }: { result: JiraToolResult }) {
  return React.createElement(Box, { flexDirection: 'column' },
    React.createElement(Text, {
      color: result.success ? theme.success : theme.error
    },
      result.success ? '✓ JIRA operation completed' : '✗ JIRA operation failed'
    ),
    result.message && React.createElement(Text, null, result.message),
    result.error && React.createElement(Text, { color: theme.error }, result.error),
    result.ticketKey && React.createElement(Text, { color: theme.info },
      `Ticket: ${result.ticketKey}`
    )
  )
}

export function JiraToolRejectedMessage() {
  return React.createElement(FallbackToolUseRejectedMessage, {
    toolName: 'JIRA',
    reason: 'Permission denied',
  })
}

export function JiraToolUseMessage({ input }: { input: JiraToolInput }) {
  switch (input.operation) {
    case 'get':
      return React.createElement(Text, { color: theme.info },
        `Getting JIRA ticket ${input.ticketKey || ''}`
      )
    case 'create':
      return React.createElement(Text, { color: theme.info },
        `Creating JIRA ticket in project ${input.project || ''}: ${input.summary || ''}`
      )
    case 'update':
      return React.createElement(Text, { color: theme.info },
        `Updating JIRA ticket ${input.ticketKey || ''}`
      )
    default:
      return React.createElement(Text, { color: theme.info },
        `Performing JIRA operation: ${input.operation}`
      )
  }
}