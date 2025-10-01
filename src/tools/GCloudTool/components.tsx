import React from 'react'
import { Box, Text } from 'ink'
import { FallbackToolUseRejectedMessage } from '@components/FallbackToolUseRejectedMessage'
import { GCloudToolOutput, GCloudInput } from './types'
import { formatCommandForDisplay, formatSuggestionsForDisplay } from './formatters'

const theme = {
  success: 'green',
  error: 'red',
  info: 'blue',
  warning: 'yellow',
  command: 'cyan',
  output: 'white',
  suggestion: 'magenta'
} as const

/**
 * Renders the result of a GCloud tool execution
 */
export function GCloudToolResultComponent({ result }: { result: GCloudToolOutput }) {
  return (
    <Box flexDirection="column">
      <Text color={result.success ? theme.success : theme.error}>
        {result.success ? '✓ ' : '✗ '}
        {result.success ? 'Command executed successfully' : `Error: ${result.error || 'Unknown error'}`}
      </Text>
      
      {result.command && (
        <Text color={theme.command}>
          $ {formatCommandForDisplay(result.command)}
        </Text>
      )}
      
      {result.executionTime !== undefined && (
        <Text color={theme.info}>
          Execution time: {formatExecutionTime(result.executionTime)}
        </Text>
      )}
      
      {result.exitCode !== undefined && !result.success && (
        <Text color={theme.error}>
          Exit code: {result.exitCode}
        </Text>
      )}
      
      {result.authenticationRequired && (
        <Text color={theme.warning}>
          Authentication required. Please authenticate with Google Cloud SDK.
        </Text>
      )}
      
      {result.suggestions && result.suggestions.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color={theme.suggestion}>
            Suggestions:
          </Text>
          {result.suggestions.map((suggestion, index) => (
            <Text key={index} color={theme.suggestion}>
              • {suggestion}
            </Text>
          ))}
        </Box>
      )}
      
      {result.stdout && result.stdout.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color={theme.info}>Output:</Text>
          <Text color={theme.output}>
            {result.stdout.join('\n')}
          </Text>
        </Box>
      )}
      
      {!result.success && result.stderr && result.stderr.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color={theme.error}>Error output:</Text>
          <Text color={theme.error}>
            {result.stderr.join('\n')}
          </Text>
        </Box>
      )}
    </Box>
  )
}

/**
 * Renders a message when the tool use is rejected
 */
export function GCloudToolRejectedMessage() {
  return (
    <FallbackToolUseRejectedMessage
      toolName="Google Cloud SDK"
      reason="Permission denied"
    />
  )
}

/**
 * Renders a message about the tool being used
 */
export function GCloudToolUseMessage({ input }: { input: GCloudInput }) {
  return (
    <Text color={theme.info}>
      Executing Google Cloud SDK command: {formatCommandForDisplay(input.command)}
    </Text>
  )
}

/**
 * Format execution time in a human-readable format
 */
function formatExecutionTime(timeMs: number): string {
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
