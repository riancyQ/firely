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

describe('健康状态监控', () => {
  beforeEach(() => {
    localStorage.clear();
    window.localStorageService = window.storageService;
  });

  describe('2.1 储蓄健康状态', () => {
    test('0个月数据显示"数据不足"（灰色）', () => {
      const result = calcService.getHealthStatus();
      expect(result.status).toBe('unknown');
      expect(result.color).toBe('#6b7280');
      expect(result.statusText).toContain('未知');
    });

    test('1个月数据显示"数据不足"（灰色）', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      const result = calcService.getHealthStatus();
      expect(result.status).toBe('unknown');
      expect(result.color).toBe('#6b7280');
    });

    test('储蓄率≥50%显示"优秀"（绿色）', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 300000 });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1500000, date: currentMonthDate
      });
      
      const result = calcService.getHealthStatus();
      expect(result.status).toBe('healthy');
      expect(result.color).toBe('#22c55e');
      expect(result.statusText).toContain('优秀');
    });

    test('0%<储蓄率<50%显示"注意"（黄色）', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 450000 });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1012500, date: currentMonthDate
      });
      
      const result = calcService.getHealthStatus();
      expect(result.status).toBe('warning');
      expect(result.color).toBe('#eab308');
      expect(result.statusText).toContain('注意');
    });

    test('储蓄率≤0%显示"危险"（红色）', () => {
      storage.saveUserInfo({ annualIncome: 300000, annualExpense: 500000 });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 800000, date: currentMonthDate
      });
      
      const result = calcService.getHealthStatus();
      expect(result.status).toBe('danger');
      expect(result.color).toBe('#ef4444');
      expect(result.statusText).toContain('危险');
    });
  });

  describe('2.2 理财健康状态', () => {
    test('0个月数据显示"数据不足"（灰色）', () => {
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('unknown');
      expect(result.color).toBe('#6b7280');
    });

    test('1个月数据显示"数据不足"（灰色）', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: currentMonthDate
      });
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('unknown');
      expect(result.color).toBe('#6b7280');
    });

    test('年化利率≥3.5%显示"优秀"（绿色）', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1004000, investmentBalance: 4000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('healthy');
      expect(result.color).toBe('#22c55e');
    });

    test('0%<年化利率<3.5%显示"注意"（黄色）', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1002000, investmentBalance: 2000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('warning');
      expect(result.color).toBe('#eab308');
    });

    test('年化利率≤0%显示"危险"（红色）', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('danger');
      expect(result.color).toBe('#ef4444');
    });
  });

  describe('状态消息内容', () => {
    test('储蓄健康状态包含建议信息', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 300000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1500000, date: currentMonthDate
      });
      
      const result = calcService.getHealthStatus();
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });

    test('理财健康状态包含建议信息', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1004000, investmentBalance: 4000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentHealthStatus();
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    });
  });
});
