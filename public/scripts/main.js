console.log('========== FIRELY App started ==========');

let editingTransactionId = null;
let editingAccountId = null;
let deletingTransactionId = null;

window.skipWelcome = function() {
  window.storageService.saveUserInfo({
    gender: 'male',
    annualIncome: 100000,
    annualExpense: 50000,
    riskProfile: 'moderate'
  });
  
  document.getElementById('welcome-modal').style.display = 'none';
  if (window.refreshData) {
    window.refreshData();
  }
};

window.saveUserInfo = async function() {
  try {
    console.log('saveUserInfo called');
    
    const incomeInput = document.getElementById('welcome-annual-income');
    const expenseInput = document.getElementById('welcome-annual-expense');
    const riskSelect = document.getElementById('welcome-risk-profile');
    
    if (!incomeInput || !expenseInput || !riskSelect) {
      alert('表单元素未找到');
      return;
    }
    
    const annualIncome = parseFloat(incomeInput.value);
    if (isNaN(annualIncome) || annualIncome <= 0) {
      alert('请输入有效的家庭年收入（大于0）');
      return;
    }
    
    const annualExpense = parseFloat(expenseInput.value);
    if (isNaN(annualExpense) || annualExpense < 0) {
      alert('请输入有效的家庭年支出（大于等于0）');
      return;
    }
    
    const riskProfile = riskSelect.value;
    if (!riskProfile) {
      alert('请选择您的家庭理财情况');
      return;
    }
    
    window.storageService.saveUserInfo({
      gender: 'male',
      annualIncome: annualIncome * 10000,
      annualExpense: annualExpense * 10000,
      riskProfile: riskProfile
    });
    
    document.getElementById('welcome-modal').style.display = 'none';
    
    if (window.refreshData) {
      await window.refreshData();
    }
    
    alert('保存成功！');
  } catch (error) {
    console.error('Error in saveUserInfo:', error);
    alert('保存失败: ' + error.message);
  }
};

async function saveDefaultUserInfo() {
  window.storageService.saveUserInfo({
    gender: 'male',
    annualIncome: 100000,
    annualExpense: 50000,
    riskProfile: 'moderate'
  });
  
  document.getElementById('welcome-modal').style.display = 'none';
  await window.refreshData();
}

async function refreshData() {
  await window.dashboardModule.refreshSummary();
  await window.dashboardModule.refreshTransactions('all');
  await window.dashboardModule.refreshFireInfo();
  await window.dashboardModule.refreshDepositAccounts();
}
window.refreshData = refreshData;

window.openUserInfoModal = function() {
  const userInfo = window.storageService.getUserInfo();
  if (userInfo) {
    document.getElementById('edit-annual-income').value = (userInfo.annualIncome / 10000).toFixed(2);
    document.getElementById('edit-annual-expense').value = (userInfo.annualExpense / 10000).toFixed(2);
    document.getElementById('edit-risk-profile').value = userInfo.riskProfile || '';
  }
  document.getElementById('user-info-modal').classList.add('active');
};

window.closeUserInfoModal = function() {
  document.getElementById('user-info-modal').classList.remove('active');
};

window.saveUserInfoEdit = async function() {
  try {
    const annualIncome = parseFloat(document.getElementById('edit-annual-income').value);
    const annualExpense = parseFloat(document.getElementById('edit-annual-expense').value);
    const riskProfile = document.getElementById('edit-risk-profile').value;
    
    if (isNaN(annualIncome) || annualIncome <= 0) {
      alert('请输入有效的家庭年收入（大于0）');
      return;
    }
    
    if (isNaN(annualExpense) || annualExpense < 0) {
      alert('请输入有效的家庭年支出（大于等于0）');
      return;
    }
    
    if (!riskProfile) {
      alert('请选择您的家庭理财情况');
      return;
    }
    
    const existingInfo = window.storageService.getUserInfo();
    
    await window.storageService.saveUserInfo({
      gender: existingInfo?.gender || 'male',
      annualIncome: annualIncome * 10000,
      annualExpense: annualExpense * 10000,
      riskProfile: riskProfile
    });
    
    closeUserInfoModal();
    await window.refreshData();
    alert('保存成功！');
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败: ' + error.message);
  }
};

window.openDepositListModal = function() {
  window.dashboardModule.refreshDepositAccounts();
  document.getElementById('deposit-list-modal').classList.add('active');
};

window.closeDepositListModal = function() {
  document.getElementById('deposit-list-modal').classList.remove('active');
};

