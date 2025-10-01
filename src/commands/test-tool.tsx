import { Command } from '@commands'
import { Box, Text, useInput } from 'ink'
import InkTextInput from 'ink-text-input'
import * as React from 'react'
import { useState } from 'react'
import { getAllTools } from '@tools'
import { Tool, ToolUseContext } from '@tool'
import { randomBytes } from 'crypto'
import { z } from 'zod'

// Example test cases for different tools
const TOOL_TEST_EXAMPLES = {
  gcloud: [
    {
      name: 'List GCP projects',
      description: 'List all accessible Google Cloud projects',
      input: {
        command: 'projects list',
        format: 'json'
      }
    },
    {
      name: 'Get authentication status',
      description: 'Check current authentication status',
      input: {
        command: 'auth list'
      }
    },
    {
      name: 'List compute instances',
      description: 'List all compute instances in the current project',
      input: {
        command: 'compute instances list',
        format: 'json'
      }
    },
    {
      name: 'Get current configuration',
      description: 'Display current gcloud configuration',
      input: {
        command: 'config list'
      }
    },
    {
      name: 'Run interactive command',
      description: 'Run a command that may require user interaction',
      input: {
        command: 'config set project my-project',
        interactive: true
      }
    }
  ],
  jira: [
    {
      name: 'Get JIRA ticket',
      description: 'Retrieve details for a JIRA ticket',
      input: {
        operation: 'get',
        ticketKey: 'PROJ-123'
      }
    },
    {
      name: 'Create JIRA ticket',
      description: 'Create a new bug ticket',
      input: {
        operation: 'create',
        project: 'PROJ',
        issueType: 'Bug',
        summary: 'Test ticket from Kode',
        description: 'This is a test ticket created from the Kode test-tool command',
        priority: 'Medium'
      }
    },
    {
      name: 'Update JIRA ticket',
      description: 'Update an existing ticket',
      input: {
        operation: 'update',
        ticketKey: 'PROJ-123',
        summary: 'Updated summary',
        status: 'In Progress'
      }
    }
  ],
  file_read: [
    {
      name: 'Read file',
      description: 'Read contents of a file',
      input: {
        file_path: './package.json'
      }
    }
  ],
  bash: [
    {
      name: 'List directory',
      description: 'List current directory contents',
      input: {
        command: 'ls -la'
      }
    },
    {
      name: 'Check Node version',
      description: 'Check installed Node.js version',
      input: {
        command: 'node --version'
      }
    },
    {
      name: 'Run JiraTool tests (Node.js)',
      description: 'Execute JiraTool validation tests with Node.js',
      input: {
        command: 'node src/tools/JiraTool/test-runner.js'
      }
    },
    {
      name: 'Run JiraTool tests (Bun)',
      description: 'Execute JiraTool unit tests with Bun',
      input: {
        command: 'bun test src/tools/JiraTool/JiraTool.simple.test.ts'
      }
    }
  ],
  confluence: [
    {
      name: 'Get Confluence page by ID',
      description: 'Retrieve a specific Confluence page',
      input: {
        operation: 'get',
        pageId: '123456',
        expand: ['body.storage', 'version', 'metadata.labels']
      }
    },
    {
      name: 'Search Confluence content',
      description: 'Search for content across Confluence',
      input: {
        operation: 'search',
        query: 'project documentation',
        searchSpace: 'DOCS',
        limit: 10
      }
    },
    {
      name: 'List Confluence spaces',
      description: 'Get all available Confluence spaces',
      input: {
        operation: 'spaces',
        limit: 20
      }
    },
    {
      name: 'Create Confluence page',
      description: 'Create a new page in Confluence',
      input: {
        operation: 'create',
        title: 'Test Page from Kode',
        spaceKey: 'DOCS',
        content: '<p>This is a test page created from the Kode CLI tool.</p>',
        labels: ['test', 'kode', 'automation']
      }
    },
    {
      name: 'List space content',
      description: 'List all pages in a specific space',
      input: {
        operation: 'list',
        spaceKey: 'DOCS',
        contentType: 'page',
        orderBy: 'modified',
        limit: 15
      }
    }
  ],
  grep: [
    {
      name: 'Search for text',
      description: 'Search for specific text in files',
      input: {
        pattern: 'import.*React',
        path: './src'
      }
    }
  ]
}

