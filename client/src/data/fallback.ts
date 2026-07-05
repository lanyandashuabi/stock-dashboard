/**
 * 静态回退数据（前端版）
 * 当 API 不可用时使用
 */

export const MACRO_FALLBACK = {
  indices: [
    { code: '000001.SH', name: '上证指数', price: 3350, change: 0, changePercent: 0 },
    { code: '399001.SZ', name: '深证成指', price: 10850, change: 0, changePercent: 0 },
    { code: '399006.SZ', name: '创业板指', price: 2150, change: 0, changePercent: 0 },
    { code: '000300.SH', name: '沪深300', price: 3900, change: 0, changePercent: 0 },
    { code: '000688.SH', name: '科创50', price: 980, change: 0, changePercent: 0 },
    { code: '000016.SH', name: '上证50', price: 2650, change: 0, changePercent: 0 },
    { code: '399005.SZ', name: '中小100', price: 6800, change: 0, changePercent: 0 },
  ],
  marketSentiment: {
    northBound: {
      label: '北向资金(已停发)',
      value: '--',
      note: '交易所2024年8月起已停止发布实时净流入数据',
    },
    totalAmount: { label: '两市成交额', value: '--', unit: '亿' },
  },
  economy: [
    { name: 'CPI(同比)', value: '0.3%', date: '2025年5月', source: '国家统计局', nextUpdate: '每月9-15日发布' },
    { name: 'PPI(同比)', value: '-2.5%', date: '2025年5月', source: '国家统计局', nextUpdate: '每月9-15日发布' },
    { name: 'PMI(制造业)', value: '50.5', date: '2025年6月', source: '国家统计局', nextUpdate: '每月最后一日发布' },
    { name: 'M2(同比)', value: '8.3%', date: '2025年5月', source: '中国人民银行', nextUpdate: '每月10-15日发布' },
    { name: '社融增量', value: '2.06万亿', date: '2025年5月', source: '中国人民银行', nextUpdate: '每月10-15日发布' },
    { name: 'GDP(同比)', value: '5.2%', date: '2025年Q2', source: '国家统计局', nextUpdate: '每季度发布' },
  ],
  monetary: [
    { name: '1年期LPR', value: '3.10%', date: '2025年6月', nextMeeting: '每月20日' },
    { name: '5年期LPR', value: '3.60%', date: '2025年6月', nextMeeting: '每月20日' },
    { name: '存款准备金率', value: '9.50%', date: '2025年6月', nextMeeting: '不定期' },
    { name: '7天逆回购利率', value: '1.50%', date: '2025年6月', nextMeeting: '每日操作' },
  ],
  global: [
    { name: '美联储利率', value: '4.25-4.50%', date: '2025年6月', nextMeeting: '7月FOMC' },
    { name: '美国10Y国债', value: '4.25%', date: '实时' },
    { name: '美元指数', value: '104.5', date: '实时' },
    { name: 'VIX恐慌指数', value: '16.8', date: '实时' },
    { name: 'COMEX黄金', value: '2350', date: '实时', unit: '美元/盎司' },
    { name: 'WTI原油', value: '78.5', date: '实时', unit: '美元/桶' },
    { name: 'USD/CNH', value: '7.25', date: '实时' },
  ],
};

export const FOCUS_ASSETS = [
  { code: '600519.SH', name: '贵州茅台', note: '消费龙头' },
  { code: '000858.SZ', name: '五粮液', note: '白酒' },
  { code: '300750.SZ', name: '宁德时代', note: '新能源电池' },
  { code: '00700.HK', name: '腾讯控股', note: '互联网' },
  { code: '09988.HK', name: '阿里巴巴', note: '电商云' },
];
