# Test Tool Command

The `test-tool` command provides an interactive interface to test any Kode tool with predefined examples or custom JSON input. Perfect for testing tool functionality, learning tool schemas, and debugging integrations.

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
- Browse all available tools in the system
- Navigate with arrow keys (↑/↓)
- See tool names and user-facing descriptions
- Press 'q' to quit at any time

### 📋 Predefined Examples
The command includes ready-to-use test cases for popular tools:

#### 🎫 JIRA Tool Examples
- **Get JIRA ticket**: `{"operation": "get", "ticketKey": "PROJ-123"}`
  - Retrieve complete ticket details including status, assignee, description
- **Create JIRA ticket**: `{"operation": "create", "project": "PROJ", "issueType": "Bug", "summary": "Test ticket"}`
  - Create new bugs, tasks, or stories with full field support
- **Update JIRA ticket**: `{"operation": "update", "ticketKey": "PROJ-123", "status": "In Progress"}`
  - Modify existing tickets, change status, update fields

#### 📁 File Operations
- **Read files**: `{"file_path": "./package.json"}`
- **List directories**: Various directory listing options

#### 💻 System Commands  
- **Bash execution**: `{"command": "ls -la"}` or `{"command": "node --version"}`
- **Safe command testing**: Execute shell commands in controlled environment

#### 🔍 Search Operations
- **Grep patterns**: `{"pattern": "import.*React", "path": "./src"}`
- **Text search**: Find patterns across codebases

### ✏️ Enhanced Custom Input
- **Visual text input field**: Bordered input area with focus indication
- **Tool-specific examples**: Contextual JSON examples for each tool
- **Real-time JSON validation**: Immediate feedback on syntax errors
- **Smart placeholders**: Auto-generated placeholders based on selected tool
- **Multi-line support**: Handle complex JSON structures naturally

### 📊 Advanced Results Display
- **Formatted output**: Tool-specific result formatting
- **Success indicators**: ✅ Clear success/failure status
- **Detailed error messages**: Comprehensive error descriptions with context
- **Interactive results**: Navigate back to continue testing other tools

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
- **Type directly**: Use the visual text input field
- `Enter`: Submit JSON and execute tool
- `Esc`: Go back to example selection
- **Smart examples**: See tool-specific JSON examples
- **Validation**: Immediate feedback on JSON syntax errors

### Results Screen
- `Enter` or `Esc`: Return to tool selection

## Example Sessions

### 🎫 Testing JIRA Tool

1. **Start**: Run `test-tool`
2. **Select Tool**: Navigate to "jira" and press Enter
3. **Choose Example**: Select "Get JIRA ticket" 
4. **View Results**: See formatted ticket details:
   ```
   ✅ JIRA operation completed
   JIRA Ticket PROJ-123:
   Title: Fix login validation
   Status: In Progress
   Type: Bug
   Project: MyProject (PROJ)
   Priority: High
   Assignee: John Doe
   ...
   ```
5. **Test Creation**: Try "Create JIRA ticket" example
6. **Custom Input**: Use custom JSON like:
   ```json
   {
     "operation": "update",
     "ticketKey": "PROJ-123",
     "status": "Done",
     "summary": "Updated title"
   }
   ```

### 💻 Testing File Operations

1. **Select**: Choose "file_read" tool
2. **Custom Input**: Enter `{"file_path": "./package.json"}`
3. **Results**: View file contents with syntax highlighting
4. **Try Different**: Test various file paths and options

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

## Benefits & Use Cases

### 🚀 **Development & Testing**
- **Fast iterations**: Quickly test tool changes without full workflows
- **Schema validation**: Verify tool input/output contracts
- **Error testing**: Safely test edge cases and error conditions
- **New tool validation**: Test newly developed tools before integration

### 📚 **Learning & Discovery**
- **Tool exploration**: Discover available tools and their capabilities
- **Schema understanding**: Learn tool input requirements through examples
- **API familiarization**: Understand tool responses and formatting
- **Best practices**: See recommended usage patterns

### 🔧 **Integration & Configuration**
- **JIRA setup validation**: Test JIRA credentials and connectivity
- **File system testing**: Verify file access and permissions
- **Command validation**: Test bash commands in safe environment
- **Search pattern testing**: Develop and test grep patterns

### 🐛 **Debugging & Troubleshooting**
- **Isolate issues**: Test tools independently from workflows
- **Reproduce errors**: Recreate specific error conditions
- **Validate fixes**: Confirm tool behavior after updates
- **Performance testing**: Measure tool execution times

The test-tool command is especially valuable for:
- ✅ **JIRA Integration**: Validate credentials, test operations, debug API issues
- ✅ **File Operations**: Safe file testing without workflow disruption  
- ✅ **Command Execution**: Test bash commands before automated execution
- ✅ **Search & Pattern**: Develop complex grep patterns interactively
- ✅ **Tool Development**: Validate new tools during development cycle
