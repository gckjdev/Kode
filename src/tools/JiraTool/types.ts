export interface JiraConfig {
  baseUrl: string
  username: string
  apiToken: string
}

export interface JiraTicket {
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

export interface JiraFieldUpdate {
  fields?: Record<string, unknown>
  transition?: {
    id: string
  }
}

export interface JiraCreateResponse {
  key: string
  id: string
}

export interface JiraTransition {
  id: string
  name: string
  to: {
    name: string
  }
}

export interface JiraTransitionsResponse {
  transitions: JiraTransition[]
}

export interface JiraErrorResponse {
  errorMessages?: string[]
  errors?: Record<string, string>
}