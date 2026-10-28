import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export { McpError };

export function asMcpError(error: unknown): McpError {
  const message = error instanceof Error ? error.message : String(error);
  return new McpError(ErrorCode.InternalError, message);
}

// How the app (MyWhoosh 6.2.3) names each sport: type = custom workout path segment / SportsModeType,
// mode = custom workout Mode, name = sportType query value, enum = sportType for /events.
// 2 exists in the app enum (swimming) but has no UI.
export const SPORTS = {
  cycling: { type: 0, mode: 'E_Ride', name: 'Cycling', enum: 'E_Cycling' },
  running: { type: 1, mode: 'E_Run', name: 'Running', enum: 'E_Running' },
  rowing: { type: 3, mode: 'E_Row', name: 'Rowing', enum: 'E_Rowing' },
} as const;

export const sportParameter = z
  .enum(['cycling', 'running', 'rowing'])
  .default('cycling')
  .describe('Sport: cycling, running or rowing');
