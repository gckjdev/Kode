# GCloud Tool Interface Contract

## Tool Interface Specification

### Tool Definition
```typescript
interface GCloudTool extends Tool {
  name: 'gcloud'
  inputSchema: GCloudInputSchema
  description(): Promise<string>
  userFacingName(): string
  isReadOnly(): boolean
  isConcurrencySafe(): boolean
  isEnabled(): Promise<boolean>
  needsPermissions(): boolean
  prompt(): Promise<string>
  renderResultForAssistant(output: GCloudToolOutput): string
  renderToolUseMessage(input: GCloudInput): string
  renderToolUseRejectedMessage(): ReactElement
  renderToolResultMessage(output: GCloudToolOutput): ReactElement
  call(input: GCloudInput, context: ToolUseContext): AsyncGenerator<ToolResult>
}
```

### Input Schema
```typescript
const gcloudInputSchema = z.strictObject({
  command: z.string().describe('The gcloud command to execute (without "gcloud" prefix)'),
  workingDirectory: z.string().optional().describe('Directory to execute command from'),
  timeout: z.number().positive().optional().describe('Command timeout in milliseconds'),
  format: z.enum(['json', 'raw', 'auto']).optional().default('auto').describe('Output format preference'),
  interactive: z.boolean().optional().default(false).describe('Whether command may require user interaction'),
  environment: z.record(z.string()).optional().describe('Additional environment variables')
})

type GCloudInput = z.infer<typeof gcloudInputSchema>
```

### Output Schema
```typescript
interface GCloudToolOutput {
  command: string
  success: boolean
  exitCode?: number
  stdout?: string[]
  stderr?: string[]
  executionTime?: number
  cancelled?: boolean
  error?: string
  authenticationRequired?: boolean
  suggestions?: string[]
  structuredOutput?: any
}
```

## Method Contracts

### Tool Properties
- **name**: Must return 'gcloud'
- **userFacingName**: Must return 'Google Cloud SDK'
- **isReadOnly**: Must return false (executes commands)
- **isConcurrencySafe**: Must return false (shell execution not thread-safe)
- **needsPermissions**: Must return true (requires shell execution permission)

### Async Methods

#### description()
**Contract**: Returns tool description for AI assistant
**Returns**: Promise<string>
**Requirements**:
- Must describe gcloud command execution capabilities
- Must mention authentication requirements
- Must be clear and concise for AI consumption

#### isEnabled()
**Contract**: Checks if gcloud SDK is available
**Returns**: Promise<boolean>
**Requirements**:
- Must verify gcloud is installed and in PATH
- Must return false if gcloud not available
- Must not throw exceptions

#### prompt()
**Contract**: Returns detailed tool prompt for AI
**Returns**: Promise<string>
**Requirements**:
- Must include usage examples
- Must explain input parameters
- Must mention common use cases

### Rendering Methods

#### renderResultForAssistant(output: GCloudToolOutput)
**Contract**: Formats output for AI assistant consumption
**Parameters**: GCloudToolOutput object
**Returns**: string
**Requirements**:
- Must format structured output when available
- Must include error messages and suggestions
- Must be concise but informative
- Must handle authentication errors specially

#### renderToolUseMessage(input: GCloudInput)
**Contract**: Formats user-facing message about tool usage
**Parameters**: GCloudInput object
**Returns**: string
**Requirements**:
- Must show the command being executed
- Must indicate working directory if specified
- Must be clear and informative

#### renderToolUseRejectedMessage()
**Contract**: Shows message when tool use is rejected
**Returns**: ReactElement
**Requirements**:
- Must explain why tool was rejected
- Must provide guidance for resolution
- Must use consistent UI components

#### renderToolResultMessage(output: GCloudToolOutput)
**Contract**: Renders full tool result with UI components
**Parameters**: GCloudToolOutput object
**Returns**: ReactElement
**Requirements**:
- Must show command execution status
- Must display output in readable format
- Must highlight errors and warnings
- Must provide authentication guidance when needed

### Core Execution Method

#### call(input: GCloudInput, context: ToolUseContext)
**Contract**: Executes gcloud command and streams results
**Parameters**: 
- input: Validated GCloudInput object
- context: Tool execution context
**Returns**: AsyncGenerator<ToolResult>
**Requirements**:
- Must validate gcloud SDK availability
- Must check authentication status
- Must execute command with proper environment
- Must stream output in real-time
- Must handle cancellation gracefully
- Must provide structured output when possible
- Must yield progress updates for long-running commands
- Must handle authentication errors with helpful guidance

## Error Handling Contracts

### Authentication Errors
**Requirement**: When gcloud is not authenticated:
- Set `authenticationRequired: true` in output
- Provide specific authentication commands in `suggestions`
- Include helpful error message explaining the issue

### Command Errors
**Requirement**: When gcloud command fails:
- Include full error output in `stderr`
- Set `success: false` and include `exitCode`
- Parse common errors and provide suggestions
- Maintain original gcloud error formatting

### System Errors
**Requirement**: When system-level errors occur:
- Catch and wrap exceptions appropriately
- Provide clear error messages for users
- Log technical details for debugging
- Never expose internal implementation details

## Performance Contracts

### Response Time
- **Command startup**: <500ms from call to first output
- **Output streaming**: Real-time with <100ms latency
- **Authentication check**: <2 seconds for status verification

### Resource Usage
- **Memory**: Limit output buffering to 10MB per command
- **CPU**: Minimal overhead beyond gcloud command itself
- **Processes**: Clean up child processes on cancellation

### Cancellation
- **Signal handling**: Respond to cancellation within 1 second
- **Process cleanup**: Terminate child processes gracefully
- **State cleanup**: Clear execution state on cancellation

## Integration Contracts

### Kode Tool System
- Must implement complete Tool interface
- Must integrate with permission system
- Must use standard error handling patterns
- Must follow constitutional principles

### Google Cloud SDK
- Must preserve gcloud authentication context
- Must respect gcloud configuration files
- Must handle all gcloud command variations
- Must maintain compatibility across gcloud versions

### Operating System
- Must work on macOS, Linux, and Windows
- Must handle different shell environments
- Must respect system PATH configuration
- Must handle process signals appropriately
