import { Router, Request, Response } from 'express';
import { getAllStocks, addStock, deleteStock } from '../db';
import { formatDisplayCode, getMarket, normalizeCode } from '../utils/code-utils';

const router = Router();

// 获取所有个股
router.get('/stock-pool', (_req: Request, res: Response) => {
  try {
    const stocks = getAllStocks();
    res.json({ success: true, data: stocks });
  } catch (err) {
    console.error('[StockPool] Error:', err);
    res.status(500).json({ success: false, error: '获取个股池失败' });
  }
});

// 添加个股
router.post('/stock-pool', (req: Request, res: Response) => {
  try {
    const { code: rawCode, name, industry = '', tags = '' } = req.body;

    if (!rawCode || !name) {
      return res.status(400).json({ success: false, error: '股票代码和名称不能为空' });
    }

    // 使用 normalizeCode 标准化输入
    const normalized = normalizeCode(rawCode);
    if (!normalized) {
      return res.status(400).json({
        success: false,
        error: '无法识别代码格式，支持：600519 / 600519.SH / sh600519 / 00700.HK 等',
      });
    }

    const market = getMarket(normalized);
    const formattedCode = formatDisplayCode(normalized);

    const stock = addStock({
      code: formattedCode,
      name: name.trim(),
      market: market === 'hk' ? 'HK' : 'A',
      industry,
      tags,
      price: 0,
      change_percent: 0,
      is_custom: 1,
    });

    res.json({ success: true, data: stock });
  } catch (err: any) {
    if (err?.message?.includes('UNIQUE')) {
      return res.status(400).json({ success: false, error: '该股票已存在' });
    }
    console.error('[StockPool] Add error:', err);
    res.status(500).json({ success: false, error: '添加个股失败' });
  }
});

// 删除个股
router.delete('/stock-pool/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: '无效的ID' });
    }

    const deleted = deleteStock(id);
    if (!deleted) {
      return res.status(400).json({
        success: false,
        error: '删除失败：股票不存在或为预置股票不可删除',
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[StockPool] Delete error:', err);
    res.status(500).json({ success: false, error: '删除个股失败' });
  }
});

export default router;
