/**
 * DeepSeek LLM 统一客户端
 * 基于 OpenAI 兼容格式调用 DeepSeek API
 * 
 * 环境变量：
 * - DEEPSEEK_API_KEY: DeepSeek API 密钥（必填）
 * - DEEPSEEK_BASE_URL: API 基础地址（默认 https://api.deepseek.com）
 * - DEEPSEEK_MODEL: 模型名称（默认 deepseek-v4-flash）
 */

import { ChatMessage } from './llm-types';

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-v4-flash';

function getBaseUrl(): string {
  return process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL;
}

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error('DEEPSEEK_API_KEY 环境变量未设置，请在项目配置中添加 DeepSeek API Key');
  }
  return key;
}

function getModel(): string {
  return process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
}

/**
 * 流式对话 - 返回 ReadableStream (SSE 格式)
 */
export async function streamChat(
  messages: ChatMessage[],
  options?: { temperature?: number; model?: string }
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();
  const model = options?.model || getModel();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: options?.temperature ?? 0.8,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`DeepSeek API 错误 (${response.status}): ${errorText}`);
  }

  if (!response.body) {
    throw new Error('DeepSeek API 未返回流式响应');
  }

  // 将 DeepSeek/OpenAI SSE 格式转换为简化的 SSE 格式
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6); // 去掉 "data: "
        if (data === '[DONE]') {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
          }
        } catch {
          // 忽略解析失败的行
        }
      }
    },
  });

  return response.body.pipeThrough(transformStream);
}

/**
 * 非流式对话 - 返回完整文本
 */
export async function invokeChat(
  messages: ChatMessage[],
  options?: { temperature?: number; model?: string }
): Promise<string> {
  const apiKey = getApiKey();
  const baseUrl = getBaseUrl();
  const model = options?.model || getModel();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`DeepSeek API 错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * 获取当前配置信息（用于健康检查）
 */
export function getConfig(): { baseUrl: string; model: string; hasApiKey: boolean } {
  return {
    baseUrl: getBaseUrl(),
    model: getModel(),
    hasApiKey: !!process.env.DEEPSEEK_API_KEY,
  };
}
