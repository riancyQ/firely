class CalculationService {
  constructor(storageService) {
    this.storageService = storageService;
  }

  getAllTransactions() {
    return this.storageService.getTransactions();
  }

  getAllDepositAccounts() {
    return this.storageService.getDepositAccounts();
  }

  getUserInfo() {
    return this.storageService.getUserInfo();
  }

  getBalanceSummary() {
    const transactions = this.getAllTransactions();
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount || 0;
      } else if (t.type === 'expense') {
        totalExpense += t.amount || 0;
      }
    });
    
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    
    let capitalGrowth = 0;
    let investmentGrowth = 0;
    
    if (transactions.length >= 2) {
      const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const firstCapital = sortedTransactions[0].capitalBalance || 0;
      const lastCapital = sortedTransactions[sortedTransactions.length - 1].capitalBalance || 0;
      capitalGrowth = lastCapital - firstCapital;
      
      const firstInvestment = sortedTransactions[0].investmentBalance || 0;
      const lastInvestment = sortedTransactions[sortedTransactions.length - 1].investmentBalance || 0;
      investmentGrowth = lastInvestment - firstInvestment;
    }

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate: Math.round(savingsRate * 100) / 100,
      capitalGrowth,
      investmentGrowth
    };
  }

  getHealthStatus() {
    const transactions = this.getAllTransactions();
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    
    const monthlyData = {};
    incomeTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {};
      }
    });
    const monthsAsc = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    const monthCount = monthsAsc.length;
    
    if (monthCount <= 1) {
      return {
        status: 'unknown',
        statusText: '❓ 未知',
        message: '数据不足，无法计算储蓄率',
        color: '#6b7280'
      };
    }
    
    const annualSavings = this.getAnnualSavings();
    const userInfo = this.getUserInfo();
    const annualExpense = userInfo?.annualExpense || 0;
    const annualIncome = annualSavings + annualExpense;
    
    const savingsRate = annualIncome > 0 ? (annualSavings / annualIncome * 100) : 0;
    
    if (savingsRate >= 50) {
      return {
        status: 'healthy',
        statusText: '✅ 优秀',
        message: '储蓄率非常健康！继续保持',
        color: '#22c55e'
      };
    } else if (savingsRate > 0 && savingsRate < 50) {
      return {
        status: 'warning',
        statusText: '⚠️ 注意',
        message: '财务状况有待提高！储蓄率较低',
        color: '#eab308'
      };
    } else {
      return {
        status: 'danger',
        statusText: '❌ 危险',
        message: '储蓄率为负或零，需要调整支出习惯',
        color: '#ef4444'
      };
    }
  }

  getInvestmentHealthStatus() {
    const annualRateResult = this.getAnnualRate();
    
    let investmentRate = annualRateResult.rate;
    let status = 'unknown';
    let statusText = '❓ 未知';
    let message = '数据不足，无法计算年化利率';

    if (annualRateResult.value !== null) {
      const rateValue = annualRateResult.value * 100;
      if (rateValue >= 3.5) {
        status = 'healthy';
        statusText = '✅ 优秀';
        message = '理财收益表现优秀！继续保持';
      } else if (rateValue > 0 && rateValue < 3.5) {
        status = 'warning';
        statusText = '⚠️ 注意';
        message = '理财收益有待提高！可以考虑优化配置';
      } else {
        status = 'danger';
        statusText = '❌ 危险';
        message = '理财收益为负或零，需要调整投资策略';
      }
    }

    return {
      rate: investmentRate,
      status,
      statusText,
      message,
      color: status === 'healthy' ? '#22c55e' : status === 'warning' ? '#eab308' : status === 'unknown' ? '#6b7280' : '#ef4444'
    };
  }

  getMonthlySummary() {
    const transactions = this.getAllTransactions();
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const userInfo = this.getUserInfo();
    const userAnnualExpense = userInfo ? userInfo.annualExpense || 0 : 0;

    const monthlyData = {};
    incomeTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const capitalBalance = t.capitalBalance || t.amount || 0;
      const investmentBalance = t.investmentBalance || 0;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { year, totalCapital: 0, totalInvestment: 0 };
      }
      monthlyData[monthKey].totalCapital += capitalBalance;
      monthlyData[monthKey].totalInvestment += investmentBalance;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a));
    const currentMonthKey = sortedMonths[0] || null;
    const currentYear = new Date().getFullYear();
    const monthsAsc = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    
    const currentMonthCapital = currentMonthKey ? monthlyData[currentMonthKey].totalCapital : 0;
    
    let annualBalance = 'N/A';
    let annualBalanceValue = 0;
    const currentYearMonths = Object.keys(monthlyData).filter(k => monthlyData[k].year === currentYear);
    const lastYearMonths = Object.keys(monthlyData).filter(k => monthlyData[k].year === currentYear - 1);
    
    if (currentYearMonths.length > 0) {
      const currentYearTotal = currentYearMonths.reduce((sum, k) => sum + monthlyData[k].totalCapital, 0);
      if (lastYearMonths.length > 0) {
        const lastYearTotal = lastYearMonths.reduce((sum, k) => sum + monthlyData[k].totalCapital, 0);
        annualBalanceValue = currentYearTotal - lastYearTotal;
        const sign = annualBalanceValue >= 0 ? '+' : '';
        annualBalance = sign + this.formatMoney(annualBalanceValue);
      }
    }
    
    let monthlyBalance = 'N/A';
    let monthlyBalanceValue = 0;
    if (monthsAsc.length >= 2) {
      const currentMonth = monthsAsc[monthsAsc.length - 1];
      const prevMonth = monthsAsc[monthsAsc.length - 2];
      monthlyBalanceValue = monthlyData[currentMonth].totalCapital - monthlyData[prevMonth].totalCapital;
      const sign = monthlyBalanceValue >= 0 ? '+' : '';
      monthlyBalance = sign + this.formatMoney(monthlyBalanceValue);
    }
    
    let annualInvestment = 0;
    if (currentYearMonths.length > 0) {
      annualInvestment = currentYearMonths.reduce((sum, k) => sum + monthlyData[k].totalInvestment, 0);
    }
    
    let savingsRate = 'N/A';
    const monthCount = monthsAsc.length;
    
    if (monthCount >= 2) {
      const annualSavings = this.getAnnualSavings();
      
      if (annualSavings !== 'N/A') {
        const userInfo = this.getUserInfo();
        const annualExpense = userInfo?.annualExpense || 0;
        const annualIncome = annualSavings + annualExpense;
        
        if (annualIncome > 0) {
          const rate = (annualSavings / annualIncome * 100).toFixed(1);
          savingsRate = rate + '%';
        }
      }
    }

    return {
      currentMonthCapital,
      currentMonthCapitalFormatted: this.formatMoney(currentMonthCapital),
      annualBalance,
      annualBalanceValue,
      monthlyBalance,
      monthlyBalanceValue,
      annualInvestment,
      annualInvestmentFormatted: this.formatMoney(annualInvestment),
      savingsRate,
      monthlyData,
      monthsAsc
    };
  }

  formatMoney(amount) {
    return window.formatters.formatMoney(amount);
  }

  formatDate(dateStr) {
    return window.formatters.formatDate(dateStr);
  }

  getCapitalChartData() {
    const transactions = this.getAllTransactions();
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const monthlyData = {};
    incomeTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const monthLabel = (date.getMonth() + 1) + '月';
      const capitalBalance = t.capitalBalance || t.amount;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          label: monthLabel, 
          year: date.getFullYear(),
          total: 0,
          count: 0 
        };
      }
      monthlyData[monthKey].total += capitalBalance;
      monthlyData[monthKey].count++;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    
    const growthRates = {};
    for (let i = 1; i < sortedMonths.length; i++) {
      const current = sortedMonths[i];
      const previous = sortedMonths[i - 1];
      const growth = ((monthlyData[current].total - monthlyData[previous].total) / monthlyData[previous].total * 100).toFixed(1);
      growthRates[current] = parseFloat(growth);
    }
    
    let annualGrowth = 'N/A';
    if (sortedMonths.length >= 12) {
      const currentYearTotal = Object.keys(monthlyData)
        .filter(k => k.startsWith(String(new Date().getFullYear())))
        .reduce((sum, k) => sum + monthlyData[k].total, 0);
      const lastYearTotal = Object.keys(monthlyData)
        .filter(k => k.startsWith(String(new Date().getFullYear() - 1)))
        .reduce((sum, k) => sum + monthlyData[k].total, 0);
      if (lastYearTotal > 0) {
        annualGrowth = ((currentYearTotal - lastYearTotal) / lastYearTotal * 100).toFixed(1) + '%';
      }
    }

    return {
      monthlyData,
      sortedMonths,
      growthRates,
      annualGrowth,
      hasData: transactions.length > 0
    };
  }

  getInvestmentChartData() {
    const transactions = this.getAllTransactions();
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const monthlyData = {};
    incomeTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const monthLabel = (date.getMonth() + 1) + '月';
      const investmentBalance = t.investmentBalance || 0;
      const capitalBalance = t.capitalBalance || t.amount;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          label: monthLabel, 
          year: date.getFullYear(),
          totalInvestment: 0,
          totalCapital: 0
        };
      }
      monthlyData[monthKey].totalInvestment += investmentBalance;
      monthlyData[monthKey].totalCapital += capitalBalance;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    
    sortedMonths.forEach((monthKey, index) => {
      const prevMonthKey = index > 0 ? sortedMonths[index - 1] : null;
      if (!prevMonthKey) {
        monthlyData[monthKey].rate = 'N/A';
      } else {
        const prevCapital = monthlyData[prevMonthKey].totalCapital;
        monthlyData[monthKey].rate = prevCapital > 0 ? (monthlyData[monthKey].totalInvestment / prevCapital * 100).toFixed(1) : '0.0';
      }
    });
    
    const annualRateResult = this.getAnnualRate();
    const estimatedAnnualRate = annualRateResult.rate;

    return {
      monthlyData,
      sortedMonths,
      estimatedAnnualRate,
      hasData: transactions.length > 0
    };
  }

  getTransactionsGroupedByMonth() {
    const transactions = this.getAllTransactions();
    const depositAccounts = this.getAllDepositAccounts();
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const transactionsWithAccount = incomeTransactions.map(t => {
      const account = depositAccounts.find(a => a.id === t.depositAccountId);
      return {
        ...t,
        accountName: account ? account.name : '未知账户'
      };
    });

    const groupedByMonth = {};
    transactionsWithAccount.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const monthLabel = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = { label: monthLabel, transactions: [], totalCapital: 0, totalInvestment: 0 };
      }
      const capitalBalance = t.capitalBalance || t.amount;
      const investmentBalance = t.investmentBalance || 0;
      groupedByMonth[monthKey].totalCapital += capitalBalance;
      groupedByMonth[monthKey].totalInvestment += investmentBalance;
      groupedByMonth[monthKey].transactions.push(t);
    });

    const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

    return {
      groupedByMonth,
      sortedMonths,
      hasData: transactions.length > 0
    };
  }

  getDepositTypeLabel(type) {
    return window.formatters.getDepositTypeLabel(type);
  }

  getAnnualRate() {
    const transactions = this.getAllTransactions();
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const monthlyData = {};
    incomeTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const capitalBalance = t.capitalBalance || t.amount || 0;
      const investmentBalance = t.investmentBalance || 0;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { totalCapital: 0, totalInvestment: 0 };
      }
      monthlyData[monthKey].totalCapital += capitalBalance;
      monthlyData[monthKey].totalInvestment += investmentBalance;
    });

    const monthsAsc = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    const n = monthsAsc.length;

    if (n <= 1) {
      return { rate: 'N/A', value: null };
    } else if (n >= 2 && n <= 11) {
      let product = 1;
      for (let i = 1; i < monthsAsc.length; i++) {
        const currentMonth = monthsAsc[i];
        const prevMonth = monthsAsc[i - 1];
        if (monthlyData[prevMonth].totalCapital > 0) {
          const rate = monthlyData[currentMonth].totalInvestment / monthlyData[prevMonth].totalCapital;
          product *= (1 + rate);
        }
      }
      const annualRate = Math.pow(product, 12 / (n - 1)) - 1;
      return { rate: (annualRate * 100).toFixed(1) + '%', value: annualRate };
    } else {
      const recent12MonthsAsc = monthsAsc.slice(-12);
      let product = 1;
      for (let i = 1; i < recent12MonthsAsc.length; i++) {
        const currentMonth = recent12MonthsAsc[i];
        const prevMonth = recent12MonthsAsc[i - 1];
        if (monthlyData[prevMonth].totalCapital > 0) {
          const rate = monthlyData[currentMonth].totalInvestment / monthlyData[prevMonth].totalCapital;
          product *= (1 + rate);
        }
      }
      const annualRate = product - 1;
      return { rate: (annualRate * 100).toFixed(1) + '%', value: annualRate };
    }
  }

  getAnnualSavings() {
    const transactions = this.getAllTransactions();
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const monthlyData = {};
    incomeTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const capitalBalance = t.capitalBalance || t.amount || 0;
      const investmentBalance = t.investmentBalance || 0;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { totalCapital: 0, totalInvestment: 0 };
      }
      monthlyData[monthKey].totalCapital += capitalBalance;
      monthlyData[monthKey].totalInvestment += investmentBalance;
    });

    const monthsAsc = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    const monthCount = monthsAsc.length;

    if (monthCount <= 1) {
      return 'N/A';
    }

    let totalMonthlySavings = 0;
    for (let i = 1; i < monthsAsc.length; i++) {
      const currentMonth = monthsAsc[i];
      const prevMonth = monthsAsc[i - 1];
      const capitalChange = monthlyData[currentMonth].totalCapital - monthlyData[prevMonth].totalCapital;
      const investmentIncome = monthlyData[currentMonth].totalInvestment;
      totalMonthlySavings += capitalChange - investmentIncome;
    }

    let annualSavings;
    if (monthCount >= 12) {
      const recent12MonthsAsc = monthsAsc.slice(-12);
      annualSavings = 0;
      for (let i = 1; i < recent12MonthsAsc.length; i++) {
        const currentMonth = recent12MonthsAsc[i];
        const prevMonth = recent12MonthsAsc[i - 1];
        const capitalChange = monthlyData[currentMonth].totalCapital - monthlyData[prevMonth].totalCapital;
        const investmentIncome = monthlyData[currentMonth].totalInvestment;
        annualSavings += capitalChange - investmentIncome;
      }
    } else {
      annualSavings = (totalMonthlySavings / (monthCount - 1)) * 12;
    }

    return annualSavings;
  }

  getReturnRate() {
    const userInfo = this.getUserInfo();
    const riskProfile = userInfo?.riskProfile || 'moderate';
    switch(riskProfile) {
      case 'conservative': return 0.025;
      case 'aggressive': return 0.045;
      case 'moderate':
      default: return 0.035;
    }
  }

  getCapitalDistribution() {
    const transactions = this.getAllTransactions();
    const depositAccounts = this.getAllDepositAccounts();
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const transactionsWithAccount = incomeTransactions.map(t => {
      const account = depositAccounts.find(a => a.id === t.depositAccountId);
      return {
        ...t,
        accountName: account ? account.name : '未知账户'
      };
    });

    const now = new Date();
    const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    
    const monthlyTransactions = {};
    transactionsWithAccount.forEach(t => {
      const transactionDate = new Date(t.date);
      const transactionMonth = transactionDate.getFullYear() + '-' + String(transactionDate.getMonth() + 1).padStart(2, '0');
      if (!monthlyTransactions[transactionMonth]) {
        monthlyTransactions[transactionMonth] = [];
      }
      monthlyTransactions[transactionMonth].push(t);
    });
    
    const sortedMonths = Object.keys(monthlyTransactions).sort((a, b) => b.localeCompare(a));
    const displayMonth = sortedMonths.length > 0 ? sortedMonths[0] : currentMonth;
    const displayTransactions = monthlyTransactions[displayMonth] || [];
    
    const latestByAccount = {};
    displayTransactions.forEach(t => {
      const accountName = t.accountName || '未分类';
      if (!latestByAccount[accountName] || new Date(t.date) >= new Date(latestByAccount[accountName].date)) {
        latestByAccount[accountName] = t;
      }
    });
    
    const accountData = {};
    let totalCapital = 0;
    
    Object.keys(latestByAccount).forEach(accountName => {
      const t = latestByAccount[accountName];
      const capitalBalance = t.capitalBalance || t.amount;
      accountData[accountName] = { amount: capitalBalance };
      totalCapital += capitalBalance;
    });

    const accountList = Object.keys(accountData).map(accountName => ({
      name: accountName,
      amount: accountData[accountName].amount,
      percentage: totalCapital > 0 ? (accountData[accountName].amount / totalCapital * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    return {
      accountList,
      totalCapital,
      displayMonth,
      hasData: transactions.length > 0
    };
  }

  getFireProgressInfo() {
    const userInfo = this.getUserInfo();
    const userAnnualExpense = userInfo?.annualExpense || 0;
    const userAnnualIncome = userInfo?.annualIncome || 0;
    const returnRate = this.getReturnRate();

    const transactions = this.getAllTransactions();
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const monthlyData = {};
    incomeTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
      const capitalBalance = t.capitalBalance || t.amount || 0;
      const investmentBalance = t.investmentBalance || 0;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { totalCapital: 0, totalInvestment: 0 };
      }
      monthlyData[monthKey].totalCapital += capitalBalance;
      monthlyData[monthKey].totalInvestment += investmentBalance;
    });

    const monthsAsc = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b));
    const currentCapital = monthsAsc.length > 0 ? monthlyData[monthsAsc[monthsAsc.length - 1]].totalCapital : 0;
    
    const fireTarget = userAnnualExpense > 0 && returnRate > 0 ? (userAnnualExpense / returnRate) : 0;
    const remainingAmount = fireTarget - currentCapital;
    
    let annualSavings = 0;
    let annualRate = returnRate;
    const monthCount = monthsAsc.length;
    
    if (monthCount <= 1) {
      annualSavings = userAnnualIncome - userAnnualExpense;
      annualRate = returnRate;
    } else {
      const annualSavingsResult = this.getAnnualSavings();
      const annualRateResult = this.getAnnualRate();
      
      annualSavings = annualSavingsResult !== 'N/A' ? annualSavingsResult : 0;
      annualRate = annualRateResult.value !== null ? annualRateResult.value : returnRate;
    }
    
    let yearsToFire = '--';
    if (fireTarget > 0 && currentCapital >= 0 && annualSavings > 0) {
      const A = currentCapital;
      const S = annualSavings;
      const r = annualRate;
      const F = fireTarget;
      
      if (r >= 0) {
        if (r > 0) {
          const denominator = A * r + S;
          if (denominator > 0) {
            const numerator = Math.log((F * r + S) / denominator);
            const logDenominator = Math.log(1 + r);
            if (logDenominator !== 0 && !isNaN(numerator) && !isNaN(logDenominator)) {
              yearsToFire = Math.max(0, numerator / logDenominator).toFixed(1);
            }
          }
        } else if (r === 0) {
          yearsToFire = Math.max(0, (F - A) / S).toFixed(1);
        }
      } else {
        yearsToFire = 'loss';
      }
    }
    
    const progressPercentage = fireTarget > 0 ? Math.min(100, (currentCapital / fireTarget * 100)).toFixed(1) : 0;

    return {
      currentCapital,
      fireTarget,
      remainingAmount,
      progressPercentage,
      yearsToFire,
      annualSavings,
      annualRate,
      fireTargetInWan: (fireTarget / 10000).toFixed(2),
      remainingInWan: (remainingAmount / 10000).toFixed(2)
    };
  }

  getFireInfo(age = 30, gender = 'male', estimatedAnnualExpense = null, safeWithdrawalRate = 0.035, annualIncome = 0) {
    const summary = this.getBalanceSummary();
    const currentBalance = summary.balance;
    
    const userInfo = this.getUserInfo();
    const actualAnnualExpense = userInfo ? userInfo.annualExpense || 0 : summary.totalExpense * 12;
    
    const finalEstimatedExpense = estimatedAnnualExpense || actualAnnualExpense * 1.1;
    
    const fireTarget = finalEstimatedExpense / safeWithdrawalRate;
    
    const remainingAmount = Math.max(0, fireTarget - currentBalance);
    const progressPercentage = fireTarget > 0 ? Math.min(100, (currentBalance / fireTarget) * 100) : 0;
    
    const transactions = this.getAllTransactions();
    
    const monthlyData = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { capital: 0, investment: 0, savings: 0 };
      }
      monthlyData[monthKey].capital += t.capitalBalance || t.amount;
      monthlyData[monthKey].investment += t.investmentBalance || 0;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const n = sortedMonths.length;
    
    for (let i = 1; i < sortedMonths.length; i++) {
      const prevMonth = sortedMonths[i - 1];
      const currMonth = sortedMonths[i];
      monthlyData[currMonth].savings = monthlyData[currMonth].capital - monthlyData[prevMonth].capital - monthlyData[currMonth].investment;
    }
    
    let annualReturnRate = safeWithdrawalRate;
    
    if (n >= 2) {
      const monthsToUse = n >= 12 ? sortedMonths.slice(-12) : sortedMonths;
      let product = 1;
      monthsToUse.forEach((key, index) => {
        if (index > 0) {
          const prevCapital = monthlyData[monthsToUse[index - 1]].capital;
          const investment = monthlyData[key].investment;
          if (prevCapital > 0) {
            const monthlyRate = investment / prevCapital;
            product *= (1 + monthlyRate);
          }
        }
      });
      const monthsCount = monthsToUse.length - 1;
      if (monthsCount > 0) {
        annualReturnRate = n >= 12 ? product - 1 : Math.pow(product, 12 / monthsCount) - 1;
      }
    }
    
    const defaultAnnualSavings = annualIncome > finalEstimatedExpense ? annualIncome - finalEstimatedExpense : 0;
    
    let annualSavings = defaultAnnualSavings;
    
    if (n >= 2) {
      const monthsToUse = n >= 12 ? sortedMonths.slice(-12) : sortedMonths;
      const totalMonthlySavings = monthsToUse.reduce((sum, key) => sum + monthlyData[key].savings, 0);
      const monthsCount = monthsToUse.length - 1;
      
      if (n >= 2 && n <= 5) {
        const actualAnnualSavings = monthsCount > 0 ? totalMonthlySavings * (12 / monthsCount) : 0;
        annualSavings = (defaultAnnualSavings * 0.5 + actualAnnualSavings * 0.5);
      } else {
        annualSavings = monthsCount > 0 ? totalMonthlySavings * (12 / monthsCount) : 0;
      }
    }
    
    annualSavings = Math.max(0, annualSavings);
    const monthlySavings = annualSavings / 12;
    
    let yearsToFire = Infinity;
    if (annualSavings > 0 && remainingAmount > 0) {
      if (annualReturnRate > 0) {
        const numerator = Math.log((remainingAmount * annualReturnRate + annualSavings) / annualSavings);
        const denominator = Math.log(1 + annualReturnRate);
        yearsToFire = denominator > 0 ? numerator / denominator : Infinity;
      } else {
        yearsToFire = remainingAmount / annualSavings;
      }
    } else if (remainingAmount <= 0) {
      yearsToFire = 0;
    }

    return {
      currentBalance,
      actualAnnualExpense,
      estimatedAnnualExpense: finalEstimatedExpense,
      averageAnnualExpense: finalEstimatedExpense,
      age,
      gender,
      retirementAge: gender === 'female' ? 55 : 60,
      fireTarget,
      remainingAmount,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      monthlySavings: Math.round(monthlySavings * 100) / 100,
      yearsToFire: Math.round(yearsToFire * 100) / 100
    };
  }
}

const calculationService = new CalculationService(localStorageService);
window.calculationService = calculationService;