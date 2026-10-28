import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError, SPORTS, sportParameter } from './utils/toolHelpers.js';

export const method = 'getPlayerAchievements';
export const description = 'Get player achievement progress and completed achievements.';
export const parameters = z.object({
  sport: sportParameter,
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const whooshId = extra.client.getWhooshId();
    if (!whooshId) throw new McpError(-32600, 'Not authenticated');

    const result = await extra.client.get(`/achievement-trophies/player-achievement?UserId=${whooshId}&sportType=${SPORTS[args.sport].name}`);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
