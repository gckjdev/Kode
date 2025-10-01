# Confluence Tool Integration Testing Guide

This guide provides step-by-step instructions for testing the Confluence tool with real Confluence instances.

## Prerequisites

1. **Confluence Instance Access**: Either Confluence Cloud or Server
2. **API Credentials**: API token (Cloud) or username/password (Server)
3. **Test Space**: A space where you can create/modify content
4. **Kode Configuration**: Properly configured `.kode.json`

## Test Configuration

### Example .kode.json
```json
{
  "confluence": {
    "instances": {
      "test": {
        "baseUrl": "https://your-test-instance.atlassian.net/wiki",
        "email": "test@example.com",
        "apiToken": "your-test-api-token",
        "type": "cloud"
      }
    },
    "defaultInstance": "test"
  }
}
```

## Integration Test Scenarios

### 1. Connection and Authentication Test

**Objective**: Verify basic connectivity and authentication

```bash
# Test 1: List spaces (minimal permissions required)
confluence spaces --limit 5

# Expected: List of accessible spaces
# Success criteria: No authentication errors, spaces returned
```

### 2. Space Operations Test

**Objective**: Test space listing and browsing capabilities

```bash
# Test 2a: List all spaces with details
confluence spaces --expand "description,homepage" --limit 10

# Test 2b: List content in a specific space
confluence list --space-key "YOUR_TEST_SPACE" --limit 10

# Expected: Space information and content listings
# Success criteria: Proper space data formatting, no permission errors
```

### 3. Page Retrieval Test

**Objective**: Test page reading operations

```bash
# Test 3a: Get page by ID (use an existing page ID)
confluence get --page-id "EXISTING_PAGE_ID" --expand "body.storage,version,metadata.labels"

# Test 3b: Get page by title and space
confluence get --page-title "EXISTING_PAGE_TITLE" --space-key "YOUR_TEST_SPACE"

# Expected: Full page content with metadata
# Success criteria: Content properly formatted, all requested fields present
```

### 4. Search Functionality Test

**Objective**: Test search capabilities

```bash
# Test 4a: Simple text search
confluence search --query "documentation" --limit 10

# Test 4b: Space-specific search
confluence search --query "test" --search-space "YOUR_TEST_SPACE" --limit 5

# Test 4c: CQL search
confluence search --query 'type = "page" AND space = "YOUR_TEST_SPACE"' --limit 5

# Expected: Relevant search results with excerpts
# Success criteria: Results match query, proper formatting
```

### 5. Page Creation Test

**Objective**: Test page creation with various content types

```bash
# Test 5a: Create simple page
confluence create \
  --title "Kode Integration Test - $(date +%Y%m%d-%H%M%S)" \
  --space-key "YOUR_TEST_SPACE" \
  --content "<p>This is a test page created by the Kode Confluence tool.</p>" \
  --labels "test,kode,automation"

# Test 5b: Create page with hierarchy
confluence create \
  --title "Child Test Page - $(date +%Y%m%d-%H%M%S)" \
  --space-key "YOUR_TEST_SPACE" \
  --content "<p>This is a child page for testing.</p>" \
  --parent-id "PARENT_PAGE_ID" \
  --labels "test,child"

# Expected: New pages created successfully
# Success criteria: Pages appear in Confluence, proper metadata set
```

### 6. Page Update Test

**Objective**: Test page modification capabilities

```bash
# Test 6a: Update page content (use page ID from Test 5a)
confluence update \
  --page-id "CREATED_PAGE_ID" \
  --title "Updated Test Page - $(date +%Y%m%d-%H%M%S)" \
  --content "<p>This page has been updated by the Kode tool.</p><p>Update time: $(date)</p>"

# Test 6b: Update page by title
confluence update \
  --page-title "EXISTING_PAGE_TITLE" \
  --space-key "YOUR_TEST_SPACE" \
  --content "<p>Updated via title lookup.</p>"

# Expected: Pages updated with new content
# Success criteria: Version numbers incremented, content changed
```

### 7. Content Format Test

**Objective**: Test different content format handling

```bash
# Test 7a: Create page with wiki format
confluence create \
  --title "Wiki Format Test - $(date +%Y%m%d-%H%M%S)" \
  --space-key "YOUR_TEST_SPACE" \
  --content "h1. Wiki Format Test\n\n*Bold text* and _italic text_\n\n* List item 1\n* List item 2" \
  --content-format "wiki"

# Test 7b: Create page with storage format
confluence create \
  --title "Storage Format Test - $(date +%Y%m%d-%H%M%S)" \
  --space-key "YOUR_TEST_SPACE" \
  --content "<h1>Storage Format Test</h1><p>This uses <strong>storage format</strong> directly.</p>" \
  --content-format "storage"

# Expected: Pages created with proper format conversion
# Success criteria: Content renders correctly in Confluence
```

### 8. Attachment Test

**Objective**: Test attachment operations

```bash
# Test 8a: List attachments on a page
confluence attachments --page-id "PAGE_WITH_ATTACHMENTS"

# Expected: List of attachments with metadata
# Success criteria: Attachment information properly displayed
```

### 9. Multi-Instance Test

