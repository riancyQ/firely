import sqlite3 from 'sqlite3';
import path from 'path';
import { Transaction, DepositAccount } from '../types';

const dbPath = path.resolve(__dirname, '../../data/budget.db');

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('数据库连接失败:', err.message);
      } else {
        this.init();
      }
    });
  }

  private init(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS deposit_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        repaymentDay INTEGER,
        createdAt TEXT NOT NULL
      )
    `);
    
    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        capitalBalance REAL,
        investmentBalance REAL,
        description TEXT,
        date TEXT NOT NULL,
        depositAccountId INTEGER,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (depositAccountId) REFERENCES deposit_accounts(id)
      )
    `);

    // 检查表是否存在，如果存在则尝试添加新列
    this.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'", (err, row) => {
      if (err) {
        console.error('检查表失败:', err.message);
        return;
      }
      
      // 只有表已存在时才尝试添加列（用于迁移旧数据库）
      if (row) {
        this.db.run('ALTER TABLE transactions ADD COLUMN capitalBalance REAL', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.warn('添加列失败:', err.message);
          }
        });
        
        this.db.run('ALTER TABLE transactions ADD COLUMN investmentBalance REAL', (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            console.warn('添加列失败:', err.message);
          }
        });
      }
    });
  }

  public async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const createdAt = new Date().toISOString();
      this.db.run(
        'INSERT INTO transactions (type, category, amount, capitalBalance, investmentBalance, description, date, depositAccountId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          transaction.type, 
          transaction.category, 
          transaction.amount,
          transaction.capitalBalance || transaction.amount,
          transaction.investmentBalance || 0,
          transaction.description, 
          transaction.date, 
          transaction.depositAccountId, 
          createdAt
        ],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  public async getAllTransactions(): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM transactions ORDER BY date DESC, createdAt DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Transaction[]);
      });
    });
  }

  public async getTransactionsByType(type: 'income' | 'expense'): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM transactions WHERE type = ? ORDER BY date DESC', [type], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Transaction[]);
      });
    });
  }

  public async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC',
        [startDate, endDate],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Transaction[]);
        }
      );
    });
  }

  public async getTransactionById(id: number): Promise<Transaction | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Transaction || null);
      });
    });
  }

  public async updateTransaction(id: number, transaction: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const params: (string | number)[] = [];

      if (transaction.type) {
        updates.push('type = ?');
        params.push(transaction.type);
      }
      if (transaction.category) {
        updates.push('category = ?');
        params.push(transaction.category);
      }
      if (transaction.amount !== undefined) {
        updates.push('amount = ?');
        params.push(transaction.amount);
      }
      if (transaction.capitalBalance !== undefined) {
        updates.push('capitalBalance = ?');
        params.push(transaction.capitalBalance);
      }
      if (transaction.investmentBalance !== undefined) {
        updates.push('investmentBalance = ?');
        params.push(transaction.investmentBalance);
      }
      if (transaction.description) {
        updates.push('description = ?');
        params.push(transaction.description);
      }
      if (transaction.date) {
        updates.push('date = ?');
        params.push(transaction.date);
      }
      if (transaction.depositAccountId !== undefined) {
        updates.push('depositAccountId = ?');
        params.push(transaction.depositAccountId);
      }

      if (updates.length === 0) {
        resolve(true);
        return;
      }

      params.push(id);

      this.db.run(
        `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  public async deleteTransaction(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  public async getSummary(): Promise<{ totalIncome: number; totalExpense: number }> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT type, SUM(amount) as total FROM transactions GROUP BY type',
        (err, rows) => {
          if (err) reject(err);
          else {
            const result = { totalIncome: 0, totalExpense: 0 };
            (rows as { type: string; total: number }[]).forEach((row) => {
              if (row.type === 'income') {
                result.totalIncome = row.total;
              } else if (row.type === 'expense') {
                result.totalExpense = row.total;
              }
            });
            resolve(result);
          }
        }
      );
    });
  }

  public async getCategorySummary(type: 'income' | 'expense'): Promise<{ category: string; amount: number }[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT category, SUM(amount) as amount FROM transactions WHERE type = ? GROUP BY category',
        [type],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as { category: string; amount: number }[]);
        }
      );
    });
  }

  public async addDepositAccount(account: Omit<DepositAccount, 'id' | 'createdAt'>): Promise<number> {
    return new Promise((resolve, reject) => {
      const createdAt = new Date().toISOString();
      this.db.run(
        'INSERT INTO deposit_accounts (name, type, repaymentDay, createdAt) VALUES (?, ?, ?, ?)',
        [account.name, account.type, account.repaymentDay, createdAt],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  public async getAllDepositAccounts(): Promise<DepositAccount[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM deposit_accounts ORDER BY createdAt DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as DepositAccount[]);
      });
    });
  }

  public async getDepositAccountById(id: number): Promise<DepositAccount | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM deposit_accounts WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as DepositAccount || null);
      });
    });
  }

  public async updateDepositAccount(id: number, account: Partial<Omit<DepositAccount, 'id' | 'createdAt'>>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const updates: string[] = [];
      const params: (string | number | undefined)[] = [];

      if (account.name) {
        updates.push('name = ?');
        params.push(account.name);
      }
      if (account.type) {
        updates.push('type = ?');
        params.push(account.type);
      }
      if (account.repaymentDay !== undefined) {
        updates.push('repaymentDay = ?');
        params.push(account.repaymentDay);
      }

      if (updates.length === 0) {
        resolve(true);
        return;
      }

      params.push(id);

      this.db.run(
        `UPDATE deposit_accounts SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  public async deleteDepositAccount(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM deposit_accounts WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  public close(): void {
    this.db.close();
  }
}

export const db = new Database();