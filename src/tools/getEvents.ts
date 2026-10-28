import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError, SPORTS, sportParameter } from './utils/toolHelpers.js';

export const method = 'getEvents';
export const description = 'Get list of upcoming and current events.';
export const parameters = z.object({
  sport: sportParameter,
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const zoneOffset = Buffer.from('+01:00:00.000').toString('base64');
    const query = new URLSearchParams({
      'zone-offset': zoneOffset,
      date: '-1',
      // the app sends sportType; the old SportsMode parameter was ignored (same events for every sport)
      sportType: SPORTS[args.sport].enum,
      platform: 'mobile',
    });

    const result = await extra.client.get(`/events?${query}`, { baseUrl: 'SERVICE26' });
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
