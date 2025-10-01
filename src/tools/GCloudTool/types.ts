import { z } from 'zod'

// GCloudCommand entity
export enum CommandState {
  Created = 'created',
  Validating = 'validating',
  Executing = 'executing',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled'
}

export interface GCloudCommand {
  command: string
  args: string[]
  workingDirectory?: string
  environment?: Record<string, string>
  timeout?: number
  requiresInteraction: boolean
  supportsJson: boolean
}

export const gcloudCommandSchema = z.object({
  command: z.string().min(1),
  args: z.array(z.string()),
  workingDirectory: z.string().optional(),
  environment: z.record(z.string()).optional(),
  timeout: z.number().positive().optional(),
  requiresInteraction: z.boolean(),
  supportsJson: z.boolean()
})

// CommandExecution entity
export enum ExecutionStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled'
}

export interface CommandExecution {
  id: string
  command: GCloudCommand
  status: ExecutionStatus
  startTime: Date
  endTime?: Date
  exitCode?: number
  stdout: string[]
  stderr: string[]
  cancelled: boolean
  pid?: number
}

export const commandExecutionSchema = z.object({
  id: z.string().uuid(),
  command: gcloudCommandSchema,
  status: z.nativeEnum(ExecutionStatus),
  startTime: z.date(),
  endTime: z.date().optional(),
  exitCode: z.number().optional(),
  stdout: z.array(z.string()),
  stderr: z.array(z.string()),
  cancelled: z.boolean(),
  pid: z.number().optional()
})

// OutputLine entity
export interface OutputLine {
  content: string
  timestamp: Date
  stream: 'stdout' | 'stderr'
  lineNumber: number
  isJson: boolean
}

export const outputLineSchema = z.object({
  content: z.string(),
  timestamp: z.date(),
  stream: z.enum(['stdout', 'stderr']),
  lineNumber: z.number().positive(),
  isJson: z.boolean()
})

// AuthenticationStatus entity
export interface AuthenticationStatus {
  isAuthenticated: boolean
  activeAccount?: string
  availableAccounts: string[]
  defaultProject?: string
  lastChecked: Date
}

export const authenticationStatusSchema = z.object({
  isAuthenticated: z.boolean(),
  activeAccount: z.string().email().optional(),
  availableAccounts: z.array(z.string().email()),
  defaultProject: z.string().optional(),
  lastChecked: z.date()
})

// CommandHistory entity
export interface HistoryEntry {
  command: string
  timestamp: Date
  success: boolean
  executionTime: number
  workingDirectory: string
}

export const historyEntrySchema = z.object({
  command: z.string().min(1),
  timestamp: z.date(),
  success: z.boolean(),
  executionTime: z.number().nonnegative(),
  workingDirectory: z.string()
})

export interface CommandHistory {
  commands: HistoryEntry[]
  maxEntries: number
  sessionId: string
}

export const commandHistorySchema = z.object({
  commands: z.array(historyEntrySchema),
  maxEntries: z.number().positive(),
  sessionId: z.string().uuid()
})

// Tool input/output schemas
export const gcloudInputSchema = z.strictObject({
  command: z.string().describe('The gcloud command to execute (without "gcloud" prefix)'),
  workingDirectory: z.string().optional().describe('Directory to execute command from'),
  timeout: z.number().positive().optional().describe('Command timeout in milliseconds'),
  format: z.enum(['json', 'raw', 'auto']).optional().default('auto').describe('Output format preference'),
  interactive: z.boolean().optional().default(false).describe('Whether command may require user interaction'),
  environment: z.record(z.string()).optional().describe('Additional environment variables')
})

export type GCloudInput = z.infer<typeof gcloudInputSchema>

export interface GCloudToolOutput {
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

export class GCloudError extends Error {
  constructor(
    message: string,
    public readonly exitCode?: number,
    public readonly stderr?: string[],
    public readonly authenticationRequired?: boolean,
    public readonly suggestions?: string[]
  ) {
    super(message)
    this.name = 'GCloudError'
  }
}
