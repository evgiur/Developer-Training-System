import { z } from 'zod';

export type PromptType = 'coding' | 'grading' | 'explanation' | 'task_gen' | 'classification';

export interface AIGenerateRequest {
  promptType: PromptType;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

export interface AIGenerateResponse {
  text: string;
  provider: string;
  model: string;
  latencyMs: number;
}

export interface GradingRubric {
  correctnessWeight: number; // e.g. 0.4
  completenessWeight: number; // e.g. 0.3
  depthWeight: number; // e.g. 0.3
  referenceAnswer: string;
}

export const GradingResultSchema = z.object({
  correctness: z.number().min(0).max(100),
  completeness: z.number().min(0).max(100),
  depth: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  qualityScore: z.number().int().min(0).max(4), // 0: fail, 1: partial, 2: correct with hint, 3: correct, 4: perfect
  errorTypes: z.array(z.string()),
  missingPoints: z.array(z.string()),
  feedback: z.string(),
  nextAction: z.string(),
});

export type GradingResult = z.infer<typeof GradingResultSchema>;

export interface IAIGatewayProvider {
  name: string;
  generateText(request: AIGenerateRequest): Promise<AIGenerateResponse>;
  generateStructured<T>(request: AIGenerateRequest, schema: z.ZodSchema<T>): Promise<{ data: T; response: AIGenerateResponse }>;
  gradeAnswer(userAnswer: string, rubric: GradingRubric): Promise<GradingResult>;
}
