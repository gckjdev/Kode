# Quickstart Guide: Confluence Tool

**Feature**: Confluence Tool Integration  
**Date**: 2025-01-02  
**Status**: Complete

## Quick Setup

### 1. Configuration
Add Confluence configuration to your `.kode.json`:

```json
{
  "confluence": {
    "instances": {
      "default": {
        "baseUrl": "https://yourcompany.atlassian.net/wiki",
        "email": "your.email@company.com",
        "apiToken": "your-api-token",
        "type": "cloud"
      }
    },
    "defaultInstance": "default"
  }
}
```

### 2. Get API Token
- **Confluence Cloud**: Go to [Account Settings → Security → API tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
- **Confluence Server**: Use username/password or Personal Access Token

### 3. Test Connection
```bash
# Test with a simple page retrieval
confluence get --page-id "123456"

# Or search for content
confluence search --query "getting started"
```

## Usage Examples

### Basic Page Operations

#### Get Page Content
```bash
# By page ID
confluence get --page-id "123456" --expand "body.storage,version"

# By title and space
confluence get --page-title "Getting Started" --space-key "DOCS"
```

#### Create New Page
```bash
confluence create \
  --title "My New Page" \
  --space-key "DOCS" \
  --content "<p>This is my new page content.</p>" \
  --parent-id "789012"
```

#### Update Existing Page
```bash
confluence update \
  --page-id "123456" \
  --title "Updated Title" \
  --content "<p>Updated content here.</p>"
```

### Content Discovery

#### Search Content
```bash
# Simple text search
confluence search --query "project documentation"

# Search in specific space
confluence search --query "API" --search-space "DEV"

# Search specific content type
confluence search --query "meeting notes" --search-type "page"
```

#### List Space Content
```bash
# List all pages in a space
confluence list --space-key "DOCS" --content-type "page"

# List with ordering
confluence list --space-key "DOCS" --order-by "modified" --limit 10
```

#### Browse Spaces
```bash
# List all accessible spaces
confluence spaces

# List with details
confluence spaces --expand "description,homepage" --limit 20
```

### Attachment Management

#### List Page Attachments
```bash
confluence attachments --page-id "123456"
```

#### Download Attachment
```bash
confluence attachments --attachment-id "att123" --filename "document.pdf"
```

## Advanced Usage

### Multiple Instances
Configure multiple Confluence instances:

```json
{
  "confluence": {
    "instances": {
      "company": {
        "baseUrl": "https://company.atlassian.net/wiki",
        "email": "user@company.com",
        "apiToken": "token1",
        "type": "cloud"
      },
      "internal": {
        "baseUrl": "https://confluence.internal.com",
        "username": "user",
        "apiToken": "token2",
        "type": "server"
      }
    },
    "defaultInstance": "company"
  }
}
```

Use specific instance:
```bash
confluence get --instance "internal" --page-id "123456"
```

### Complex Search Queries
Use Confluence Query Language (CQL):

```bash
# Search by space and type
confluence search --query 'space = "DOCS" AND type = "page"'

# Search by date range
confluence search --query 'created >= "2024-01-01" AND space = "PROJ"'

# Search by label
confluence search --query 'label = "important" AND space = "DOCS"'
```

### Batch Operations
```bash
# List multiple spaces
confluence list --space-keys "DOCS,PROJ,DEV" --content-type "page"

# Search across multiple criteria
confluence search \
  --query "documentation OR guide OR tutorial" \
  --search-space "DOCS" \
  --limit 50
```

## Integration Examples

### With Other Kode Tools

#### JIRA + Confluence Integration
```bash
# Get JIRA ticket details
jira get PROJ-123

# Create related Confluence page
confluence create \
  --title "PROJ-123: Implementation Guide" \
  --space-key "DOCS" \
  --content "<p>Implementation guide for PROJ-123</p>"
```

#### File Operations + Confluence
```bash
# Read local file and create Confluence page
file_read README.md | confluence create \
  --title "Project README" \
  --space-key "DOCS" \
  --content-format "wiki"
```

### Automation Workflows

#### Daily Documentation Update
```bash
#!/bin/bash
# Update daily status page
confluence update \
  --page-title "Daily Status" \
  --space-key "TEAM" \
  --content "<p>Status for $(date): All systems operational</p>"
```

#### Search and Report
```bash
#!/bin/bash
# Generate weekly report of new documentation
confluence search \
  --query 'created >= "$(date -d "7 days ago" +%Y-%m-%d)"' \
  --search-space "DOCS" \
  --limit 100 > weekly_docs.json
```

## Testing and Validation

### Using test-tool Command
```bash
# Start interactive testing
test-tool

# Navigate to 'confluence' tool
# Try predefined examples:
# - Get page by ID
# - Create test page  
# - Search content
# - List spaces
```

### Manual Testing Checklist

#### Authentication Testing
- [ ] Valid credentials work
- [ ] Invalid credentials show clear error
- [ ] Token expiration handled gracefully
- [ ] Multiple instances work correctly

#### Content Operations Testing
- [ ] Get existing page returns content
- [ ] Get non-existent page shows helpful error
- [ ] Create page with valid data succeeds
- [ ] Create page with invalid data shows validation error
- [ ] Update page preserves version history
- [ ] Update non-existent page shows error

#### Search Testing
- [ ] Text search returns relevant results
- [ ] CQL search works correctly
- [ ] Search with no results handled gracefully
- [ ] Search filters work as expected

#### Error Handling Testing
- [ ] Network timeouts show retry options
- [ ] Rate limiting triggers backoff
- [ ] Permission errors provide clear guidance
- [ ] Malformed responses handled safely

## Troubleshooting

### Common Issues

#### Authentication Failures
```
Error: Authentication failed
Solution: 
1. Verify API token is correct
2. Check email address matches Atlassian account
3. Ensure token has required permissions
```

#### Page Not Found
```
Error: Page not found: 123456
Solution:
1. Verify page ID is correct
2. Check if page exists and is accessible
3. Try searching for the page by title
```

#### Permission Denied
```
Error: Insufficient permissions for operation
Solution:
1. Check Confluence space permissions
2. Verify user has required access level
3. Contact space administrator if needed
```

#### Rate Limiting
```
Error: Rate limit exceeded, retry after 60 seconds
Solution:
1. Wait for the specified time
2. Reduce request frequency
3. Consider upgrading Confluence plan
```

### Debug Mode
Enable verbose logging:
```bash
confluence get --page-id "123456" --verbose
```

### Configuration Validation
Test your configuration:
```bash
confluence spaces --limit 1  # Should list at least one space
```

## Performance Tips

### Optimize Requests
- Use `--expand` selectively to get only needed data
- Set appropriate `--limit` for list operations
- Cache frequently accessed content locally

### Batch Operations
- Use space-level operations when possible
- Combine multiple operations in scripts
- Implement retry logic for reliability

### Content Management
- Use storage format for editing
- Use view format for display
- Compress large content when possible

---

**Quickstart Status**: ✅ Complete  
**Ready for**: Implementation and testing  
**Next Step**: Generate implementation tasks with `/tasks`
