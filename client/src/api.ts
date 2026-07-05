/**
 * 前端 API 调用工具
 * 带超时 + 重试 + 统一错误处理
 */

const BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${BASE}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }

    return await res.json();
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, error: '请求超时' };
    }
    return { success: false, error: '网络异常' };
  } finally {
    clearTimeout(timer);
  }
}

// 带重试的请求
async function requestWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<ApiResponse<T>> {
  let lastResult: ApiResponse<T> = { success: false, error: '' };

  for (let i = 0; i <= retries; i++) {
    lastResult = await request<T>(url, options);
    if (lastResult.success) return lastResult;
    if (i < retries) {
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }

  return lastResult;
}

// ---- API 方法 ----

export interface MacroData {
  indices: IndexItem[];
  marketSentiment: {
    northBound: { label: string; value: string; note: string };
    totalAmount: { label: string; value: string; unit: string };
  };
  economy: EconomyItem[];
  monetary: MonetaryItem[];
  global: GlobalItem[];
  marketStatus: {
    status: string;
    label: string;
    isTradingDay: boolean;
  };
  updatedAt: string;
  _fallback?: boolean;
}

export interface IndexItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
}

export interface EconomyItem {
  name: string;
  value: string;
  date: string;
  source: string;
  nextUpdate: string;
}

export interface MonetaryItem {
  name: string;
  value: string;
  date: string;
  nextMeeting: string;
}

export interface GlobalItem {
  name: string;
  value: string;
  date: string;
  unit?: string;
  nextMeeting?: string;
}

export interface KlineResponse {
  code: string;
  name: string;
  market: string;
  klines: KlineItem[];
}

export interface KlineItem {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
  changePercent: number;
  turnoverRate: number;
}

export interface StockPoolItem {
  id: number;
  code: string;
  name: string;
  market: string;
  industry: string;
  tags: string;
  price: number;
  change_percent: number;
  is_custom: number;
}

export async function fetchMacro(): Promise<ApiResponse<MacroData>> {
  return requestWithRetry<MacroData>('/macro');
}

export async function fetchKline(
  code: string,
  period = 'day'
): Promise<ApiResponse<KlineResponse>> {
  return requestWithRetry<KlineResponse>(
    `/kline?code=${encodeURIComponent(code)}&period=${period}`
  );
}

export async function fetchRealtime(
  codes: string[]
): Promise<ApiResponse<Record<string, any>>> {
  return requestWithRetry<Record<string, any>>(
    `/realtime?codes=${codes.map(encodeURIComponent).join(',')}`
  );
}

export async function fetchStockPool(): Promise<ApiResponse<StockPoolItem[]>> {
  return requestWithRetry<StockPoolItem[]>('/stock-pool');
}

export async function addStockPoolItem(stock: {
  code: string;
  name: string;
  industry: string;
  tags: string;
}): Promise<ApiResponse<StockPoolItem>> {
  return request<StockPoolItem>('/stock-pool', {
    method: 'POST',
    body: JSON.stringify(stock),
  });
}

export async function deleteStockPoolItem(
  id: number
): Promise<ApiResponse<void>> {
  return request<void>(`/stock-pool/${id}`, { method: 'DELETE' });
}

// ---- 股票搜索 ----

export interface StockSearchResult {
  code: string;
  name: string;
  market: string;
}

export async function searchStock(
  keyword: string
): Promise<ApiResponse<StockSearchResult[]>> {
  return request<StockSearchResult[]>(
    `/stock-search?keyword=${encodeURIComponent(keyword)}`
  );
}

// ---- 行业词条 ----

export interface IndustryTermItem {
  id: number;
  name: string;
  keywords: string;
  parent_industry: string;
  created_at: string;
  updated_at: string;
}

export async function fetchIndustryTerms(): Promise<ApiResponse<IndustryTermItem[]>> {
  return request<IndustryTermItem[]>('/industry-terms');
}

export async function addIndustryTerm(term: {
  name: string;
  keywords: string;
  parent_industry?: string;
}): Promise<ApiResponse<IndustryTermItem>> {
  return request<IndustryTermItem>('/industry-terms', {
    method: 'POST',
    body: JSON.stringify(term),
  });
}

export async function updateIndustryTerm(
  id: number,
  term: { name?: string; keywords?: string; parent_industry?: string }
): Promise<ApiResponse<void>> {
  return request<void>(`/industry-terms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(term),
  });
}

export async function deleteIndustryTerm(
  id: number
): Promise<ApiResponse<void>> {
  return request<void>(`/industry-terms/${id}`, { method: 'DELETE' });
}
