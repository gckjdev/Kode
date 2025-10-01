# Data Model: Google Cloud SDK Tool

## Core Entities

### GCloudCommand
Represents a gcloud SDK command with its execution context and parameters.

**Attributes**:
- `command: string` - The full gcloud command string (e.g., "gcloud projects list")
- `args: string[]` - Parsed command arguments and flags
- `workingDirectory?: string` - Directory to execute command from
- `environment?: Record<string, string>` - Additional environment variables
- `timeout?: number` - Command timeout in milliseconds (default: 300000)
- `requiresInteraction: boolean` - Whether command may require user input
- `supportsJson: boolean` - Whether command supports --format=json flag

**Validation Rules**:
- Command must start with "gcloud"
- Command string cannot be empty
- Timeout must be positive integer if specified
- Working directory must exist if specified

**State Transitions**:
```
Created → Validating → Executing → [Completed | Failed | Cancelled]
```

### CommandExecution
Represents the runtime execution state and results of a gcloud command.

**Attributes**:
- `id: string` - Unique execution identifier
- `command: GCloudCommand` - The command being executed
- `status: ExecutionStatus` - Current execution state
- `startTime: Date` - When execution began
- `endTime?: Date` - When execution completed
- `exitCode?: number` - Process exit code
- `stdout: string[]` - Standard output lines
- `stderr: string[]` - Standard error lines
- `cancelled: boolean` - Whether execution was cancelled by user
- `pid?: number` - Process ID for cancellation

**Validation Rules**:
- ID must be unique per session
- Start time required for all executions
- End time only set when execution completes
- Exit code only valid when execution finishes

**Relationships**:
- One CommandExecution belongs to one GCloudCommand
- CommandExecution can have multiple OutputLines

### OutputLine
Represents a single line of command output with metadata.

**Attributes**:
- `content: string` - The actual output text
- `timestamp: Date` - When line was received
- `stream: 'stdout' | 'stderr'` - Which output stream
- `lineNumber: number` - Sequential line number
- `isJson: boolean` - Whether content is valid JSON

**Validation Rules**:
- Content cannot contain null bytes
- Timestamp must be valid Date
- Line number must be positive integer
- Stream must be either 'stdout' or 'stderr'

### AuthenticationStatus
Represents the current Google Cloud authentication state.

**Attributes**:
- `isAuthenticated: boolean` - Whether user is authenticated
- `activeAccount?: string` - Currently active account email
- `availableAccounts: string[]` - List of configured accounts
- `defaultProject?: string` - Default GCP project
- `lastChecked: Date` - When status was last verified

**Validation Rules**:
- Available accounts must be valid email addresses
- Default project must be valid GCP project ID format
- Last checked must be recent (within last hour for accuracy)

### CommandHistory
Represents the history of executed gcloud commands for recall and repetition.

**Attributes**:
- `commands: HistoryEntry[]` - List of executed commands
- `maxEntries: number` - Maximum history size (default: 100)
- `sessionId: string` - Current session identifier

**Validation Rules**:
- Commands list cannot exceed maxEntries
- Session ID must be unique per tool session
- History entries must be chronologically ordered

### HistoryEntry
Represents a single command in the execution history.

**Attributes**:
- `command: string` - The executed command
- `timestamp: Date` - When command was executed
- `success: boolean` - Whether command succeeded
- `executionTime: number` - How long command took (milliseconds)
- `workingDirectory: string` - Directory where command was executed

**Validation Rules**:
- Command cannot be empty
- Timestamp must be valid Date
- Execution time must be non-negative
- Working directory must be valid path

## Entity Relationships

```
GCloudCommand (1) ←→ (1) CommandExecution
CommandExecution (1) ←→ (*) OutputLine
AuthenticationStatus (1) ←→ (*) GCloudCommand
CommandHistory (1) ←→ (*) HistoryEntry
```

## Data Flow

### Command Execution Flow
1. **Input Validation**: User input parsed into GCloudCommand
2. **Authentication Check**: Verify AuthenticationStatus before execution
3. **Execution**: Create CommandExecution and start process
4. **Output Streaming**: Create OutputLine for each line received
5. **Completion**: Update CommandExecution with final status
6. **History**: Add HistoryEntry to CommandHistory

### Authentication Flow
1. **Status Check**: Execute `gcloud auth list` to get AuthenticationStatus
2. **Validation**: Verify active account and project access
3. **Guidance**: Provide helpful tips if authentication issues detected

### Output Processing Flow
1. **Stream Capture**: Receive stdout/stderr from gcloud process
2. **Line Processing**: Parse each line into OutputLine
3. **Format Detection**: Attempt JSON parsing for structured output
4. **Display**: Render output through appropriate formatter

## Storage Considerations

### In-Memory Storage
- **CommandExecution**: Active executions kept in memory
- **OutputLine**: Streamed lines buffered for display
- **AuthenticationStatus**: Cached for performance

### Persistent Storage
- **CommandHistory**: Stored in user session (not persisted across restarts)
- **Configuration**: Tool settings in global `.kode.json`

### Performance Constraints
- **Output Buffering**: Limit in-memory output to prevent memory issues
- **History Size**: Cap history entries to maintain performance
- **Authentication Caching**: Cache auth status to avoid repeated checks

## Error Handling

### Validation Errors
- Invalid command format
- Missing required parameters
- Authentication failures

### Runtime Errors
- Command execution failures
- Network connectivity issues
- Permission denied errors

### Recovery Strategies
- Graceful degradation for non-critical features
- Clear error messages with actionable guidance
- Automatic retry for transient failures