window.openDepositModal = function() {
  document.getElementById('deposit-name-input').value = '';
  document.getElementById('deposit-repayment-select').value = 'no';
  document.getElementById('repayment-day-group').style.display = 'none';
  editingAccountId = null;
  document.getElementById('deposit-modal').classList.add('active');
};

window.closeDepositModal = function() {
  document.getElementById('deposit-modal').classList.remove('active');
};

window.toggleRepaymentDay = function() {
  const select = document.getElementById('deposit-repayment-select');
  const group = document.getElementById('repayment-day-group');
  group.style.display = select.value === 'yes' ? 'block' : 'none';
};

window.submitDepositAccount = function() {
  const name = document.getElementById('deposit-name-input').value;
  const isRepayment = document.getElementById('deposit-repayment-select').value === 'yes';
  const repaymentDay = isRepayment ? parseInt(document.getElementById('repayment-day-input').value) : null;
  
  if (!name.trim()) {
    alert('请输入账户名称');
    return;
  }
  
  const accountData = {
    name: name.trim(),
    type: isRepayment ? 'bank' : 'other',
    repaymentDay: repaymentDay
  };
  
  if (editingAccountId) {
    window.storageService.updateDepositAccount(editingAccountId, accountData);
  } else {
    window.storageService.addDepositAccount(accountData);
  }
  
  closeDepositModal();
  window.refreshData();
};

window.openEditDepositModal = function(accountId) {
  editingAccountId = accountId;
  const account = window.storageService.getDepositAccountById(accountId);
  if (account) {
    document.getElementById('deposit-name-input').value = account.name;
    document.getElementById('deposit-repayment-select').value = account.type === 'bank' && account.repaymentDay ? 'yes' : 'no';
    document.getElementById('repayment-day-input').value = account.repaymentDay || 1;
    toggleRepaymentDay();
    document.getElementById('deposit-modal').classList.add('active');
  }
};

window.deleteDepositAccount = function(accountId) {
  if (confirm('确定要删除这个账户吗？')) {
    window.storageService.deleteDepositAccount(accountId);
    window.refreshData();
  }
};

window.openAddModal = function() {
  editingTransactionId = null;
  window.dashboardModule.refreshDepositAccounts();
  document.getElementById('capital-balance-input').value = '';
  document.getElementById('investment-balance-input').value = '';
  document.getElementById('description-input').value = '';
  document.getElementById('date-input').value = new Date().toISOString().split('T')[0];
  
  const modalTitle = document.querySelector('#modal-overlay .modal-title');
  if (modalTitle) {
    modalTitle.textContent = '添加收入记录';
  }
  
  const submitBtn = document.querySelector('#modal-overlay .btn-submit');
  if (submitBtn) {
    submitBtn.textContent = '确认添加';
  }
  
  document.getElementById('modal-overlay').classList.add('active');
};

window.closeModal = function() {
  document.getElementById('modal-overlay').classList.remove('active');
  editingTransactionId = null;
};

window.submitTransaction = function() {
  const depositAccountId = parseInt(document.getElementById('deposit-account-select').value);
  const capitalBalanceInput = document.getElementById('capital-balance-input').value;
  const investmentBalanceInput = document.getElementById('investment-balance-input').value;
  
  const capitalBalance = capitalBalanceInput ? parseFloat(capitalBalanceInput) : 0;
  const investmentBalance = investmentBalanceInput ? parseFloat(investmentBalanceInput) : 0;
  const description = document.getElementById('description-input').value;
  const date = document.getElementById('date-input').value;

  if (!depositAccountId) {
    alert('请选择资金存放地');
    return;
  }

  if (!capitalBalance && capitalBalance !== 0 || capitalBalance < 0) {
    alert('请输入有效的资金余额（必须大于等于0）');
    return;
  }

  const depositAccounts = window.storageService.getDepositAccounts();
  const selectedAccount = depositAccounts.find(a => a.id === depositAccountId);
  
  if (selectedAccount.type === 'bank' && !selectedAccount.repaymentDay) {
    const today = new Date();
    const day = today.getDate();
    if (day <= 15) {
      alert('⚠️ 您尚未设置该银行的还款日，还款所导致的减少金额可能会显示在下个月总金额中');
    }
  }

  try {
    const data = { 
      type: 'income', 
      category: 'income',
      amount: capitalBalance,
      capitalBalance,
      investmentBalance,
      description, 
      date, 
      depositAccountId 
    };
    
    if (editingTransactionId) {
      window.storageService.updateTransaction(editingTransactionId, data);
    } else {
      window.storageService.addTransaction(data);
    }

    window.closeModal();
    window.refreshData();
    editingTransactionId = null;
  } catch (error) {
    alert('操作失败: ' + error.message);
  }
};

