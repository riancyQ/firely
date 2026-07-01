global.localStorage = {
  data: {},
  getItem: function(key) { return this.data[key] || null; },
  setItem: function(key, value) { this.data[key] = value; },
  removeItem: function(key) { delete this.data[key]; },
  clear: function() { this.data = {}; }
};

global.localStorageService = {
  getTransactions: function() {
    const data = localStorage.getItem('firely_transactions');
    return data ? JSON.parse(data) : [];
  },
  getTransactionById: function(id) {
    const transactions = this.getTransactions();
    return transactions.find(t => t.id === id);
  },
  addTransaction: function(transaction) {
    const transactions = this.getTransactions();
    transactions.push(transaction);
    localStorage.setItem('firely_transactions', JSON.stringify(transactions));
    return transaction;
  },
  updateTransaction: function(id, transaction) {
    const transactions = this.getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...transaction };
      localStorage.setItem('firely_transactions', JSON.stringify(transactions));
    }
    return transactions[index];
  },
  deleteTransaction: function(id) {
    const transactions = this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    localStorage.setItem('firely_transactions', JSON.stringify(filtered));
    return filtered;
  },
  getDepositAccounts: function() {
    const data = localStorage.getItem('firely_deposit_accounts');
    return data ? JSON.parse(data) : [];
  },
  getDepositAccountById: function(id) {
    const accounts = this.getDepositAccounts();
    return accounts.find(a => a.id === id);
  },
  addDepositAccount: function(account) {
    const accounts = this.getDepositAccounts();
    accounts.push(account);
    localStorage.setItem('firely_deposit_accounts', JSON.stringify(accounts));
    return account;
  },
  updateDepositAccount: function(id, account) {
    const accounts = this.getDepositAccounts();
    const index = accounts.findIndex(a => a.id === id);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...account };
      localStorage.setItem('firely_deposit_accounts', JSON.stringify(accounts));
    }
    return accounts[index];
  },
  deleteDepositAccount: function(id) {
    const accounts = this.getDepositAccounts();
    const filtered = accounts.filter(a => a.id !== id);
    localStorage.setItem('firely_deposit_accounts', JSON.stringify(filtered));
    return filtered;
  },
  getUserInfo: function() {
    const data = localStorage.getItem('firely_user_info');
    return data ? JSON.parse(data) : null;
  },
  saveUserInfo: function(userInfo) {
    localStorage.setItem('firely_user_info', JSON.stringify(userInfo));
    return userInfo;
  }
};