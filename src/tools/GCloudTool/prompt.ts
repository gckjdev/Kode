export const TOOL_NAME_FOR_PROMPT = 'gcloud'

export const DESCRIPTION = `Execute Google Cloud SDK commands directly through the Kode CLI interface. This tool allows you to manage Google Cloud Platform resources without switching between different terminal sessions or authentication contexts.

You can execute any standard gcloud command, and the tool will handle authentication, output formatting, and error handling. The tool provides structured JSON output when possible, and falls back to raw output for commands that don't support JSON formatting.

Usage:
\`\`\`
gcloud [command] [flags]
\`\`\`

Examples:
- \`gcloud projects list\` - List all accessible GCP projects
- \`gcloud compute instances list\` - List all compute instances
- \`gcloud config get-value project\` - Get current project
- \`gcloud auth list\` - List authenticated accounts

Parameters:
- \`command\` (required): The gcloud command to execute (without "gcloud" prefix)
- \`workingDirectory\` (optional): Directory to execute command from
- \`timeout\` (optional): Command timeout in milliseconds
- \`format\` (optional): Output format preference ('json', 'raw', 'auto')
- \`interactive\` (optional): Whether command may require user interaction
- \`environment\` (optional): Additional environment variables

The tool will automatically:
- Check if gcloud SDK is installed and available
- Verify authentication status
- Format output as JSON when supported
- Provide helpful error messages and suggestions
- Handle long-running commands with progress indicators
- Support cancellation of operations

If authentication is required, the tool will provide guidance on how to authenticate.`

export const DETAILED_PROMPT = `${DESCRIPTION}

Common Use Cases:

1. Project Management
   - List projects: \`gcloud projects list\`
   - Set default project: \`gcloud config set project PROJECT_ID\`
   - Describe project: \`gcloud projects describe PROJECT_ID\`

2. Compute Engine
   - List instances: \`gcloud compute instances list\`
   - Create instance: \`gcloud compute instances create INSTANCE_NAME --zone=ZONE\`
   - Start/stop instance: \`gcloud compute instances start/stop INSTANCE_NAME --zone=ZONE\`

3. App Engine
   - Deploy app: \`gcloud app deploy\`
   - View versions: \`gcloud app versions list\`
   - Set traffic: \`gcloud app services set-traffic\`

4. Cloud Storage
   - List buckets: \`gcloud storage ls\`
   - List objects: \`gcloud storage ls gs://BUCKET_NAME\`
   - Copy files: \`gcloud storage cp SOURCE DESTINATION\`

5. Kubernetes Engine
   - List clusters: \`gcloud container clusters list\`
   - Get credentials: \`gcloud container clusters get-credentials CLUSTER_NAME --zone=ZONE\`
   - Create cluster: \`gcloud container clusters create CLUSTER_NAME\`

6. IAM & Authentication
   - List service accounts: \`gcloud iam service-accounts list\`
   - Create service account: \`gcloud iam service-accounts create SA_NAME\`
   - List roles: \`gcloud iam roles list\`

7. Authentication
   - Login: \`gcloud auth login\`
   - List accounts: \`gcloud auth list\`
   - Application default credentials: \`gcloud auth application-default login\`

8. Configuration
   - List configurations: \`gcloud config configurations list\`
   - Set property: \`gcloud config set PROPERTY VALUE\`
   - Get property: \`gcloud config get-value PROPERTY\`

Error Handling:
- If gcloud is not installed, the tool will provide installation instructions
- If authentication is required, the tool will suggest authentication commands
- If a command fails, the tool will provide error details and suggestions

JSON Output:
- Many gcloud commands support JSON output format
- The tool will automatically use JSON format when supported
- This provides structured data for easier processing
- You can specify format preference with the \`format\` parameter

Long-Running Commands:
- Commands like deployments may take a long time to complete
- The tool will show progress indicators during execution
- You can cancel long-running operations if needed
- Set timeout parameter to control maximum execution time

Interactive Commands:
- Some commands require user confirmation
- Set \`interactive: true\` for commands that need user input
- The tool will handle interactive prompts appropriately

Environment Variables:
- You can set additional environment variables for the command
- This is useful for credentials or configuration
- Example: \`{ "CLOUDSDK_CORE_PROJECT": "my-project" }\`

Working Directory:
- You can specify a working directory for the command
- This is useful for commands that operate on local files
- Example: \`workingDirectory: "/path/to/app"\`

Remember to check authentication status before executing commands that require it.`
