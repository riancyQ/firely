const validators = {
  isNotEmpty(value) {
    return value !== null && value !== undefined && value !== '';
  },

  isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  },

  isPositiveNumber(value) {
    return this.isNumber(value) && value > 0;
  },

  isValidDate(dateStr) {
    if (dateStr === null || dateStr === undefined || dateStr === '') {
      return false;
    }
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  },

  validateTransaction(transaction) {
    const errors = [];
    
    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      errors.push('交易类型无效');
    }
    
    if (!this.isPositiveNumber(transaction.amount)) {
      errors.push('金额必须为正数');
    }
    
    if (!this.isValidDate(transaction.date)) {
      errors.push('日期格式无效');
    }
    
    if (!transaction.depositAccountId) {
      errors.push('请选择资金账户');
    }
    
    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  },

  validateDepositAccount(account) {
    const errors = [];
    
    if (!this.isNotEmpty(account.name)) {
      errors.push('账户名称不能为空');
    }
    
    if (!account.type || !['bank', 'other', 'alipay', 'jd', 'wechat', 'securities'].includes(account.type)) {
      errors.push('账户类型无效');
    }
    
    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  },

  validateUserInfo(userInfo) {
    const errors = [];
    
    if (!this.isPositiveNumber(userInfo.annualIncome)) {
      errors.push('年收入必须为正数');
    }
    
    if (!this.isPositiveNumber(userInfo.annualExpense)) {
      errors.push('年支出必须为正数');
    }
    
    if (!userInfo.riskProfile || !['conservative', 'moderate', 'aggressive'].includes(userInfo.riskProfile)) {
      errors.push('风险偏好无效');
    }
    
    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }
};

window.validators = validators;