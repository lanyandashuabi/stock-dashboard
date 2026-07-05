import { Router, Request, Response } from 'express';
import { getAllIndustryTerms } from '../db';

const router = Router();

/**
 * 研报智能分析 API — v3.0
 *
 * 改进：
 * 1. 不再使用硬编码 STOCK_MAP，改用：
 *    - 正则提取研报中所有可能的股票名称
 *    - 批量调用腾讯财经API验证
 * 2. 行业词条从 SQLite industry_terms 动态读取
 * 3. 区分行业研报 vs 个股研报的催化剂归属
 * 4. 自动建议新行业词条
 */

// ---- 正则：提取股票名称 ----
// 匹配 "中文名称(数字代码)" 或 "中文名称（数字代码）" 或 逗号分隔的名称列表
const STOCK_NAME_PATTERN = /([\u4e00-\u9fa5]{2,6}(?:股份|科技|集团|控股|电子|电气|传动|精密|材料|医疗|生物|药业|医药|食品|饮料|乳业|汽车|动力|能源|通信|网络|软件|数据|银行|证券|保险|地产|物业|钢铁|水泥|化工|矿业|黄金|铜业|铝业|稀土|航空|航天|船舶|重工|机械|电器|电机|电力|水务|燃气|环保|建筑|建材|运输|物流|快递|机场|港口|高速|旅游|酒店|零售|百货|免税|服装|纺织|家纺|传媒|影视|游戏|出版|教育|人力|美容|化妆|纸业|包装|家具)?)/g;

// 匹配代码格式: (600519) 或 （600519）或 600519.SH
const CODE_PATTERN = /[（(](\d{5,6})[）)]|(\d{5,6})\.(SH|SZ|BJ|HK)/gi;

// ---- 股票名称黑名单（非股票名称的常见词） ----
const NON_STOCK_WORDS = new Set([
  '特斯拉', '英伟达', '微软', '谷歌', '苹果', '亚马逊', 'META', 'OPENAI',
  '机器人', '自动化', '人工智能', '大模型', '新能源', '光伏', '储能',
  '产业链', '供应链', '供应商', '零部件', '制造业', '工业', '消费',
  '投资者', '市场', '行业', '板块', '公司', '集团', '上周', '本周',
  '建议', '关注', '买入', '卖出', '持有', '增持', '减持', '评级',
  '同比', '环比', '增长', '下降', '营收', '利润', '净利润', '毛利率',
  '上半年', '下半年', '一季度', '二季度', '三季度', '四季度',
  '催化剂', '风险', '机会', '估值', '目标价', '空间',
  '时间', '进度', '量产', '定点', '份额',
  '数据', '来源', '截止', '本报告', '研报',
  '预期', '预计', '判断', '认为', '维持',
  '中际旭创', '新易盛', '天孚通信', '贵州茅台', '宁德时代', '比亚迪',
]);

/**
 * 批量验证股票名称（调用腾讯财经API）
 */
async function verifyStockNames(names: string[]): Promise<Map<string, { code: string; name: string; market: string }>> {
  const result = new Map<string, { code: string; name: string; market: string }>();
  if (names.length === 0) return result;

  const unique = [...new Set(names)].slice(0, 60); // 最多60个
  const batchSize = 10;
  const batches: string[][] = [];

  for (let i = 0; i < unique.length; i += batchSize) {
    batches.push(unique.slice(i, i + batchSize));
  }

  const searches = batches.map(async (batch) => {
    for (const name of batch) {
      try {
        const matches = await searchSingleStock(name);
        const exact = matches.find(m => m.name === name);
        if (exact) {
          result.set(name, exact);
        } else if (matches.length > 0 && (
          matches[0].name.includes(name) || name.includes(matches[0].name)
        )) {
          result.set(name, matches[0]);
        }
      } catch {
        // skip
      }
    }
  });

  await Promise.all(searches);
  return result;
}

/**
 * 搜索单只股票
 */
