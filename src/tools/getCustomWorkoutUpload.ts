import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError, SPORTS, sportParameter } from './utils/toolHelpers.js';

export const method = 'getCustomWorkoutUpload';
export const description = 'Get the S3 URL (valid 10 minutes) and count of the custom workouts for one sport.';
export const parameters = z.object({
  sport: sportParameter,
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    // the path takes the sport type, not the WhooshId (a WhooshId here made the server fail with
    // "Cast to Number failed for value NaN at path sportsModeType")
    const result = await extra.client.get(`/client/custom-workout-upload/${SPORTS[args.sport].type}`, { baseUrl: 'COACHING' });
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
