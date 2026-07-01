const fs = require('fs');
const path = require('path');

const localStorageServiceCode = fs.readFileSync(path.join(__dirname, '../public/js/localStorageService.js'), 'utf8');
const frontendServiceCode = fs.readFileSync(path.join(__dirname, '../public/js/frontendService.js'), 'utf8');

eval(localStorageServiceCode);
eval(frontendServiceCode);

describe('P0核心测试', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAnnualRate', () => {
    test('P0-001: 0个月数据返回N/A', () => {
      const result = frontendService.getAnnualRate();
      expect(result.rate).toBe('N/A');
      expect(result.value).toBeNull();
    });

    test('P0-002: 1个月数据返回N/A', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      const result = frontendService.getAnnualRate();
      expect(result.rate).toBe('N/A');
      expect(result.value).toBeNull();
    });

    test('P0-003: 2个月数据计算年化收益率', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1006000, investmentBalance: 6000, date: '2026-06-30'
      });
      const result = frontendService.getAnnualRate();
      expect(parseFloat(result.rate)).toBeCloseTo(7.44, 1);
      expect(result.value).toBeDefined();
    });
  });

  describe('getAnnualSavings', () => {
    test('P0-004: 0个月数据返回N/A', () => {
      const result = frontendService.getAnnualSavings();
      expect(result).toBe('N/A');
    });

    test('P0-005: 2个月数据计算年储蓄', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1120000, investmentBalance: 6000, date: '2026-06-30'
      });
      const result = frontendService.getAnnualSavings();
      expect(result).toBe(1368000);
    });
  });

  describe('getHealthStatus', () => {
    test('P0-007: 0个月数据返回灰色未知', () => {
      const result = frontendService.getHealthStatus();
      expect(result.status).toBe('unknown');
      expect(result.color).toBe('#6b7280');
      expect(result.statusText).toBe('❓ 未知');
    });

    test('P0-008: 储蓄率≥50%返回绿色优秀', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000, riskProfile: 'conservative' });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1120000, investmentBalance: 6000, date: '2026-06-30'
      });
      const result = frontendService.getHealthStatus();
      expect(result.status).toBe('healthy');
      expect(result.color).toBe('#22c55e');
      expect(result.statusText).toBe('✅ 优秀');
    });
  });

  describe('getInvestmentHealthStatus', () => {
    test('P0-009: 0个月数据返回灰色未知', () => {
      const result = frontendService.getInvestmentHealthStatus();
      expect(result.status).toBe('unknown');
      expect(result.color).toBe('#6b7280');
    });

    test('P0-010: 年化≥3.5%返回绿色优秀', () => {
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1006000, investmentBalance: 6000, date: '2026-06-30'
      });
      const result = frontendService.getInvestmentHealthStatus();
      expect(result.status).toBe('healthy');
      expect(result.color).toBe('#22c55e');
    });
  });

  describe('数据存储', () => {
    test('P0-011: 保存和读取用户信息', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000, riskProfile: 'conservative' });
      const info = localStorageService.getUserInfo();
      expect(info.annualIncome).toBe(600000);
      expect(info.annualExpense).toBe(350000);
    });

    test('P0-012: 添加和读取交易记录', () => {
      localStorageService.addTransaction({ id: 1, type: 'income', amount: 100000, capitalBalance: 1000000, investmentBalance: 0, date: '2026-06-30' });
      const transactions = localStorageService.getTransactions();
      expect(transactions.length).toBe(1);
      expect(transactions[0].type).toBe('income');
    });

    test('P0-013: 添加和读取资金账户', () => {
      localStorageService.addDepositAccount({ id: 1, name: '招商银行', type: 'bank' });
      const accounts = localStorageService.getDepositAccounts();
      expect(accounts.length).toBe(1);
      expect(accounts[0].name).toBe('招商银行');
    });
  });

  describe('getFireProgressInfo', () => {
    test('P0-015: 0个月数据使用用户输入计算', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000, riskProfile: 'conservative' });
      const result = frontendService.getFireProgressInfo();
      expect(result.annualSavings).toBe(250000);
      expect(result.annualRate).toBe(0.025);
    });

    test('P0-016: 2个月数据使用实际计算值', () => {
      localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000, riskProfile: 'conservative' });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
      });
      localStorageService.addTransaction({
        type: 'income', capitalBalance: 1120000, investmentBalance: 6000, date: '2026-06-30'
      });
      const result = frontendService.getFireProgressInfo();
      expect(result.annualSavings).toBe(1368000);
      expect(result.annualRate).toBeGreaterThan(0);
    });
  });
});