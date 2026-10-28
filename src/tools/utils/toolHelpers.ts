import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export { McpError };

export function asMcpError(error: unknown): McpError {
  const message = error instanceof Error ? error.message : String(error);
  return new McpError(ErrorCode.InternalError, message);
}

// Custom workouts are stored per sport. Path segment / SportsModeType and workout Mode as the app
// sends them (captured from MyWhoosh 6.2.3); 2 exists in the app enum (swimming) but has no UI.
export const SPORTS = {
  cycling: { type: 0, mode: 'E_Ride' },
  running: { type: 1, mode: 'E_Run' },
  rowing: { type: 3, mode: 'E_Row' },
} as const;

export const sportParameter = z
  .enum(['cycling', 'running', 'rowing'])
  .default('cycling')
  .describe('Sport the custom workouts belong to (cycling, running or rowing)');
