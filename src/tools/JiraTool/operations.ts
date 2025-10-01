import { JiraApiClient, JiraApiError } from './JiraApiClient'
import {
  TicketFields,
  validateRequiredFields,
  buildCreateFields,
  buildUpdateFields,
  sanitizeTicketKey
} from './fieldBuilders'
import { JiraTicket } from './types'

export class JiraOperations {
  private client: JiraApiClient

  constructor(client: JiraApiClient) {
    this.client = client
  }

  async getTicket(ticketKey: string): Promise<JiraTicket> {
    const sanitizedKey = sanitizeTicketKey(ticketKey)

    if (!sanitizedKey) {
      throw new JiraApiError('Valid ticket key is required for get operation')
    }

    return this.client.getTicket(sanitizedKey)
  }

  async createTicket(fields: TicketFields): Promise<{ key: string }> {
    validateRequiredFields(fields, 'create')
    const createFields = buildCreateFields(fields)

    return this.client.createTicket(createFields)
  }

  async updateTicket(ticketKey: string, fields: TicketFields): Promise<void> {
    const sanitizedKey = sanitizeTicketKey(ticketKey)

    if (!sanitizedKey) {
      throw new JiraApiError('Valid ticket key is required for update operation')
    }

    const updates = buildUpdateFields(fields)

    // Handle status transition separately
    if (fields.status) {
      await this.performStatusTransition(sanitizedKey, fields.status)
    }

    // Update other fields if any
    if (updates.fields) {
      await this.client.updateTicket(sanitizedKey, updates)
    }
  }

  private async performStatusTransition(ticketKey: string, targetStatus: string): Promise<void> {
    try {
      const transitions = await this.client.getTransitions(ticketKey)
      const targetTransition = transitions.transitions.find(
        transition => transition.to.name.toLowerCase() === targetStatus.toLowerCase()
      )

      if (!targetTransition) {
        throw new JiraApiError(
          `Status transition to "${targetStatus}" not available for ticket ${ticketKey}. ` +
          `Available transitions: ${transitions.transitions.map(t => t.to.name).join(', ')}`
        )
      }

      await this.client.transitionTicket(ticketKey, targetTransition.id)
    } catch (error) {
      if (error instanceof JiraApiError) {
        throw error
      }

      throw new JiraApiError(
        `Failed to transition ticket ${ticketKey} to status "${targetStatus}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
    }
  }
}