/**
 * LLM 通用类型定义
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
