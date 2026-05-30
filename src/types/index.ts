export interface Transaction {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  capitalBalance?: number;
  investmentBalance?: number;
  description: string;
  date: string;
  depositAccountId: number;
  createdAt: string;
}

export interface BalanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number;
  capitalGrowth: number;
  investmentGrowth: number;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'danger';
  message: string;
  color: string;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
}

export interface FireInfo {
  currentBalance: number;
  actualAnnualExpense: number;
  estimatedAnnualExpense: number;
  averageAnnualExpense: number;
  age: number;
  gender: 'male' | 'female';
  retirementAge: number;
  fireTarget: number;
  remainingAmount: number;
  progressPercentage: number;
  monthlySavings: number;
  yearsToFire: number;
}

export type Gender = 'male' | 'female';

export type TransactionType = 'income' | 'expense';

export type DepositType = 'bank' | 'alipay' | 'jd' | 'wechat' | 'securities' | 'other';

export interface DepositAccount {
  id: number;
  name: string;
  type: DepositType;
  repaymentDay?: number;
  createdAt: string;
}

export const DEPOSIT_ACCOUNTS = [
  { name: '招商银行', type: 'bank' as DepositType },
  { name: '中国农业银行', type: 'bank' as DepositType },
  { name: '江苏银行', type: 'bank' as DepositType },
  { name: '盛京银行', type: 'bank' as DepositType },
  { name: '支付宝', type: 'alipay' as DepositType },
  { name: '京东金融', type: 'jd' as DepositType },
  { name: '微信余额', type: 'wechat' as DepositType },
  { name: '广发证券', type: 'securities' as DepositType },
];

export const INCOME_CATEGORIES = ['工资', '奖金', '投资收益', '兼职', '其他收入'];
export const EXPENSE_CATEGORIES = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '房租', '水电', '其他支出'];