window.openEditModal = function(transactionId) {
  editingTransactionId = transactionId;
  window.dashboardModule.refreshDepositAccounts();
  const transaction = window.storageService.getTransactionById(transactionId);
  
  if (!transaction) {
    alert('无法获取交易记录，请刷新页面重试');
    return;
  }
  
  document.getElementById('deposit-account-select').value = transaction.depositAccountId || '';
  document.getElementById('capital-balance-input').value = transaction.capitalBalance ? transaction.capitalBalance.toFixed(2) : '';
  document.getElementById('investment-balance-input').value = transaction.investmentBalance ? transaction.investmentBalance.toFixed(2) : '';
  document.getElementById('description-input').value = transaction.description || '';
  document.getElementById('date-input').value = transaction.date || '';
  
  const modalTitle = document.querySelector('#modal-overlay .modal-title');
  if (modalTitle) {
    modalTitle.textContent = '修改收入记录';
  }
  
  const submitBtn = document.querySelector('#modal-overlay .btn-submit');
  if (submitBtn) {
    submitBtn.textContent = '确认修改';
  }
  
  document.getElementById('modal-overlay').classList.add('active');
};

window.deleteTransaction = function(transactionId) {
  deletingTransactionId = transactionId;
  document.getElementById('delete-confirm-modal').classList.add('active');
};

window.closeDeleteConfirmModal = function() {
  document.getElementById('delete-confirm-modal').classList.remove('active');
  deletingTransactionId = null;
};

window.confirmDeleteTransaction = function() {
  if (deletingTransactionId) {
    window.storageService.deleteTransaction(deletingTransactionId);
    window.refreshData();
  }
  closeDeleteConfirmModal();
};

window.toggleDataDropdown = function() {
  document.getElementById('data-dropdown').classList.toggle('show');
};

window.handleExportData = function() {
  const exportData = window.storageService.exportData();
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `firely_export_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  document.getElementById('data-dropdown').classList.remove('show');
};

window.triggerImportData = function() {
  document.getElementById('import-file-input').click();
  document.getElementById('data-dropdown').classList.remove('show');
};

window.handleFileSelect = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!confirm('导入数据将覆盖现有数据，确定继续吗？')) {
    event.target.value = '';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const importData = JSON.parse(e.target.result);
      const result = window.storageService.importData(importData);
      alert(result.message);
      if (result.success) {
        window.refreshData();
      }
    } catch (error) {
      alert('文件格式错误: ' + error.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
};

window.handlePieClick = function(accountName) {
  if (window.incomeRecordsModule) {
    if (window.incomeRecordsModule.selectedAccount === accountName) {
      window.incomeRecordsModule.selectedAccount = null;
    } else {
      window.incomeRecordsModule.selectedAccount = accountName;
    }
    const container = document.getElementById('transaction-list');
    if (container) {
      window.incomeRecordsModule.displayDistribution(container);
    }
  }
};

window.clearPieSelection = function() {
  if (window.incomeRecordsModule) {
    window.incomeRecordsModule.selectedAccount = null;
    const container = document.getElementById('transaction-list');
    if (container) {
      window.incomeRecordsModule.displayDistribution(container);
    }
  }
};

document.addEventListener('click', function(event) {
  try {
    const dropdown = document.getElementById('data-dropdown');
    if (dropdown && !dropdown.contains(event.target)) {
      dropdown.classList.remove('show');
    }
  } catch (e) {
    console.error('Dropdown error:', e);
  }
});

document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOMContentLoaded event fired');
  
  try {
    const tabs = document.querySelectorAll('.tab');
    console.log('Found', tabs.length, 'tabs');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        console.log('Tab clicked:', this.dataset.tab);
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.tab;
        if (window.dashboardModule) {
          window.dashboardModule.refreshTransactions(filter);
        } else {
          console.error('dashboardModule not found');
        }
      });
    });
    
    console.log('Tab events bound successfully');
  } catch (e) {
    console.error('Tab binding error:', e);
  }
  
  try {
    const userInfo = window.storageService.getUserInfo();
    
    if (!userInfo) {
      document.getElementById('welcome-modal').style.display = 'flex';
    } else {
      document.getElementById('welcome-modal').style.display = 'none';
      await window.refreshData();
    }
  } catch (e) {
    console.error('Init error:', e);
  }
});