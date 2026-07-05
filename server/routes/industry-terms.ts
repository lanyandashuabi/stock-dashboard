import { Router, Request, Response } from 'express';
import { getAllIndustryTerms, addIndustryTerm, updateIndustryTerm, deleteIndustryTerm } from '../db';

const router = Router();

// 获取所有行业词条
router.get('/industry-terms', (_req: Request, res: Response) => {
  try {
    const terms = getAllIndustryTerms();
    res.json({ success: true, data: terms });
  } catch (err) {
    console.error('[IndustryTerms] Error:', err);
    res.status(500).json({ success: false, error: '获取行业词条失败' });
  }
});

// 新增行业词条
router.post('/industry-terms', (req: Request, res: Response) => {
  try {
    const { name, keywords, parent_industry } = req.body;
    if (!name || !keywords) {
      return res.status(400).json({ success: false, error: '名称和关键词不能为空' });
    }

    const term = addIndustryTerm({ name: name.trim(), keywords: keywords.trim(), parent_industry: parent_industry || '' });
    res.json({ success: true, data: term });
  } catch (err: any) {
    if (err?.message?.includes('UNIQUE')) {
      return res.status(400).json({ success: false, error: '该行业词条已存在' });
    }
    console.error('[IndustryTerms] Add error:', err);
    res.status(500).json({ success: false, error: '添加行业词条失败' });
  }
});

// 编辑行业词条
router.put('/industry-terms/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: '无效的ID' });
    }

    const { name, keywords, parent_industry } = req.body;
    const updated = updateIndustryTerm(id, { name, keywords, parent_industry });
    if (!updated) {
      return res.status(400).json({ success: false, error: '词条不存在' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[IndustryTerms] Update error:', err);
    res.status(500).json({ success: false, error: '更新行业词条失败' });
  }
});

// 删除行业词条
router.delete('/industry-terms/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: '无效的ID' });
    }

    const deleted = deleteIndustryTerm(id);
    if (!deleted) {
      return res.status(400).json({ success: false, error: '词条不存在' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[IndustryTerms] Delete error:', err);
    res.status(500).json({ success: false, error: '删除行业词条失败' });
  }
});

export default router;
