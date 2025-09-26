# JIRA Tool

The JIRA Tool allows you to interact with JIRA tickets directly from Kode. You can get ticket details, create new tickets, and update existing tickets.

## Configuration

Add the following JIRA configuration to your `.kode.json` file:

```json
{
  "jira": {
    "baseUrl": "https://yourcompany.atlassian.net",
    "username": "your.email@company.com",
    "apiToken": "your-api-token"
  }
}
```

### Getting a JIRA API Token

1. Go to your Atlassian account settings: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a descriptive name (e.g., "Kode CLI Tool")
4. Copy the generated token and use it in your configuration

## Usage Examples

### Get Ticket Details
```bash
# Get information about a specific ticket
jira get PROJ-123
```

### Create a New Ticket
```bash
# Create a new bug ticket
jira create --project PROJ --type Bug --summary "Fix login issue" --description "Users cannot log in with valid credentials"

# Create a task with assignee and priority
jira create --project PROJ --type Task --summary "Update documentation" --assignee john.doe --priority High
```

### Update Ticket
```bash
# Update ticket summary and description
jira update PROJ-123 --summary "New summary" --description "Updated description"

# Change assignee and priority
jira update PROJ-123 --assignee jane.smith --priority Low

# Transition ticket status
jira update PROJ-123 --status "In Progress"

# Add labels and components
jira update PROJ-123 --labels bug,frontend --components UI,Authentication
```

## Supported Operations

### Get Ticket (`get`)
- **Required**: `ticketKey`
- **Returns**: Complete ticket information including status, assignee, description, etc.

### Create Ticket (`create`)
- **Required**: `project`, `issueType`, `summary`
- **Optional**: `description`, `assignee`, `priority`, `labels`, `components`
- **Returns**: Created ticket key

### Update Ticket (`update`)
- **Required**: `ticketKey`
- **Optional**: `summary`, `description`, `assignee`, `priority`, `status`, `labels`, `components`, `customFields`
- **Returns**: Success confirmation

## Field Mappings

- **Project**: Use the project key (e.g., "PROJ", "DEV")
- **Issue Type**: Use exact names (e.g., "Bug", "Task", "Story", "Epic")
- **Priority**: Use exact names (e.g., "Highest", "High", "Medium", "Low", "Lowest")
- **Status**: Use exact status names for transitions
- **Assignee**: Use username or email address
- **Labels**: Array of label strings
- **Components**: Array of component names

## Error Handling

The tool provides detailed error messages for common issues:
- Authentication failures
- Invalid ticket keys
- Missing required fields
- Permission errors
- Invalid field values

## Security

- API tokens are stored in your local configuration
- All requests use HTTPS
- Basic authentication with username/API token
- No sensitive data is logged

## Limitations

- Requires JIRA Cloud or Server with REST API v3
- Some custom fields may require specific formatting
- File attachments are not currently supported
- Advanced workflows may have specific transition requirements