async function searchSingleStock(keyword: string): Promise<{ code: string; name: string; market: string }[]> {
  try {
    const url = `https://smartbox.gtimg.cn/s3/?q=${encodeURIComponent(keyword)}&t=all&count=5`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const text = await resp.text();

    const results: { code: string; name: string; market: string }[] = [];
    const seen = new Set<string>();

    // 格式: v_hint="sh~601689~拓普集团~tpjt~GP-A"
    const hintMatches = text.matchAll(/v_hint="([^"]+)"/g);
    for (const m of hintMatches) {
      const parts = m[1].split('~');
      if (parts.length < 3) continue;
      const marketPrefix = parts[0];
      const rawCode = parts[1];
      const name = decodeUnicode(parts[2]);
      if (!name || !rawCode) continue;

      let code = '';
      if (marketPrefix === 'sh') code = `${rawCode}.SH`;
      else if (marketPrefix === 'sz') code = `${rawCode}.SZ`;
      else if (marketPrefix === 'bj') code = `${rawCode}.BJ`;
      else if (marketPrefix === 'hk') code = `${rawCode}.HK`;
      else continue;

      if (seen.has(code)) continue;
      seen.add(code);
      results.push({ code, name, market: code.endsWith('.HK') ? 'HK' : 'A' });
    }

    return results;
  } catch {
    return [];
  }
}

