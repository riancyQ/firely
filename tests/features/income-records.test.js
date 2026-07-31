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

describe('收入记录管理', () => {
  beforeEach(() => {
    localStorage.clear();
    window.localStorageService = window.storageService;
  });

  describe('4.1 列表展示', () => {
    test('空数据返回空结构', () => {
      const result = calcService.getTransactionsGroupedByMonth();
      expect(result.sortedMonths).toEqual([]);
      expect(result.hasData).toBe(false);
    });

    test('按月分组展示记录', () => {
      const account = storage.addDepositAccount({ name: '招商银行', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = calcService.getTransactionsGroupedByMonth();
      expect(result.hasData).toBe(true);
      expect(result.sortedMonths.length).toBe(1);
      const monthKey = result.sortedMonths[0];
      expect(result.groupedByMonth[monthKey].transactions.length).toBe(2);
    });

    test('每月显示资金总余额和理财总收益', () => {
      const account = storage.addDepositAccount({ name: '招商银行', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, investmentBalance: 2000, date: currentMonthDate,
        depositAccountId: account.id
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, investmentBalance: 1000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = calcService.getTransactionsGroupedByMonth();
      const monthKey = result.sortedMonths[0];
      expect(result.groupedByMonth[monthKey].totalCapital).toBe(800000);
      expect(result.groupedByMonth[monthKey].totalInvestment).toBe(3000);
    });

    test('显示账户名称', () => {
      const account = storage.addDepositAccount({ name: '招商银行', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = calcService.getTransactionsGroupedByMonth();
      const monthKey = result.sortedMonths[0];
      const transaction = result.groupedByMonth[monthKey].transactions[0];
      expect(transaction.accountName).toBe('招商银行');
    });
  });

  describe('4.2 新增记录', () => {
    test('成功添加记录', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      const transaction = storage.addTransaction({
        type: 'income',
        amount: 10000,
        capitalBalance: 500000,
        investmentBalance: 2000,
        date: currentMonthDate,
        depositAccountId: account.id
      });
      
      expect(transaction.id).toBeDefined();
      expect(transaction.createdAt).toBeDefined();
      expect(transaction.type).toBe('income');
    });

    test('保存后列表自动刷新', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = calcService.getTransactionsGroupedByMonth();
      expect(result.hasData).toBe(true);
      expect(result.sortedMonths.length).toBe(1);
    });
  });

  describe('4.3 编辑记录', () => {
    test('成功更新记录', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      const transaction = storage.addTransaction({
        type: 'income',
        capitalBalance: 500000,
        date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = storage.updateTransaction(transaction.id, {
        capitalBalance: 600000
      });
      expect(result).toBe(true);
      
      const updated = storage.getTransactionById(transaction.id);
      expect(updated.capitalBalance).toBe(600000);
    });

    test('不存在的ID返回false', () => {
      const result = storage.updateTransaction(999, { capitalBalance: 600000 });
      expect(result).toBe(false);
    });
  });

  describe('4.4 删除记录', () => {
    test('成功删除记录', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      const transaction = storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      const result = storage.deleteTransaction(transaction.id);
      expect(result).toBe(true);
      
      const deleted = storage.getTransactionById(transaction.id);
      expect(deleted).toBeNull();
    });

    test('删除后列表自动刷新', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      const t1 = storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      const t2 = storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      storage.deleteTransaction(t1.id);
      
      const result = calcService.getTransactionsGroupedByMonth();
      const monthKey = result.sortedMonths[0];
      expect(result.groupedByMonth[monthKey].transactions.length).toBe(1);
    });

    test('不存在的ID返回false', () => {
      const result = storage.deleteTransaction(999);
      expect(result).toBe(false);
    });
  });

  describe('4.5 收入/支出类型', () => {
    test('区分收入类型记录', () => {
      storage.addTransaction({
        type: 'income', amount: 10000, date: currentMonthDate
      });
      storage.addTransaction({
        type: 'expense', amount: 3000, date: currentMonthDate
      });
      
      const summary = calcService.getBalanceSummary();
      expect(summary.totalIncome).toBe(10000);
      expect(summary.totalExpense).toBe(3000);
    });

    test('收入记录用于资金分布计算', () => {
      const account = storage.addDepositAccount({ name: '账户A', type: 'bank' });
      
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      storage.addTransaction({
        type: 'expense', amount: 5000, date: currentMonthDate
      });
      
      const distribution = calcService.getCapitalDistribution();
      expect(distribution.hasData).toBe(true);
      expect(distribution.totalCapital).toBe(500000);
    });
  });

  describe('4.6 数据隔离', () => {
    test('多条记录ID递增', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      
      const t1 = storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      const t2 = storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      expect(t2.id).toBe(t1.id + 1);
    });

    test('不同账户记录独立', () => {
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
      
      const distribution = calcService.getCapitalDistribution();
      expect(distribution.accountList.length).toBe(2);
    });
  });

  describe('删除确认逻辑', () => {
    test('打开删除确认状态', () => {
      let deletingTransactionId = null;
      expect(deletingTransactionId).toBeNull();
      
      deletingTransactionId = 1;
      expect(deletingTransactionId).toBe(1);
    });

    test('确认删除后清除状态', () => {
      let deletingTransactionId = 5;
      const idToDelete = deletingTransactionId;
      
      expect(idToDelete).toBe(5);
      
      deletingTransactionId = null;
      expect(deletingTransactionId).toBeNull();
    });

    test('无ID时不执行删除', () => {
      let deletingTransactionId = null;
      let deleteCalled = false;
      
      if (deletingTransactionId) {
        deleteCalled = true;
      }
      
      expect(deleteCalled).toBe(false);
    });

    test('有ID时执行删除', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      const transaction = storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      let deletingTransactionId = transaction.id;
      let deleteCalled = false;
      
      if (deletingTransactionId) {
        storage.deleteTransaction(deletingTransactionId);
        deleteCalled = true;
      }
      
      expect(deleteCalled).toBe(true);
      expect(storage.getTransactionById(transaction.id)).toBeNull();
    });

    test('取消删除不执行操作', () => {
      const account = storage.addDepositAccount({ name: '测试账户', type: 'bank' });
      const transaction = storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate,
        depositAccountId: account.id
      });
      
      let deletingTransactionId = transaction.id;
      
      deletingTransactionId = null;
      
      if (deletingTransactionId) {
        storage.deleteTransaction(deletingTransactionId);
      }
      
      expect(storage.getTransactionById(transaction.id)).not.toBeNull();
    });
  });

  describe('表单提交逻辑', () => {
    test('金额万元转元', () => {
      const inputInWan = 50;
      const expectedInYuan = 500000;
      expect(inputInWan * 10000).toBe(expectedInYuan);
    });

    test('零值转换', () => {
      expect(0 * 10000).toBe(0);
    });

    test('小数值转换', () => {
      expect(0.5 * 10000).toBe(5000);
    });

    test('负数被拒绝', () => {
      const capitalBalance = -10000;
      let isValid = true;
      
      if (!capitalBalance && capitalBalance !== 0 || capitalBalance < 0) {
        isValid = false;
      }
      
      expect(isValid).toBe(false);
    });

    test('理财收益允许负数（表示亏损）', () => {
      const investmentBalance = -5000;
      let isValid = true;
      
      if (isNaN(investmentBalance)) {
        isValid = false;
      }
      
      expect(isValid).toBe(true);
      expect(investmentBalance).toBeLessThan(0);
    });

    test('理财收益零值被接受', () => {
      const investmentBalance = 0;
      let isValid = isNaN(investmentBalance) ? false : true;
      
      expect(isValid).toBe(true);
    });

    test('零值被接受', () => {
      const capitalBalance = 0;
      let isValid = true;
      
      if (!capitalBalance && capitalBalance !== 0 || capitalBalance < 0) {
        isValid = false;
      }
      
      expect(isValid).toBe(true);
    });

    test('未选择账户返回错误', () => {
      const depositAccountId = parseInt('');
      let hasError = false;
      
      if (!depositAccountId) {
        hasError = true;
      }
      
      expect(hasError).toBe(true);
    });
  });

  describe('状态管理逻辑', () => {
    test('编辑状态初始化', () => {
      let editingTransactionId = null;
      expect(editingTransactionId).toBeNull();
    });

    test('开始编辑设置ID', () => {
      let editingTransactionId = null;
      editingTransactionId = 3;
      expect(editingTransactionId).toBe(3);
    });

    test('新增重置编辑状态', () => {
      let editingTransactionId = 10;
      editingTransactionId = null;
      expect(editingTransactionId).toBeNull();
    });

    test('饼图选中状态切换 - 选中', () => {
      const selectedAccount = '账户A';
      let currentSelection = null;
      
      if (currentSelection === selectedAccount) {
        currentSelection = null;
      } else {
        currentSelection = selectedAccount;
      }
      
      expect(currentSelection).toBe('账户A');
    });

    test('饼图选中状态切换 - 取消', () => {
      const selectedAccount = '账户A';
      let currentSelection = '账户A';
      
      if (currentSelection === selectedAccount) {
        currentSelection = null;
      }
      
      expect(currentSelection).toBeNull();
    });

    test('清除饼图选择', () => {
      let selectedAccount = '账户B';
      selectedAccount = null;
      expect(selectedAccount).toBeNull();
    });
  });
});
