# Google Cloud SDK Tool for Kode

A tool for executing Google Cloud SDK commands directly through the Kode CLI interface.

## Overview

The Google Cloud SDK Tool allows developers and cloud administrators to manage Google Cloud Platform resources without switching between different terminal sessions or authentication contexts. It provides a seamless integration with the gcloud command-line tool, handling authentication, output formatting, and error handling.

## Features

- Execute any standard gcloud command
- Structured JSON output when supported
- Authentication status detection and guidance
- Real-time output streaming
- Progress indicators for long-running operations
- Cancellation support
- Helpful error messages and suggestions

## Prerequisites

- Google Cloud SDK installed and available in PATH
- Authentication with Google Cloud (run `gcloud auth login`)
- Access to at least one Google Cloud project

## Configuration

Add the following configuration to your `.kode.json` file:

```json
{
  "gcloud": {
    "defaultTimeout": 300000,
    "preferJsonOutput": true,
    "showAuthStatus": true,
    "workingDirectory": "/path/to/project",
    "environment": {
      "CLOUDSDK_CORE_PROJECT": "my-default-project",
      "CLOUDSDK_COMPUTE_ZONE": "us-central1-a"
    },
    "commandHistory": {
      "enabled": true,
      "maxEntries": 100,
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

## Usage

### Basic Commands

```
gcloud [command] [flags]
```

Examples:
- `gcloud projects list`
- `gcloud compute instances list`
- `gcloud config get-value project`
- `gcloud auth list`

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `command` | string | The gcloud command to execute (without "gcloud" prefix) |
| `workingDirectory` | string (optional) | Directory to execute command from |
| `timeout` | number (optional) | Command timeout in milliseconds |
| `format` | enum (optional) | Output format preference ('json', 'raw', 'auto') |
| `interactive` | boolean (optional) | Whether command may require user interaction |
| `environment` | object (optional) | Additional environment variables |

### Output Format

The tool supports three output formats:

- `json`: Force JSON output when supported by the command
- `raw`: Always use raw output
- `auto` (default): Use JSON when supported, fall back to raw output

### Interactive Commands

For commands that require user confirmation or input, set the `interactive` parameter to `true`:

```json
{
  "command": "compute instances delete my-instance --zone=us-central1-a",
  "interactive": true
}
```

### Environment Variables

You can set additional environment variables for the command:

```json
{
  "command": "app deploy",
  "environment": {
    "CLOUDSDK_CORE_PROJECT": "my-project",
    "CLOUDSDK_COMPUTE_ZONE": "us-central1-a"
  }
}
```

## Common Use Cases

### Project Management

```
gcloud projects list
gcloud config set project PROJECT_ID
gcloud projects describe PROJECT_ID
```

### Compute Engine

```
gcloud compute instances list
gcloud compute instances create INSTANCE_NAME --zone=ZONE
gcloud compute instances start/stop INSTANCE_NAME --zone=ZONE
```

### App Engine

```
gcloud app deploy
gcloud app versions list
gcloud app services set-traffic
```

### Cloud Storage

```
gcloud storage ls
gcloud storage ls gs://BUCKET_NAME
gcloud storage cp SOURCE DESTINATION
```

### Kubernetes Engine

```
gcloud container clusters list
gcloud container clusters get-credentials CLUSTER_NAME --zone=ZONE
gcloud container clusters create CLUSTER_NAME
```

### IAM & Authentication

```
gcloud iam service-accounts list
gcloud iam service-accounts create SA_NAME
gcloud iam roles list
```

### Authentication

```
gcloud auth login
gcloud auth list
gcloud auth application-default login
```

### Configuration

```
gcloud config configurations list
gcloud config set PROPERTY VALUE
gcloud config get-value PROPERTY
```

## Error Handling

The tool provides detailed error messages and suggestions for common issues:

- If gcloud is not installed, it will provide installation instructions
- If authentication is required, it will suggest authentication commands
- If a command fails, it will provide error details and suggestions

## Limitations

- The tool requires the Google Cloud SDK to be installed and available in PATH
- Some interactive commands may not work as expected in non-interactive environments
- The tool does not support streaming logs or other continuous output commands

## Troubleshooting

### Common Issues

#### "gcloud not found"

- Install Google Cloud SDK from https://cloud.google.com/sdk/docs/install
- Add gcloud to your PATH
- Restart terminal/IDE after installation

#### "Authentication required"

- Run `gcloud auth login` for user authentication
- Run `gcloud auth application-default login` for application default credentials
- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

#### "Permission denied"

- Check IAM roles in Google Cloud Console
- Verify project access with `gcloud projects list`
- Contact project administrator for access

#### "Command timeout"

- Increase timeout in configuration
- Check network connectivity
- Verify command parameters are correct
