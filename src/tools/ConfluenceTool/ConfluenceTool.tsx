// Confluence Tool - Main Implementation
// Comprehensive Confluence integration for content management

import React from 'react'
import { z } from 'zod'
import { Text, Box } from 'ink'
import { Tool, ToolUseContext } from '@tool'
import { logError } from '@utils/log'
import { createApiClient, getErrorMessage, isConfluenceError } from './api'
import { 
  formatPageSummary, 
  formatSpaceSummary, 
  formatAttachmentSummary,
  createContentBody,
  extractContentText,
  extractContentHtml,
  formatTimestamp,
  formatUserInfo,
  truncateContent,
  validatePageTitle,
  validateSpaceKey,
  validateContentSize,
  parseInstanceName
} from './utils'
import { DESCRIPTION, TOOL_NAME_FOR_PROMPT } from './prompt'
import type { 
  ConfluenceToolInput, 
  ConfluenceToolOutput, 
  ConfluencePage,
  ConfluenceSpace,
  ConfluenceAttachment,
  SearchResult,
  CreatePageRequest,
  UpdatePageRequest
} from './types'

// Input Schema Definition
const confluenceInputSchema = z.strictObject({
  operation: z.enum(['get', 'create', 'update', 'search', 'list', 'spaces', 'attachments'])
    .describe('The operation to perform'),
  
  instance: z.string().optional()
    .describe('Confluence instance name (default: "default")'),
  
  // Page identification
  pageId: z.string().optional()
    .describe('Page ID for get/update operations'),
  pageTitle: z.string().optional()
    .describe('Page title (alternative to pageId)'),
  spaceKey: z.string().optional()
    .describe('Space key (required for pageTitle lookup)'),
  
  // Content operations
  title: z.string().optional()
    .describe('Page title for create/update operations'),
  content: z.string().optional()
    .describe('Page content body'),
  contentFormat: z.enum(['storage', 'view', 'wiki']).optional()
    .describe('Content format (default: storage)'),
  parentId: z.string().optional()
    .describe('Parent page ID for new pages'),
  labels: z.array(z.string()).optional()
    .describe('Page labels/tags'),
  
  // Search operations
  query: z.string().optional()
    .describe('Search query (CQL or plain text)'),
  searchSpace: z.string().optional()
    .describe('Limit search to specific space'),
  searchType: z.enum(['page', 'blogpost', 'attachment', 'space']).optional()
    .describe('Content type filter for search'),
  
  // List operations
  spaceKeys: z.array(z.string()).optional()
    .describe('Space keys to list content from'),
  contentType: z.enum(['page', 'blogpost']).optional()
    .describe('Content type filter'),
  orderBy: z.enum(['title', 'created', 'modified']).optional()
    .describe('Sort order for results'),
  
  // Attachment operations
  attachmentId: z.string().optional()
    .describe('Attachment ID'),
  filename: z.string().optional()
    .describe('Attachment filename'),
  
  // Common options
  expand: z.array(z.string()).optional()
    .describe('Fields to expand in response'),
  limit: z.number().min(1).max(100).optional()
    .describe('Maximum results to return (default: 25)'),
  start: z.number().min(0).optional()
    .describe('Pagination offset (default: 0)')
})

type ConfluenceInput = z.infer<typeof confluenceInputSchema>

