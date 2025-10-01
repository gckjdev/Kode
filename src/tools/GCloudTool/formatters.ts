import { GCloudToolOutput, AuthenticationStatus } from './types'

/**
 * Format command output for the AI assistant
 */
export function formatOutputForAssistant(output: GCloudToolOutput): string {
  if (!output.success) {
    return formatErrorForAssistant(output)
  }

  // If we have structured JSON output, format it nicely
  if (output.structuredOutput) {
    return formatStructuredOutputForAssistant(output)
  }

  // Otherwise format standard output
  return formatStandardOutputForAssistant(output)
}

/**
 * Format error output for the AI assistant
 */
export function formatErrorForAssistant(output: GCloudToolOutput): string {
  let result = `Error executing gcloud command: ${output.error || 'Unknown error'}`
  
  if (output.exitCode !== undefined) {
    result += `\nExit code: ${output.exitCode}`
  }
  
  if (output.authenticationRequired) {
    result += '\n\nAuthentication required. Please authenticate with Google Cloud SDK.'
    
    if (output.suggestions && output.suggestions.length > 0) {
      result += '\nSuggested commands:'
      output.suggestions.forEach(suggestion => {
        result += `\n- ${suggestion}`
      })
    }
  } else if (output.suggestions && output.suggestions.length > 0) {
    result += '\n\nSuggestions:'
    output.suggestions.forEach(suggestion => {
      result += `\n- ${suggestion}`
    })
  }
  
  if (output.stderr && output.stderr.length > 0) {
    const errorDetails = output.stderr.join('\n').trim()
    if (errorDetails) {
      result += `\n\nError details:\n${errorDetails}`
    }
  }
  
  return result
}

/**
 * Format structured JSON output for the AI assistant
 */
export function formatStructuredOutputForAssistant(output: GCloudToolOutput): string {
  try {
    // For authentication status, format specially
    if (output.command === 'auth list' && output.structuredOutput) {
      return formatAuthStatusForAssistant(output.structuredOutput as AuthenticationStatus)
    }
    
    // For other structured outputs, format as JSON
    const structuredData = output.structuredOutput
    
    // Handle empty arrays/objects
    if (Array.isArray(structuredData) && structuredData.length === 0) {
      return 'Command executed successfully. No results returned.'
    }
    
    if (typeof structuredData === 'object' && 
        structuredData !== null && 
        Object.keys(structuredData).length === 0) {
      return 'Command executed successfully. Empty object returned.'
    }
    
    // Format as JSON string with 2-space indentation
    return `Command executed successfully. Result:\n\n${JSON.stringify(structuredData, null, 2)}`
  } catch (error) {
    // Fallback to standard output if JSON formatting fails
    return formatStandardOutputForAssistant(output)
  }
}

/**
 * Format standard output for the AI assistant
 */
export function formatStandardOutputForAssistant(output: GCloudToolOutput): string {
  let result = 'Command executed successfully.'
  
  if (output.executionTime !== undefined) {
    result += ` (${formatExecutionTime(output.executionTime)})`
  }
  
  if (output.stdout && output.stdout.length > 0) {
    const stdoutContent = output.stdout.join('\n').trim()
    if (stdoutContent) {
      result += `\n\nOutput:\n${stdoutContent}`
    }
  }
  
  return result
}

/**
 * Format authentication status for the AI assistant
 */
export function formatAuthStatusForAssistant(status: AuthenticationStatus): string {
  if (!status.isAuthenticated) {
    return 'Not authenticated with Google Cloud SDK. Please run "gcloud auth login" to authenticate.'
  }
  
  let result = 'Google Cloud SDK authentication status:'
  
  if (status.activeAccount) {
    result += `\nActive account: ${status.activeAccount}`
  }
  
  if (status.defaultProject) {
    result += `\nDefault project: ${status.defaultProject}`
  }
  
  if (status.availableAccounts && status.availableAccounts.length > 0) {
    if (status.availableAccounts.length === 1) {
      // Don't repeat if there's only one account and it's the active one
      if (!status.activeAccount || status.availableAccounts[0] !== status.activeAccount) {
        result += `\nAvailable account: ${status.availableAccounts[0]}`
      }
    } else {
      result += '\nAvailable accounts:'
      status.availableAccounts.forEach(account => {
        const isActive = account === status.activeAccount ? ' (active)' : ''
        result += `\n- ${account}${isActive}`
      })
    }
  }
  
  return result
}

/**
 * Format execution time in a human-readable format
 */
export function formatExecutionTime(timeMs: number): string {
  if (timeMs < 1000) {
    return `${timeMs}ms`
  } else if (timeMs < 60000) {
    return `${(timeMs / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(timeMs / 60000)
    const seconds = ((timeMs % 60000) / 1000).toFixed(1)
    return `${minutes}m ${seconds}s`
  }
}

/**
 * Format command for display
 */
export function formatCommandForDisplay(command: string): string {
  // Ensure command starts with gcloud
  if (!command.startsWith('gcloud ')) {
    command = `gcloud ${command}`
  }
  
  return command
}

/**
 * Format suggestions for display
 */
export function formatSuggestionsForDisplay(suggestions: string[]): string {
  if (!suggestions || suggestions.length === 0) {
    return ''
  }
  
  return suggestions.map(suggestion => `• ${suggestion}`).join('\n')
}
