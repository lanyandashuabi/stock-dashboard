import { Router, Request, Response } from 'express';

const router = Router();

/**
 * 研报智能分析 API
 *
 * 接收研报文本，使用规则引擎提取关键信息：
 * - 涉及个股（代码+名称+操作建议）
 * - 行业影响
 * - 风险提示
 * - 核心摘要
 */

// 已知股票名称→代码映射
const STOCK_MAP: Record<string, { code: string; name: string }> = {
  '贵州茅台': { code: '600519.SH', name: '贵州茅台' },
  '五粮液': { code: '000858.SZ', name: '五粮液' },
  '宁德时代': { code: '300750.SZ', name: '宁德时代' },
  '比亚迪': { code: '002594.SZ', name: '比亚迪' },
  '工业富联': { code: '601138.SH', name: '工业富联' },
  '中际旭创': { code: '300308.SZ', name: '中际旭创' },
  '汇川技术': { code: '300124.SZ', name: '汇川技术' },
  '科大讯飞': { code: '002230.SZ', name: '科大讯飞' },
  '中芯国际': { code: '688981.SH', name: '中芯国际' },
  '药明康德': { code: '603259.SH', name: '药明康德' },
  '迈瑞医疗': { code: '300760.SZ', name: '迈瑞医疗' },
  '招商轮船': { code: '601872.SH', name: '招商轮船' },
  '中远海能': { code: '600026.SH', name: '中远海能' },
  '寒武纪': { code: '688256.SH', name: '寒武纪' },
  '海光信息': { code: '688041.SH', name: '海光信息' },
  '腾讯控股': { code: '00700.HK', name: '腾讯控股' },
  '阿里巴巴': { code: '09988.HK', name: '阿里巴巴-SW' },
  '美团': { code: '03690.HK', name: '美团-W' },
  '小米集团': { code: '01810.HK', name: '小米集团-W' },
  '新易盛': { code: '300502.SZ', name: '新易盛' },
  '天孚通信': { code: '300394.SZ', name: '天孚通信' },
  '绿的谐波': { code: '688017.SH', name: '绿的谐波' },
  '埃斯顿': { code: '002747.SZ', name: '埃斯顿' },
  '浪潮信息': { code: '000977.SZ', name: '浪潮信息' },
  '中科曙光': { code: '603019.SH', name: '中科曙光' },
  '招商南油': { code: '601975.SH', name: '招商南油' },
  '中国船舶': { code: '600150.SH', name: '中国船舶' },
};

// 行业关键词映射
const INDUSTRY_KEYWORDS: Record<string, string> = {
  'AI算力|光模块|服务器|芯片|算力|人工智能|大模型|GPU': 'AI算力',
  '机器人|人形机器人|自动化|伺服|减速器': '机器人',
  '创新药|医药|CXO|生物制药|医疗器械|疫苗': '创新药',
  '油运|航运|VLCC|油轮|成品油': '油运',
  '新能源|光伏|风电|储能|锂电池': '新能源',
  '消费|白酒|食品|饮料|茅台|五粮液': '消费',
  '银行|金融|券商|保险': '金融',
  '互联网|腾讯|阿里|美团|字节': '科技',
};

router.post('/research/analyze', (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.length < 10) {
      return res.status(400).json({ success: false, error: '请输入至少10字的研报内容' });
    }

    // 1. 提取涉及个股
    const stocks: { code: string; name: string; action: string; reason: string }[] = [];
    for (const [name, info] of Object.entries(STOCK_MAP)) {
      if (content.includes(name)) {
        // 提取操作建议
        let action = '关注';
        if (content.includes('买入') && content.includes(name)) action = '买入';
        else if (content.includes('增持') && content.includes(name)) action = '增持';
        else if (content.includes('减持') && content.includes(name)) action = '减持';
        else if (content.includes('卖出') && content.includes(name)) action = '卖出';
        else if (content.includes('持有') && content.includes(name)) action = '持有';

        // 提取原因
        const idx = content.indexOf(name);
        const snippet = content.substring(Math.max(0, idx - 30), Math.min(content.length, idx + 80));
        stocks.push({ code: info.code, name: info.name, action, reason: snippet.replace(/\n/g, ' ').trim() });
      }
    }

    // 2. 行业影响
    const industryUpdates: { industry: string; content: string }[] = [];
    for (const [keywords, industry] of Object.entries(INDUSTRY_KEYWORDS)) {
      const matched = keywords.split('|').some(kw => content.includes(kw));
      if (matched) {
        const summary = content.length > 200 ? content.substring(0, 200) + '...' : content;
        industryUpdates.push({ industry, content: `研报提及${industry}相关标的，${summary}` });
      }
    }

    // 3. 风险提示
    const riskWarnings: string[] = [];
    const riskPatterns = [
      { regex: /风险[：:]\s*([^。\n]+)/g, label: '' },
      { regex: /下行风险[：:]\s*([^。\n]+)/g, label: '下行风险：' },
      { regex: /需注意[：:]\s*([^。\n]+)/g, label: '需注意：' },
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

    // 4. 核心摘要
    const summary = content.length > 300
      ? content.substring(0, 300).replace(/\n/g, ' ').trim() + '...'
      : content.replace(/\n/g, ' ').trim();

    res.json({
      success: true,
      data: {
        summary,
        stocks,
        industryUpdates: industryUpdates.slice(0, 5),
        riskWarnings: riskWarnings.slice(0, 5),
      },
    });
  } catch (err) {
    console.error('[Research] Error:', err);
    res.status(500).json({ success: false, error: '分析失败' });
  }
});

export default router;
