# Quickstart: Google Cloud SDK Tool

## Prerequisites

### System Requirements
- Node.js 18+ with TypeScript support
- Google Cloud SDK installed and configured
- Access to at least one Google Cloud project

### Installation Verification
```bash
# Verify gcloud is installed
gcloud version

# Verify authentication (should show active account)
gcloud auth list

# Verify project access (should show available projects)
gcloud projects list
```

## Integration Scenarios

### Scenario 1: Basic Command Execution
**Goal**: Execute simple gcloud commands through Kode interface

**Setup**:
1. Ensure gcloud SDK is authenticated
2. Configure default project if needed
3. Test basic connectivity

**Test Commands**:
```bash
# List projects
gcloud projects list

# Get current configuration
gcloud config list

# Check active account
gcloud auth list --filter=status:ACTIVE
```

**Expected Results**:
- Commands execute successfully
- Output formatted appropriately (JSON when supported)
- Authentication status displayed clearly

### Scenario 2: Long-Running Operations
**Goal**: Handle deployment and build operations with progress indication

**Setup**:
1. Have a deployable application ready
2. Ensure sufficient permissions for deployment
3. Configure target environment

**Test Commands**:
```bash
# Deploy application (long-running)
gcloud app deploy --quiet

# Build container image (long-running)
gcloud builds submit --tag gcr.io/PROJECT_ID/IMAGE_NAME

# Create compute instance (medium duration)
gcloud compute instances create test-instance --zone=us-central1-a
```

**Expected Results**:
- Progress indicators shown during execution
- Real-time output streaming
- Ability to cancel operations
- Clear completion status

### Scenario 3: Interactive Commands
**Goal**: Handle commands requiring user confirmation

**Setup**:
1. Identify commands that require confirmation
2. Test both confirmed and cancelled scenarios
3. Verify proper prompt handling

**Test Commands**:
```bash
# Delete resource (requires confirmation)
gcloud compute instances delete test-instance --zone=us-central1-a

# Enable API (may require confirmation)
gcloud services enable container.googleapis.com

# Set project (interactive selection)
gcloud config set project PROJECT_ID
```

**Expected Results**:
- Confirmation prompts displayed properly
- User input handled correctly
- Cancellation works as expected

### Scenario 4: Authentication Issues
**Goal**: Handle and guide users through authentication problems

**Setup**:
1. Temporarily break authentication (logout)
2. Test various authentication scenarios
3. Verify helpful guidance provided

**Test Commands**:
```bash
# Commands that should fail without auth
gcloud projects list
gcloud compute instances list

# Authentication commands
gcloud auth login
gcloud auth application-default login
```

**Expected Results**:
- Clear authentication error messages
- Helpful suggestions for resolution
- Links to authentication documentation

### Scenario 5: Error Handling
**Goal**: Graceful handling of various error conditions

**Setup**:
1. Test with invalid commands
2. Test with insufficient permissions
3. Test with network issues

**Test Commands**:
```bash
# Invalid command
gcloud invalid-command

# Permission denied scenario
gcloud projects delete PROJECT_ID

# Invalid project reference
gcloud --project=invalid-project compute instances list
```

**Expected Results**:
- Clear error messages from gcloud
- Suggestions for common fixes
- No tool crashes or hangs

## Configuration Examples

### Basic Configuration
Add to `.kode.json`:
```json
{
  "gcloud": {
    "defaultTimeout": 300000,
    "preferJsonOutput": true,
    "showAuthStatus": true,
    "commandHistory": {
      "enabled": true,
      "maxEntries": 100
    }
  }
}
```

### Advanced Configuration
```json
{
  "gcloud": {
    "defaultTimeout": 600000,
    "preferJsonOutput": true,
    "showAuthStatus": true,
    "workingDirectory": "/path/to/project",
    "environment": {
      "CLOUDSDK_CORE_PROJECT": "my-default-project",
      "CLOUDSDK_COMPUTE_ZONE": "us-central1-a"
    },
    "commandHistory": {
      "enabled": true,
      "maxEntries": 200,
      "persistAcrossSessions": false
    },
    "progressIndicators": {
      "enabled": true,
      "showElapsedTime": true,
      "showCancellationHint": true
    }
  }
}
```

## Common Use Cases

### Development Workflow
```bash
# Set up development environment
gcloud config set project my-dev-project
gcloud auth application-default login

# Deploy to development
gcloud app deploy --version=dev-$(date +%s)

# Check logs
gcloud logs tail -s 1m
```

### CI/CD Integration
```bash
# Authenticate with service account
gcloud auth activate-service-account --key-file=service-account.json

# Build and deploy
gcloud builds submit --config=cloudbuild.yaml
gcloud run deploy my-service --image=gcr.io/PROJECT/IMAGE
```

### Resource Management
```bash
# List and manage compute resources
gcloud compute instances list
gcloud compute disks list --filter="zone:us-central1-a"

# Manage storage
gcloud storage buckets list
gcloud storage cp file.txt gs://my-bucket/
```

### Monitoring and Debugging
```bash
# Check service status
gcloud run services list
gcloud app versions list

# View logs and metrics
gcloud logs read "resource.type=cloud_run_revision"
gcloud monitoring metrics list
```

## Troubleshooting

### Common Issues

#### "gcloud not found"
**Problem**: Tool reports gcloud SDK not available
**Solutions**:
1. Install Google Cloud SDK
2. Add gcloud to system PATH
3. Restart terminal/IDE after installation

#### "Authentication required"
**Problem**: Commands fail with authentication errors
**Solutions**:
1. Run `gcloud auth login` for user authentication
2. Run `gcloud auth application-default login` for application auth
3. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

#### "Permission denied"
**Problem**: Commands fail due to insufficient permissions
**Solutions**:
1. Check IAM roles in Google Cloud Console
2. Verify project access with `gcloud projects list`
3. Contact project administrator for access

#### "Command timeout"
**Problem**: Long-running commands timeout
**Solutions**:
1. Increase timeout in configuration
2. Check network connectivity
3. Verify command parameters are correct

### Performance Issues

#### Slow command startup
**Causes**: Large gcloud configuration, network latency
**Solutions**:
1. Clean up gcloud configuration
2. Use local caching when possible
3. Optimize network connection

#### High memory usage
**Causes**: Large command output, memory leaks
**Solutions**:
1. Use streaming output processing
2. Limit output buffering
3. Monitor memory usage during long operations

## Validation Checklist

### Pre-deployment
- [ ] All integration scenarios pass
- [ ] Error handling works correctly
- [ ] Authentication guidance is helpful
- [ ] Performance meets requirements
- [ ] Configuration options work as expected

### Post-deployment
- [ ] Tool integrates properly with Kode
- [ ] No conflicts with existing tools
- [ ] Documentation is accurate and complete
- [ ] User feedback is positive
- [ ] Performance monitoring shows good metrics

## Support Resources

### Documentation Links
- [Google Cloud SDK Documentation](https://cloud.google.com/sdk/docs)
- [gcloud Command Reference](https://cloud.google.com/sdk/gcloud/reference)
- [Authentication Guide](https://cloud.google.com/docs/authentication)

### Community Resources
- [Google Cloud Community](https://cloud.google.com/community)
- [Stack Overflow - google-cloud-platform](https://stackoverflow.com/questions/tagged/google-cloud-platform)
- [Kode Documentation](../../../README.md)
