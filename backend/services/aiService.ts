import axios from 'axios';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatMessage[];
  /** Ask DeepSeek to guarantee a JSON output (prompt must contain the word "json"/"JSON") */
  jsonMode?: boolean;
  model?: string;
  max_tokens?: number;
  temperature?: number;
}

interface SpeechToTextRequest {
  model?: string;
  language?: string;
  prompt?: string;
  appLink?: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const DEFAULT_MODEL_NAME = 'deepseek-chat';

class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl =
      process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  }

  /**
   * Make a non-streaming chat completion request (DeepSeek OpenAI-compatible API)
   */
  async chatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error(
        'AI 服务未配置：缺少 DEEPSEEK_API_KEY 环境变量，请在后端 .env 中设置后重启服务',
      );
    }
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: request.model || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL_NAME,
          messages: request.messages,
          stream: false,
          ...(request.max_tokens !== undefined && { max_tokens: request.max_tokens }),
          ...(request.temperature !== undefined && { temperature: request.temperature }),
          ...(request.jsonMode && { response_format: { type: 'json_object' } }),
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        const detail =
          typeof data === 'string'
            ? data.slice(0, 300)
            : JSON.stringify(data ?? {}).slice(0, 300);
        console.error('AI Service Error:', status, detail || error.message);
        throw new Error(
          `AI 服务请求失败（${status ?? '网络错误/超时'}）${detail ? `：${detail}` : ''}`,
        );
      }
      console.error('AI Service Error:', error);
      throw new Error(`AI service request failed: ${error}`);
    }
  }

  /**
   * Simple chat method for basic conversations (non-streaming)
   */
  async chat(
    message: string,
    systemPrompt?: string,
    options?: { jsonMode?: boolean },
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: message });

    const response = await this.chatCompletion({ messages, ...options });
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Speech to text.
   * NOTE: DeepSeek does not provide a speech-to-text API; kept for interface compatibility.
   */
  async speechToText(
    _audioFile: File | Buffer | Blob,
    _options?: SpeechToTextRequest,
  ): Promise<string> {
    throw new Error(
      '语音转文字不可用：当前使用的 DeepSeek API 不提供语音识别服务',
    );
  }
}

// Factory function to create AI service instance
export function createAIService(): AIService {
  return new AIService();
}

export default AIService;
export type {
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  SpeechToTextRequest,
};
