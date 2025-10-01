import fetch from 'node-fetch'
import { getGlobalConfig } from '@utils/config'
import { logError } from '@utils/log'
import {
  JiraConfig,
  JiraTicket,
  JiraCreateResponse,
  JiraTransitionsResponse,
  JiraErrorResponse,
  JiraFieldUpdate
} from './types'

export class JiraApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string,
    public errorDetails?: JiraErrorResponse
  ) {
    super(message)
    this.name = 'JiraApiError'
  }
}

export class JiraApiClient {
  private config: JiraConfig | null = null

  async getConfig(): Promise<JiraConfig> {
    if (this.config) {
      return this.config
    }

    const globalConfig = getGlobalConfig()
    const jiraConfig = globalConfig.jira

    if (!jiraConfig) {
      throw new JiraApiError('JIRA configuration not found. Please configure JIRA settings in your .kode.json file.')
    }

    if (!jiraConfig.baseUrl || !jiraConfig.username || !jiraConfig.apiToken) {
      throw new JiraApiError('Incomplete JIRA configuration. Please ensure baseUrl, username, and apiToken are set.')
    }

    this.config = jiraConfig as JiraConfig
    return this.config
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' = 'GET',
    body?: unknown
  ): Promise<T> {
    const config = await this.getConfig()
    const url = `${config.baseUrl.replace(/\/+$/, '')}/rest/api/3/${endpoint}`
    const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64')

    try {
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
        await this.handleError(response)
      }

      return response.json() as Promise<T>
    } catch (error) {
      if (error instanceof JiraApiError) {
        throw error
      }

      logError(error)
      throw new JiraApiError(
        `Network error during JIRA API request: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async handleError(response: any): Promise<never> {
    let errorMessage = `JIRA API error (${response.status}): ${response.statusText}`
    let errorDetails: JiraErrorResponse | undefined

    try {
      const errorText = await response.text()
      const errorJson = JSON.parse(errorText) as JiraErrorResponse

      errorDetails = errorJson

      if (errorJson.errorMessages?.length) {
        errorMessage += ` - ${errorJson.errorMessages.join(', ')}`
      }

      if (errorJson.errors && Object.keys(errorJson.errors).length > 0) {
        const errorDetailsStr = Object.entries(errorJson.errors)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
        errorMessage += ` - ${errorDetailsStr}`
      }

      if (!errorJson.errorMessages?.length && !errorJson.errors) {
        errorMessage += ` - ${errorText}`
      }
    } catch (parseError) {
      // If we can't parse the error response, just use the status text
      logError(parseError)
    }

    throw new JiraApiError(errorMessage, response.status, response.statusText, errorDetails)
  }

  async getTicket(ticketKey: string): Promise<JiraTicket> {
    if (!ticketKey.trim()) {
      throw new JiraApiError('Ticket key cannot be empty')
    }

    return this.makeRequest<JiraTicket>(`issue/${ticketKey.trim()}`)
  }

  async createTicket(fields: Record<string, unknown>): Promise<JiraCreateResponse> {
    if (!fields.project || !fields.issuetype || !fields.summary) {
      throw new JiraApiError('project, issueType, and summary are required for creating tickets')
    }

    return this.makeRequest<JiraCreateResponse>('issue', 'POST', { fields })
  }

  async updateTicket(ticketKey: string, update: JiraFieldUpdate): Promise<void> {
    if (!ticketKey.trim()) {
      throw new JiraApiError('Ticket key cannot be empty')
    }

    if (Object.keys(update).length === 0) {
      throw new JiraApiError('No update data provided')
    }

    await this.makeRequest(`issue/${ticketKey.trim()}`, 'PUT', update)
  }

  async getTransitions(ticketKey: string): Promise<JiraTransitionsResponse> {
    if (!ticketKey.trim()) {
      throw new JiraApiError('Ticket key cannot be empty')
    }

    return this.makeRequest<JiraTransitionsResponse>(`issue/${ticketKey.trim()}/transitions`)
  }

  async transitionTicket(ticketKey: string, transitionId: string): Promise<void> {
    if (!ticketKey.trim()) {
      throw new JiraApiError('Ticket key cannot be empty')
    }

    if (!transitionId.trim()) {
      throw new JiraApiError('Transition ID cannot be empty')
    }

    await this.makeRequest(
      `issue/${ticketKey.trim()}/transitions`,
      'POST',
      { transition: { id: transitionId.trim() } }
    )
  }
}