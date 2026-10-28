import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError, SPORTS, sportParameter } from './utils/toolHelpers.js';
import AdmZip from 'adm-zip';

export const method = 'downloadCustomWorkoutsFromS3';
export const description = 'Download and extract all custom workouts of one sport from the MyWhoosh S3 bucket. Returns the workout data as parsed JSON objects, in the shape uploadCustomWorkout accepts.';
export const parameters = z.object({
  sport: sportParameter,
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    // Get S3 URL
    const uploadInfo = await extra.client.get(`/client/custom-workout-upload/${SPORTS[args.sport].type}`, { 
      baseUrl: 'COACHING' 
    }) as { data: { workoutZipUrl: string; workoutCount: number } };

    if (!uploadInfo.data?.workoutZipUrl) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ workouts: [], count: 0 }, null, 2) }],
      };
    }

    // Download ZIP from S3
    const response = await fetch(uploadInfo.data.workoutZipUrl);
    if (!response.ok) {
      throw new McpError(-32603, `Failed to download workouts: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Extract ZIP
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    const workouts = [];
    for (const entry of zipEntries) {
      if (!entry.isDirectory && entry.entryName.endsWith('.json')) {
        const content = entry.getData().toString('utf8');
        try {
          const workout = JSON.parse(content);
          workouts.push(workout);
        } catch (parseError) {
          console.error(`Failed to parse ${entry.entryName}:`, parseError);
        }
      }
    }

    return {
      content: [{ 
        type: 'text', 
        text: JSON.stringify({ 
          workouts, 
          count: workouts.length,
          totalCount: uploadInfo.data.workoutCount 
        }, null, 2) 
      }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
