import { IAIGatewayProvider, AIGenerateRequest, AIGenerateResponse, GradingRubric, GradingResult, GradingResultSchema } from './types';
import { z } from 'zod';

export class OllamaAdapter implements IAIGatewayProvider {
  name = 'ollama';
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = model || process.env.OLLAMA_MODEL || 'qwen2.5-coder';
  }

  async generateText(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const startTime = Date.now();
    const systemMessage = request.systemPrompt || 'You are an expert AI assistant for a developer training system.';
    
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        prompt: `${systemMessage}\n\nUser: ${request.prompt}`,
        stream: false,
        options: {
          temperature: request.temperature ?? 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      text: data.response || '',
      provider: this.name,
      model: this.model,
      latencyMs,
    };
  }

  async generateStructured<T>(request: AIGenerateRequest, schema: z.ZodSchema<T>): Promise<{ data: T; response: AIGenerateResponse }> {
    const jsonPrompt = `${request.prompt}\n\nRespond strictly with valid JSON conforming to the schema. Do not include markdown codeblocks or extra text.`;
    const response = await this.generateText({ ...request, prompt: jsonPrompt });

    // Sanitize response text in case model wrapped output in markdown ```json ... ```
    let cleanText = response.text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedJson = JSON.parse(cleanText);
    const validatedData = schema.parse(parsedJson);

    return { data: validatedData, response };
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
- errorTypes: array of string error tags (e.g., "KNOWLEDGE_GAP", "CARELESS_ERROR")
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
}
