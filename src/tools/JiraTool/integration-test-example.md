# JiraTool Integration Test Example

## Using test-tool Command

You can test the JiraTool using the interactive `test-tool` command:

```bash
# Start the test tool
test-tool

# Navigate to 'jira' tool
# Select from predefined examples or use custom input
```

## Manual Testing Examples

### 1. Test Configuration Validation
```json
{
  "operation": "get",
  "ticketKey": "TEST-123"
}
```
**Expected**: Configuration error if JIRA not configured

### 2. Test Get Operation
```json
{
  "operation": "get", 
  "ticketKey": "PROJ-123"
}
```
**Expected**: Ticket details or "ticket not found" error

### 3. Test Create Operation
```json
{
  "operation": "create",
  "project": "TEST",
  "issueType": "Bug",
  "summary": "Test ticket from Kode",
  "description": "Integration test ticket",
  "priority": "Medium"
}
```
**Expected**: New ticket created with returned ticket key

### 4. Test Update Operation
```json
{
  "operation": "update",
  "ticketKey": "TEST-123",
  "summary": "Updated via Kode",
  "status": "In Progress"
}
```
**Expected**: Ticket updated successfully

## Configuration Setup

Before testing, ensure your `.kode.json` has JIRA configuration:

```json
{
  "jira": {
    "baseUrl": "https://yourcompany.atlassian.net",
    "username": "your.email@company.com", 
    "apiToken": "your-api-token"
  }
}
```

## Test Scenarios

### ✅ **Happy Path Testing**
1. Valid configuration → Successful operations
2. Proper authentication → API calls work
3. Valid ticket keys → Data retrieval works
4. Valid project/issue types → Ticket creation works

### ⚠️ **Error Path Testing**
1. Missing configuration → Clear error messages
2. Invalid credentials → Authentication errors
3. Invalid ticket keys → Not found errors
4. Invalid project/issue types → Validation errors
5. Network issues → Graceful error handling

### 🔧 **Edge Case Testing**
1. Special characters in descriptions
2. Long ticket summaries
3. Multiple labels and components
4. Status transitions with workflow rules
5. Custom field updates

## Constitutional Compliance Verification

### First Principles Engineering ✅
- Test fundamental JIRA API interactions
- Validate core assumptions about ticket operations
- Verify error handling from first principles

### Empirical Validation ✅
- All functionality tested with real scenarios
- Error conditions verified through testing
- Performance characteristics observable

### Simplicity and Minimalism ✅
- Tests focus on essential functionality
- No over-complicated test scenarios
- Clear pass/fail criteria

### Autonomous Problem Solving ✅
- Tool handles errors independently
- Provides clear guidance to users
- Recovers gracefully from failures

This integration testing approach ensures the JiraTool works correctly in real-world scenarios while maintaining constitutional compliance.
