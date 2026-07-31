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

describe('资金分布（饼图）', () => {
  beforeEach(() => {
    localStorage.clear();
    window.localStorageService = window.storageService;
  });

  describe('5.1 基础展示', () => {
    test('空数据返回空列表', () => {
      const result = calcService.getCapitalDistribution();
      expect(result.accountList).toEqual([]);
      expect(result.totalCapital).toBe(0);
      expect(result.hasData).toBe(false);
    });

    test('各账户资金占比正确', () => {
      const acc1 = storage.addDepositAccount({ name: '账户A', type: 'bank' });
      const acc2 = storage.addDepositAccount({ name: '账户B', type: 'fund' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 600000, date: currentMonthDate,
        depositAccountId: acc1.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 400000, date: currentMonthDate,
        depositAccountId: acc2.id
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.totalCapital).toBe(1000000);
      expect(result.accountList.length).toBe(2);
      
      const accA = result.accountList.find(a => a.name === '账户A');
      const accB = result.accountList.find(a => a.name === '账户B');
      expect(accA.percentage).toBe(60);
      expect(accB.percentage).toBe(40);
    });

    test('百分比总和为100%', () => {
      const acc1 = storage.addDepositAccount({ name: '账户A', type: 'bank' });
      const acc2 = storage.addDepositAccount({ name: '账户B', type: 'fund' });
      const acc3 = storage.addDepositAccount({ name: '账户C', type: 'alipay' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: acc1.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate,
        depositAccountId: acc2.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 200000, date: currentMonthDate,
        depositAccountId: acc3.id
      });
      
      const result = calcService.getCapitalDistribution();
      const totalPercentage = result.accountList.reduce((sum, a) => sum + a.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });

    test('单一账户占比100%', () => {
      const account = storage.addDepositAccount({ name: '唯一账户', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.accountList.length).toBe(1);
      expect(result.accountList[0].percentage).toBe(100);
    });
  });

  describe('5.2 排序规则', () => {
    test('按金额从大到小排序', () => {
      const acc1 = storage.addDepositAccount({ name: '小账户', type: 'bank' });
      const acc2 = storage.addDepositAccount({ name: '大账户', type: 'bank' });
      const acc3 = storage.addDepositAccount({ name: '中账户', type: 'fund' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 100000, date: currentMonthDate,
        depositAccountId: acc1.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: acc2.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate,
        depositAccountId: acc3.id
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.accountList[0].name).toBe('大账户');
      expect(result.accountList[1].name).toBe('中账户');
      expect(result.accountList[2].name).toBe('小账户');
    });
  });

  describe('5.3 数据筛选规则', () => {
    test('只统计收入类型交易', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      storage.addTransaction({
        type: 'expense', amount: 5000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.totalCapital).toBe(500000);
    });

    test('取每个账户最新记录', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 400000, date: currentMonthDate,
        depositAccountId: account.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.totalCapital).toBe(500000);
    });

    test('只显示当前月份数据', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: lastMonthDate,
        depositAccountId: account.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.totalCapital).toBe(500000);
    });
  });

  describe('5.4 异常账户处理', () => {
    test('账户不存在时归类为"未知账户"', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: 999
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.accountList.length).toBe(1);
      expect(result.accountList[0].name).toBe('未知账户');
    });

    test('无账户ID的记录归类为"未知账户"', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.accountList.length).toBe(1);
      expect(result.accountList[0].name).toBe('未知账户');
    });
  });

  describe('5.5 展示月份信息', () => {
    test('返回展示月份', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = calcService.getCapitalDistribution();
      expect(result.displayMonth).toBeDefined();
      expect(result.displayMonth).toContain(currentYear.toString());
    });

    test('无数据时显示当前月份', () => {
      const result = calcService.getCapitalDistribution();
      const expectedMonth = `${currentYear}-${currentMonth}`;
      expect(result.displayMonth).toBe(expectedMonth);
    });
  });

  describe('5.6 数据完整性', () => {
    test('包含账户名称和金额', () => {
      const acc1 = storage.addDepositAccount({ name: '招商银行', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: acc1.id
      });
      
      const result = calcService.getCapitalDistribution();
      const item = result.accountList[0];
      expect(item.name).toBeDefined();
      expect(item.amount).toBeDefined();
      expect(item.percentage).toBeDefined();
    });

    test('所有账户金额为正数', () => {
      const acc1 = storage.addDepositAccount({ name: '账户A', type: 'bank' });
      const acc2 = storage.addDepositAccount({ name: '账户B', type: 'fund' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: acc1.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate,
        depositAccountId: acc2.id
      });
      
      const result = calcService.getCapitalDistribution();
      result.accountList.forEach(item => {
        expect(item.amount).toBeGreaterThan(0);
        expect(item.percentage).toBeGreaterThan(0);
      });
    });
  });
});
