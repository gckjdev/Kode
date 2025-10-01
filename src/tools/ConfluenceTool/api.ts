// Confluence API Client Implementation
// Handles HTTP requests, authentication, and basic API operations

import { getGlobalConfig } from '@utils/config'
import { logError } from '@utils/log'
import type {
  ConfluenceInstance,
  ConfluenceConfig,
  ApiRequest,
  ApiResponse,
  ConfluenceError,
  ConfluenceApiError,
  ConfluencePage,
  ConfluenceSpace,
  ConfluenceAttachment,
  SearchResult,
  CreatePageRequest,
  UpdatePageRequest,
  ContentListOptions,
  SearchQuery,
  SearchOptions,
  AttachmentUpload,
  ListSpacesOptions
} from './types'
import { ConfluenceErrorType } from './types'

// HTTP Client with Authentication
export class ConfluenceApiClient {
  private instance: ConfluenceInstance
  private baseHeaders: Record<string, string>

  constructor(instance: ConfluenceInstance) {
    this.instance = instance
    this.baseHeaders = this.createAuthHeaders()
  }

  // Create authentication headers based on instance type
  private createAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }

    if (this.instance.type === 'cloud') {
      // Confluence Cloud uses email + API token
      if (!this.instance.email || !this.instance.apiToken) {
        throw new Error('Confluence Cloud requires email and apiToken')
      }
      const auth = Buffer.from(`${this.instance.email}:${this.instance.apiToken}`).toString('base64')
      headers['Authorization'] = `Basic ${auth}`
    } else {
      // Confluence Server uses username + password/token
      if (!this.instance.username || !this.instance.apiToken) {
        throw new Error('Confluence Server requires username and apiToken')
      }
      const auth = Buffer.from(`${this.instance.username}:${this.instance.apiToken}`).toString('base64')
      headers['Authorization'] = `Basic ${auth}`
    }

    return headers
  }

  // Validate configuration
  async validateConfig(): Promise<boolean> {
    try {
      // Test with a simple API call
      const response = await this.makeRequest({
        method: 'GET',
        url: this.buildUrl('/rest/api/space'),
        headers: this.baseHeaders,
        timeout: this.instance.timeout || 10000
      })
      return response.status === 200
    } catch (error) {
      return false
    }
  }

  // Build full URL from endpoint
  private buildUrl(endpoint: string): string {
    const baseUrl = this.instance.baseUrl.replace(/\/+$/, '') // Remove trailing slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return `${baseUrl}${cleanEndpoint}`
  }

  // Make HTTP request with error handling and retries
  private async makeRequest<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const maxRetries = this.instance.maxRetries || 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.executeRequest<T>(request)
        
        // Check for rate limiting
        if (response.status === 429) {
          const retryAfter = this.getRetryAfter(response.headers)
          if (attempt < maxRetries) {
            await this.delay(retryAfter * 1000)
            continue
          }
        }

        // Return successful responses and client errors (don't retry)
        if (response.status < 500 || attempt === maxRetries) {
          return response
        }

        // Server errors - retry with exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await this.delay(backoffDelay)

      } catch (error) {
        lastError = error as Error
        if (attempt === maxRetries) {
          throw this.createConfluenceError(
            ConfluenceErrorType.NETWORK_ERROR,
            `Network request failed after ${maxRetries} attempts: ${lastError.message}`,
            0,
            true
          )
        }
        
        // Exponential backoff for network errors
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        await this.delay(backoffDelay)
      }
    }

    throw lastError || new Error('Request failed')
  }

  // Execute single HTTP request
  private async executeRequest<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), request.timeout || 30000)

    try {
      const fetchOptions: RequestInit = {
        method: request.method,
        headers: request.headers,
        signal: controller.signal
      }

      if (request.body) {
        if (request.body instanceof Buffer) {
          fetchOptions.body = new Uint8Array(request.body)
        } else {
          fetchOptions.body = request.body as BodyInit
        }
      }

      const response = await fetch(request.url, fetchOptions)
      clearTimeout(timeoutId)

      // Parse response body
      let data: T
      const contentType = response.headers.get('content-type') || ''
      
      if (contentType.includes('application/json')) {
        data = await response.json()
      } else if (request.method === 'GET' && contentType.includes('application/octet-stream')) {
        // Handle binary data (attachments)
        data = await response.arrayBuffer() as any
      } else {
        data = await response.text() as any
      }

      // Convert headers to plain object
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key] = value
      })

      const apiResponse: ApiResponse<T> = {
        status: response.status,
        statusText: response.statusText,
        headers,
        data
      }

      // Handle API errors
      if (!response.ok) {
        throw this.createErrorFromResponse(apiResponse)
      }

      return apiResponse

    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw this.createConfluenceError(
          ConfluenceErrorType.TIMEOUT,
          `Request timed out after ${request.timeout || 30000}ms`,
          0,
          true
        )
      }
      
      throw error
    }
  }

  // Create ConfluenceError from API response
  private createErrorFromResponse(response: ApiResponse): ConfluenceError {
    const status = response.status
    let type: ConfluenceErrorType
    let userMessage: string
    let retryable = false

    // Categorize error by status code
    switch (status) {
      case 401:
        type = ConfluenceErrorType.AUTHENTICATION
        userMessage = 'Authentication failed. Please check your credentials.'
        break
      case 403:
        type = ConfluenceErrorType.AUTHORIZATION
        userMessage = 'Access denied. You may not have permission for this operation.'
        break
      case 404:
        type = ConfluenceErrorType.NOT_FOUND
        userMessage = 'Resource not found. Please check the ID or title.'
        break
      case 400:
        type = ConfluenceErrorType.VALIDATION
        userMessage = 'Invalid request. Please check your input parameters.'
        break
      case 409:
        type = ConfluenceErrorType.CONFLICT
        userMessage = 'Conflict detected. The resource may have been modified by another user.'
        break
      case 429:
        type = ConfluenceErrorType.RATE_LIMIT
        userMessage = 'Rate limit exceeded. Please wait before making more requests.'
        retryable = true
        break
      default:
        if (status >= 500) {
          type = ConfluenceErrorType.SERVER_ERROR
          userMessage = 'Server error occurred. Please try again later.'
          retryable = true
        } else {
          type = ConfluenceErrorType.VALIDATION
          userMessage = `Request failed with status ${status}.`
        }
    }

    // Extract detailed error message from response
    let detailedMessage = userMessage
    if (response.data && typeof response.data === 'object') {
      const apiError = response.data as ConfluenceApiError
      if (apiError.message) {
        detailedMessage = apiError.message
      } else if (apiError.errors && apiError.errors.length > 0) {
        detailedMessage = apiError.errors.map(e => e.message).join('; ')
      }
    }

    return this.createConfluenceError(type, detailedMessage, status, retryable, response)
  }

  // Create standardized ConfluenceError
  private createConfluenceError(
    type: ConfluenceErrorType,
    message: string,
    statusCode?: number,
    retryable: boolean = false,
    response?: ApiResponse
  ): ConfluenceError {
    const error = new Error(message) as ConfluenceError
    error.type = type
    error.statusCode = statusCode
    error.retryable = retryable
    error.userMessage = message
    error.response = response
    return error
  }

  // Get retry delay from response headers
  private getRetryAfter(headers: Record<string, string>): number {
    const retryAfter = headers['retry-after'] || headers['Retry-After']
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10)
      return isNaN(seconds) ? 60 : seconds
    }
    return 60 // Default 60 seconds
  }

  // Utility delay function
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // API Endpoint Methods
  
  async getPage(pageId: string, expand?: string[]): Promise<ConfluencePage> {
    const url = this.buildUrl(`/rest/api/content/${pageId}`)
    const params = new URLSearchParams()
    
    if (expand && expand.length > 0) {
      params.append('expand', expand.join(','))
    }
    
    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url
    
    const response = await this.makeRequest<ConfluencePage>({
      method: 'GET',
      url: finalUrl,
      headers: this.baseHeaders
    })
    
    return response.data
  }

  async getPageByTitle(spaceKey: string, title: string, expand?: string[]): Promise<ConfluencePage> {
    const url = this.buildUrl('/rest/api/content')
    const params = new URLSearchParams({
      spaceKey,
      title,
      type: 'page'
    })
    
    if (expand && expand.length > 0) {
      params.append('expand', expand.join(','))
    }
    
    const response = await this.makeRequest<{ results: ConfluencePage[] }>({
      method: 'GET',
      url: `${url}?${params.toString()}`,
      headers: this.baseHeaders
    })
    
    if (!response.data.results || response.data.results.length === 0) {
      throw this.createConfluenceError(
        ConfluenceErrorType.NOT_FOUND,
        `Page '${title}' not found in space '${spaceKey}'`,
        404
      )
    }
    
    return response.data.results[0]
  }

  async createPage(pageData: CreatePageRequest): Promise<ConfluencePage> {
    const url = this.buildUrl('/rest/api/content')
    
    const response = await this.makeRequest<ConfluencePage>({
      method: 'POST',
      url,
      headers: this.baseHeaders,
      body: JSON.stringify(pageData)
    })
    
    return response.data
  }

  async updatePage(pageId: string, pageData: UpdatePageRequest): Promise<ConfluencePage> {
    const url = this.buildUrl(`/rest/api/content/${pageId}`)
    
    const response = await this.makeRequest<ConfluencePage>({
      method: 'PUT',
      url,
      headers: this.baseHeaders,
      body: JSON.stringify(pageData)
    })
    
    return response.data
  }

  async deletePage(pageId: string): Promise<void> {
    const url = this.buildUrl(`/rest/api/content/${pageId}`)
    
    await this.makeRequest<void>({
      method: 'DELETE',
      url,
      headers: this.baseHeaders
    })
  }

  async getSpaces(options?: ListSpacesOptions): Promise<ConfluenceSpace[]> {
    const url = this.buildUrl('/rest/api/space')
    const params = new URLSearchParams()
    
    if (options?.type) params.append('type', options.type)
    if (options?.status) params.append('status', options.status)
    if (options?.label) params.append('label', options.label)
    if (options?.favourite !== undefined) params.append('favourite', String(options.favourite))
    if (options?.start !== undefined) params.append('start', String(options.start))
    if (options?.limit !== undefined) params.append('limit', String(options.limit))
    if (options?.expand) params.append('expand', options.expand.join(','))
    
    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url
    
    const response = await this.makeRequest<{ results: ConfluenceSpace[] }>({
      method: 'GET',
      url: finalUrl,
      headers: this.baseHeaders
    })
    
    return response.data.results || []
  }

  async getSpace(spaceKey: string, expand?: string[]): Promise<ConfluenceSpace> {
    const url = this.buildUrl(`/rest/api/space/${spaceKey}`)
    const params = new URLSearchParams()
    
    if (expand && expand.length > 0) {
      params.append('expand', expand.join(','))
    }
    
    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url
    
    const response = await this.makeRequest<ConfluenceSpace>({
      method: 'GET',
      url: finalUrl,
      headers: this.baseHeaders
    })
    
    return response.data
  }

  async getSpaceContent(spaceKey: string, options?: ContentListOptions): Promise<ConfluencePage[]> {
    const url = this.buildUrl(`/rest/api/space/${spaceKey}/content`)
    const params = new URLSearchParams()
    
    if (options?.type) params.append('type', options.type)
    if (options?.status) params.append('status', options.status)
    if (options?.orderby) params.append('orderby', options.orderby)
    if (options?.start !== undefined) params.append('start', String(options.start))
    if (options?.limit !== undefined) params.append('limit', String(options.limit))
    if (options?.expand) params.append('expand', options.expand.join(','))
    
    const finalUrl = params.toString() ? `${url}?${params.toString()}` : url
    
    const response = await this.makeRequest<{ results: ConfluencePage[] }>({
      method: 'GET',
      url: finalUrl,
      headers: this.baseHeaders
    })
    
    return response.data.results || []
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const url = this.buildUrl('/rest/api/search')
    const params = new URLSearchParams({
      cql: query.cql
    })
    
    if (query.cqlcontext) params.append('cqlcontext', query.cqlcontext)
    if (query.excerpt) params.append('excerpt', query.excerpt)
    if (query.expand) params.append('expand', query.expand.join(','))
    if (query.start !== undefined) params.append('start', String(query.start))
    if (query.limit !== undefined) params.append('limit', String(query.limit))
    if (query.includeArchivedSpaces !== undefined) {
      params.append('includeArchivedSpaces', String(query.includeArchivedSpaces))
    }
    
    const response = await this.makeRequest<SearchResult>({
      method: 'GET',
      url: `${url}?${params.toString()}`,
      headers: this.baseHeaders
    })
    
    return response.data
  }

  async searchContent(text: string, options?: SearchOptions): Promise<SearchResult> {
    // Build CQL query from text search
    let cql = `text ~ "${text}"`
    
    if (options?.spaceKey) {
      cql += ` AND space = "${options.spaceKey}"`
    }
    
    if (options?.type) {
      cql += ` AND type = "${options.type}"`
    }
    
    const searchQuery: SearchQuery = {
      cql,
      excerpt: options?.excerpt || 'highlight',
      start: options?.start,
      limit: options?.limit
    }
    
    return this.search(searchQuery)
  }

  async getAttachments(pageId: string): Promise<ConfluenceAttachment[]> {
    const url = this.buildUrl(`/rest/api/content/${pageId}/child/attachment`)
    
    const response = await this.makeRequest<{ results: ConfluenceAttachment[] }>({
      method: 'GET',
      url,
      headers: this.baseHeaders
    })
    
    return response.data.results || []
  }

  async getAttachment(attachmentId: string): Promise<ConfluenceAttachment> {
    const url = this.buildUrl(`/rest/api/content/${attachmentId}`)
    const params = new URLSearchParams({
      expand: 'container,metadata.labels,version'
    })
    
    const response = await this.makeRequest<ConfluenceAttachment>({
      method: 'GET',
      url: `${url}?${params.toString()}`,
      headers: this.baseHeaders
    })
    
    return response.data
  }

  async uploadAttachment(pageId: string, file: AttachmentUpload): Promise<ConfluenceAttachment> {
    const url = this.buildUrl(`/rest/api/content/${pageId}/child/attachment`)
    
    // Create form data for file upload
    const formData = new FormData()
    const uint8Array = new Uint8Array(file.content)
    const blob = new Blob([uint8Array], { type: file.contentType })
    formData.append('file', blob, file.filename)
    
    if (file.comment) {
      formData.append('comment', file.comment)
    }
    
    // Remove Content-Type header for form data (let browser set it)
    const headers = { ...this.baseHeaders }
    delete headers['Content-Type']
    
    const response = await this.makeRequest<{ results: ConfluenceAttachment[] }>({
      method: 'POST',
      url,
      headers,
      body: formData as any
    })
    
    if (!response.data.results || response.data.results.length === 0) {
      throw this.createConfluenceError(
        ConfluenceErrorType.SERVER_ERROR,
        'Failed to upload attachment',
        500
      )
    }
    
    return response.data.results[0]
  }

  async downloadAttachment(attachmentId: string): Promise<Buffer> {
    // First get attachment metadata to get download URL
    const attachment = await this.getAttachment(attachmentId)
    const downloadUrl = attachment.extensions?.fileSize 
      ? this.buildUrl(`/download/attachments/${attachment.container.id}/${attachment.title}`)
      : this.buildUrl(`/rest/api/content/${attachmentId}/download`)
    
    const response = await this.makeRequest<ArrayBuffer>({
      method: 'GET',
      url: downloadUrl,
      headers: { ...this.baseHeaders, 'Accept': 'application/octet-stream' }
    })
    
    return Buffer.from(response.data)
  }
}

