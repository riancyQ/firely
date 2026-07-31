const fs = require('fs');
const path = require('path');

const storageServiceCode = fs.readFileSync(
  path.join(__dirname, '../../src/scripts/services/storageService.js'),
  'utf8'
);

describe('storageService', () => {
  let localStorageService;

  beforeEach(() => {
    eval(storageServiceCode);
    localStorageService = window.storageService;
    window.localStorageService = localStorageService;
    localStorage.clear();
  });

  describe('getNextId', () => {
    test('首次调用返回 1', () => {
      const id = localStorageService.getNextId('test');
      expect(id).toBe(1);
    });

    test('第二次调用返回 2', () => {
      localStorageService.getNextId('test');
      const id = localStorageService.getNextId('test');
      expect(id).toBe(2);
    });

    test('不同表名使用不同的计数器', () => {
      const id1 = localStorageService.getNextId('table1');
      const id2 = localStorageService.getNextId('table2');
      expect(id1).toBe(1);
      expect(id2).toBe(1);
    });
  });

  describe('Transactions CRUD', () => {
    test('addTransaction 成功添加记录', () => {
      const transaction = localStorageService.addTransaction({
        type: 'income',
        amount: 10000,
        capitalBalance: 100000,
        investmentBalance: 0,
        date: '2026-06-30'
      });
      expect(transaction.id).toBeDefined();
      expect(transaction.createdAt).toBeDefined();
      expect(transaction.type).toBe('income');
    });

    test('getTransactions 返回所有记录', () => {
      localStorageService.addTransaction({ type: 'income', date: '2026-06-01' });
      localStorageService.addTransaction({ type: 'expense', date: '2026-06-15' });
      const transactions = localStorageService.getTransactions();
      expect(transactions.length).toBe(2);
    });

    test('getTransactions 空数据返回空数组', () => {
      const transactions = localStorageService.getTransactions();
      expect(transactions).toEqual([]);
    });

    test('updateTransaction 成功更新记录', () => {
      const transaction = localStorageService.addTransaction({
        type: 'income',
        amount: 10000,
        date: '2026-06-30'
      });
      const result = localStorageService.updateTransaction(transaction.id, {
        amount: 20000
      });
      expect(result).toBe(true);
      const updated = localStorageService.getTransactionById(transaction.id);
      expect(updated.amount).toBe(20000);
    });

    test('updateTransaction 不存在的ID返回false', () => {
      const result = localStorageService.updateTransaction(999, { amount: 100 });
      expect(result).toBe(false);
    });

    test('deleteTransaction 成功删除记录', () => {
      const transaction = localStorageService.addTransaction({
        type: 'income',
        date: '2026-06-30'
      });
      const result = localStorageService.deleteTransaction(transaction.id);
      expect(result).toBe(true);
      const deleted = localStorageService.getTransactionById(transaction.id);
      expect(deleted).toBeNull();
    });

    test('deleteTransaction 不存在的ID返回false', () => {
      const result = localStorageService.deleteTransaction(999);
      expect(result).toBe(false);
    });

    test('getTransactionById 返回指定记录', () => {
      const transaction = localStorageService.addTransaction({
        type: 'income',
        amount: 50000,
        date: '2026-06-30'
      });
      const found = localStorageService.getTransactionById(transaction.id);
      expect(found).toBeDefined();
      expect(found.amount).toBe(50000);
    });

    test('getTransactionById 不存在的ID返回null', () => {
      const found = localStorageService.getTransactionById(999);
      expect(found).toBeNull();
    });
  });

  describe('Deposit Accounts CRUD', () => {
    test('addDepositAccount 成功添加账户', () => {
      const account = localStorageService.addDepositAccount({
        name: '招商银行',
        type: 'bank'
      });
      expect(account.id).toBeDefined();
      expect(account.createdAt).toBeDefined();
      expect(account.name).toBe('招商银行');
    });

    test('getDepositAccounts 返回所有账户', () => {
      localStorageService.addDepositAccount({ name: '账户1', type: 'bank' });
      localStorageService.addDepositAccount({ name: '账户2', type: 'fund' });
      const accounts = localStorageService.getDepositAccounts();
      expect(accounts.length).toBe(2);
    });

    test('getDepositAccounts 空数据返回空数组', () => {
      const accounts = localStorageService.getDepositAccounts();
      expect(accounts).toEqual([]);
    });

    test('updateDepositAccount 成功更新账户', () => {
      const account = localStorageService.addDepositAccount({
        name: '原名称',
        type: 'bank'
      });
      const result = localStorageService.updateDepositAccount(account.id, {
        name: '新名称'
      });
      expect(result).toBe(true);
      const updated = localStorageService.getDepositAccountById(account.id);
      expect(updated.name).toBe('新名称');
    });

    test('updateDepositAccount 不存在的ID返回false', () => {
      const result = localStorageService.updateDepositAccount(999, { name: 'test' });
      expect(result).toBe(false);
    });

    test('deleteDepositAccount 成功删除账户', () => {
      const account = localStorageService.addDepositAccount({
        name: '待删除',
        type: 'bank'
      });
      const result = localStorageService.deleteDepositAccount(account.id);
      expect(result).toBe(true);
      const deleted = localStorageService.getDepositAccountById(account.id);
      expect(deleted).toBeNull();
    });

    test('deleteDepositAccount 不存在的ID返回false', () => {
      const result = localStorageService.deleteDepositAccount(999);
      expect(result).toBe(false);
    });

    test('getDepositAccountById 返回指定账户', () => {
      const account = localStorageService.addDepositAccount({
        name: '测试账户',
        type: 'bank'
      });
      const found = localStorageService.getDepositAccountById(account.id);
      expect(found).toBeDefined();
      expect(found.name).toBe('测试账户');
    });

    test('getDepositAccountById 不存在的ID返回null', () => {
      const found = localStorageService.getDepositAccountById(999);
      expect(found).toBeNull();
    });
  });

  describe('User Info', () => {
    test('saveUserInfo 保存用户信息', () => {
      const info = localStorageService.saveUserInfo({
        annualIncome: 600000,
        annualExpense: 350000
      });
      expect(info.createdAt).toBeDefined();
      expect(info.annualIncome).toBe(600000);
    });

    test('getUserInfo 返回用户信息', () => {
      localStorageService.saveUserInfo({
        annualIncome: 600000,
        annualExpense: 350000
      });
      const info = localStorageService.getUserInfo();
      expect(info).not.toBeNull();
      expect(info.annualIncome).toBe(600000);
    });

    test('getUserInfo 无数据返回null', () => {
      const info = localStorageService.getUserInfo();
      expect(info).toBeNull();
    });
  });

  describe('clearAll', () => {
    test('clearAll 清除所有数据', () => {
      localStorageService.addTransaction({ type: 'income', date: '2026-06-30' });
      localStorageService.addDepositAccount({ name: 'test', type: 'bank' });
      localStorageService.saveUserInfo({ annualIncome: 600000 });

      localStorageService.clearAll();

      expect(localStorageService.getTransactions()).toEqual([]);
      expect(localStorageService.getDepositAccounts()).toEqual([]);
      expect(localStorageService.getUserInfo()).toBeNull();
    });
  });

  describe('exportData', () => {
    test('exportData 导出空数据', () => {
      const result = localStorageService.exportData();
      expect(result.appVersion).toBe('2.0');
      expect(result.exportTime).toBeDefined();
      expect(result.data.transactions).toEqual([]);
      expect(result.data.depositAccounts).toEqual([]);
      expect(result.data.userInfo).toBeNull();
    });

    test('exportData 导出完整数据', () => {
      localStorageService.addTransaction({ type: 'income', amount: 10000, date: '2026-06-30' });
      localStorageService.addDepositAccount({ name: 'test', type: 'bank' });
      localStorageService.saveUserInfo({ annualIncome: 600000 });

      const result = localStorageService.exportData();
      expect(result.data.transactions.length).toBe(1);
      expect(result.data.depositAccounts.length).toBe(1);
      expect(result.data.userInfo.annualIncome).toBe(600000);
    });
  });

  describe('importData', () => {
    test('importData 导入有效数据', () => {
      const exportData = {
        appVersion: '2.0',
        exportTime: '2026-06-30T10:00:00.000Z',
        data: {
          transactions: [{ id: 1, type: 'income', amount: 10000, date: '2026-06-30' }],
          depositAccounts: [{ id: 1, name: 'test', type: 'bank' }],
          userInfo: { annualIncome: 600000 },
          nextIds: { transactions: 2, depositAccounts: 2 }
        }
      };
      const result = localStorageService.importData(exportData);
      expect(result.success).toBe(true);
      expect(localStorageService.getTransactions().length).toBe(1);
      expect(localStorageService.getDepositAccounts().length).toBe(1);
      expect(localStorageService.getUserInfo().annualIncome).toBe(600000);
    });

    test('importData 无效数据返回错误', () => {
      const result = localStorageService.importData(null);
      expect(result.success).toBe(false);
      expect(result.message).toContain('文件格式错误');
    });

    test('importData 高版本返回错误', () => {
      const exportData = {
        appVersion: '3.0',
        data: {}
      };
      const result = localStorageService.importData(exportData);
      expect(result.success).toBe(false);
      expect(result.message).toContain('版本过高');
    });

    test('importData 兼容旧版本', () => {
      const exportData = {
        appVersion: '1.0',
        data: {
          transactions: [{ type: 'income', amount: 5000, date: '2026-06-30' }]
        }
      };
      const result = localStorageService.importData(exportData);
      expect(result.success).toBe(true);
      expect(result.message).toContain('旧版本');
    });
  });

  describe('边界情况', () => {
    test('getTransactions 处理JSON异常', () => {
      localStorage.setItem('firely_transactions', 'invalid-json');
      const result = localStorageService.getTransactions();
      expect(result).toEqual([]);
    });

    test('getDepositAccounts 处理JSON异常', () => {
      localStorage.setItem('firely_deposit_accounts', 'invalid-json');
      const result = localStorageService.getDepositAccounts();
      expect(result).toEqual([]);
    });

    test('getUserInfo 处理JSON异常', () => {
      localStorage.setItem('firely_user_info', 'invalid-json');
      const result = localStorageService.getUserInfo();
      expect(result).toBeNull();
    });

    test('addTransaction 多条记录ID递增', () => {
      const t1 = localStorageService.addTransaction({ type: 'income', date: '2026-06-30' });
      const t2 = localStorageService.addTransaction({ type: 'income', date: '2026-06-30' });
      expect(t2.id).toBe(t1.id + 1);
    });

    test('importData 覆盖现有数据', () => {
      localStorageService.addTransaction({ type: 'income', date: '2026-06-30' });
      localStorageService.addDepositAccount({ name: 'old', type: 'bank' });

      const exportData = {
        appVersion: '2.0',
        data: {
          transactions: [{ id: 100, type: 'expense', date: '2026-07-01' }],
          depositAccounts: [{ id: 100, name: 'new', type: 'fund' }],
          nextIds: { transactions: 101, depositAccounts: 101 }
        }
      };
      localStorageService.importData(exportData);
      expect(localStorageService.getTransactions().length).toBe(1);
      expect(localStorageService.getTransactions()[0].type).toBe('expense');
      expect(localStorageService.getDepositAccounts()[0].name).toBe('new');
    });
  });
});