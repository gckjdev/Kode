# Test Tool Command

The `test-tool` command provides an interactive interface to test any Kode tool with predefined examples or custom input.

## Usage

```bash
# Start the interactive tool tester
test-tool

# Or use aliases
test
tool-test
```

## Features

### 🎯 Tool Selection
- Browse all available tools
- Navigate with arrow keys
- See tool names and descriptions

### 📋 Predefined Examples
The command includes ready-to-use test cases for popular tools:

#### JIRA Tool Examples
- **Get JIRA ticket**: Retrieve ticket details
- **Create JIRA ticket**: Create a new bug/task/story
- **Update JIRA ticket**: Modify existing tickets

#### Other Tool Examples
- **File operations**: Read files, list directories
- **Bash commands**: Execute shell commands
- **Search operations**: Grep for text patterns

### ✏️ Custom Input
- Enter your own JSON input for any tool
- Real-time JSON validation
- Schema hints for each tool

### 📊 Results Display
- Formatted output from tool execution
- Clear success/error indicators
- Detailed error messages

## Navigation

### Tool Selection Screen
- `↑/↓`: Navigate through tools
- `Enter`: Select tool
- `q`: Quit

### Example Selection Screen
- `↑/↓`: Navigate through examples
- `Enter`: Run selected example
- `Esc`: Go back to tool selection

### Custom Input Mode
- Type JSON input directly
- `Enter`: Execute with current input
- `Esc`: Go back to examples

### Results Screen
- `Enter` or `Esc`: Return to tool selection

## Example Session

1. **Start**: Run `test-tool`
2. **Select Tool**: Choose "jira" from the list
3. **Pick Example**: Select "Get JIRA ticket"
4. **View Results**: See formatted ticket information
5. **Continue Testing**: Try other tools or examples

## Adding New Examples

To add examples for new tools, edit the `TOOL_TEST_EXAMPLES` object in `src/commands/test-tool.tsx`:

```typescript
const TOOL_TEST_EXAMPLES = {
  your_tool: [
    {
      name: 'Example Name',
      description: 'What this example does',
      input: {
        // Tool input parameters
      }
    }
  ]
}
```

## Benefits

- **Fast Testing**: Quickly verify tool functionality
- **Learning**: Understand tool input/output formats  
- **Debugging**: Test edge cases and error conditions
- **Development**: Validate new tools during development

The test-tool command is especially useful for:
- Validating JIRA configuration
- Testing file operations safely
- Experimenting with bash commands
- Learning tool schemas and capabilities