// Configuration Management Functions

export async function getConfluenceConfig(): Promise<ConfluenceConfig> {
  const config = getGlobalConfig()
  const confluenceConfig = config.confluence
  
  if (!confluenceConfig) {
    throw new Error('Confluence configuration not found. Please configure Confluence settings in your .kode.json file.')
  }

  if (!confluenceConfig.instances || Object.keys(confluenceConfig.instances).length === 0) {
    throw new Error('No Confluence instances configured. Please add at least one instance to your .kode.json file.')
  }

  if (!confluenceConfig.defaultInstance) {
    throw new Error('No default Confluence instance specified. Please set defaultInstance in your .kode.json file.')
  }

  return confluenceConfig
}

export async function getConfluenceInstance(instanceName?: string): Promise<ConfluenceInstance> {
  const config = await getConfluenceConfig()
  const targetInstance = instanceName || config.defaultInstance
  
  const instance = config.instances[targetInstance]
  if (!instance) {
    throw new Error(`Confluence instance '${targetInstance}' not found. Available instances: ${Object.keys(config.instances).join(', ')}`)
  }

  // Validate required fields
  if (!instance.baseUrl) {
    throw new Error(`Confluence instance '${targetInstance}' is missing baseUrl`)
  }

  if (instance.type === 'cloud') {
    if (!instance.email || !instance.apiToken) {
      throw new Error(`Confluence Cloud instance '${targetInstance}' requires email and apiToken`)
    }
  } else if (instance.type === 'server') {
    if (!instance.username || !instance.apiToken) {
      throw new Error(`Confluence Server instance '${targetInstance}' requires username and apiToken`)
    }
  } else {
    throw new Error(`Confluence instance '${targetInstance}' has invalid type. Must be 'cloud' or 'server'`)
  }

  return instance
}

export async function createApiClient(instanceName?: string): Promise<ConfluenceApiClient> {
  try {
    const instance = await getConfluenceInstance(instanceName)
    return new ConfluenceApiClient(instance)
  } catch (error) {
    logError(error)
    throw error
  }
}

// Utility Functions

export function isConfluenceError(error: any): error is ConfluenceError {
  return error && typeof error === 'object' && 'type' in error && 'userMessage' in error
}

export function getErrorMessage(error: unknown): string {
  if (isConfluenceError(error)) {
    return error.userMessage
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
