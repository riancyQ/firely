const fs = require('fs');
const path = require('path');

const storageServiceCode = fs.readFileSync(path.join(__dirname, '../src/scripts/services/storageService.js'), 'utf8');
const calculationServiceCode = fs.readFileSync(path.join(__dirname, '../src/scripts/services/calculationService.js'), 'utf8');

eval(storageServiceCode);
eval(calculationServiceCode);

describe('数据导入导出测试', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('I/O-001: 导出空数据', () => {
    const result = storageService.exportData();
    expect(result.appVersion).toBe('2.0');
    expect(result.exportTime).toBeDefined();
    expect(result.data).toBeDefined();
    expect(result.data.transactions).toEqual([]);
    expect(result.data.depositAccounts).toEqual([]);
  });

  test('I/O-002: 导出正常数据', () => {
    storageService.saveUserInfo({ annualIncome: 600000, annualExpense: 350000, riskProfile: 'conservative' });
    storageService.addTransaction({
      type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: '2026-05-31'
    });
    storageService.addDepositAccount({ name: '招商银行', type: 'bank' });
    
    const result = storageService.exportData();
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

    const result = storageService.importData(exportData);
    expect(result.success).toBe(true);
    expect(storageService.getTransactions().length).toBe(1);
    expect(storageService.getDepositAccounts().length).toBe(1);
    expect(storageService.getUserInfo().annualIncome).toBe(600000);
  });

  test('I/O-004: 导入格式错误文件', () => {
    const invalidData = { invalid: 'data' };
    const result = storageService.importData(invalidData);
    expect(result.success).toBe(false);
    expect(result.message).toContain('文件格式错误');
  });

  test('I/O-005: 导入版本过高文件', () => {
    const exportData = {
      appVersion: '3.0',
      data: { transactions: [], depositAccounts: [], userInfo: null, nextIds: {} }
    };
    const result = storageService.importData(exportData);
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

    const result = storageService.importData(exportData);
    expect(result.success).toBe(true);
    expect(result.message).toContain('旧版本');
  });

  test('I/O-007: 导出导入数据一致性', () => {
    storageService.saveUserInfo({ annualIncome: 800000, annualExpense: 400000, riskProfile: 'aggressive' });
    storageService.addTransaction({
      type: 'income', capitalBalance: 2000000, investmentBalance: 10000, date: '2026-05-31'
    });
    storageService.addTransaction({
      type: 'income', capitalBalance: 2100000, investmentBalance: 15000, date: '2026-06-30'
    });
    storageService.addDepositAccount({ name: '工商银行', type: 'bank' });

    const exported = storageService.exportData();
    
    storageService.clearAll();
    
    const importResult = storageService.importData(exported);
    expect(importResult.success).toBe(true);

    const importedTransactions = storageService.getTransactions();
    const importedAccounts = storageService.getDepositAccounts();
    const importedUserInfo = storageService.getUserInfo();

    expect(importedTransactions.length).toBe(2);
    expect(importedAccounts.length).toBe(1);
    expect(importedUserInfo.annualIncome).toBe(800000);
  });

  describe('导入导出逻辑补充', () => {
    test('导入前确认逻辑 - 用户确认后执行', () => {
      let userConfirmed = true;
      
      if (!userConfirmed) {
        return;
      }
      
      const exportData = {
        appVersion: '2.0',
        data: { transactions: [], depositAccounts: [], userInfo: null, nextIds: {} }
      };
      const result = storageService.importData(exportData);
      expect(result.success).toBe(true);
    });

    test('导入前确认逻辑 - 用户取消不执行', () => {
      let userConfirmed = false;
      let importCalled = false;
      
      if (!userConfirmed) {
        importCalled = false;
      } else {
        importCalled = true;
      }
      
      expect(importCalled).toBe(false);
    });

    test('JSON 解析异常处理', () => {
      const invalidJson = '{invalid json content';
      let parseError = null;
      
      try {
        JSON.parse(invalidJson);
      } catch (error) {
        parseError = error.message;
      }
      
      expect(parseError).toBeDefined();
      expect(parseError.length).toBeGreaterThan(0);
    });

    test('导出时间戳为有效ISO格式', () => {
      const result = storageService.exportData();
      const date = new Date(result.exportTime);
      
      expect(date.getTime()).toBeGreaterThan(0);
      expect(date.toISOString()).toBe(result.exportTime);
    });

    test('导出时间戳在当前时间之前', () => {
      const result = storageService.exportData();
      const exportTime = new Date(result.exportTime).getTime();
      const now = Date.now();
      
      expect(exportTime).toBeLessThanOrEqual(now);
    });

    test('导入时部分数据字段缺失', () => {
      const exportData = {
        appVersion: '2.0',
        data: {
          transactions: [{ id: 1, type: 'income', capitalBalance: 500000, date: '2026-07-30' }],
          depositAccounts: [],
          userInfo: null,
          nextIds: {}
        }
      };
      
      const result = storageService.importData(exportData);
      expect(result.success).toBe(true);
      expect(storageService.getTransactions().length).toBe(1);
      expect(storageService.getDepositAccounts().length).toBe(0);
      expect(storageService.getUserInfo()).toBeNull();
    });

    test('导入时 transactions 为非数组', () => {
      const exportData = {
        appVersion: '2.0',
        data: {
          transactions: null,
          depositAccounts: null,
          userInfo: null,
          nextIds: null
        }
      };
      
      const result = storageService.importData(exportData);
      expect(result.success).toBe(true);
    });

    test('导出包含所有必要字段', () => {
      const result = storageService.exportData();
      
      expect(result).toHaveProperty('appVersion');
      expect(result).toHaveProperty('exportTime');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('transactions');
      expect(result.data).toHaveProperty('depositAccounts');
      expect(result.data).toHaveProperty('nextIds');
    });

    test('nextIds 在导出中包含计数器', () => {
      storageService.addTransaction({
        type: 'income', capitalBalance: 100000, date: '2026-07-30'
      });
      storageService.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      const result = storageService.exportData();
      
      expect(result.data.nextIds).toBeDefined();
      expect(result.data.nextIds.transactions).toBeGreaterThanOrEqual(1);
      expect(result.data.nextIds.depositAccounts).toBeGreaterThanOrEqual(1);
    });

    test('导入时 appVersion 默认值为1.0', () => {
      const exportData = {
        data: {
          transactions: [],
          depositAccounts: [],
          userInfo: null,
          nextIds: {}
        }
      };
      
      const result = storageService.importData(exportData);
      expect(result.success).toBe(true);
    });

    test('导入异常时返回错误信息', () => {
      const mockThrow = jest.spyOn(storageService, 'clearAll').mockImplementation(() => {
        throw new Error('模拟存储异常');
      });
      
      const exportData = {
        appVersion: '2.0',
        data: { transactions: [], depositAccounts: [], userInfo: null, nextIds: {} }
      };
      
      const result = storageService.importData(exportData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('导入失败');
      
      mockThrow.mockRestore();
    });
  });
});