**Objective**: Test multi-instance configuration (if available)

```bash
# Test 9a: Use specific instance
confluence get --instance "test" --page-id "EXISTING_PAGE_ID"

# Test 9b: Switch between instances
confluence spaces --instance "production" --limit 3
confluence spaces --instance "staging" --limit 3

# Expected: Operations work with different instances
# Success criteria: Correct instance used, different results if applicable
```

### 10. Error Handling Test

**Objective**: Test error scenarios and recovery

```bash
# Test 10a: Non-existent page
confluence get --page-id "999999999"

# Test 10b: Invalid space key
confluence list --space-key "NONEXISTENT"

# Test 10c: Permission denied scenario (if possible)
confluence create --title "Test" --space-key "RESTRICTED_SPACE" --content "<p>Test</p>"

# Expected: Clear error messages with actionable guidance
# Success criteria: No crashes, helpful error messages
```

## Performance Tests

### 11. Large Content Test

**Objective**: Test handling of large content

```bash
# Create page with substantial content
confluence create \
  --title "Large Content Test - $(date +%Y%m%d-%H%M%S)" \
  --space-key "YOUR_TEST_SPACE" \
  --content "$(printf '<p>%s</p>' $(seq 1 100 | xargs -I {} echo "This is line {} of large content test."))"

# Expected: Page created successfully
# Success criteria: No timeout errors, content properly stored
```

### 12. Pagination Test

**Objective**: Test pagination handling

```bash
# Test large result sets
confluence search --query "*" --limit 50 --start 0
confluence search --query "*" --limit 50 --start 50

# Expected: Proper pagination handling
# Success criteria: Different results for different start values
```

## Interactive Testing

### Using test-tool

```bash
# Start interactive testing
test-tool

# Navigate to 'confluence' tool
# Try each predefined example:
# 1. Get Confluence page by ID
# 2. Search Confluence content  
# 3. List Confluence spaces
# 4. Create Confluence page
# 5. List space content
```

## Validation Checklist

### ✅ Basic Functionality
- [ ] Authentication works with valid credentials
- [ ] Authentication fails gracefully with invalid credentials
- [ ] Spaces can be listed and browsed
- [ ] Pages can be retrieved by ID and title
- [ ] Search returns relevant results
- [ ] Pages can be created with various content types
- [ ] Pages can be updated with version control
- [ ] Attachments can be listed

### ✅ Content Handling
- [ ] Storage format content works correctly
- [ ] Wiki format is converted properly
- [ ] Large content (>1MB) is handled
- [ ] Special characters and Unicode work
- [ ] HTML entities are properly escaped
- [ ] Labels and metadata are preserved

### ✅ Error Handling
- [ ] Network timeouts are handled gracefully
- [ ] Rate limiting triggers appropriate backoff
- [ ] Permission errors provide clear guidance
- [ ] Invalid input shows validation errors
- [ ] API errors are properly categorized

### ✅ Performance
- [ ] Operations complete within expected timeframes
- [ ] Large result sets are paginated properly
- [ ] Caching improves repeated operations
- [ ] Memory usage remains reasonable

### ✅ Integration
- [ ] Tool appears in test-tool interface
- [ ] Configuration is properly validated
- [ ] Multi-instance switching works
- [ ] Permission system integration works

## Cleanup

After testing, clean up test content:

```bash
# Note: The tool doesn't currently support delete operations
# Clean up manually through Confluence web interface:
# 1. Go to your test space
# 2. Delete test pages created during integration testing
# 3. Remove any test attachments
```

## Troubleshooting Integration Issues

### Common Problems

1. **Authentication Issues**
   - Verify API token is not expired
   - Check email/username matches account
   - Ensure proper permissions are granted

2. **Network Issues**
   - Verify base URL is correct
   - Check firewall/proxy settings
   - Test connectivity with curl/ping

3. **Permission Issues**
   - Verify space access permissions
   - Check if user can create/edit content
   - Contact Confluence administrator

4. **Content Issues**
   - Validate content format syntax
   - Check for special characters
   - Verify content size limits

### Debug Steps

1. **Enable Verbose Logging**
   ```json
   {
     "verbose": true,
     "confluence": { ... }
   }
   ```

2. **Test with Minimal Operations**
   ```bash
   confluence spaces --limit 1
   ```

3. **Validate Configuration**
   ```bash
   node src/tools/ConfluenceTool/test-runner.js
   ```

4. **Check API Directly**
   ```bash
   curl -u "email:token" "https://your-instance.atlassian.net/wiki/rest/api/space"
   ```

## Reporting Issues

When reporting integration issues, include:

1. **Environment Information**
   - Confluence type (Cloud/Server) and version
   - Kode version and configuration
   - Operating system and Node.js version

2. **Error Details**
   - Complete error messages
   - Steps to reproduce
   - Expected vs actual behavior

3. **Configuration**
   - Sanitized configuration (remove credentials)
   - Instance type and settings
   - Permission levels

4. **Test Results**
   - Which tests passed/failed
   - Specific error scenarios
   - Performance observations

This comprehensive integration testing ensures the Confluence tool works reliably across different environments and use cases.
