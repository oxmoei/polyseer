/**
 * 简化的搜索工具 - 基于 AI 知识
 * 不依赖外部搜索 API，使用 AI 模型的内置知识
 */
import { z } from "zod";
import { tool, generateText } from "ai";
import { getModel } from '@/lib/ai/model';

// 搜索结果类型
export interface SimpleSearchResult {
  title: string;
  url: string;
  content: string;
  relevance_score: number;
  source: string;
}

export type SimpleToolResult = {
  success: boolean;
  query: string;
  results: SimpleSearchResult[];
  note?: string;
};

// Deep Search 输入 schema
const deepSearchInputSchema = z.object({
  query: z.string().min(1).describe('搜索查询'),
  searchType: z.enum(["all", "web", "market", "academic", "proprietary"]).default("all"),
  startDate: z.string().optional(),
});

// Web Search 输入 schema
const webSearchInputSchema = z.object({
  query: z.string().min(1).describe('搜索查询'),
  startDate: z.string().optional(),
});

/**
 * 使用 AI 知识生成搜索结果
 */
async function generateSearchResults(query: string, searchType: string): Promise<SimpleSearchResult[]> {
  try {
    const { text } = await generateText({
      model: getModel(),
      system: `你是一个知识渊博的研究助手。基于你的知识，为给定的查询提供相关的事实性信息。

返回格式要求：以 JSON 数组格式返回 3-5 条相关信息，每条包含：
- title: 信息标题
- content: 详细内容（100-200字）
- source: 信息来源类型（如 "新闻报道", "官方声明", "研究报告", "行业分析" 等）
- relevance_score: 相关性评分 0.5-1.0

只返回 JSON 数组，不要其他文字。`,
      prompt: `查询: "${query}"
搜索类型: ${searchType}
当前日期: ${new Date().toISOString().slice(0, 10)}

请基于你的知识提供与此查询最相关的事实性信息。注意：
1. 聚焦于可验证的事实和数据
2. 包含具体的日期、数字、人名、机构名
3. 区分确定的事实和推测
4. 优先提供近期信息（2024-2025年）`,
    });

    // 解析 AI 返回的 JSON
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const results = JSON.parse(jsonMatch[0]);
      return results.map((r: any, i: number) => ({
        title: r.title || `Result ${i + 1}`,
        url: '', // AI 生成的结果没有真实 URL
        content: r.content || '',
        relevance_score: r.relevance_score || 0.7,
        source: r.source || 'AI Knowledge',
      }));
    }
    return [];
  } catch (error) {
    console.error('[SimpleSearch] Error generating results:', error);
    return [];
  }
}

// Deep Search 工具
export const simpleDeepSearchTool = tool({
  description: "搜索相关信息。使用 AI 知识库提供研究信息。",
  inputSchema: deepSearchInputSchema,
  execute: async ({ query, searchType }) => {
    console.log(`[SimpleDeepSearch] Query: "${query}", Type: ${searchType}`);

    const results = await generateSearchResults(query, searchType);

    const toolResult: SimpleToolResult = {
      success: true,
      query,
      results,
      note: "基于 AI 知识生成的搜索结果",
    };

    console.log(`[SimpleDeepSearch] Generated ${results.length} results`);
    return toolResult;
  },
});

// Web Search 工具
export const simpleWebSearchTool = tool({
  description: "网络搜索。使用 AI 知识库提供网络信息。",
  inputSchema: webSearchInputSchema,
  execute: async ({ query }) => {
    console.log(`[SimpleWebSearch] Query: "${query}"`);

    const results = await generateSearchResults(query, 'web');

    const toolResult: SimpleToolResult = {
      success: true,
      query,
      results,
      note: "基于 AI 知识生成的搜索结果",
    };

    console.log(`[SimpleWebSearch] Generated ${results.length} results`);
    return toolResult;
  },
});
