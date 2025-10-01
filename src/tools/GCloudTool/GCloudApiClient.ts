import { spawn, ChildProcess } from 'child_process'
import { getGlobalConfig } from '@utils/config'
import { logError } from '@utils/log'
import { existsSync } from 'fs'
import { resolve } from 'path'
import {
  GCloudCommand,
  CommandExecution,
  ExecutionStatus,
  OutputLine,
  AuthenticationStatus,
  GCloudError
} from './types'

export class GCloudApiClient {
  private static DEFAULT_TIMEOUT = 300000 // 5 minutes

  /**
   * Check if gcloud SDK is installed and available
   */
  async isGCloudAvailable(): Promise<boolean> {
    try {
      const process = spawn('gcloud', ['version'], { shell: true })
      return new Promise<boolean>((resolve) => {
        process.on('error', () => resolve(false))
        process.on('exit', (code) => resolve(code === 0))
      })
    } catch (error) {
      return false
    }
  }

  /**
   * Get gcloud configuration from .kode.json
   */
  getGCloudConfig() {
    const config = getGlobalConfig()
    return config.gcloud || {}
  }

  /**
   * Execute a gcloud command
   */
  async executeCommand(command: GCloudCommand): Promise<CommandExecution> {
    // Validate command
    if (!command.command.startsWith('gcloud ')) {
      throw new GCloudError('Command must start with "gcloud"')
    }

    // Check if gcloud is available
    const isAvailable = await this.isGCloudAvailable()
    if (!isAvailable) {
      throw new GCloudError(
        'Google Cloud SDK not found. Please install it from https://cloud.google.com/sdk/docs/install',
        undefined,
        undefined,
        false,
        ['Install Google Cloud SDK', 'Add gcloud to your PATH']
      )
    }

    // Check working directory
    if (command.workingDirectory && !existsSync(command.workingDirectory)) {
      throw new GCloudError(`Working directory does not exist: ${command.workingDirectory}`)
    }

    // Prepare execution
    const execution: CommandExecution = {
      id: crypto.randomUUID(),
      command,
      status: ExecutionStatus.Pending,
      startTime: new Date(),
      stdout: [],
      stderr: [],
      cancelled: false
    }

    try {
      // Execute command
      const result = await this.runCommand(execution)
      return result
    } catch (error) {
      if (error instanceof GCloudError) {
        throw error
      }
      
      logError(error)
      throw new GCloudError(`Failed to execute command: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Run a command and stream output
   */
  private async runCommand(execution: CommandExecution): Promise<CommandExecution> {
    return new Promise<CommandExecution>((resolve, reject) => {
      try {
        // Parse command into args
        const args = execution.command.command.replace(/^gcloud\s+/, '').split(/\s+/)
        const config = this.getGCloudConfig()
        
        // Apply JSON format if supported and requested
        if (execution.command.supportsJson && 
            (config.preferJsonOutput || execution.command.args.includes('--format=json'))) {
          if (!args.some(arg => arg.startsWith('--format='))) {
            args.push('--format=json')
          }
        }
        
        // Spawn process
        const spawnOptions = {
          cwd: execution.command.workingDirectory,
          env: {
            ...process.env,
            ...execution.command.environment
          },
          shell: true
        }
        
        const childProcess = spawn('gcloud', args, spawnOptions)
        execution.pid = childProcess.pid
        execution.status = ExecutionStatus.Running
        
        // Set up timeout
        const timeout = execution.command.timeout || config.defaultTimeout || GCloudApiClient.DEFAULT_TIMEOUT
        const timeoutId = setTimeout(() => {
          this.killProcess(childProcess)
          execution.status = ExecutionStatus.Failed
          reject(new GCloudError(`Command timed out after ${timeout}ms`))
        }, timeout)
        
        // Handle output
        this.handleProcessOutput(childProcess, execution)
        
        // Handle process completion
        childProcess.on('close', (code) => {
          clearTimeout(timeoutId)
          execution.endTime = new Date()
          execution.exitCode = code || 0
          
          if (execution.cancelled) {
            execution.status = ExecutionStatus.Cancelled
          } else if (code === 0) {
            execution.status = ExecutionStatus.Completed
          } else {
            execution.status = ExecutionStatus.Failed
            
            // Check for authentication errors
            const authError = this.checkForAuthError(execution.stderr)
            if (authError) {
              reject(new GCloudError(
                'Authentication required',
                code,
                execution.stderr,
                true,
                [
                  'Run "gcloud auth login" to authenticate',
                  'Run "gcloud auth application-default login" for application default credentials'
                ]
              ))
              return
            }
          }
          
          resolve(execution)
        })
        
        // Handle process errors
        childProcess.on('error', (error) => {
          clearTimeout(timeoutId)
          execution.status = ExecutionStatus.Failed
          execution.endTime = new Date()
          reject(new GCloudError(`Process error: ${error.message}`))
        })
      } catch (error) {
        execution.status = ExecutionStatus.Failed
        execution.endTime = new Date()
        reject(new GCloudError(`Failed to start command: ${error instanceof Error ? error.message : String(error)}`))
      }
    })
  }
  
  /**
   * Handle process output streams
   */
  private handleProcessOutput(process: ChildProcess, execution: CommandExecution): void {
    let stdoutLineNumber = 0
    let stderrLineNumber = 0
    
    process.stdout?.on('data', (data) => {
      const lines = data.toString().split(/\r?\n/).filter(Boolean)
      
      lines.forEach(line => {
        stdoutLineNumber++
        const outputLine: OutputLine = {
          content: line,
          timestamp: new Date(),
          stream: 'stdout',
          lineNumber: stdoutLineNumber,
          isJson: this.isJsonContent(line)
        }
        
        execution.stdout.push(outputLine.content)
      })
    })
    
    process.stderr?.on('data', (data) => {
      const lines = data.toString().split(/\r?\n/).filter(Boolean)
      
      lines.forEach(line => {
        stderrLineNumber++
        const outputLine: OutputLine = {
          content: line,
          timestamp: new Date(),
          stream: 'stderr',
          lineNumber: stderrLineNumber,
          isJson: false
        }
        
        execution.stderr.push(outputLine.content)
      })
    })
  }
  
  /**
   * Check if content is valid JSON
   */
  private isJsonContent(content: string): boolean {
    try {
      JSON.parse(content)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Kill a running process
   */
  killProcess(process: ChildProcess): void {
    try {
      if (process.pid) {
        process.kill('SIGTERM')
      }
    } catch (error) {
      logError(`Failed to kill process: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  /**
   * Cancel a running command execution
   */
  cancelExecution(execution: CommandExecution): boolean {
    if (execution.status !== ExecutionStatus.Running || !execution.pid) {
      return false
    }
    
    try {
      process.kill(execution.pid, 'SIGTERM')
      execution.cancelled = true
      execution.status = ExecutionStatus.Cancelled
      execution.endTime = new Date()
      return true
    } catch (error) {
      logError(`Failed to cancel execution: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }
  
  /**
   * Check if stderr contains authentication errors
   */
  private checkForAuthError(stderr: string[]): boolean {
    const authErrorPatterns = [
      'not authorized',
      'not authenticated',
      'authentication required',
      'please run',
      'gcloud auth login',
      'credentials not found',
      'no credentials'
    ]
    
    return stderr.some(line => 
      authErrorPatterns.some(pattern => line.toLowerCase().includes(pattern))
    )
  }
  
  /**
   * Get current authentication status
   */
  async getAuthenticationStatus(): Promise<AuthenticationStatus> {
    try {
      const execution = await this.executeCommand({
        command: 'gcloud auth list --format=json',
        args: ['auth', 'list', '--format=json'],
        requiresInteraction: false,
        supportsJson: true
      })
      
      if (execution.status !== ExecutionStatus.Completed) {
        return {
          isAuthenticated: false,
          availableAccounts: [],
          lastChecked: new Date()
        }
      }
      
      // Parse accounts
      const jsonOutput = execution.stdout.join('')
      let accounts: Array<{ account: string, status: string }> = []
      
      try {
        accounts = JSON.parse(jsonOutput)
      } catch {
        // If parsing fails, assume not authenticated
        return {
          isAuthenticated: false,
          availableAccounts: [],
          lastChecked: new Date()
        }
      }
      
      // Get active account
      const activeAccount = accounts.find(acc => acc.status === 'ACTIVE')?.account
      
      // Get default project
      const projectExecution = await this.executeCommand({
        command: 'gcloud config get-value project --format=json',
        args: ['config', 'get-value', 'project', '--format=json'],
        requiresInteraction: false,
        supportsJson: true
      })
      
      let defaultProject: string | undefined
      
      try {
        if (projectExecution.status === ExecutionStatus.Completed) {
          const projectJson = projectExecution.stdout.join('')
          defaultProject = JSON.parse(projectJson)
          if (defaultProject === '(unset)') {
            defaultProject = undefined
          }
        }
      } catch {
        defaultProject = undefined
      }
      
      return {
        isAuthenticated: accounts.length > 0,
        activeAccount,
        availableAccounts: accounts.map(acc => acc.account),
        defaultProject,
        lastChecked: new Date()
      }
    } catch (error) {
      // If checking auth status fails, assume not authenticated
      return {
        isAuthenticated: false,
        availableAccounts: [],
        lastChecked: new Date()
      }
    }
  }
}
