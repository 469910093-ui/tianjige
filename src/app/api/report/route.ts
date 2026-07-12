import { NextRequest, NextResponse } from 'next/server';
import { invokeChat } from '@/lib/llm-client';
import { buildFallbackReport, buildFoodSummary } from '@/lib/mock-report';

export async function POST(request: NextRequest) {
  const { engineData, engineType, birthInfo } = await request.json();

  const now = new Date();
  const today = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const thisMonth = `${now.getFullYear()}年${now.getMonth() + 1}月`;
  const thisYear = `${now.getFullYear()}年`;

  // PRD：无 LLM 时仍可展示排盘 + 降级白话报告（不阻断主路径）
  const hasLlmKey = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
  if (!hasLlmKey) {
    const reports = buildFallbackReport(engineData, birthInfo);
    return NextResponse.json({
      success: true,
      reports,
      generated: 4,
      source: 'fallback',
      notice: '未配置 DEEPSEEK_API_KEY，已按引擎排盘生成降级白话报告',
    });
  }

  // Common style instruction
  const styleInstruction = `你是一位民间命理师傅，口吻要像老手艺人讲行话——干净利落、有烟火气。规则：
1. 主要参考中式命理排盘结果（八字、紫微、六爻、奇门），引用古籍和各派大师的解读思路
2. 通俗易懂，贴近实际生活，但不要具体到某个行业、某个数字
3. 不要用AI腔（禁止"综上所述""值得注意的是""总的来说""需要指出"等），用"此造""此局""冲犯""化解""不妨"等命理行话自然穿插
4. 评分必须有，但不要解释评分逻辑
5. 严格按JSON格式输出，不要加任何多余文字`;

  const engineTypeLabel: Record<string, string> = {
    'bazi': '八字命盘',
    'astrology': '星座星盘',
    'tarot': '塔罗占卜',
    'ziwei': '紫微斗数',
    'qimen': '奇门遁甲',
    'liuyao': '六爻占卜',
    'horoscope': '每日运势',
    'unified': '综合多流派',
  };

  const label = engineTypeLabel[engineType] || engineType || '综合';
  const birthStr = birthInfo
    ? `\n求测者出生信息：${birthInfo}${String(birthInfo).includes('MBTI') ? '\n若含 MBTI，可轻微参考性格语气做表达，但不要喧宾夺主，也勿编造未给出的类型。' : ''}`
    : '';

  const generateSection = async (section: string, extraPrompt: string): Promise<Record<string, unknown> | null> => {
    const systemPrompt = `${styleInstruction}

测算类型：${label}
${extraPrompt}

输出JSON结构：
{
  "overall": { "score": 85, "text": "总体运势概述" },
  "career": { "score": 78, "text": "事业解读" },
  "love": { "score": 82, "text": "感情解读" },
  "wealth": { "score": 70, "text": "财运解读" },
  "health": { "score": 88, "text": "健康解读" },
  "advice": "一句话化解或建议"
}

算命引擎原始数据：
${JSON.stringify(engineData, null, 2)}${birthStr}`;

    try {
      const content = await invokeChat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `请生成「${section}」的命理解读，严格按JSON格式输出。` },
        ],
        { temperature: 0.7 }
      );

      const rawContent = content || '';
      const cleaned = rawContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      let jsonStr = '';
      const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }
      if (!jsonStr) {
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
      }

      if (!jsonStr) {
        console.error(`Report section ${section}: no JSON found, preview: ${cleaned.substring(0, 200)}`);
        return null;
      }

      return JSON.parse(jsonStr);
    } catch (error) {
      console.error(`Report section ${section} error:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  // Generate 4 sections in parallel
  const sections = [
    { key: 'overview', prompt: `生成命理概况报告。从性格、天赋、格局高度来解读此人命盘全貌。这是总体概况，不要涉及具体日期运势。` },
    { key: 'daily', prompt: `生成今日运势报告。开头必须提到"今天是${today}"，然后解读今日运势。重点看日运对命盘的冲合关系。` },
    { key: 'monthly', prompt: `生成${thisMonth}月运报告。解读本月整体运势走势，注意月令对命盘的影响。` },
    { key: 'yearly', prompt: `生成${thisYear}年运报告。解读今年整体运势大势，注意太岁、流年对命盘的作用。` },
  ];

  const results = await Promise.all(
    sections.map(s => generateSection(s.key, s.prompt).then(r => ({ key: s.key, data: r })))
  );

  const reports: Record<string, unknown> = {};
  const failedKeys: string[] = [];
  for (const r of results) {
    if (r.data) {
      reports[r.key] = r.data;
    } else {
      failedKeys.push(r.key);
    }
  }

  // Retry failed sections once
  for (const key of failedKeys) {
    console.log(`Retrying report section: ${key}`);
    const section = sections.find(s => s.key === key)!;
    const retryResult = await generateSection(key, section.prompt);
    if (retryResult) {
      reports[key] = retryResult;
    }
  }

  const successCount = Object.keys(reports).length;
  if (successCount === 0) {
    // LLM 全失败：降级为引擎白话报告，避免主路径空白
    const fallback = buildFallbackReport(engineData, birthInfo);
    return NextResponse.json({
      success: true,
      reports: fallback,
      generated: 4,
      source: 'fallback',
      notice: 'AI 报告暂不可用，已按引擎排盘生成降级白话报告',
    });
  }

  // 无论 LLM 成功与否，都附带一句「今天吃什么」重点（基于五行，不依赖模型）
  const bundle = (engineData || {}) as {
    bazi?: { wuxing?: Record<string, number> } | null;
  };
  const wx = bundle.bazi?.wuxing;
  let strong = '土';
  let weak = '金';
  if (wx) {
    const entries = Object.entries(wx).sort((a, b) => b[1] - a[1]);
    strong = entries[0]?.[0] || strong;
    weak = entries[entries.length - 1]?.[0] || weak;
  }
  (reports as Record<string, unknown>).foodSummary = buildFoodSummary(strong, weak);

  return NextResponse.json({
    success: true,
    reports,
    generated: successCount,
    source: 'llm',
  });
}
