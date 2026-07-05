import iconv from 'iconv-lite';

/**
 * GBK 编码解码工具
 * 新浪财经接口使用 GBK 编码
 */
export function decodeGBK(buffer: Buffer): string {
  return iconv.decode(buffer, 'gbk');
}

export function encodeGBK(text: string): Buffer {
  return iconv.encode(text, 'gbk');
}

/**
 * HTTP 请求工具（带超时和重试）
 */
export async function fetchWithTimeout(
  url: string,
  options: {
    timeout?: number;
    encoding?: 'utf-8' | 'gbk';
    headers?: Record<string, string>;
  } = {}
): Promise<string> {
  const { timeout = 10000, encoding = 'utf-8' } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://finance.sina.com.cn/',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (encoding === 'gbk') {
      return decodeGBK(buffer);
    }

    return buffer.toString('utf-8');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 带重试的请求
 */
export async function fetchWithRetry(
  url: string,
  options: {
    timeout?: number;
    encoding?: 'utf-8' | 'gbk';
    retries?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<string> {
  const { retries = 2, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fetchWithTimeout(url, fetchOptions);
    } catch (err) {
      lastError = err as Error;
      if (i < retries) {
        // 指数退避：1s, 2s
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}
