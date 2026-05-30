import { Request, Response } from 'express';
import { budgetService } from '../services/budgetService';
import { Transaction, TransactionType } from '../types';

export class TransactionController {
  public async getAllTransactions(req: Request, res: Response) {
    try {
      const transactions = await budgetService.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: '获取交易记录失败' });
    }
  }

  public async getTransactionsByType(req: Request, res: Response) {
    try {
      const type = req.params.type as TransactionType;
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ error: '无效的交易类型' });
      }
      const transactions = await budgetService.getTransactionsByType(type);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: '获取交易记录失败' });
    }
  }

  public async getTransactionById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '无效的ID' });
      }
      const transaction = await budgetService.getTransactionById(id);
      if (!transaction) {
        return res.status(404).json({ error: '交易记录不存在' });
      }
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: '获取交易记录失败' });
    }
  }

  public async addTransaction(req: Request, res: Response) {
    try {
      console.log('接收到的请求体:', req.body);
      const { type, category, amount, capitalBalance, investmentBalance, description, date, depositAccountId } = req.body;
      
      if (!type || !category || amount === undefined || depositAccountId === undefined || isNaN(depositAccountId)) {
        console.log('缺少必要字段:', { type, category, amount, depositAccountId });
        return res.status(400).json({ error: '缺少必要字段' });
      }
      
      if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ error: '无效的交易类型' });
      }
      
      if (typeof amount !== 'number' || amount <= 0) {
        console.log('金额验证失败:', { amount, type: typeof amount });
        return res.status(400).json({ error: '金额必须为正数' });
      }

      const transaction: Omit<Transaction, 'id' | 'createdAt'> = {
        type,
        category,
        amount,
        capitalBalance,
        investmentBalance,
        description: description || '',
        date: date || new Date().toISOString().split('T')[0],
        depositAccountId
      };

      console.log('准备添加交易:', transaction);
      const newTransaction = await budgetService.addTransaction(transaction);
      res.status(201).json(newTransaction);
    } catch (error) {
      console.error('添加交易失败:', error);
      res.status(500).json({ error: '添加交易记录失败: ' + (error as Error).message });
    }
  }

  public async updateTransaction(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      console.log('收到 PUT 请求，ID:', id);
      console.log('请求体:', req.body);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: '无效的ID' });
      }

      const { type, category, amount, capitalBalance, investmentBalance, description, date, depositAccountId } = req.body;
      
      if (type && type !== 'income' && type !== 'expense') {
        return res.status(400).json({ error: '无效的交易类型' });
      }
      
      if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
        return res.status(400).json({ error: '金额必须为正数' });
      }

      const updateData: Partial<Omit<Transaction, 'id' | 'createdAt'>> = {};
      if (type) updateData.type = type;
      if (category) updateData.category = category;
      if (amount !== undefined) updateData.amount = amount;
      if (capitalBalance !== undefined) updateData.capitalBalance = capitalBalance;
      if (investmentBalance !== undefined) updateData.investmentBalance = investmentBalance;
      if (description !== undefined) updateData.description = description;
      if (date) updateData.date = date;
      if (depositAccountId !== undefined) updateData.depositAccountId = depositAccountId;

      const success = await budgetService.updateTransaction(id, updateData);
      if (!success) {
        return res.status(404).json({ error: '交易记录不存在' });
      }
      res.json({ message: '更新成功' });
    } catch (error) {
      res.status(500).json({ error: '更新交易记录失败' });
    }
  }

  public async deleteTransaction(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: '无效的ID' });
      }

      const success = await budgetService.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ error: '交易记录不存在' });
      }
      res.json({ message: '删除成功' });
    } catch (error) {
      res.status(500).json({ error: '删除交易记录失败' });
    }
  }
}

export const transactionController = new TransactionController();