export const ConfluenceTool = {
  name: 'confluence',
  inputSchema: confluenceInputSchema,
  
  async description(): Promise<string> {
    return DESCRIPTION
  },
  
  userFacingName(): string {
    return 'Confluence'
  },
  
  async isEnabled(): Promise<boolean> {
    return true
  },
  
  isReadOnly(): boolean {
    return false
  },
  
  isConcurrencySafe(): boolean {
    return true
  },
  
  needsPermissions(): boolean {
    return true
  },
  
  async prompt(): Promise<string> {
    return `You are using the ${TOOL_NAME_FOR_PROMPT} tool for Confluence content management operations.

${DESCRIPTION}

Always provide clear, actionable feedback to users about the results of Confluence operations.`
  },
  
  renderResultForAssistant(output: ConfluenceToolOutput): string {
    if (!output.success) {
      return `Confluence operation failed: ${output.error || 'Unknown error'}`
    }

    switch (output.operation) {
      case 'get':
        if (output.page) {
          const content = extractContentText(output.page.body)
          const summary = formatPageSummary(output.page)
          const contentPreview = content ? `\n\nContent Preview:\n${truncateContent(content, 500)}` : ''
          return `${summary}${contentPreview}`
        }
        break

      case 'create':
        if (output.page) {
          return `Successfully created Confluence page: ${output.page.title} (${output.page.id})\nURL: ${output.page.metadata.frontend_url}`
        }
        return output.message || 'Page created successfully'

      case 'update':
        if (output.page) {
          return `Successfully updated Confluence page: ${output.page.title} (${output.page.id})\nVersion: ${output.page.version.number}\nURL: ${output.page.metadata.frontend_url}`
        }
        return output.message || 'Page updated successfully'

      case 'search':
        if (output.searchResults) {
          const results = output.searchResults
          let response = `Found ${results.size} results (showing ${results.results.length})`
          
          if (results.results.length > 0) {
            response += ':\n\n'
            response += results.results.map((item, index) => {
              const excerpt = item.excerpt ? `\n${truncateContent(item.excerpt, 200)}` : ''
              return `${index + 1}. **${item.title}**${excerpt}\n   URL: ${item.url}`
            }).join('\n\n')
          }
          
          return response
        }
        break

      case 'list':
        if (output.pages) {
          const pages = output.pages
          let response = `Found ${pages.length} pages`
          
          if (pages.length > 0) {
            response += ':\n\n'
            response += pages.map((page, index) => {
              return `${index + 1}. **${page.title}** (${page.id})\n   Modified: ${formatTimestamp(page.version.when)} by ${formatUserInfo(page.version.by)}`
            }).join('\n\n')
          }
          
          return response
        }
        break

      case 'spaces':
        if (output.spaces) {
          const spaces = output.spaces
          let response = `Found ${spaces.length} spaces`
          
          if (spaces.length > 0) {
            response += ':\n\n'
            response += spaces.map((space, index) => {
              return `${index + 1}. ${formatSpaceSummary(space)}`
            }).join('\n\n')
          }
          
          return response
        }
        break

      case 'attachments':
        if (output.attachments) {
          const attachments = output.attachments
          let response = `Found ${attachments.length} attachments`
          
          if (attachments.length > 0) {
            response += ':\n\n'
            response += attachments.map((attachment, index) => {
              return `${index + 1}. ${formatAttachmentSummary(attachment)}`
            }).join('\n\n')
          }
          
          return response
        }
        break
    }

    return output.message || 'Operation completed successfully'
  },
  
  renderToolUseMessage(input: ConfluenceInput): string {
    const instanceSuffix = input.instance ? ` (${input.instance})` : ''
    
    switch (input.operation) {
      case 'get':
        if (input.pageId) {
          return `Getting Confluence page ${input.pageId}${instanceSuffix}`
        } else if (input.pageTitle && input.spaceKey) {
          return `Getting Confluence page "${input.pageTitle}" from space ${input.spaceKey}${instanceSuffix}`
        }
        return `Getting Confluence page${instanceSuffix}`

      case 'create':
        if (input.title && input.spaceKey) {
          return `Creating Confluence page "${input.title}" in space ${input.spaceKey}${instanceSuffix}`
        }
        return `Creating Confluence page${instanceSuffix}`

      case 'update':
        if (input.pageId) {
          return `Updating Confluence page ${input.pageId}${instanceSuffix}`
        } else if (input.pageTitle && input.spaceKey) {
          return `Updating Confluence page "${input.pageTitle}" in space ${input.spaceKey}${instanceSuffix}`
        }
        return `Updating Confluence page${instanceSuffix}`

      case 'search':
        if (input.query) {
          const spaceFilter = input.searchSpace ? ` in space ${input.searchSpace}` : ''
          return `Searching Confluence for "${input.query}"${spaceFilter}${instanceSuffix}`
        }
        return `Searching Confluence${instanceSuffix}`

      case 'list':
        if (input.spaceKey) {
          return `Listing content in Confluence space ${input.spaceKey}${instanceSuffix}`
        } else if (input.spaceKeys) {
          return `Listing content in Confluence spaces ${input.spaceKeys.join(', ')}${instanceSuffix}`
        }
        return `Listing Confluence content${instanceSuffix}`

      case 'spaces':
        return `Listing Confluence spaces${instanceSuffix}`

      case 'attachments':
        if (input.pageId) {
          return `Listing attachments for Confluence page ${input.pageId}${instanceSuffix}`
        }
        return `Managing Confluence attachments${instanceSuffix}`

      default:
        return `Performing Confluence operation: ${input.operation}${instanceSuffix}`
    }
  },

  renderToolUseRejectedMessage(): React.ReactElement {
    return (
      <Box flexDirection="column">
        <Text color="red">Confluence operation cancelled by user</Text>
        <Text dimColor>The Confluence tool requires permission to access external services.</Text>
      </Box>
    )
  },

  renderToolResultMessage(output: ConfluenceToolOutput): React.ReactElement {
    if (!output.success) {
      return (
        <Box flexDirection="column">
          <Text color="red">❌ Confluence operation failed</Text>
          <Text>{output.error || 'Unknown error occurred'}</Text>
        </Box>
      )
    }

    const instanceInfo = output.instance ? ` (${output.instance})` : ''

    switch (output.operation) {
      case 'get':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Retrieved Confluence page{instanceInfo}</Text>
            {output.page && (
              <Text dimColor>Page: {output.page.title} ({output.page.id})</Text>
            )}
          </Box>
        )

      case 'create':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Created Confluence page{instanceInfo}</Text>
            {output.page && (
              <Text dimColor>Page: {output.page.title} ({output.page.id})</Text>
            )}
          </Box>
        )

      case 'update':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Updated Confluence page{instanceInfo}</Text>
            {output.page && (
              <Text dimColor>Page: {output.page.title} (v{output.page.version.number})</Text>
            )}
          </Box>
        )

      case 'search':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Confluence search completed{instanceInfo}</Text>
            {output.searchResults && (
              <Text dimColor>Found {output.searchResults.size} results</Text>
            )}
          </Box>
        )

      case 'list':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Listed Confluence content{instanceInfo}</Text>
            {output.pages && (
              <Text dimColor>Found {output.pages.length} pages</Text>
            )}
          </Box>
        )

      case 'spaces':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Listed Confluence spaces{instanceInfo}</Text>
            {output.spaces && (
              <Text dimColor>Found {output.spaces.length} spaces</Text>
            )}
          </Box>
        )

      case 'attachments':
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Retrieved Confluence attachments{instanceInfo}</Text>
            {output.attachments && (
              <Text dimColor>Found {output.attachments.length} attachments</Text>
            )}
          </Box>
        )

      default:
        return (
          <Box flexDirection="column">
            <Text color="green">✅ Confluence operation completed{instanceInfo}</Text>
          </Box>
        )
    }
  },

  async *call(
    input: ConfluenceInput,
    context: ToolUseContext
  ) {
    try {
      // Parse instance name from input if provided
      const { instanceName } = parseInstanceName(input.query || '')
      const targetInstance = input.instance || instanceName

      // Create API client
      const apiClient = await createApiClient(targetInstance)

      // Validate input based on operation
      const validationResult = validateInput(input)
      if (!validationResult.valid) {
        const validationErrorResult: ConfluenceToolOutput = {
          operation: input.operation,
          success: false,
          error: validationResult.error!,
          instance: targetInstance
        }
        
        yield {
          type: 'result',
          data: validationErrorResult,
          resultForAssistant: ConfluenceTool.renderResultForAssistant(validationErrorResult)
        }
        return
      }

      // Execute operation
      const result = await executeOperation(apiClient, input, targetInstance)
      
      yield {
        type: 'result',
        data: result,
        resultForAssistant: ConfluenceTool.renderResultForAssistant(result)
      }

    } catch (error) {
      logError(error)
      const errorMessage = getErrorMessage(error)
      
      const errorResult: ConfluenceToolOutput = {
        operation: input.operation,
        success: false,
        error: errorMessage,
        instance: input.instance
      }
      
      yield {
        type: 'result',
        data: errorResult,
        resultForAssistant: ConfluenceTool.renderResultForAssistant(errorResult)
      }
    }
  }
} satisfies Tool

