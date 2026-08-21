import { IAIGatewayProvider, AIGenerateRequest, AIGenerateResponse, GradingRubric, GradingResult, GradingResultSchema } from './types';
import { z } from 'zod';

/**
 * T10: Abstract base adapter that implements shared logic for all AI providers.
 * Concrete adapters only need to implement generateText().
 */
export abstract class BaseAIAdapter implements IAIGatewayProvider {
  abstract name: string;

  abstract generateText(request: AIGenerateRequest): Promise<AIGenerateResponse>;

  async generateStructured<T>(request: AIGenerateRequest, schema: z.ZodSchema<T>): Promise<{ data: T; response: AIGenerateResponse }> {
    const jsonPrompt = `${request.prompt}\n\nRespond strictly with valid JSON conforming to the schema. Do not include markdown codeblocks or extra text.`;

    let response = await this.generateText({ ...request, prompt: jsonPrompt });

    let cleanText = this.sanitizeJsonResponse(response.text);

    try {
      const parsedJson = JSON.parse(cleanText);
      const validatedData = schema.parse(parsedJson);
      return { data: validatedData, response };
    } catch (firstError) {
      // T11: One retry with clarifying prompt including the error message
      console.warn(`[${this.name}] First structured parse failed, retrying with error context...`, firstError);

      const retryPrompt = `${jsonPrompt}\n\nYour previous response was invalid. Error: ${firstError instanceof Error ? firstError.message : String(firstError)}\n\nPlease fix your response and return ONLY valid JSON.`;
      response = await this.generateText({ ...request, prompt: retryPrompt });
      cleanText = this.sanitizeJsonResponse(response.text);

      const parsedJson = JSON.parse(cleanText);
      const validatedData = schema.parse(parsedJson);
      return { data: validatedData, response };
    }
  }

  async gradeAnswer(userAnswer: string, rubric: GradingRubric): Promise<GradingResult> {
    const prompt = `
Evaluate the following user response against the reference answer and rubric.

Reference Answer:
"${rubric.referenceAnswer}"

User Answer:
"${userAnswer}"

Return a JSON object with:
- correctness: 0 to 100
- completeness: 0 to 100
- depth: 0 to 100
- communication: 0 to 100
- confidence: 0.0 to 1.0
- qualityScore: integer from 0 (failed) to 4 (perfect recall + applied correctly)
- errorTypes: array of string error tags (e.g., "KNOWLEDGE_GAP", "CARELESS_ERROR", "AI_DEPENDENCY", "COMMUNICATION_GAP")
- missingPoints: array of strings key points missed
- feedback: clear constructive feedback
- nextAction: recommended remediation action
`;

    const { data } = await this.generateStructured(
      {
        promptType: 'grading',
        prompt,
        systemPrompt: 'You are a strict, fair Senior Engineering Assessor. Grade the developer answer objectively.',
        temperature: 0.1,
      },
      GradingResultSchema
    );

    return data;
  }

  /**
   * Clean markdown code fences from model response
   */
  private sanitizeJsonResponse(text: string): string {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
      clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return clean;
  }
}
