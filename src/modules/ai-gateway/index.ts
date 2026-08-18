import { IAIGatewayProvider, AIGenerateRequest, AIGenerateResponse, GradingRubric, GradingResult } from './types';
import { OllamaAdapter } from './ollama-adapter';
import { OpenRouterAdapter } from './openrouter-adapter';
import { z } from 'zod';

export class AIGatewayService implements IAIGatewayProvider {
  name = 'ai-gateway-composite';
  private primaryProvider: IAIGatewayProvider;
  private fallbackProvider: IAIGatewayProvider;

  constructor() {
    const activeProvider = process.env.AI_PROVIDER || 'ollama';

    if (activeProvider === 'openrouter') {
      this.primaryProvider = new OpenRouterAdapter();
      this.fallbackProvider = new OllamaAdapter();
    } else {
      this.primaryProvider = new OllamaAdapter();
      this.fallbackProvider = new OpenRouterAdapter();
    }
  }

  async generateText(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    try {
      return await this.primaryProvider.generateText(request);
    } catch (primaryError) {
      console.warn(`[AI Gateway] Primary provider (${this.primaryProvider.name}) failed. Attempting fallback...`, primaryError);
      return await this.fallbackProvider.generateText(request);
    }
  }

  async generateStructured<T>(request: AIGenerateRequest, schema: z.ZodSchema<T>): Promise<{ data: T; response: AIGenerateResponse }> {
    try {
      return await this.primaryProvider.generateStructured(request, schema);
    } catch (primaryError) {
      console.warn(`[AI Gateway] Primary provider (${this.primaryProvider.name}) structured generation failed. Attempting fallback...`, primaryError);
      return await this.fallbackProvider.generateStructured(request, schema);
    }
  }

  async gradeAnswer(userAnswer: string, rubric: GradingRubric): Promise<GradingResult> {
    try {
      return await this.primaryProvider.gradeAnswer(userAnswer, rubric);
    } catch (primaryError) {
      console.warn(`[AI Gateway] Primary provider grading failed. Attempting fallback...`, primaryError);
      return await this.fallbackProvider.gradeAnswer(userAnswer, rubric);
    }
  }
}

export const aiGateway = new AIGatewayService();
