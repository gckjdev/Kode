import { JiraFieldUpdate } from './types'

export interface TicketFields {
  project?: string
  issueType?: string
  summary?: string
  description?: string
  assignee?: string
  priority?: string
  labels?: string[]
  components?: string[]
  status?: string
  customFields?: Record<string, unknown>
}

export function buildCreateFields(fields: TicketFields): Record<string, unknown> {
  const createFields: Record<string, unknown> = {}

  if (fields.project) {
    createFields.project = { key: fields.project }
  }

  if (fields.issueType) {
    createFields.issuetype = { name: fields.issueType }
  }

  if (fields.summary) {
    createFields.summary = fields.summary
  }

  if (fields.description) {
    createFields.description = buildDescriptionField(fields.description)
  }

  if (fields.assignee) {
    createFields.assignee = { name: fields.assignee }
  }

  if (fields.priority) {
    createFields.priority = { name: fields.priority }
  }

  if (fields.labels && fields.labels.length > 0) {
    createFields.labels = fields.labels
  }

  if (fields.components && fields.components.length > 0) {
    createFields.components = fields.components.map(name => ({ name }))
  }

  if (fields.customFields) {
    Object.assign(createFields, fields.customFields)
  }

  return createFields
}

export function buildUpdateFields(fields: TicketFields): JiraFieldUpdate {
  const updateFields: JiraFieldUpdate = {}
  const fieldUpdates: Record<string, unknown> = {}

  if (fields.summary) {
    fieldUpdates.summary = fields.summary
  }

  if (fields.description) {
    fieldUpdates.description = buildDescriptionField(fields.description)
  }

  if (fields.assignee) {
    fieldUpdates.assignee = { name: fields.assignee }
  }

  if (fields.priority) {
    fieldUpdates.priority = { name: fields.priority }
  }

  if (fields.labels) {
    fieldUpdates.labels = fields.labels
  }

  if (fields.components) {
    fieldUpdates.components = fields.components.map(name => ({ name }))
  }

  if (fields.customFields) {
    Object.assign(fieldUpdates, fields.customFields)
  }

  if (Object.keys(fieldUpdates).length > 0) {
    updateFields.fields = fieldUpdates
  }

  return updateFields
}

function buildDescriptionField(description: string) {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: description
          }
        ]
      }
    ]
  }
}

export function validateRequiredFields(fields: TicketFields, operation: 'create' | 'update'): void {
  if (operation === 'create') {
    const required = ['project', 'issueType', 'summary'] as const

    for (const field of required) {
      if (!fields[field]) {
        throw new Error(`${field} is required for creating tickets`)
      }
    }
  }
}

export function sanitizeTicketKey(ticketKey: string): string {
  return ticketKey.trim().toUpperCase()
}