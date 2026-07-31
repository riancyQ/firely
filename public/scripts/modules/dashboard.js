const dashboardModule = {
  async refreshSummary() {
    const summary = window.calculationService.getMonthlySummary();
    
    const capitalBalanceEl = document.getElementById('capital-balance');
    if (capitalBalanceEl) capitalBalanceEl.textContent = summary.currentMonthCapitalFormatted;
    
    const annualBalanceEl = document.getElementById('annual-balance');
    if (annualBalanceEl) {
      annualBalanceEl.textContent = summary.annualBalance;
      annualBalanceEl.style.color = summary.annualBalanceValue >= 0 ? '#10b981' : '#ef4444';
    }
    
    const monthlyBalanceEl = document.getElementById('monthly-balance');
    if (monthlyBalanceEl) {
      monthlyBalanceEl.textContent = summary.monthlyBalance;
      monthlyBalanceEl.style.color = summary.monthlyBalanceValue >= 0 ? '#10b981' : '#ef4444';
    }
    
    const annualInvestmentEl = document.getElementById('annual-investment');
    if (annualInvestmentEl) {
      annualInvestmentEl.textContent = summary.annualInvestmentFormatted;
      annualInvestmentEl.style.color = summary.annualInvestment >= 0 ? '#10b981' : '#ef4444';
    }
    
    await window.healthModule.refreshHealthStatus();
  },

  async refreshFireInfo() {
    await window.fireGoalModule.refreshFireInfo();
  },

  async refreshDepositAccounts() {
    const accounts = window.storageService.getDepositAccounts();
    const select = document.getElementById('deposit-account-select');
    const list = document.getElementById('deposit-list');
    
    if (select) {
      select.innerHTML = '<option value="">请选择资金存放地</option>';
      accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.name + (account.type === 'bank' && account.repaymentDay ? ` (每月${account.repaymentDay}日还款)` : '');
        select.appendChild(option);
      });
    }
    
    if (list) {
      if (accounts.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>暂无资金账户，请添加</p></div>';
      } else {
        list.innerHTML = accounts.map(account => `
          <div class="deposit-item">
            <div class="deposit-info">
              <div class="deposit-name">${account.name}</div>
              <div class="deposit-type">${window.calculationService.getDepositTypeLabel(account.type)}</div>
            </div>
            <div class="deposit-repayment">
              ${account.type === 'bank' && account.repaymentDay ? `每月${account.repaymentDay}日` : '-'}
            </div>
            <div class="deposit-actions">
              <button onclick="openEditDepositModal(${account.id})">编辑</button>
              <button onclick="deleteDepositAccount(${account.id})">删除</button>
            </div>
          </div>
        `).join('');
      }
    }
  },

  async refreshTransactions(filter) {
    await window.incomeRecordsModule.refreshTransactions(filter);
  }
};

window.dashboardModule = dashboardModule;