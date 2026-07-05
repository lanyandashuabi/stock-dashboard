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

    -- 行业词条（用于研报分析时匹配行业）
    CREATE TABLE IF NOT EXISTS industry_terms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      keywords TEXT NOT NULL DEFAULT '',
      parent_industry TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 默认行业词条
    INSERT OR IGNORE INTO industry_terms (name, keywords, parent_industry) VALUES
      ('AI算力', 'AI算力,光模块,服务器,芯片,算力,人工智能,大模型,GPU,HBM,液冷,数据中心', ''),
      ('机器人', '机器人,人形机器人,自动化,伺服,减速器,灵巧手,电机,传感器,Optimus', ''),
      ('创新药', '创新药,医药,CXO,生物制药,医疗器械,疫苗,GLP-1,减肥药', ''),
      ('油运', '油运,航运,VLCC,油轮,成品油,造船', ''),
      ('新能源', '新能源,光伏,风电,储能,锂电池,电动车,充电桩', ''),
      ('消费', '消费,白酒,食品,饮料,调味品,乳制品,茅台,五粮液,大众品,餐饮', ''),
      ('金融', '银行,券商,保险,信托,金融科技', ''),
      ('科技', '互联网,腾讯,阿里,美团,字节,软件,SaaS', ''),
      ('汽车零部件', '汽车零部件,零部件,一体化压铸,热管理,底盘,内外饰,汽车电子', ''),
      ('半导体', '半导体,芯片设计,晶圆,封测,EDA,光刻,存储', ''),
      ('电力设备', '电力设备,电网,特高压,变压器,开关,电缆', ''),
      ('房地产', '房地产,地产,开发,物业,建材,家居', ''),
      ('煤炭', '煤炭,煤化工,焦煤,动力煤', ''),
      ('有色', '有色金属,铜,铝,黄金,稀土,锂矿', ''),
      ('军工', '军工,国防,航空,航天,导弹,雷达', ''),
      ('通信', '通信,5G,6G,卫星,光纤,基站', ''),
      ('计算机', '计算机,软件,信创,国产替代,政务', ''),
      ('传媒', '传媒,游戏,影视,广告,出版', ''),
      ('农业', '农业,种业,养殖,饲料,农药,化肥', ''),
      ('化工', '化工,石化,精细化工,新材料,MDI', ''),
      ('钢铁', '钢铁,螺纹钢,热卷,铁矿石', ''),
      ('建筑', '建筑,基建,一带一路,水利,市政', ''),
      ('交通运输', '交通运输,物流,快递,机场,港口,高速', ''),
      ('公用事业', '公用事业,电力,水务,燃气,环保', ''),
      ('轻工', '轻工,造纸,包装,家具,文具', ''),
      ('纺织服装', '纺织,服装,家纺,运动,品牌', ''),
      ('商贸零售', '零售,电商,超市,百货,免税', ''),
      ('社会服务', '社会服务,旅游,酒店,餐饮,教育,人力资源', ''),
      ('美容护理', '美容,化妆品,医美,个护', ''),
      ('机械设备', '机械设备,工程机械,自动化,激光,刀具,机床', ''),
      ('电子', '电子,PCB,面板,LED,被动元件,连接器', ''),
      ('燃发柴发', '燃发,柴发,潍柴,发电,柴油发电机', '');
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

// ---- Industry Terms CRUD ----

export interface IndustryTerm {
  id: number;
  name: string;
  keywords: string;
  parent_industry: string;
  created_at: string;
  updated_at: string;
}

export function getAllIndustryTerms(): IndustryTerm[] {
  return getDb()
    .prepare('SELECT * FROM industry_terms ORDER BY name')
    .all() as IndustryTerm[];
}

export function addIndustryTerm(term: { name: string; keywords: string; parent_industry?: string }): IndustryTerm {
  const stmt = getDb().prepare(
    'INSERT INTO industry_terms (name, keywords, parent_industry) VALUES (?, ?, ?)'
  );
  const result = stmt.run(term.name, term.keywords, term.parent_industry || '');
  return getDb()
    .prepare('SELECT * FROM industry_terms WHERE id = ?')
    .get(result.lastInsertRowid) as IndustryTerm;
}

export function updateIndustryTerm(id: number, term: { name?: string; keywords?: string; parent_industry?: string }): boolean {
  const fields: string[] = [];
  const values: any[] = [];

  if (term.name !== undefined) { fields.push('name = ?'); values.push(term.name); }
  if (term.keywords !== undefined) { fields.push('keywords = ?'); values.push(term.keywords); }
  if (term.parent_industry !== undefined) { fields.push('parent_industry = ?'); values.push(term.parent_industry); }

  if (fields.length === 0) return false;

  fields.push("updated_at = datetime('now', 'localtime')");
  values.push(id);

  const result = getDb()
    .prepare(`UPDATE industry_terms SET ${fields.join(', ')} WHERE id = ?`)
    .run(...values);
  return result.changes > 0;
}

export function deleteIndustryTerm(id: number): boolean {
  const result = getDb().prepare('DELETE FROM industry_terms WHERE id = ?').run(id);
  return result.changes > 0;
}
