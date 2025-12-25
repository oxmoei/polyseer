/**
 * 统一的 AI 模型配置
 * 支持 DeepSeek (OpenAI 兼容 API)
 */
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// DeepSeek API 配置 - 使用 OpenAI 兼容包
const deepseek = createOpenAICompatible({
  name: 'deepseek',
  baseURL: 'https://api.deepseek.com/v1',
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
});

// 模型映射
export const getModel = () => deepseek('deepseek-chat');
export const getModelSmall = () => deepseek('deepseek-chat');
export const getModelReasoning = () => deepseek('deepseek-reasoner');

// 导出 provider 供特殊用途
export { deepseek };
