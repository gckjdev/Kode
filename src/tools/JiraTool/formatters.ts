import { JiraTicket } from './types'

export function formatTicketForAssistant(ticket: JiraTicket): string {
  const fields = ticket.fields

  return `JIRA Ticket ${ticket.key}:
Title: ${fields.summary}
Status: ${fields.status.name}
Type: ${fields.issuetype.name}
Project: ${fields.project.name} (${fields.project.key})
Priority: ${fields.priority.name}
Assignee: ${fields.assignee?.displayName || 'Unassigned'}
Reporter: ${fields.reporter.displayName}
Created: ${fields.created}
Updated: ${fields.updated}
Labels: ${fields.labels.join(', ') || 'None'}
Components: ${fields.components.map(c => c.name).join(', ') || 'None'}

Description:
${fields.description || 'No description'}`
}

export function formatOperationMessage(operation: string, ticketKey?: string, summary?: string, project?: string): string {
  switch (operation) {
    case 'get':
      return ticketKey ? `Getting JIRA ticket ${ticketKey}` : 'Getting JIRA ticket'
    case 'create':
      if (summary && project) {
        return `Creating JIRA ticket in project ${project}: ${summary}`
      }
      return summary ? `Creating JIRA ticket: ${summary}` : 'Creating JIRA ticket'
    case 'update':
      return ticketKey ? `Updating JIRA ticket ${ticketKey}` : 'Updating JIRA ticket'
    default:
      return `Performing JIRA operation: ${operation}`
  }
}

export function formatSuccessMessage(operation: string, ticketKey?: string): string {
  switch (operation) {
    case 'create':
      return ticketKey ? `Successfully created JIRA ticket: ${ticketKey}` : 'Successfully created JIRA ticket'
    case 'update':
      return ticketKey ? `Successfully updated JIRA ticket: ${ticketKey}` : 'Successfully updated JIRA ticket'
    default:
      return 'JIRA operation completed successfully'
  }
}

export function formatErrorMessage(operation: string, error: string): string {
  return `JIRA operation failed (${operation}): ${error}`
}