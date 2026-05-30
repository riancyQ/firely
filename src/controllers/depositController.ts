import { Request, Response } from 'express';
import { budgetService } from '../services/budgetService';
import { DepositAccount, DEPOSIT_ACCOUNTS } from '../types';

export class DepositController {
  public async getAllAccounts(req: Request, res: Response) {
    try {
      const accounts = await budgetService.getAllDepositAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ error: '获取资金存放池失败' });
    }
  }

  public async getAccountById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const account = await budgetService.getDepositAccountById(id);
      if (account) {
        res.json(account);
      } else {
        res.status(404).json({ error: '账户不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: '获取账户失败' });
    }
  }

  public async addAccount(req: Request, res: Response) {
    try {
      const { name, type, repaymentDay } = req.body;
      
      const exists = await budgetService.getAllDepositAccounts();
      const isDuplicate = exists.some(a => a.name === name);
      if (isDuplicate) {
        return res.status(400).json({ error: '该账户已存在' });
      }

      const account = await budgetService.addDepositAccount({
        name,
        type,
        repaymentDay: type === 'bank' ? repaymentDay : undefined
      });
      res.status(201).json(account);
    } catch (error) {
      res.status(500).json({ error: '添加账户失败' });
    }
  }

  public async updateAccount(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { repaymentDay } = req.body;
      
      const success = await budgetService.updateDepositAccount(id, { repaymentDay });
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: '账户不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: '更新账户失败' });
    }
  }

  public async deleteAccount(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const success = await budgetService.deleteDepositAccount(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: '账户不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: '删除账户失败' });
    }
  }

  public async getAvailableAccounts(req: Request, res: Response) {
    try {
      const existing = await budgetService.getAllDepositAccounts();
      const existingNames = existing.map(a => a.name);
      const available = DEPOSIT_ACCOUNTS.filter(a => !existingNames.includes(a.name));
      res.json(available);
    } catch (error) {
      res.status(500).json({ error: '获取可用账户失败' });
    }
  }
}

export const depositController = new DepositController();