// Input Validation Function
function validateInput(input: ConfluenceInput): { valid: boolean; error?: string } {
  switch (input.operation) {
    case 'get':
      if (!input.pageId && !(input.pageTitle && input.spaceKey)) {
        return { valid: false, error: 'Get operation requires either pageId or both pageTitle and spaceKey' }
      }
      break

    case 'create':
      if (!input.title || !input.spaceKey || !input.content) {
        return { valid: false, error: 'Create operation requires title, spaceKey, and content' }
      }
      
      const titleValidation = validatePageTitle(input.title)
      if (!titleValidation.valid) {
        return { valid: false, error: titleValidation.error }
      }
      
      const spaceValidation = validateSpaceKey(input.spaceKey)
      if (!spaceValidation.valid) {
        return { valid: false, error: spaceValidation.error }
      }
      
      const contentValidation = validateContentSize(input.content)
      if (!contentValidation.valid) {
        return { valid: false, error: contentValidation.error }
      }
      break

    case 'update':
      if (!input.pageId && !(input.pageTitle && input.spaceKey)) {
        return { valid: false, error: 'Update operation requires either pageId or both pageTitle and spaceKey' }
      }
      
      if (input.title) {
        const titleValidation = validatePageTitle(input.title)
        if (!titleValidation.valid) {
          return { valid: false, error: titleValidation.error }
        }
      }
      
      if (input.content) {
        const contentValidation = validateContentSize(input.content)
        if (!contentValidation.valid) {
          return { valid: false, error: contentValidation.error }
        }
      }
      break

    case 'search':
      if (!input.query) {
        return { valid: false, error: 'Search operation requires query parameter' }
      }
      break

    case 'list':
      if (!input.spaceKey && !input.spaceKeys) {
        return { valid: false, error: 'List operation requires either spaceKey or spaceKeys parameter' }
      }
      break

    case 'attachments':
      if (!input.pageId) {
        return { valid: false, error: 'Attachments operation requires pageId parameter' }
      }
      break
  }

  return { valid: true }
}

