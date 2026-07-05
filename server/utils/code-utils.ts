/**
 * 股票代码转换工具
 * 支持 A股、港股代码在不同数据源之间的格式转换
 */

// A股 → 新浪代码
export function toSinaCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^0-9A-Z]/g, '');

  // 如果已经是 sina 格式（如 sh600519），直接返回小写
  if (/^(SH|SZ|BJ)\d{6}$/.test(clean)) {
    return clean.toLowerCase();
  }

  // 600519.SH 格式
  const match = clean.match(/^(\d{6})\.?(SH|SZ|BJ)$/);
  if (match) {
    return `${match[2].toLowerCase()}${match[1]}`;
  }

  // 纯数字，根据首位判断
  if (/^\d{6}$/.test(clean)) {
    if (clean.startsWith('6')) return `sh${clean}`;
    if (clean.startsWith('0') || clean.startsWith('3')) return `sz${clean}`;
    if (clean.startsWith('4') || clean.startsWith('8')) return `bj${clean}`;
    return `sz${clean}`;
  }

  // 港股 00700.HK → r_hk00700 (新浪港股代码)
  const hkMatch = clean.match(/^(\d{5})\.?(HK)$/);
  if (hkMatch) {
    return `rt_hk${hkMatch[1]}`;
  }

  return clean.toLowerCase();
}

// 获取东方财富代码格式
export function toEastMoneyCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^0-9A-Z]/g, '');

  const match = clean.match(/^(\d{6})\.?(SH|SZ|BJ)$/);
  if (match) {
    if (match[2] === 'SH') return `1.${match[1]}`;
    if (match[2] === 'SZ') return `0.${match[1]}`;
    if (match[2] === 'BJ') return `0.${match[1]}`;
  }

  // 纯数字
  if (/^\d{6}$/.test(clean)) {
    if (clean.startsWith('6')) return `1.${clean}`;
    return `0.${clean}`;
  }

  // 港股
  const hkMatch = clean.match(/^(\d{5})\.?(HK)$/);
  if (hkMatch) return `116.${hkMatch[1]}`;

  return `1.${clean}`;
}

// 判断市场
export function getMarket(code: string): 'sh' | 'sz' | 'bj' | 'hk' | 'unknown' {
  const clean = code.toUpperCase().replace(/[^0-9A-Z]/g, '');

  if (clean.includes('HK')) return 'hk';

  const num = clean.match(/\d{5,6}/)?.[0];
  if (!num) return 'unknown';

  if (clean.startsWith('6') && num.length === 6) return 'sh';
  if ((clean.startsWith('0') || clean.startsWith('3')) && num.length === 6) return 'sz';
  if ((clean.startsWith('4') || clean.startsWith('8')) && num.length === 6) return 'bj';

  if (num.startsWith('6')) return 'sh';
  return 'sz';
}

// 格式化展示代码
export function formatDisplayCode(code: string): string {
  const clean = code.toUpperCase().replace(/[^0-9A-Z]/g, '');
  const match = clean.match(/^(\d{5,6})\.?(SH|SZ|BJ|HK)$/);
  if (match) return `${match[1]}.${match[2]}`;

  if (/^\d{6}$/.test(clean)) {
    if (clean.startsWith('6')) return `${clean}.SH`;
    return `${clean}.SZ`;
  }

  if (/^\d{5}$/.test(clean)) return `${clean}.HK`;

  return code;
}
