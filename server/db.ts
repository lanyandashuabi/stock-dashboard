import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'dashboard.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    // 确保目录存在
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    -- 个股池
    CREATE TABLE IF NOT EXISTS stock_pool (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      market TEXT NOT NULL DEFAULT 'A',
      industry TEXT DEFAULT '',
      tags TEXT DEFAULT '',
      price REAL DEFAULT 0,
      change_percent REAL DEFAULT 0,
      is_custom INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 默认股票（预置）
    INSERT OR IGNORE INTO stock_pool (code, name, market, industry, is_custom) VALUES
      ('600519.SH', '贵州茅台', 'A', '消费', 0),
      ('000858.SZ', '五粮液', 'A', '消费', 0),
      ('300750.SZ', '宁德时代', 'A', 'AI算力', 0),
      ('002594.SZ', '比亚迪', 'A', '新能源', 0),
      ('601138.SH', '工业富联', 'A', 'AI算力', 0),
      ('300308.SZ', '中际旭创', 'A', 'AI算力', 0),
      ('300124.SZ', '汇川技术', 'A', '机器人', 0),
      ('002230.SZ', '科大讯飞', 'A', 'AI算力', 0),
      ('688981.SH', '中芯国际', 'A', 'AI算力', 0),
      ('603259.SH', '药明康德', 'A', '创新药', 0),
      ('300760.SZ', '迈瑞医疗', 'A', '创新药', 0),
      ('601872.SH', '招商轮船', 'A', '油运', 0),
      ('00700.HK', '腾讯控股', 'HK', '科技', 0),
      ('09988.HK', '阿里巴巴-SW', 'HK', '科技', 0),
      ('03690.HK', '美团-W', 'HK', '科技', 0),
      ('01810.HK', '小米集团-W', 'HK', '科技', 0);

    -- 观察清单
    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      note TEXT DEFAULT '',
      alert_price REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 设置
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- 默认设置
    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('refreshInterval', '30'),
      ('defaultMarket', 'A'),
      ('theme', 'dark');

    -- 宏观数据缓存（持久化最近一次成功获取的数据）
    CREATE TABLE IF NOT EXISTS macro_cache (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);
}

// ---- Stock Pool CRUD ----

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
  created_at: string;
  updated_at: string;
}

export function getAllStocks(): StockPoolItem[] {
  return getDb().prepare('SELECT * FROM stock_pool ORDER BY market, code').all() as StockPoolItem[];
}

export function addStock(stock: Omit<StockPoolItem, 'id' | 'created_at' | 'updated_at'>): StockPoolItem {
  const stmt = getDb().prepare(
    'INSERT INTO stock_pool (code, name, market, industry, tags, is_custom) VALUES (?, ?, ?, ?, ?, 1)'
  );
  const result = stmt.run(stock.code, stock.name, stock.market, stock.industry, stock.tags);
  return getDb()
    .prepare('SELECT * FROM stock_pool WHERE id = ?')
    .get(result.lastInsertRowid) as StockPoolItem;
}

export function deleteStock(id: number): boolean {
  // 只允许删除自定义股票
  const result = getDb()
    .prepare('DELETE FROM stock_pool WHERE id = ? AND is_custom = 1')
    .run(id);
  return result.changes > 0;
}

// ---- Settings ----

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value || null;
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    .run(key, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

// ---- Macro Cache ----

export function getMacroCache(key: string): string | null {
  const row = getDb()
    .prepare('SELECT data FROM macro_cache WHERE key = ?')
    .get(key) as { data: string } | undefined;
  return row?.data || null;
}

export function setMacroCache(key: string, data: string): void {
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO macro_cache (key, data, updated_at) VALUES (?, ?, datetime('now', 'localtime'))"
    )
    .run(key, data);
}
