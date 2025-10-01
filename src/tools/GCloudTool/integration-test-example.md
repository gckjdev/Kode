# Google Cloud SDK Tool Integration Testing Guide

This document provides guidance on how to perform integration testing for the Google Cloud SDK Tool.

## Prerequisites

Before running integration tests, ensure you have:

1. Google Cloud SDK installed and available in PATH
2. Authentication with Google Cloud (run `gcloud auth login`)
3. Access to at least one Google Cloud project
4. Kode CLI with the Google Cloud SDK Tool enabled

## Test Scenarios

### 1. Basic Command Execution

**Objective**: Verify that basic gcloud commands execute successfully and return expected output.

**Steps**:
1. Run the following command:
   ```
   gcloud projects list
   ```
2. Verify that the command executes successfully
3. Verify that the output is formatted as JSON (if JSON output is enabled)
4. Verify that the output contains a list of projects

**Expected Results**:
- Command executes without errors
- Output is properly formatted
- Project list is displayed

### 2. Authentication Status

**Objective**: Verify that the tool correctly detects and reports authentication status.

**Steps**:
1. Run the following command:
   ```
   gcloud auth list
   ```
2. Verify that the command executes successfully
3. Verify that the output shows the current authentication status
4. Verify that the active account is correctly identified

**Expected Results**:
- Command executes without errors
- Authentication status is correctly reported
- Active account is displayed

### 3. Long-Running Operations

**Objective**: Verify that long-running commands show progress indicators and can be cancelled.

**Steps**:
1. Run a long-running command (e.g., creating a compute instance):
   ```
   gcloud compute instances create test-instance --zone=us-central1-a
   ```
2. Verify that progress indicators are displayed
3. Verify that the command can be cancelled
4. Verify that the command completes with a clear status

**Expected Results**:
- Progress indicators are displayed during execution
- Command can be cancelled
- Final status is clearly displayed

### 4. Error Handling

**Objective**: Verify that the tool handles errors gracefully and provides helpful guidance.

**Steps**:
1. Run an invalid command:
   ```
   gcloud invalid-command
   ```
2. Verify that the error is handled gracefully
3. Verify that a clear error message is displayed

**Expected Results**:
- Error is caught and handled
- Clear error message is displayed
- No crash or unexpected behavior

### 5. Authentication Issues

**Objective**: Verify that the tool detects authentication issues and provides guidance.

**Steps**:
1. Temporarily revoke authentication (e.g., `gcloud auth revoke`)
2. Run a command that requires authentication:
   ```
   gcloud projects list
   ```
3. Verify that the authentication issue is detected
4. Verify that helpful guidance is provided

**Expected Results**:
- Authentication issue is detected
- Helpful guidance is provided
- Suggestions for authentication commands are displayed

### 6. Output Formatting

**Objective**: Verify that the tool correctly formats output based on the format parameter.

**Steps**:
1. Run a command with JSON format:
   ```
   gcloud projects list --format=json
   ```
2. Verify that the output is formatted as JSON
3. Run the same command with raw format:
   ```
   gcloud projects list --format=text
   ```
4. Verify that the output is displayed in raw format

**Expected Results**:
- JSON output is correctly formatted
- Raw output is displayed as-is

### 7. Interactive Commands

**Objective**: Verify that the tool handles interactive commands correctly.

**Steps**:
1. Run an interactive command:
   ```
   gcloud config set project my-project
   ```
2. Verify that the command prompts for confirmation
3. Verify that the confirmation can be provided
4. Verify that the command completes successfully

**Expected Results**:
- Command prompts for confirmation
- Confirmation can be provided
- Command completes successfully

## Test Execution

You can run these tests using the `test-tool` command:

```
test-tool
```

Select the `gcloud` tool and choose one of the predefined examples or enter a custom command.

## Automated Testing

For automated testing, you can use the `GCloudTool.simple.test.ts` file, which contains unit tests for the Google Cloud SDK Tool.

To run the tests:

```
bun test src/tools/GCloudTool/GCloudTool.simple.test.ts
```

## Troubleshooting

If you encounter issues during testing:

1. Check that Google Cloud SDK is installed and available in PATH
2. Verify that you are authenticated with Google Cloud
3. Check that you have access to the required Google Cloud resources
4. Verify that the Kode CLI is properly configured

## Reporting Issues

If you find any issues during testing, please report them with:

1. The command that was executed
2. The expected output
3. The actual output or error message
4. Any relevant context or environment information
