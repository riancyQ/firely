import { Request, Response } from 'express';
import { budgetService } from '../services/budgetService';

export class SummaryController {
  public async getBalanceSummary(req: Request, res: Response) {
    try {
      const summary = await budgetService.getBalanceSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: '获取余额汇总失败' });
    }
  }

  public async getHealthStatus(req: Request, res: Response) {
    try {
      const health = await budgetService.getHealthStatus();
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: '获取健康状态失败' });
    }
  }

  public async getIncomeCategories(req: Request, res: Response) {
    try {
      const categories = await budgetService.getIncomeCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: '获取收入分类失败' });
    }
  }

  public async getExpenseCategories(req: Request, res: Response) {
    try {
      const categories = await budgetService.getExpenseCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: '获取支出分类失败' });
    }
  }

  public async getFireInfo(req: Request, res: Response) {
    try {
      const age = parseInt(req.query.age as string) || 30;
      const gender = (req.query.gender as string) === 'female' ? 'female' : 'male';
      const estimatedExpense = req.query.estimatedExpense ? parseFloat(req.query.estimatedExpense as string) : null;
      const investmentReturnRate = parseFloat(req.query.returnRate as string) || 0.035;
      const annualIncome = parseFloat(req.query.annualIncome as string) || 0;
      const fireInfo = await budgetService.getFireInfo(age, gender, estimatedExpense, investmentReturnRate, annualIncome);
      res.json(fireInfo);
    } catch (error) {
      res.status(500).json({ error: '获取FIRE信息失败' });
    }
  }
}

export const summaryController = new SummaryController();