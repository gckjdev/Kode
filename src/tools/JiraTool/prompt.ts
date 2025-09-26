export const TOOL_NAME_FOR_PROMPT = 'jira'

export const DESCRIPTION = 'Interact with JIRA - get ticket details, create new tickets, and update existing tickets. Requires JIRA authentication configuration.'

export const PROMPT = async (options?: { safeMode?: boolean }) => {
  return `
# JIRA Tool

Use this tool to interact with JIRA tickets. The tool supports:

1. **Get Ticket Details**: Retrieve information about a specific JIRA ticket
2. **Create Ticket**: Create a new JIRA ticket with specified details
3. **Update Ticket**: Update an existing JIRA ticket's fields

## Authentication

The tool requires JIRA authentication configuration:
- JIRA base URL (e.g., https://yourcompany.atlassian.net)
- Username/email
- API token or password

## Operations

### Get Ticket
- Fetches complete ticket information including description, status, assignee, etc.
- Returns ticket data in a structured format

### Create Ticket
- Creates a new ticket with specified project, issue type, summary, and description
- Optional fields: assignee, priority, labels, components, etc.
- Returns the created ticket key and details

### Update Ticket
- Updates existing ticket fields like summary, description, status, assignee, etc.
- Supports both simple field updates and complex operations
- Returns updated ticket information

## Error Handling

The tool provides clear error messages for:
- Authentication failures
- Invalid ticket keys
- Missing required fields
- Network connectivity issues
- Permission errors

## Usage Tips

- Always verify JIRA configuration before using
- Use proper ticket keys (e.g., "PROJ-123")
- Check project permissions for create/update operations
- Some fields may be required depending on your JIRA configuration
`.trim()
}
