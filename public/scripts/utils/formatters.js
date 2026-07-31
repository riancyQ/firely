const formatters = {
  formatMoney(amount) {
    const amountInWan = amount / 10000;
    return '¥ ' + amountInWan.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' 万';
  },

  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  formatMonth(monthKey) {
    if (!monthKey) return '';
    const parts = monthKey.split('-');
    return `${parts[0]}年${parts[1]}月`;
  },

  getDepositTypeLabel(type) {
    const labels = {
      bank: '🏦 还款账户',
      other: '💼 普通账户',
      alipay: '📱 支付宝',
      jd: '🛒 京东金融',
      wechat: '💬 微信余额',
      securities: '📈 证券公司'
    };
    return labels[type] || type;
  },

  getReturnRate(riskProfile) {
    switch(riskProfile) {
      case 'conservative': return 0.025;
      case 'aggressive': return 0.045;
      case 'moderate':
      default: return 0.035;
    }
  }
};

window.formatters = formatters;