# MyWhoosh MCP Server

[![GitHub stars](https://img.shields.io/github/stars/mywhoosh-community/mywhoosh-mcp-server)](https://github.com/mywhoosh-community/mywhoosh-mcp-server/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/mywhoosh-community/mywhoosh-mcp-server)](https://github.com/mywhoosh-community/mywhoosh-mcp-server/network/members)
[![License](https://img.shields.io/github/license/mywhoosh-community/mywhoosh-mcp-server)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/mywhoosh-community/mywhoosh-mcp-server)

![MyWhoosh Logo](./docs/assets/mywhoosh-mcp-logo.png)

A Model Context Protocol (MCP) server for MyWhoosh that allows you to access the MyWhoosh API directly from your AI provider (like Cursor, Claude Desktop, etc.). Create workouts, manage training sessions, schedule tasks, and more - all through natural language.

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/mywhoosh-community/mywhoosh-mcp-server.git
cd mywhoosh-mcp-server
```

### 2. Install dependencies

```bash
npm install
```

### 3. Build the project

```bash
npm run build
```

### 4. Configure the MCP server

Add the following configuration to your AI provider (e.g., in Cursor under MCP Settings):

```json
{
  "mcpServers": {
    "mywhoosh-mcp-server": {
      "command": "node",
      "args": ["PATH_TO_PROJECT\\build\\index.js"],
      "env": {
        "MYWHOOSH_USERNAME": "${input:mywhoosh-username}",
        "MYWHOOSH_PASSWORD": "${input:mywhoosh-password}"
      }
    }
  },
  "inputs": [
    {
      "id": "mywhoosh-username",
      "type": "promptString",
      "description": "Enter your MyWhoosh username"
    },
    {
      "id": "mywhoosh-password",
      "type": "promptString",
      "description": "Enter your MyWhoosh password",
      "password": true
    }
  ]
}
```

**Important:** Replace `PATH_TO_PROJECT` with the absolute path to your cloned repository (e.g., `C:\\Users\\admin\\Desktop\\mywhoosh-mcp-server` on Windows or `/home/user/mywhoosh-mcp-server` on Linux/Mac).

### Configuration in different AI providers

#### Cursor

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Search for "MCP: Edit Configuration"
3. Paste the configuration above

#### Claude Desktop

Edit the configuration file:

- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

## Usage

After installation, you can use the MCP server directly in your AI provider. Examples:

- "Create a 30-minute interval workout"
- "Show me my scheduled training sessions"
- "Change my MyWhoosh settings"

## Custom workouts

Custom workouts are stored per sport: pass `sport` (`cycling`, `running` or `rowing`, default `cycling`)
to `uploadCustomWorkout`, `downloadCustomWorkoutsFromS3`, `getCustomWorkoutUpload` and `deleteCustomWorkout`.
The request shapes follow what the MyWhoosh app sends. Tested on a live account:

| Operation | Tool | Works |
| --- | --- | --- |
| List custom workouts | `downloadCustomWorkoutsFromS3`, `getCustomWorkoutUpload` | yes |
| Create / update (same `Id`) | `uploadCustomWorkout` | yes (cycling checked in the app; running checked via the list) |
| Delete | `deleteCustomWorkout` | yes |

## License

ISC License - see [LICENSE](LICENSE) file for details.

## Support

For issues or questions, please create an [Issue](https://github.com/mywhoosh-community/mywhoosh-mcp-server/issues) on GitHub.