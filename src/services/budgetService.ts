import { db } from '../db/database';
import { Transaction, BalanceSummary, HealthStatus, CategorySummary, TransactionType, FireInfo, Gender, DepositAccount } from '../types';

export class BudgetService {
  public async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const id = await db.addTransaction(transaction);
    return {
      ...transaction,
      id,
      createdAt: new Date().toISOString()
    };
  }

  public async getAllTransactions(): Promise<Transaction[]> {
    return db.getAllTransactions();
  }

  public async getTransactionsByType(type: TransactionType): Promise<Transaction[]> {
    return db.getTransactionsByType(type);
  }

  public async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return db.getTransactionsByDateRange(startDate, endDate);
  }

  public async getTransactionById(id: number): Promise<Transaction | null> {
    return db.getTransactionById(id);
  }

  public async updateTransaction(id: number, transaction: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<boolean> {
    return db.updateTransaction(id, transaction);
  }

  public async deleteTransaction(id: number): Promise<boolean> {
    return db.deleteTransaction(id);
  }

  public async getBalanceSummary(): Promise<BalanceSummary> {
    const { totalIncome, totalExpense } = await db.getSummary();
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    
    const transactions = await db.getAllTransactions();
    
    let capitalGrowth = 0;
    let investmentGrowth = 0;
    
    if (transactions.length >= 2) {
      const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const firstCapital = sortedTransactions[0].capitalBalance || 0;
      const lastCapital = sortedTransactions[sortedTransactions.length - 1].capitalBalance || 0;
      capitalGrowth = lastCapital - firstCapital;
      
      const firstInvestment = sortedTransactions[0].investmentBalance || 0;
      const lastInvestment = sortedTransactions[sortedTransactions.length - 1].investmentBalance || 0;
      investmentGrowth = lastInvestment - firstInvestment;
    }

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate: Math.round(savingsRate * 100) / 100,
      capitalGrowth,
      investmentGrowth
    };
  }

  public async getHealthStatus(): Promise<HealthStatus> {
    const summary = await this.getBalanceSummary();
    
    if (summary.balance >= 0 && summary.savingsRate >= 20) {
      return {
        status: 'healthy',
        message: '财务状况良好！储蓄率达到健康水平',
        color: '#22c55e'
      };
    } else if (summary.balance >= 0 && summary.savingsRate >= 10) {
      return {
        status: 'warning',
        message: '财务状况一般，建议提高储蓄率',
        color: '#eab308'
      };
    } else if (summary.balance >= 0) {
      return {
        status: 'warning',
        message: '收支平衡，但储蓄率偏低',
        color: '#f97316'
      };
    } else {
      return {
        status: 'danger',
        message: '财务状况危险！支出超过收入',
        color: '#ef4444'
      };
    }
  }

  public async getIncomeCategories(): Promise<CategorySummary[]> {
    const categories = await db.getCategorySummary('income');
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
    
    return categories.map(cat => ({
      category: cat.category,
      amount: cat.amount,
      percentage: total > 0 ? Math.round((cat.amount / total) * 10000) / 100 : 0
    }));
  }

  public async getExpenseCategories(): Promise<CategorySummary[]> {
    const categories = await db.getCategorySummary('expense');
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
    
    return categories.map(cat => ({
      category: cat.category,
      amount: cat.amount,
      percentage: total > 0 ? Math.round((cat.amount / total) * 10000) / 100 : 0
    }));
  }

  public async getFireInfo(age: number = 30, gender: Gender = 'male', estimatedAnnualExpense: number | null = null, safeWithdrawalRate: number = 0.035, annualIncome: number = 0): Promise<FireInfo> {
    const summary = await this.getBalanceSummary();
    const currentBalance = summary.balance;
    
    const actualAnnualExpense = summary.totalExpense * 12;
    
    const finalEstimatedExpense = estimatedAnnualExpense || actualAnnualExpense * 1.1;
    
    const fireTarget = finalEstimatedExpense / safeWithdrawalRate;
    
    const remainingAmount = Math.max(0, fireTarget - currentBalance);
    const progressPercentage = fireTarget > 0 ? Math.min(100, (currentBalance / fireTarget) * 100) : 0;
    
    const transactions = await db.getAllTransactions();
    
    const monthlyData: { [key: string]: { capital: number; investment: number; savings: number } } = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { capital: 0, investment: 0, savings: 0 };
      }
      monthlyData[monthKey].capital += t.capitalBalance || t.amount;
      monthlyData[monthKey].investment += t.investmentBalance || 0;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const n = sortedMonths.length;
    
    for (let i = 1; i < sortedMonths.length; i++) {
      const prevMonth = sortedMonths[i - 1];
      const currMonth = sortedMonths[i];
      monthlyData[currMonth].savings = monthlyData[currMonth].capital - monthlyData[prevMonth].capital - monthlyData[currMonth].investment;
    }
    
    let annualReturnRate = safeWithdrawalRate;
    
    if (n >= 2) {
      const monthsToUse = n >= 12 ? sortedMonths.slice(-12) : sortedMonths;
      let product = 1;
      monthsToUse.forEach((key, index) => {
        if (index > 0) {
          const prevCapital = monthlyData[monthsToUse[index - 1]].capital;
          const investment = monthlyData[key].investment;
          if (prevCapital > 0) {
            const monthlyRate = investment / prevCapital;
            product *= (1 + monthlyRate);
          }
        }
      });
      const monthsCount = monthsToUse.length - 1;
      if (monthsCount > 0) {
        annualReturnRate = n >= 12 ? product - 1 : Math.pow(product, 12 / monthsCount) - 1;
      }
    }
    
    const defaultAnnualSavings = annualIncome > finalEstimatedExpense ? annualIncome - finalEstimatedExpense : 0;
    
    let annualSavings = defaultAnnualSavings;
    
    if (n >= 2) {
      const monthsToUse = n >= 12 ? sortedMonths.slice(-12) : sortedMonths;
      const totalMonthlySavings = monthsToUse.reduce((sum, key) => sum + monthlyData[key].savings, 0);
      const monthsCount = monthsToUse.length - 1;
      
      if (n >= 2 && n <= 5) {
        const actualAnnualSavings = monthsCount > 0 ? totalMonthlySavings * (12 / monthsCount) : 0;
        annualSavings = (defaultAnnualSavings * 0.5 + actualAnnualSavings * 0.5);
      } else {
        annualSavings = monthsCount > 0 ? totalMonthlySavings * (12 / monthsCount) : 0;
      }
    }
    
    annualSavings = Math.max(0, annualSavings);
    const monthlySavings = annualSavings / 12;
    
    let yearsToFire = Infinity;
    if (annualSavings > 0 && remainingAmount > 0) {
      if (annualReturnRate > 0) {
        const numerator = Math.log((remainingAmount * annualReturnRate + annualSavings) / annualSavings);
        const denominator = Math.log(1 + annualReturnRate);
        yearsToFire = denominator > 0 ? numerator / denominator : Infinity;
      } else {
        yearsToFire = remainingAmount / annualSavings;
      }
    } else if (remainingAmount <= 0) {
      yearsToFire = 0;
    }

    return {
      currentBalance,
      actualAnnualExpense,
      estimatedAnnualExpense: finalEstimatedExpense,
      averageAnnualExpense: finalEstimatedExpense,
      age,
      gender,
      retirementAge: gender === 'female' ? 55 : 60,
      fireTarget,
      remainingAmount,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      monthlySavings: Math.round(monthlySavings * 100) / 100,
      yearsToFire: Math.round(yearsToFire * 100) / 100
    };
  }

  public async addDepositAccount(account: Omit<DepositAccount, 'id' | 'createdAt'>): Promise<DepositAccount> {
    const id = await db.addDepositAccount(account);
    return {
      ...account,
      id,
      createdAt: new Date().toISOString()
    };
  }

  public async getAllDepositAccounts(): Promise<DepositAccount[]> {
    return db.getAllDepositAccounts();
  }

  public async getDepositAccountById(id: number): Promise<DepositAccount | null> {
    return db.getDepositAccountById(id);
  }

  public async updateDepositAccount(id: number, account: Partial<Omit<DepositAccount, 'id' | 'createdAt'>>): Promise<boolean> {
    return db.updateDepositAccount(id, account);
  }

  public async deleteDepositAccount(id: number): Promise<boolean> {
    return db.deleteDepositAccount(id);
  }
}

export const budgetService = new BudgetService();