class LocalStorageService {
  constructor() {
    this.TRANSACTIONS_KEY = 'firely_transactions';
    this.DEPOSIT_ACCOUNTS_KEY = 'firely_deposit_accounts';
    this.USER_INFO_KEY = 'firely_user_info';
    this.NEXT_ID_KEY_PREFIX = 'firely_next_id_';
  }

  getNextId(tableName) {
    const key = this.NEXT_ID_KEY_PREFIX + tableName;
    let nextId = parseInt(localStorage.getItem(key)) || 1;
    localStorage.setItem(key, nextId + 1);
    return nextId;
  }

  getTransactions() {
    try {
      const data = localStorage.getItem(this.TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  setTransactions(transactions) {
    localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
  }

  addTransaction(transaction) {
    const transactions = this.getTransactions();
    const id = this.getNextId('transactions');
    const createdAt = new Date().toISOString();
    const newTransaction = {
      id,
      ...transaction,
      createdAt
    };
    transactions.push(newTransaction);
    this.setTransactions(transactions);
    return newTransaction;
  }

  updateTransaction(id, data) {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...data };
      this.setTransactions(transactions);
      return true;
    }
    return false;
  }

  deleteTransaction(id) {
    const transactions = this.getTransactions();
    const newTransactions = transactions.filter(t => t.id !== id);
    if (newTransactions.length !== transactions.length) {
      this.setTransactions(newTransactions);
      return true;
    }
    return false;
  }

  getTransactionById(id) {
    const transactions = this.getTransactions();
    return transactions.find(t => t.id === id) || null;
  }

  getDepositAccounts() {
    try {
      const data = localStorage.getItem(this.DEPOSIT_ACCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  setDepositAccounts(accounts) {
    localStorage.setItem(this.DEPOSIT_ACCOUNTS_KEY, JSON.stringify(accounts));
  }

  addDepositAccount(account) {
    const accounts = this.getDepositAccounts();
    const id = this.getNextId('deposit_accounts');
    const createdAt = new Date().toISOString();
    const newAccount = {
      id,
      ...account,
      createdAt
    };
    accounts.push(newAccount);
    this.setDepositAccounts(accounts);
    return newAccount;
  }

  updateDepositAccount(id, data) {
    const accounts = this.getDepositAccounts();
    const index = accounts.findIndex(a => a.id === id);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...data };
      this.setDepositAccounts(accounts);
      return true;
    }
    return false;
  }

  deleteDepositAccount(id) {
    const accounts = this.getDepositAccounts();
    const newAccounts = accounts.filter(a => a.id !== id);
    if (newAccounts.length !== accounts.length) {
      this.setDepositAccounts(newAccounts);
      return true;
    }
    return false;
  }

  getDepositAccountById(id) {
    const accounts = this.getDepositAccounts();
    return accounts.find(a => a.id === id) || null;
  }

  getUserInfo() {
    try {
      const data = localStorage.getItem(this.USER_INFO_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveUserInfo(userInfo) {
    const createdAt = new Date().toISOString();
    const data = {
      ...userInfo,
      createdAt
    };
    localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(data));
    return data;
  }

  clearAll() {
    localStorage.removeItem(this.TRANSACTIONS_KEY);
    localStorage.removeItem(this.DEPOSIT_ACCOUNTS_KEY);
    localStorage.removeItem(this.USER_INFO_KEY);
    localStorage.removeItem(this.NEXT_ID_KEY_PREFIX + 'transactions');
    localStorage.removeItem(this.NEXT_ID_KEY_PREFIX + 'deposit_accounts');
    localStorage.removeItem(this.NEXT_ID_KEY_PREFIX + 'user_info');
  }

  exportData() {
    const transactions = this.getTransactions();
    const depositAccounts = this.getDepositAccounts();
    const userInfo = this.getUserInfo();
    
    const nextIds = {
      transactions: parseInt(localStorage.getItem(this.NEXT_ID_KEY_PREFIX + 'transactions')) || 1,
      depositAccounts: parseInt(localStorage.getItem(this.NEXT_ID_KEY_PREFIX + 'deposit_accounts')) || 1
    };

    const exportData = {
      appVersion: '2.0',
      exportTime: new Date().toISOString(),
      data: {
        transactions,
        depositAccounts,
        userInfo,
        nextIds
      }
    };

    return exportData;
  }

  importData(exportData) {
    if (!exportData || !exportData.data) {
      return { success: false, message: '文件格式错误，缺少数据内容' };
    }

    const appVersion = exportData.appVersion || '1.0';
    if (appVersion > '2.0') {
      return { success: false, message: '文件版本过高，请升级应用后再导入' };
    }

    const data = exportData.data;
    
    try {
      this.clearAll();

      if (data.transactions && Array.isArray(data.transactions)) {
        this.setTransactions(data.transactions);
      }

      if (data.depositAccounts && Array.isArray(data.depositAccounts)) {
        this.setDepositAccounts(data.depositAccounts);
      }

      if (data.userInfo) {
        this.saveUserInfo(data.userInfo);
      }

      if (data.nextIds) {
        if (data.nextIds.transactions) {
          localStorage.setItem(this.NEXT_ID_KEY_PREFIX + 'transactions', data.nextIds.transactions);
        }
        if (data.nextIds.depositAccounts) {
          localStorage.setItem(this.NEXT_ID_KEY_PREFIX + 'deposit_accounts', data.nextIds.depositAccounts);
        }
      }

      let message = '数据导入成功';
      if (appVersion < '2.0') {
        message += '（数据来自旧版本，可能存在兼容性问题）';
      }

      return { success: true, message };
    } catch (error) {
      return { success: false, message: '导入失败：' + error.message };
    }
  }
}

const localStorageService = new LocalStorageService();
window.localStorageService = localStorageService;