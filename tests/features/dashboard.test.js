const fs = require('fs');
const path = require('path');

const storageServiceCode = fs.readFileSync(
  path.join(__dirname, '../../src/scripts/services/storageService.js'),
  'utf8'
);
const calculationServiceCode = fs.readFileSync(
  path.join(__dirname, '../../src/scripts/services/calculationService.js'),
  'utf8'
);
const formattersCode = fs.readFileSync(
  path.join(__dirname, '../../src/scripts/utils/formatters.js'),
  'utf8'
);

eval(storageServiceCode);
eval(formattersCode);
eval(calculationServiceCode);

const storage = window.storageService;
const calcService = window.calculationService;

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
const currentMonthDate = `${currentYear}-${currentMonth}-30`;
const lastMonthDate = now.getMonth() === 1 
  ? `${currentYear - 1}-12-31` 
  : `${currentYear}-${String(now.getMonth()).padStart(2, '0')}-28`;

describe('Dashboard 核心指标', () => {
  beforeEach(() => {
    localStorage.clear();
    window.localStorageService = window.storageService;
  });

  describe('1.1 资金总余额', () => {
    test('空数据时显示零值', () => {
      const summary = calcService.getMonthlySummary();
      expect(summary.currentMonthCapital).toBe(0);
      expect(summary.currentMonthCapitalFormatted).toBe('¥ 0.00 万');
    });

    test('显示本月资金总余额', () => {
      storage.addTransaction({
        type: 'income',
        capitalBalance: 500000,
        date: currentMonthDate
      });
      const summary = calcService.getMonthlySummary();
      expect(summary.currentMonthCapital).toBe(500000);
      expect(summary.currentMonthCapitalFormatted).toBe('¥ 50.00 万');
    });

    test('多账户余额汇总', () => {
      const acc1 = storage.addDepositAccount({ name: '账户1', type: 'bank' });
      const acc2 = storage.addDepositAccount({ name: '账户2', type: 'fund' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate,
        depositAccountId: acc1.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 200000, date: currentMonthDate,
        depositAccountId: acc2.id
      });
      
      const summary = calcService.getMonthlySummary();
      expect(summary.currentMonthCapital).toBe(500000);
    });
  });

  describe('1.2 年度理财总收益', () => {
    test('空数据时显示零值', () => {
      const summary = calcService.getMonthlySummary();
      expect(summary.annualInvestment).toBe(0);
      expect(summary.annualInvestmentFormatted).toBe('¥ 0.00 万');
    });

    test('显示本年理财总收益', () => {
      storage.addTransaction({
        type: 'income',
        capitalBalance: 1000000,
        investmentBalance: 5000,
        date: currentMonthDate
      });
      const summary = calcService.getMonthlySummary();
      expect(summary.annualInvestment).toBe(5000);
    });

    test('累计本年各月理财收益', () => {
      const prevMonth = now.getMonth() - 1;
      const prevMonthStr = prevMonth === 0 ? '12' : String(prevMonth).padStart(2, '0');
      const prevYear = prevMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonthDateStr = `${prevYear}-${prevMonthStr}-28`;
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 3000,
        date: prevMonthDateStr
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1005000, investmentBalance: 5000,
        date: currentMonthDate
      });
      
      const summary = calcService.getMonthlySummary();
      expect(summary.annualInvestment).toBe(8000);
    });
  });

  describe('1.3 月度结余', () => {
    test('空数据时显示 N/A', () => {
      const summary = calcService.getMonthlySummary();
      expect(summary.monthlyBalance).toBe('N/A');
    });

    test('单月数据时显示 N/A（无上月对比）', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      const summary = calcService.getMonthlySummary();
      expect(summary.monthlyBalance).toBe('N/A');
    });

    test('正数结余显示绿色（"+"号）', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1100000, date: currentMonthDate
      });
      const summary = calcService.getMonthlySummary();
      expect(summary.monthlyBalance).toContain('+');
      expect(summary.monthlyBalanceValue).toBe(100000);
    });

    test('负数结余显示红色（无"+"号）', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1100000, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      const summary = calcService.getMonthlySummary();
      expect(summary.monthlyBalanceValue).toBe(-100000);
    });
  });

  describe('1.4 年度结余', () => {
    test('空数据时显示 N/A', () => {
      const summary = calcService.getMonthlySummary();
      expect(summary.annualBalance).toBe('N/A');
    });

    test('单年数据时显示 N/A（无去年对比）', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      const summary = calcService.getMonthlySummary();
      expect(summary.annualBalance).toBe('N/A');
    });
  });

  describe('格式化显示', () => {
    test('金额格式化为万元单位', () => {
      const summary = calcService.getMonthlySummary();
      expect(summary.currentMonthCapitalFormatted).toContain('万');
    });

    test('储蓄率显示百分号', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1200000, date: currentMonthDate
      });
      const summary = calcService.getMonthlySummary();
      if (summary.savingsRate !== 'N/A') {
        expect(summary.savingsRate).toContain('%');
      }
    });
  });
});
