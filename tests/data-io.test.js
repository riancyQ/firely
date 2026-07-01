const fs = require('fs');
const path = require('path');

const localStorageServiceCode = fs.readFileSync(path.join(__dirname, '../public/js/localStorageService.js'), 'utf8');
const frontendServiceCode = fs.readFileSync(path.join(__dirname, '../public/js/frontendService.js'), 'utf8');

eval(localStorageServiceCode);
eval(frontendServiceCode);

describe('数据导入导出测试', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('I/O-001: 导出空数据', () => {
    const result = frontendService.exportData();
    expect(result.appVersion).toBe('2.0');
    expect(result.exportTime).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.transactions).toEqual([]);
    expect(result.data.depositAccounts).toEqual([]);
  });

  test('I/O-002: 导出正常数据', () => {
    localStorageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000, riskProfile: 'conservative' });
    localStorageService.addTransaction({
      type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
    });
    localStorageService.addDepositAccount({ name: '招商银行', type: 'bank' });
    
    const result = frontendService.exportData();
    expect(result.appVersion).toBe('2.0');
    expect(result.data.transactions.length).toBe(1);
    expect(result.data.depositAccounts.length).toBe(1);
    expect(result.data.userInfo.annualIncome).toBe(600000);
  });

  test('I/O-003: 导入有效文件', () => {
    const exportData = {
      appVersion: '2.0',
      exportTime: '2026-06-30T10:00:00.000Z',
      data: {
        transactions: [
          { id: 1, type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31' }
        ],
        depositAccounts: [
          { id: 1, name: '招商银行', type: 'bank' }
        ],
        userInfo: { annualIncome: 600000, annualExpense: 350000, riskProfile: 'conservative' },
        nextIds: { transactions: 2, depositAccounts: 2 }
      }
    };

    const result = frontendService.importData(exportData);
    expect(result.success).toBe(true);
    expect(localStorageService.getTransactions().length).toBe(1);
    expect(localStorageService.getDepositAccounts().length).toBe(1);
    expect(localStorageService.getUserInfo().annualIncome).toBe(600000);
  });

  test('I/O-004: 导入格式错误文件', () => {
    const invalidData = { invalid: 'data' };
    const result = frontendService.importData(invalidData);
    expect(result.success).toBe(false);
    expect(result.message).toContain('文件格式错误');
  });

  test('I/O-005: 导入版本过高文件', () => {
    const exportData = {
      appVersion: '3.0',
      data: { transactions: [], depositAccounts: [], userInfo: null, nextIds: {} }
    };
    const result = frontendService.importData(exportData);
    expect(result.success).toBe(false);
    expect(result.message).toContain('版本过高');
  });

  test('I/O-006: 导入版本过低文件', () => {
    const exportData = {
      appVersion: '1.0',
      data: {
        transactions: [{ id: 1, type: 'income', capitalBalance: 500000, date: '2026-05-31' }],
        depositAccounts: [],
        userInfo: { annualIncome: 500000 },
        nextIds: {}
      }
    };

    const result = frontendService.importData(exportData);
    expect(result.success).toBe(true);
    expect(result.message).toContain('旧版本');
  });

  test('I/O-007: 导出导入数据一致性', () => {
    localStorageService.saveUserInfo({ annualIncome: 800000, annualExpense: 400000, riskProfile: 'aggressive' });
    localStorageService.addTransaction({
      type: 'income', capitalBalance: 2000000, investmentBalance: 10000, date: '2026-05-31'
    });
    localStorageService.addTransaction({
      type: 'income', capitalBalance: 2100000, investmentBalance: 15000, date: '2026-06-30'
    });
    localStorageService.addDepositAccount({ name: '工商银行', type: 'bank' });

    const exported = frontendService.exportData();
    
    localStorageService.clearAll();
    
    const importResult = frontendService.importData(exported);
    expect(importResult.success).toBe(true);

    const importedTransactions = localStorageService.getTransactions();
    const importedAccounts = localStorageService.getDepositAccounts();
    const importedUserInfo = localStorageService.getUserInfo();

    expect(importedTransactions.length).toBe(2);
    expect(importedAccounts.length).toBe(1);
    expect(importedUserInfo.annualIncome).toBe(800000);
  });
});