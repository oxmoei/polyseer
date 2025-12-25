import { generateText } from 'ai';
import { getModelSmall } from '@/lib/ai/model';
import { InfluenceItem, ClusterMeta, Evidence } from '../forecasting/types';

export async function reporterAgent(
  question: string,
  p0: number,
  pNeutral: number,
  pAware: number | undefined,
  influence: InfluenceItem[],
  clusters: ClusterMeta[],
  drivers: string[],
  evidence: Evidence[],
  topN = 12
) {
  const top = [...influence].sort((a, b) => b.deltaPP - a.deltaPP).slice(0, topN);

  // Lookup maps
  const evidenceMap = evidence.reduce((map, ev) => { map[ev.id] = ev; return map; }, {} as Record<string, Evidence>);
  const clusterMap = clusters.reduce((m, c) => { m[c.clusterId] = c; return m; }, {} as Record<string, ClusterMeta>);

  const topEvidenceWithClaims = top.map(t => {
    const ev = evidenceMap[t.evidenceId];
    return {
      id: t.evidenceId,
      claim: ev?.claim || 'Evidence not found',
      polarity: ev?.polarity || 0,
      deltaPP: t.deltaPP,
      type: ev?.type || 'Unknown',
      publishedAt: ev?.publishedAt || 'n/a',
      urls: ev?.urls || [],
      originId: ev?.originId || 'unknown',
      verifiability: ev?.verifiability ?? 0,
      corroborationsIndep: ev?.corroborationsIndep ?? 0,
      consistency: ev?.consistency ?? 0,
      cluster: ev?.originId ? clusterMap[ev.originId] : undefined,
      logLR: influence.find(i => i.evidenceId === t.evidenceId)?.logLR ?? 0,
    };
  });

  const predictionDirection = pNeutral > 0.5 ? '是' : '否';
  const confidence = Math.abs(pNeutral - 0.5) * 200;

  const catalogLines = topEvidenceWithClaims.map(e => {
    const domain = e.urls && e.urls.length ? (() => { try { return new URL(e.urls[0]).hostname.replace(/^www\./, ''); } catch { return 'unknown'; } })() : 'unknown';
    const clusterMeta = e.cluster ? `cluster=${e.cluster.clusterId}, rho=${e.cluster.rho.toFixed(2)}, mEff=${e.cluster.mEff.toFixed(2)}` : 'cluster=n/a';
    return `- ${e.id} | ${e.polarity > 0 ? '+' : '-'} | Type ${e.type} | Δpp=${(e.deltaPP * 100).toFixed(2)} | logLR=${e.logLR.toFixed(3)} | ver=${e.verifiability.toFixed(2)} | corrInd=${e.corroborationsIndep} | cons=${e.consistency.toFixed(2)} | date=${e.publishedAt} | src=${domain} | ${clusterMeta}\n  Claim: ${e.claim}`;
  }).join('\n');

  const adjacentLines = topEvidenceWithClaims
    .filter((e: any) => e.pathway || typeof e.connectionStrength === 'number')
    .map((e: any) => {
      const cs = typeof e.connectionStrength === 'number' ? e.connectionStrength.toFixed(2) : 'n/a';
      const pw = e.pathway || 'adjacent';
      return `- ${e.id} | pathway=${pw} | strength=${cs} | Δpp=${(e.deltaPP * 100).toFixed(2)} | Type ${e.type}\n  Claim: ${e.claim}`;
    }).join('\n');

  const prompt = `
你是报告撰写专家。请生成一份详细、易于浏览的 Markdown **预测报告**，解释每条证据如何影响概率估计。

**重要：请全部用中文撰写报告。**

分析结果：
- 中性概率 p_neutral = ${(pNeutral * 100).toFixed(1)}%
- 市场感知概率 p_aware ${pAware !== undefined ? `= ${(pAware * 100).toFixed(1)}%` : '(未计算)'}
- 基准概率 p0 = ${(p0 * 100).toFixed(1)}%
- 预测: ${predictionDirection} (置信度 ${confidence.toFixed(1)}%)
- 关键驱动因素: ${drivers.join('; ') || '无'}

证据目录（按影响力排序）：
${catalogLines}

问题: ${question}

格式要求：
请按以下结构撰写中文报告：

## 预测: ${predictionDirection} (${(pNeutral * 100).toFixed(1)}%)

## 预测理由
- 总结正面和负面证据如何共同影响后验概率的核心逻辑。
- 明确引用证据 ID 及其 Δpp（百分点贡献），并说明相关性（cluster rho）的影响。

## 证据深度分析
- 对上述每条证据（按顺序）撰写一段简短分析，包括：
  - 证据内容（引用/摘要）、类型（A-D）、日期和来源。
  - 对估计的影响：方向、大约 Δpp，以及聚类相关性（rho, mEff）是否降低了其边际效应。
  - 质量信号：可验证性、佐证数量和一致性，说明其权重合理性；必要时提及时效性。

## 相关信号与催化因素
- 总结非直接但相关的催化因素（如平台政策、监管/法律、奖项/媒体、病毒传播、发布/巡演、宏观环境、分发渠道等）。使用以下列表并解释每个因素如何通过其路径和连接强度影响后验概率。
${adjacentLines}

## 关键驱动因素
- 列出主要的前瞻性因素（3-5 条）: ${drivers.slice(0, 5).join(', ')}

## 什么会改变我们的判断
- 3-5 个具体事件、数据集或结果，可能会实质性地改变估计，并说明方向和可能的幅度。

## 注意事项与局限性
- 说明潜在偏差、抽样问题、相关性或过度依赖聚类、数据过时风险，或与市场/Elo 基准的分歧（如有）。

风格要求：
- 精确、以证据为导向、易于浏览。引用证据时使用 ID（如 e12）；正文中避免原始 URL。
- 段落简洁；不要废话。
- **全部用中文撰写。**
`;

  const { text } = await generateText({
    model: getModelSmall(),
    system: `你是专业的中文报告撰写专家。请只输出简洁、易于浏览的中文 Markdown 格式内容。`,
    prompt,
  });
  return text;
}
