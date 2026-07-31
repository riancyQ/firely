const fs = require('fs');
const path = require('path');
const { getCurrentMonthDate, getPrevMonthDate } = require('../helpers/dateHelper');

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

const currentMonthDate = getCurrentMonthDate();
const prevMonthDate = getPrevMonthDate(1).date;

const calcService = window.calculationService;

describe('calculationService', () => {
  beforeEach(() => {
    localStorage.clear();
    window.localStorageService = window.storageService;
  });

  describe('getBalanceSummary', () => {
    test('空数据返回零值', () => {
      const result = calcService.getBalanceSummary();
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpense).toBe(0);
      expect(result.balance).toBe(0);
      expect(result.savingsRate).toBe(0);
    });

    test('计算收入和支出', () => {
      localStorageService.addTransaction({ type: 'income', amount: 10000, date: '2026-06-01' });
      localStorageService.addTransaction({ type: 'expense', amount: 3000, date: '2026-06-15' });
      const result = calcService.getBalanceSummary();
      expect(result.totalIncome).toBe(10000);
      expect(result.totalExpense).toBe(3000);
      expect(result.balance).toBe(7000);
    });

    test('计算储蓄率', () => {
      localStorageService.addTransaction({ type: 'income', amount: 10000, date: '2026-06-01' });
      localStorageService.addTransaction({ type: 'expense', amount: 3000, date: '2026-06-15' });
      const result = calcService.getBalanceSummary();
      expect(result.savingsRate).toBe(70);
    });

    test('多条记录累加', () => {
      localStorageService.addTransaction({ type: 'income', amount: 5000, date: '2026-06-01' });
      localStorageService.addTransaction({ type: 'income', amount: 5000, date: '2026-06-15' });
      localStorageService.addTransaction({ type: 'expense', amount: 2000, date: '2026-06-20' });
      const result = calcService.getBalanceSummary();
      expect(result.totalIncome).toBe(10000);
      expect(result.totalExpense).toBe(2000);
    });
  });

  describe('getAnnualRate', () => {
    test('0个月数据返回N/A', () => {
      const result = calcService.getAnnualRate();
      expect(result.rate).toBe('N/A');
      expect(result.value).toBeNull();
    });

    test('1个月数据返回N/A', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-06-30'
      });
      const result = calcService.getAnnualRate();
      expect(result.rate).toBe('N/A');
      expect(result.value).toBeNull();
    });

    test('2个月数据计算年化收益率', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1006000, investmentBalance: 6000, date: '2026-06-30'
      });
      const result = calcService.getAnnualRate();
      expect(parseFloat(result.rate)).toBeCloseTo(7.44, 1);
      expect(result.value).toBeDefined();
    });

    test('年化利率为0', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-06-30'
      });
      const result = calcService.getAnnualRate();
      expect(parseFloat(result.rate)).toBe(0);
    });
  });

  describe('getAnnualSavings', () => {
    test('0个月数据返回N/A', () => {
      const result = calcService.getAnnualSavings();
      expect(result).toBe('N/A');
    });

    test('1个月数据返回N/A', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-06-30'
      });
      const result = calcService.getAnnualSavings();
      expect(result).toBe('N/A');
    });

    test('2个月数据计算年储蓄', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1120000, investmentBalance: 6000, date: '2026-06-30'
      });
      const result = calcService.getAnnualSavings();
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getHealthStatus', () => {
    test('0个月数据返回灰色未知', () => {
      const result = calcService.getHealthStatus();
      expect(result.status).toBe('unknown');
      expect(result.color).toBe('#6b7280');
      expect(result.statusText).toContain('未知');
    });

    test('储蓄率≥50%返回绿色优秀', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1500000, investmentBalance: 0, date: '2026-06-30'
      });
      const result = calcService.getHealthStatus();
      expect(result.status).toBe('healthy');
      expect(result.color).toBe('#22c55e');
    });

    test('储蓄率为负返回红色危险', () => {
      localStorageService.saveUserInfo({ annualIncome: 300000, annualExpense: 500000 });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 800000, investmentBalance: 0, date: '2026-06-30'
      });
      const result = calcService.getHealthStatus();
      expect(result.status).toBe('danger');
    });
  });

  describe('getInvestmentHealthStatus', () => {
    test('0个月数据返回灰色未知', () => {
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('unknown');
      expect(result.color).toBe('#6b7280');
    });

    test('年化≥3.5%返回绿色优秀', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1006000, investmentBalance: 6000, date: '2026-06-30'
      });
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('healthy');
      expect(result.color).toBe('#22c55e');
    });
  });

  describe('getMonthlySummary', () => {
    test('空数据返回默认值', () => {
      const result = calcService.getMonthlySummary();
      expect(result.currentMonthCapital).toBe(0);
      expect(result.monthlyData).toEqual({});
      expect(result.monthsAsc).toEqual([]);
    });

    test('计算月度汇总', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 5000, date: '2026-06-30'
      });
      const result = calcService.getMonthlySummary();
      expect(result.currentMonthCapital).toBe(1000000);
      expect(result.annualInvestment).toBe(5000);
    });

    test('格式化当前月资金', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, date: '2026-06-30'
      });
      const result = calcService.getMonthlySummary();
      expect(result.currentMonthCapitalFormatted).toContain('万');
    });
  });

  describe('formatMoney', () => {
    test('格式化金额为万元', () => {
      const result = calcService.formatMoney(100000);
      expect(result).toBe('¥ 10.00 万');
    });

    test('格式化零值', () => {
      const result = calcService.formatMoney(0);
      expect(result).toBe('¥ 0.00 万');
    });

    test('格式化大金额', () => {
      const result = calcService.formatMoney(1000000);
      expect(result).toBe('¥ 100.00 万');
    });
  });

  describe('getCapitalDistribution', () => {
    test('空数据返回空列表', () => {
      const result = calcService.getCapitalDistribution();
      expect(result.accountList).toEqual([]);
      expect(result.totalCapital).toBe(0);
      expect(result.hasData).toBe(false);
    });

    test('计算账户分布', () => {
      const account1 = localStorageService.addDepositAccount({ name: '账户A', type: 'bank' });
      const account2 = localStorageService.addDepositAccount({ name: '账户B', type: 'fund' });
      
      localStorageService.addTransaction({
        type: 'income',
        capitalBalance: 500000,
        date: currentMonthDate,
        depositAccountId: account1.id
      });
      localStorageService.addTransaction({
        type: 'income',
        capitalBalance: 300000,
        date: currentMonthDate,
        depositAccountId: account2.id
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.accountList.length).toBeGreaterThanOrEqual(1);
      expect(result.totalCapital).toBe(800000);
      expect(result.hasData).toBe(true);
    });

    test('按金额排序', () => {
      const account1 = localStorageService.addDepositAccount({ name: '小账户', type: 'bank' });
      const account2 = localStorageService.addDepositAccount({ name: '大账户', type: 'bank' });
      
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 100000, date: currentMonthDate,
        depositAccountId: account1.id
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account2.id
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.accountList[0].name).toBe('大账户');
      expect(result.accountList[1].name).toBe('小账户');
    });
  });

  describe('getCapitalChartData', () => {
    test('空数据返回默认结构', () => {
      const result = calcService.getCapitalChartData();
      expect(result.hasData).toBe(false);
      expect(result.sortedMonths).toEqual([]);
    });

    test('生成月度图表数据', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1100000, date: '2026-06-30'
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.hasData).toBe(true);
      expect(result.sortedMonths.length).toBe(2);
      expect(result.growthRates['2026-06']).toBe(10);
    });

    test('单月数据没有增长率', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, date: '2026-06-30'
      });
      const result = calcService.getCapitalChartData();
      expect(result.growthRates).toEqual({});
    });
  });

  describe('getInvestmentChartData', () => {
    test('空数据返回默认结构', () => {
      const result = calcService.getInvestmentChartData();
      expect(result.hasData).toBe(false);
      expect(result.sortedMonths).toEqual([]);
    });

    test('计算投资收益率', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 5000, date: '2026-06-30'
      });
      
      const result = calcService.getInvestmentChartData();
      expect(result.hasData).toBe(true);
      expect(result.sortedMonths.length).toBe(2);
      expect(result.monthlyData['2026-06'].rate).toBe('0.5');
    });

    test('首月收益率为N/A', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-06-30'
      });
      const result = calcService.getInvestmentChartData();
      expect(result.monthlyData['2026-06'].rate).toBe('N/A');
    });
  });

  describe('getFireProgressInfo', () => {
    test('用户未设置时使用默认值', () => {
      const result = calcService.getFireProgressInfo();
      expect(result.currentCapital).toBe(0);
      expect(result.progressPercentage).toBe(0);
    });

    test('0个月数据使用用户输入计算', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      const result = calcService.getFireProgressInfo();
      expect(result.annualSavings).toBe(250000);
      expect(result.fireTarget).toBeGreaterThan(0);
    });

    test('2个月数据使用实际计算值', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1120000, investmentBalance: 6000, date: '2026-06-30'
      });
      const result = calcService.getFireProgressInfo();
      expect(result.annualSavings).toBeGreaterThan(0);
      expect(result.annualRate).toBeGreaterThan(0);
    });
  });

  describe('getReturnRate', () => {
    test('保守型返回2.5%', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000, riskProfile: 'conservative' });
      expect(calcService.getReturnRate()).toBe(0.025);
    });

    test('平衡型返回3.5%', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000, riskProfile: 'moderate' });
      expect(calcService.getReturnRate()).toBe(0.035);
    });

    test('进取型返回4.5%', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000, riskProfile: 'aggressive' });
      expect(calcService.getReturnRate()).toBe(0.045);
    });

    test('未设置用户返回默认值3.5%', () => {
      expect(calcService.getReturnRate()).toBe(0.035);
    });
  });

  describe('getTransactionsGroupedByMonth', () => {
    test('空数据返回空结构', () => {
      const result = calcService.getTransactionsGroupedByMonth();
      expect(result.sortedMonths).toEqual([]);
      expect(result.hasData).toBe(false);
    });

    test('按月分组交易', () => {
      localStorageService.addDepositAccount({ name: 'test', type: 'bank' });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 500000, date: '2026-06-15',
        depositAccountId: 1
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 500000, date: '2026-06-30',
        depositAccountId: 1
      });
      
      const result = calcService.getTransactionsGroupedByMonth();
      expect(result.hasData).toBe(true);
      expect(result.sortedMonths.length).toBe(1);
      expect(result.groupedByMonth['2026-06'].totalCapital).toBe(1000000);
    });
  });
});