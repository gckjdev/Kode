import { GCloudApiClient } from './GCloudApiClient'
import { 
  GCloudInput, 
  GCloudCommand, 
  CommandExecution, 
  ExecutionStatus, 
  GCloudToolOutput,
  GCloudError
} from './types'
import { logError } from '@utils/log'

export class GCloudOperations {
  private apiClient: GCloudApiClient

  constructor(apiClient: GCloudApiClient) {
    this.apiClient = apiClient
  }

  /**
   * Validate and prepare a command for execution
   */
  prepareCommand(input: GCloudInput): GCloudCommand {
    // Add 'gcloud' prefix if not present
    const fullCommand = input.command.startsWith('gcloud ') 
      ? input.command 
      : `gcloud ${input.command}`
    
    // Parse arguments
    const args = fullCommand.replace(/^gcloud\s+/, '').split(/\s+/)
    
    // Detect if command supports JSON output
    const supportsJson = this.detectJsonSupport(args)
    
    return {
      command: fullCommand,
      args,
      workingDirectory: input.workingDirectory,
      environment: input.environment,
      timeout: input.timeout,
      requiresInteraction: input.interactive ?? false,
      supportsJson
    }
  }

  /**
   * Execute a command and return formatted output
   */
  async executeCommand(input: GCloudInput): Promise<GCloudToolOutput> {
    try {
      // Check if gcloud is available
      const isAvailable = await this.apiClient.isGCloudAvailable()
      if (!isAvailable) {
        return {
          command: input.command,
          success: false,
          error: 'Google Cloud SDK not found. Please install it from https://cloud.google.com/sdk/docs/install',
          suggestions: [
            'Install Google Cloud SDK',
            'Add gcloud to your PATH'
          ]
        }
      }
      
      // Prepare command
      const command = this.prepareCommand(input)
      
      // Execute command
      const startTime = Date.now()
      const execution = await this.apiClient.executeCommand(command)
      const executionTime = Date.now() - startTime
      
      // Parse structured output if available
      let structuredOutput: any = undefined
      if (command.supportsJson && execution.stdout.length > 0) {
        try {
          const jsonContent = execution.stdout.join('')
          structuredOutput = JSON.parse(jsonContent)
        } catch (error) {
          // Ignore JSON parsing errors
        }
      }
      
      // Build result
      const result: GCloudToolOutput = {
        command: input.command,
        success: execution.status === ExecutionStatus.Completed,
        exitCode: execution.exitCode,
        stdout: execution.stdout,
        stderr: execution.stderr,
        executionTime,
        cancelled: execution.cancelled,
        structuredOutput
      }
      
      return result
    } catch (error) {
      logError(error)
      
      if (error instanceof GCloudError) {
        return {
          command: input.command,
          success: false,
          error: error.message,
          stderr: error.stderr,
          exitCode: error.exitCode,
          authenticationRequired: error.authenticationRequired,
          suggestions: error.suggestions
        }
      }
      
      return {
        command: input.command,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * Check authentication status
   */
  async checkAuthenticationStatus(): Promise<GCloudToolOutput> {
    try {
      const status = await this.apiClient.getAuthenticationStatus()
      
      return {
        command: 'auth list',
        success: status.isAuthenticated,
        structuredOutput: status,
        error: status.isAuthenticated ? undefined : 'Not authenticated with Google Cloud SDK',
        authenticationRequired: !status.isAuthenticated,
        suggestions: status.isAuthenticated ? undefined : [
          'Run "gcloud auth login" to authenticate',
          'Run "gcloud auth application-default login" for application default credentials'
        ]
      }
    } catch (error) {
      logError(error)
      
      return {
        command: 'auth list',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        authenticationRequired: true,
        suggestions: [
          'Run "gcloud auth login" to authenticate',
          'Run "gcloud auth application-default login" for application default credentials'
        ]
      }
    }
  }

  /**
   * Cancel a running command
   */
  cancelCommand(execution: CommandExecution): boolean {
    return this.apiClient.cancelExecution(execution)
  }

  /**
   * Detect if a command supports JSON output format
   */
  private detectJsonSupport(args: string[]): boolean {
    // Commands that typically don't support JSON output
    const nonJsonCommands = [
      'init', 'components', 'feedback', 'help', 'topic', 'version',
      'alpha', 'beta', 'docker', 'emulators', 'interactive'
    ]
    
    // Check if command is in non-JSON list
    if (args.length > 0 && nonJsonCommands.includes(args[0])) {
      return false
    }
    
    // Most other gcloud commands support JSON
    return true
  }
}