router.post('/research/analyze', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.length < 10) {
      return res.status(400).json({ success: false, error: '请输入至少10字的研报内容' });
    }

    // ---- 1. 提取候选股票名称 ----
    const candidateNames = new Set<string>();

    // 方法A: 正则匹配中文名称
    const nameMatches = content.matchAll(STOCK_NAME_PATTERN);
    for (const m of nameMatches) {
      const name = m[1] || m[0];
      if (name && name.length >= 3 && !NON_STOCK_WORDS.has(name)) {
        candidateNames.add(name);
      }
    }

    // 方法B: 匹配 "名称(代码)" 格式，提取名称
    const bracketPattern = /([\u4e00-\u9fa5]{2,6})\s*[（(]\d{5,6}[）)]/g;
    const bracketMatches = content.matchAll(bracketPattern);
    for (const m of bracketMatches) {
      const name = m[1];
      if (name && name.length >= 3 && !NON_STOCK_WORDS.has(name)) {
        candidateNames.add(name);
      }
    }

    // 方法C: 匹配逗号/顿号分隔的名称列表中的名称
    // 如: "拓普集团、三花智控、浙江荣泰、恒立液压等"
    const listPattern = /([\u4e00-\u9fa5]{3,6})(?:[、，,])/g;
    const listMatches = content.matchAll(listPattern);
    for (const m of listMatches) {
      const name = m[1];
      if (name && name.length >= 3 && !NON_STOCK_WORDS.has(name)) {
        candidateNames.add(name);
      }
    }

    // ---- 2. 批量验证股票名称 ----
    const verifiedStocks = await verifyStockNames([...candidateNames]);

    // ---- 3. 构建个股结果 ----
    const stocks: { code: string; name: string; action: string; reason: string }[] = [];

    for (const [name, info] of verifiedStocks) {
      // 提取操作建议
      let action = '关注';
      // 在名称前后搜索操作建议词
      const idx = content.indexOf(name);
      if (idx >= 0) {
        const context = content.substring(Math.max(0, idx - 80), Math.min(content.length, idx + 80));
        if (/买入|推荐|强烈推荐/.test(context)) action = '买入';
        else if (/增持|加仓/.test(context)) action = '增持';
        else if (/减持|减仓/.test(context)) action = '减持';
        else if (/卖出|清仓/.test(context)) action = '卖出';
        else if (/持有|观望/.test(context)) action = '持有';
      }

      // 提取上下文片段
      const snippet = content.substring(Math.max(0, idx - 20), Math.min(content.length, idx + 60));
      stocks.push({
        code: info.code,
        name: info.name,
        action,
        reason: snippet.replace(/\n/g, ' ').trim(),
      });
    }

    // ---- 4. 行业识别（从 SQLite 动态读取词条） ----
    const industryTerms = getAllIndustryTerms();
    const industryUpdates: { industry: string; content: string }[] = [];
    const matchedIndustries = new Set<string>();

    for (const term of industryTerms) {
      const keywords = term.keywords.split(/[,，]/).map(k => k.trim()).filter(Boolean);
      const matchedKws = keywords.filter(kw => content.includes(kw));
      if (matchedKws.length > 0) {
        matchedIndustries.add(term.name);
        const snippet = content.length > 200 ? content.substring(0, 200) + '...' : content;
        industryUpdates.push({
          industry: term.name,
          content: `研报提及关键词: ${matchedKws.slice(0, 5).join('、')}。${snippet}`,
        });
      }
    }

    // ---- 5. 自动建议新行业词条 ----
    // 检查研报中是否有高频出现的行业词但未在词条库中
    const suggestedTerms: { keyword: string; context: string }[] = [];
    const commonIndustryKeywords = [
      '液冷', '柴发', '燃发', '减速器', '灵巧手', '丝杠', '电机', '结构件',
      '传感器', '控制器', '执行器', '热管理', '底盘', '内外饰', '一体化压铸',
      '电子皮肤', '轻量化', '智能驾驶', '座舱', '域控', '线控', '制动',
      '压铸', '锻造', '冲压', '注塑', '模具', '工装', '检具',
      '大宗', '原油', '天然气', '煤炭', '钢铁', '铜', '铝', '黄金',
      'PCB', 'FPC', '连接器', '被动元件', 'MLCC', '电感',
      '军工', '卫星', '导弹', '雷达', '无人机', '战斗机',
      'CRO', 'CDMO', '原料药', '仿制药', '中药', '配方颗粒',
    ];

    for (const kw of commonIndustryKeywords) {
      if (content.includes(kw) && !matchedIndustries.has(kw)) {
        // 检查是否已被现有词条覆盖
        const alreadyCovered = industryTerms.some(t =>
          t.keywords.split(/[,，]/).map(k => k.trim()).includes(kw)
        );
        if (!alreadyCovered) {
          const kwIdx = content.indexOf(kw);
          const ctx = content.substring(Math.max(0, kwIdx - 20), Math.min(content.length, kwIdx + 40));
          suggestedTerms.push({ keyword: kw, context: ctx.trim() });
        }
      }
    }

    // ---- 6. 风险提示 ----
    const riskWarnings: string[] = [];
    const riskPatterns = [
      { regex: /风险[：:]\s*([^。\n]+)/g, label: '' },
      { regex: /下行风险[：:]\s*([^。\n]+)/g, label: '下行风险：' },
      { regex: /需注意[：:]\s*([^。\n]+)/g, label: '需注意：' },
      { regex: /警惕[：:]\s*([^。\n]+)/g, label: '警惕：' },
    ];
    for (const pattern of riskPatterns) {
      const matches = content.matchAll(pattern.regex);
      for (const m of matches) {
        riskWarnings.push(pattern.label + (m[1] || '').trim());
      }
    }
    if (riskWarnings.length === 0 && (content.includes('风险') || content.includes('警惕') || content.includes('谨慎'))) {
      riskWarnings.push('研报提及相关风险，请仔细阅读原文');
    }

    // ---- 7. 核心摘要 ----
    // 智能摘要：优先取标题和首段
    const lines = content.split('\n').filter(l => l.trim());
    let summary = '';
    if (lines.length > 0 && lines[0].startsWith('【') || lines[0].startsWith('#')) {
      summary = lines.slice(0, 3).join(' ').replace(/#/g, '').trim();
    } else {
      summary = content.length > 300
        ? content.substring(0, 300).replace(/\n/g, ' ').trim() + '...'
        : content.replace(/\n/g, ' ').trim();
    }

    // ---- 8. 区分行业/个股催化剂 ----
    const isSectorReport = industryUpdates.length >= 2 || stocks.length >= 5;
    const catalystType = isSectorReport ? '行业' : '个股';

    res.json({
      success: true,
      data: {
        summary,
        stocks,
        industryUpdates: industryUpdates.slice(0, 8),
        riskWarnings: riskWarnings.slice(0, 5),
        suggestedTerms: suggestedTerms.slice(0, 10),
        catalystType,
        stats: {
          candidateNames: candidateNames.size,
          verifiedStocks: verifiedStocks.size,
          matchedIndustries: matchedIndustries.size,
        },
      },
    });
  } catch (err) {
    console.error('[Research] Error:', err);
    res.status(500).json({ success: false, error: '分析失败' });
  }
});

/**
 * 解码 \uXXXX Unicode 转义序列
 */
function decodeUnicode(str: string): string {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

export default router;
