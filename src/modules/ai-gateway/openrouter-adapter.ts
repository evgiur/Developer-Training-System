import { IAIGatewayProvider, AIGenerateRequest, AIGenerateResponse, GradingRubric, GradingResult, GradingResultSchema } from './types';
import { z } from 'zod';

export class OpenRouterAdapter implements IAIGatewayProvider {
  name = 'openrouter';
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || '';
    this.model = model || process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-lite-preview-02-05:free';
  }

  async generateText(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const startTime = Date.now();
    const systemMessage = request.systemPrompt || 'You are an expert AI assistant for a developer training system.';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Developer Training System',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature ?? 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
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
