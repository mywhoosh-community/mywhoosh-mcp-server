import { z } from 'zod';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MyWhooshClient } from '../clients/mywhoosh.js';
import { asMcpError, McpError, SPORTS, sportParameter } from './utils/toolHelpers.js';

const workoutStepSchema = z.object({
  Id: z.number().describe('Step ID (sequential number starting from 1)'),
  Pace: z.number().default(1).describe('Pace multiplier (usually 1)'),
  IntervalId: z.number().default(0).describe('Interval group ID (0 for non-interval steps, same number for steps in same interval)'),
  WorkoutMessage: z.array(z.object({
    Id: z.number().describe('Message ID'),
    Time: z.number().describe('Time offset in seconds when message appears'),
    Message: z.string().describe('Message text to display'),
  })).default([]).describe('Optional messages to display during this step'),
  Rpm: z.number().default(0).describe('Target cadence in RPM (0 for no target)'),
  StepType: z.enum(['E_Normal', 'E_WarmUp', 'E_CoolDown', 'E_FreeRide']).describe('Step type: E_Normal (steady power), E_WarmUp (ramp up), E_CoolDown (ramp down), E_FreeRide (free ride)'),
  Power: z.number().describe('Target power as FTP multiplier (e.g., 0.55 = 55% FTP, 1.2 = 120% FTP). Use 0 for ramp steps (WarmUp/CoolDown)'),
  StartPower: z.number().default(0).describe('Starting power for ramp steps (WarmUp/CoolDown) as FTP multiplier'),
  EndPower: z.number().default(0).describe('Ending power for ramp steps (WarmUp/CoolDown) as FTP multiplier'),
  Time: z.number().describe('Duration of this step in seconds'),
  IsManualGrade: z.boolean().default(false),
  ManualGradeValue: z.number().default(0),
  ShowAveragePower: z.boolean().default(false),
  FlatRoad: z.number().default(0),
});

const workoutSchema = z.object({
  Id: z.number().describe('Unique workout ID. For NEW workouts: use timestamp or random large number (e.g., 176540733485). For UPDATING existing workouts: use the same ID as the original workout.'),
  Name: z.string().describe('Workout name'),
  Description: z.string().default('').describe('Workout description'),
  ERGMode: z.string().default('E_OFF').describe('ERG mode setting'),
  IsRecovery: z.boolean().default(false).describe('Is this a recovery workout?'),
  IsIntervals: z.boolean().default(false).describe('Does this workout contain intervals?'),
  FTPMode: z.string().default('E_NoFTP').describe('FTP mode'),
  IsTT: z.boolean().default(false),
  IsTSS: z.boolean().default(false),
  IsIF: z.boolean().default(false),
  FTPMultiplier: z.number().default(0),
  StressPoint: z.number().default(0),
  Time: z.number().describe('Total workout duration in seconds (sum of all step times)'),
  CustomTagDescription: z.string().default(''),
  CategoryId: z.number().default(1).describe('Workout category (1 = custom)'),
  SubcategoryId: z.number().default(0),
  Type: z.string().default('E_Custom').describe('Workout type (use E_Custom)'),
  DisplayType: z.string().default('E_byWatts').describe('Display type (E_byWatts for power-based)'),
  StepCount: z.number().describe('Total number of steps in WorkoutStepsArray'),
  IsFavorite: z.boolean().default(false),
  CompletedCount: z.number().default(0),
  WorkoutStepsArray: z.array(workoutStepSchema).describe('Array of workout steps defining the workout structure'),
  AuthorName: z.string().default('').describe('Author name (optional)'),
  TSS: z.number().default(0).describe('Training Stress Score (optional, can be 0)'),
  IF: z.number().default(0).describe('Intensity Factor (optional, can be 0)'),
  KJ: z.number().default(0).describe('Kilojoules (optional, can be 0)'),
  IsVODAvailable: z.boolean().default(false),
  Environment: z.string().default('E_Outside').describe('Workout environment, as the app sends it'),
  ScheduledDate: z.string().default(''),
});

export const method = 'uploadCustomWorkout';
export const description = `Upload or update custom workouts (cycling, running or rowing) to MyWhoosh.

CREATING NEW WORKOUTS:
- Use a new unique workout ID (the app uses the current Unix time in seconds)
- Define all workout properties and steps

SPORTS:
- Set sport to cycling, running or rowing; the workout lands in that sport's list in the app
- Read workouts back with downloadCustomWorkoutsFromS3 for the same sport

UPDATING EXISTING WORKOUTS:
- Use the same workout ID as the existing workout
- Include all workout properties (changed and unchanged)
- Only modify the fields you want to update (e.g., Name, Description, WorkoutStepsArray)
- Keep other fields the same as the original workout

WORKOUT STRUCTURE:
- Each workout consists of multiple steps (WorkoutStepsArray)
- Steps are executed sequentially
- Power values are FTP multipliers (0.55 = 55% FTP, 1.0 = 100% FTP, 1.2 = 120% FTP)
- Time is in seconds

STEP TYPES:
- E_Normal: Steady power interval (use Power field)
- E_WarmUp: Ramp up from StartPower to EndPower
- E_CoolDown: Ramp down from StartPower to EndPower  
- E_FreeRide: Free ride with optional message

INTERVALS:
- Group steps into intervals by setting the same IntervalId (e.g., 1, 2, 3)
- Steps with IntervalId = 0 are not part of an interval
- Intervals can repeat (e.g., 3x [5min @ 80% FTP, 3min @ 120% FTP])

EXAMPLE WORKOUT:
- 5min warmup @ 55% FTP (Id: 1, StepType: E_Normal, Power: 0.55, Time: 300)
- 10min ramp 55% to 120% FTP (Id: 2, StepType: E_WarmUp, StartPower: 0.55, EndPower: 1.2, Time: 600)
- 3x [5min @ 80%, 3min @ 120%] (IntervalId: 1 for all 6 steps)
- 5min cooldown 120% to 55% (Id: 8, StepType: E_CoolDown, StartPower: 1.2, EndPower: 0.55, Time: 300)`;

export const parameters = z.object({
  workouts: z.array(workoutSchema).describe('Array of workout definitions to upload'),
  sport: sportParameter,
});

export async function handler(
  args: z.infer<typeof parameters>,
  extra: { client: MyWhooshClient }
): Promise<CallToolResult> {
  try {
    const sport = SPORTS[args.sport];

    const workoutsData = args.workouts.map(workout => {
      const workoutSteps: Record<string, any> = {};
      workout.WorkoutStepsArray.forEach(step => {
        workoutSteps[step.Id.toString()] = step;
      });

      return {
        ...workout,
        Mode: sport.mode,
        WorkoutSteps: workoutSteps,
        WorkoutstepsTMap: [],
        WokoutAssociationId: 0,
      };
    });

    const result = await extra.client.post('/client/custom-workout-upload', {
      baseUrl: 'COACHING',
      // same body as the app: no UserId (the token identifies the player), sport type at the top level
      body: JSON.stringify({
        SportsModeType: sport.type,
        WorkoutsData: workoutsData,
      }),
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  } catch (e) {
    if (e instanceof McpError) throw e;
    throw asMcpError(e);
  }
}
