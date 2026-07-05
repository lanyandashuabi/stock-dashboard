/**
 * 行业分析页静态数据
 * 包含 AI算力、机器人、创新药、油运 四大行业的产业链和龙头数据
 */

export interface IndustryData {
  key: string;
  name: string;
  icon: string;
  drivers: string[];
  catalysts: string[];
  risks: string[];
  chain: {
    upstream: { name: string; description: string }[];
    midstream: { name: string; description: string }[];
    downstream: { name: string; description: string }[];
  };
  segments: {
    name: string;
    leaders: { code: string; name: string }[];
  }[];
}

export const industries: IndustryData[] = [
  {
    key: 'ai-computing',
    name: 'AI 算力',
    icon: '🧠',
    drivers: [
      '大模型训练需求爆发，算力需求年增 200%+',
      '国产替代加速，华为昇腾/寒武纪生态完善',
      '政策支持：东数西算、数字经济',
    ],
    catalysts: [
      '英伟达 H200/B100 芯片迭代',
      '国内大厂资本开支指引（阿里/腾讯/字节）',
      '光模块 1.6T 升级周期',
    ],
    risks: [
      '美国芯片出口管制升级风险',
      '算力租赁价格下行压力',
      'AI 应用落地不及预期',
    ],
    chain: {
      upstream: [
        { name: '芯片设计', description: '寒武纪、海光信息等 AI 芯片设计公司' },
        { name: '晶圆制造', description: '中芯国际、华虹半导体代工' },
        { name: '光模块/光芯片', description: '中际旭创、天孚通信、源杰科技' },
      ],
      midstream: [
        { name: '服务器', description: '工业富联、浪潮信息、中科曙光' },
        { name: '算力租赁', description: '润泽科技、光环新网、数据港' },
        { name: '交换机/网络', description: '锐捷网络、菲菱科思' },
      ],
      downstream: [
        { name: '大模型应用', description: '科大讯飞、商汤、百度' },
        { name: '行业应用', description: '金融、医疗、自动驾驶等垂直场景' },
      ],
    },
    segments: [
      {
        name: '光模块',
        leaders: [
          { code: '300308.SZ', name: '中际旭创' },
          { code: '300502.SZ', name: '新易盛' },
          { code: '300394.SZ', name: '天孚通信' },
        ],
      },
      {
        name: 'AI 芯片',
        leaders: [
          { code: '688256.SH', name: '寒武纪' },
          { code: '688041.SH', name: '海光信息' },
        ],
      },
      {
        name: '服务器',
        leaders: [
          { code: '601138.SH', name: '工业富联' },
          { code: '000977.SZ', name: '浪潮信息' },
          { code: '603019.SH', name: '中科曙光' },
        ],
      },
    ],
  },
  {
    key: 'robot',
    name: '机器人',
    icon: '🤖',
    drivers: [
      '特斯拉 Optimus 量产预期（2025-2026）',
      '人形机器人产业链从 0 到 1',
      '政策推动：工信部机器人+应用行动',
    ],
    catalysts: [
      '特斯拉 AI Day 机器人更新',
      '国内厂商量产定点公告',
      'Figure AI / 1X 等海外公司融资动态',
    ],
    risks: [
      '人形机器人商业化进度不及预期',
      '核心零部件国产化率低',
      '行业竞争加剧，估值偏高',
    ],
    chain: {
      upstream: [
        { name: '减速器', description: '绿的谐波、双环传动、中大力德' },
        { name: '伺服电机', description: '汇川技术、禾川科技、步科股份' },
        { name: '传感器', description: '奥比中光、汉威科技、柯力传感' },
      ],
      midstream: [
        { name: '本体制造', description: '埃斯顿、新松机器人、拓斯达' },
        { name: '灵巧手', description: '鸣志电器、江苏雷利' },
      ],
      downstream: [
        { name: '系统集成', description: '汽车制造、3C、物流仓储等' },
        { name: '人形机器人', description: '特斯拉、优必选、宇树科技' },
      ],
    },
    segments: [
      {
        name: '减速器',
        leaders: [
          { code: '688017.SH', name: '绿的谐波' },
          { code: '002472.SZ', name: '双环传动' },
        ],
      },
      {
        name: '伺服/控制',
        leaders: [
          { code: '300124.SZ', name: '汇川技术' },
          { code: '688320.SH', name: '禾川科技' },
        ],
      },
      {
        name: '本体',
        leaders: [
          { code: '002747.SZ', name: '埃斯顿' },
          { code: '300024.SZ', name: '机器人' },
        ],
      },
    ],
  },
  {
    key: 'innovative-drug',
    name: '创新药',
    icon: '💊',
    drivers: [
      '全球医药创新周期上行，FDA 审批加速',
      '中国创新药出海（License-out）大爆发',
      'GLP-1 减肥药超级周期',
    ],
    catalysts: [
      '重磅药物临床数据读出（ASCO/ESMO 等）',
      '海外授权（License-out）交易公告',
      '医保谈判/集采政策边际放松',
    ],
    risks: [
      '临床试验失败风险',
      '医保控费/集采降价压力',
      '地缘政治影响出海（生物安全法案）',
    ],
    chain: {
      upstream: [
        { name: 'CXO/研发服务', description: '药明康德、康龙化成、泰格医药' },
        { name: '原料药/试剂', description: '凯莱英、博腾股份' },
      ],
      midstream: [
        { name: '创新药企', description: '百济神州、信达生物、康方生物' },
        { name: '生物类似药', description: '复宏汉霖、君实生物' },
      ],
      downstream: [
        { name: '医疗机构', description: '三甲医院、专科医院' },
        { name: '零售药店', description: '老百姓、大参林、益丰药房' },
      ],
    },
    segments: [
      {
        name: 'CXO',
        leaders: [
          { code: '603259.SH', name: '药明康德' },
          { code: '300759.SZ', name: '康龙化成' },
          { code: '300347.SZ', name: '泰格医药' },
        ],
      },
      {
        name: '创新药',
        leaders: [
          { code: '688235.SH', name: '百济神州' },
          { code: '01801.HK', name: '信达生物' },
        ],
      },
      {
        name: '器械',
        leaders: [
          { code: '300760.SZ', name: '迈瑞医疗' },
          { code: '688271.SH', name: '联影医疗' },
        ],
      },
    ],
  },
  {
    key: 'oil-shipping',
    name: '油运',
    icon: '🚢',
    drivers: [
      '全球油运供需紧平衡，运价中枢上移',
      '红海绕行持续，吨海里需求增加',
      '油轮老龄化，新船订单处于历史低位',
    ],
    catalysts: [
      'OPEC+ 产量政策变化',
      'VLCC 运价指数（WS）波动',
      '地缘事件（红海/中东局势）',
    ],
    risks: [
      '全球经济衰退导致原油需求下滑',
      '地缘冲突缓解，绕行结束',
      '新船交付加速',
    ],
    chain: {
      upstream: [
        { name: '造船', description: '中国船舶、中船防务' },
        { name: '船用燃料', description: '低硫燃油/绿色甲醇供应商' },
      ],
      midstream: [
        { name: 'VLCC 超大型油轮', description: '中远海能、招商轮船' },
        { name: '成品油轮', description: '招商南油' },
      ],
      downstream: [
        { name: '炼化企业', description: '中石化、恒力石化' },
        { name: '贸易商', description: '托克、维多等国际油贸商' },
      ],
    },
    segments: [
      {
        name: 'VLCC 油轮',
        leaders: [
          { code: '600026.SH', name: '中远海能' },
          { code: '601872.SH', name: '招商轮船' },
        ],
      },
      {
        name: '成品油轮',
        leaders: [
          { code: '601975.SH', name: '招商南油' },
        ],
      },
      {
        name: '造船',
        leaders: [
          { code: '600150.SH', name: '中国船舶' },
        ],
      },
    ],
  },
];

export function getIndustry(key: string): IndustryData | undefined {
  return industries.find((i) => i.key === key);
}