interface TestToolProps {
  onDone: (result?: string) => void
}

const TestTool: React.FC<TestToolProps> = ({ onDone }) => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [selectedExample, setSelectedExample] = useState<number>(0)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [customInput, setCustomInput] = useState<string>('')
  const [mode, setMode] = useState<'select-tool' | 'select-example' | 'custom-input' | 'running' | 'result'>('select-tool')
  
  const tools = getAllTools()
  const [toolIndex, setToolIndex] = useState(0)

  useInput((input, key) => {
    if (mode === 'select-tool') {
      if (key.upArrow && toolIndex > 0) {
        setToolIndex(toolIndex - 1)
      } else if (key.downArrow && toolIndex < tools.length - 1) {
        setToolIndex(toolIndex + 1)
      } else if (key.return) {
        setSelectedTool(tools[toolIndex])
        setMode('select-example')
      } else if (input === 'q') {
        onDone()
      }
    } else if (mode === 'select-example' && selectedTool) {
      const examples = TOOL_TEST_EXAMPLES[selectedTool.name as keyof typeof TOOL_TEST_EXAMPLES] || []
      
      if (key.upArrow && selectedExample > 0) {
        setSelectedExample(selectedExample - 1)
      } else if (key.downArrow && selectedExample < examples.length) {
        setSelectedExample(selectedExample + 1)
      } else if (key.return) {
        if (selectedExample === examples.length) {
          setMode('custom-input')
        } else {
          runToolTest(examples[selectedExample].input)
        }
      } else if (key.escape) {
        setMode('select-tool')
        setSelectedTool(null)
      }
    } else if (mode === 'custom-input') {
      if (key.escape) {
        setMode('select-example')
        setCustomInput('')
      }
    } else if (mode === 'result') {
      if (key.return || key.escape) {
        setMode('select-tool')
        setSelectedTool(null)
        setResult(null)
        setError(null)
        setSelectedExample(0)
      }
    }
  })

  const runToolTest = async (input: any) => {
    if (!selectedTool) return
    
    setMode('running')
    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      // Validate input against tool schema
      const validatedInput = selectedTool.inputSchema.parse(input)
      
      // Create mock context
      const context: ToolUseContext = {
        messageId: randomBytes(16).toString('hex'),
        abortController: new AbortController(),
        readFileTimestamps: {},
        options: {
          verbose: true
        }
      }

      // Call the tool
      const generator = selectedTool.call(validatedInput, context)
      let finalResult = ''
      
      for await (const output of generator) {
        if (output.type === 'result') {
          finalResult = selectedTool.renderResultForAssistant(output.data)
          break
        }
      }
      
      setResult(finalResult || 'Tool executed successfully')
      setMode('result')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      setMode('result')
    } finally {
      setIsRunning(false)
    }
  }

  if (mode === 'select-tool') {
    return (
      <Box flexDirection="column">
        <Text bold color="blue">🛠️  Tool Testing Interface</Text>
        <Text>Select a tool to test (↑/↓ to navigate, Enter to select, 'q' to quit):</Text>
        <Text></Text>
        {tools.map((tool, index) => (
          <Box key={index}>
            <Text color={index === toolIndex ? 'yellow' : 'white'}>
              {index === toolIndex ? '→ ' : '  '}{tool.name} - {tool.userFacingName?.() || tool.name}
            </Text>
          </Box>
        ))}
      </Box>
    )
  }

  if (mode === 'select-example' && selectedTool) {
    const examples = TOOL_TEST_EXAMPLES[selectedTool.name as keyof typeof TOOL_TEST_EXAMPLES] || []
    
    return (
      <Box flexDirection="column">
        <Text bold color="blue">Testing: {selectedTool.name}</Text>
        <Text>Select a test example (↑/↓ to navigate, Enter to run, Esc to go back):</Text>
        <Text></Text>
        {examples.map((example, index) => (
          <Box key={index} flexDirection="column">
            <Text color={index === selectedExample ? 'yellow' : 'white'}>
              {index === selectedExample ? '→ ' : '  '}{example.name}
            </Text>
            {index === selectedExample && (
              <Text dimColor>    {example.description}</Text>
            )}
          </Box>
        ))}
        <Text color={selectedExample === examples.length ? 'yellow' : 'white'}>
          {selectedExample === examples.length ? '→ ' : '  '}Custom JSON input
        </Text>
        {examples.length === 0 && (
          <Text color="red">No predefined examples for this tool. Use custom input.</Text>
        )}
      </Box>
    )
  }

  if (mode === 'custom-input') {
    const handleSubmit = () => {
      if (customInput.trim()) {
        try {
          const input = JSON.parse(customInput)
          runToolTest(input)
        } catch (err) {
          setError('Invalid JSON input')
          setTimeout(() => setError(null), 3000)
        }
      }
    }

    return (
      <Box flexDirection="column">
        <Text bold color="blue">Custom Input for {selectedTool?.name}</Text>
        <Text>Enter JSON input for the tool (Enter to submit, Esc to go back):</Text>
        <Text></Text>
            <Text>Example for {selectedTool?.name}:</Text>
            <Text dimColor>
              {selectedTool?.name === 'jira'
                ? '{"operation": "get", "ticketKey": "PROJ-123"}'
                : selectedTool?.name === 'confluence'
                ? '{"operation": "search", "query": "documentation", "searchSpace": "DOCS"}'
                : selectedTool?.name === 'file_read'
                ? '{"file_path": "./package.json"}'
                : selectedTool?.name === 'bash'
                ? '{"command": "ls -la"}'
                : selectedTool?.name === 'grep'
                ? '{"pattern": "import.*React", "path": "./src"}'
                : 'Enter JSON matching the tool schema'
              }
        </Text>
        <Text></Text>
        <Box borderStyle="round" borderColor="gray" paddingX={1} paddingY={1}>
          <InkTextInput
            value={customInput}
            onChange={setCustomInput}
            onSubmit={handleSubmit}
            placeholder={
              selectedTool?.name === 'jira'
                ? '{"operation": "get", "ticketKey": "PROJ-123"}'
                : selectedTool?.name === 'confluence'
                ? '{"operation": "search", "query": "documentation"}'
                : 'Enter JSON input...'
            }
            focus={true}
          />
        </Box>
        {error && <Text color="red">Error: {error}</Text>}
        <Text></Text>
        <Text dimColor>Press Enter to submit • Press Esc to go back</Text>
      </Box>
    )
  }

  if (mode === 'running') {
    return (
      <Box flexDirection="column">
        <Text bold color="blue">Running {selectedTool?.name}...</Text>
        <Text>⏳ Executing tool, please wait...</Text>
      </Box>
    )
  }

  if (mode === 'result') {
    return (
      <Box flexDirection="column">
        <Text bold color="blue">Test Result for {selectedTool?.name}</Text>
        <Text>Press Enter or Esc to continue</Text>
        <Text></Text>
        {error ? (
          <Box flexDirection="column">
            <Text color="red" bold>❌ Error:</Text>
            <Text color="red">{error}</Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            <Text color="green" bold>✅ Success:</Text>
            <Text>{result}</Text>
          </Box>
        )}
      </Box>
    )
  }

  return null
}

const testTool = {
  type: 'local-jsx',
  name: 'test-tool',
  description: 'Interactive tool testing interface with predefined examples',
  isEnabled: true,
  isHidden: false,
  async call(onDone) {
    return <TestTool onDone={onDone} />
  },
  userFacingName() {
    return 'test-tool'
  },
  aliases: ['test', 'tool-test']
} satisfies Command

export default testTool
