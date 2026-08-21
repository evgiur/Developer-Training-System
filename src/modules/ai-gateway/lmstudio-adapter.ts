import { IAIGatewayProvider, AIGenerateRequest, AIGenerateResponse, GradingRubric, GradingResult, GradingResultSchema } from './types';
import { z } from 'zod';

export class LMStudioAdapter implements IAIGatewayProvider {
  name = 'lmstudio';
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || process.env.LMSTUDIO_BASE_URL || 'http://127.0.0.1:1234';
    this.model = model || process.env.LMSTUDIO_MODEL || 'qwen/qwen3-coder-30b';
  }

  async generateText(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const startTime = Date.now();
    const systemMessage = request.systemPrompt || 'You are an expert AI assistant for a developer training system.';

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature ?? 0.2,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LM Studio API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;
    const textOutput = data.choices?.[0]?.message?.content || '';

    return {
      text: textOutput,
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
