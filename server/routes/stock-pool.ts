import { Router, Request, Response } from 'express';
import { getAllStocks, addStock, deleteStock } from '../db';
import { formatDisplayCode, getMarket } from '../utils/code-utils';

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
    const { code, name, industry = '', tags = '' } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, error: '股票代码和名称不能为空' });
    }

    // 代码格式校验
    const codeRegex = /^\d{5,6}\.(SH|SZ|BJ|HK)$/i;
    if (!codeRegex.test(code)) {
      return res.status(400).json({
        success: false,
        error: '代码格式错误，示例：600519.SH / 00700.HK',
      });
    }

    const market = getMarket(code);
    const formattedCode = formatDisplayCode(code);

    const stock = addStock({
      code: formattedCode,
      name,
      market,
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