// Operation Execution Function
async function executeOperation(
  apiClient: any, 
  input: ConfluenceInput, 
  instanceName?: string
): Promise<ConfluenceToolOutput> {
  const baseResult = {
    operation: input.operation,
    success: false as boolean,
    instance: instanceName
  }

  try {
    switch (input.operation) {
      case 'get':
        const page = input.pageId 
          ? await apiClient.getPage(input.pageId, input.expand)
          : await apiClient.getPageByTitle(input.spaceKey!, input.pageTitle!, input.expand)
        
        return {
          ...baseResult,
          success: true,
          page
        }

      case 'create':
        const contentBody = createContentBody(input.content!, input.contentFormat || 'storage')
        const createRequest: CreatePageRequest = {
          type: 'page',
          title: input.title!,
          space: { key: input.spaceKey! },
          body: {
            storage: {
              value: contentBody.storage?.value || input.content!,
              representation: 'storage'
            }
          }
        }
        
        if (input.parentId) {
          createRequest.ancestors = [{ id: input.parentId }]
        }
        
        if (input.labels && input.labels.length > 0) {
          createRequest.metadata = {
            labels: input.labels.map(name => ({ name }))
          }
        }
        
        const createdPage = await apiClient.createPage(createRequest)
        
        return {
          ...baseResult,
          success: true,
          page: createdPage
        }

      case 'update':
        // First get current page to get version number
        const currentPage = input.pageId 
          ? await apiClient.getPage(input.pageId, ['version'])
          : await apiClient.getPageByTitle(input.spaceKey!, input.pageTitle!, ['version'])
        
        const updateRequest: UpdatePageRequest = {
          version: { number: currentPage.version.number + 1 }
        }
        
        if (input.title) {
          updateRequest.title = input.title
        }
        
        if (input.content) {
          const updateContentBody = createContentBody(input.content, input.contentFormat || 'storage')
          updateRequest.body = {
            storage: {
              value: updateContentBody.storage?.value || input.content,
              representation: 'storage'
            }
          }
        }
        
        if (input.labels && input.labels.length > 0) {
          updateRequest.metadata = {
            labels: input.labels.map(name => ({ name }))
          }
        }
        
        const updatedPage = await apiClient.updatePage(currentPage.id, updateRequest)
        
        return {
          ...baseResult,
          success: true,
          page: updatedPage
        }

      case 'search':
        const searchResults = input.searchSpace || input.searchType
          ? await apiClient.searchContent(input.query!, {
              spaceKey: input.searchSpace,
              type: input.searchType,
              start: input.start,
              limit: input.limit,
              excerpt: 'highlight'
            })
          : await apiClient.search({
              cql: input.query!,
              start: input.start,
              limit: input.limit,
              excerpt: 'highlight'
            })
        
        return {
          ...baseResult,
          success: true,
          searchResults
        }

      case 'list':
        const spaceKeys = input.spaceKeys || [input.spaceKey!]
        const allPages: ConfluencePage[] = []
        
        for (const spaceKey of spaceKeys) {
          const spacePages = await apiClient.getSpaceContent(spaceKey, {
            type: input.contentType,
            orderby: input.orderBy,
            start: input.start,
            limit: input.limit,
            expand: input.expand
          })
          allPages.push(...spacePages)
        }
        
        return {
          ...baseResult,
          success: true,
          pages: allPages
        }

      case 'spaces':
        const spaces = await apiClient.getSpaces({
          start: input.start,
          limit: input.limit,
          expand: input.expand
        })
        
        return {
          ...baseResult,
          success: true,
          spaces
        }

      case 'attachments':
        const attachments = await apiClient.getAttachments(input.pageId!)
        
        return {
          ...baseResult,
          success: true,
          attachments
        }

      default:
        return {
          ...baseResult,
          success: false,
          error: `Unknown operation: ${input.operation}`
        }
    }
  } catch (error) {
    return {
      ...baseResult,
      success: false,
      error: getErrorMessage(error)
    }
  }
}
