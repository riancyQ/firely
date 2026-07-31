const healthModule = {
  async refreshHealthStatus() {
    const summary = window.calculationService.getMonthlySummary();
    
    const healthStatus = window.calculationService.getHealthStatus();
    this.updateHealthStatus('health', healthStatus, summary.savingsRate);
    
    const investmentHealthStatus = window.calculationService.getInvestmentHealthStatus();
    this.updateHealthStatus('investment-health', investmentHealthStatus, investmentHealthStatus.rate);
  },

  updateHealthStatus(prefix, status, rateValue) {
    const lightEl = document.getElementById(`${prefix}-light`);
    const statusEl = document.getElementById(`${prefix}-status`);
    const messageEl = document.getElementById(`${prefix}-message`);
    const rateEl = document.getElementById(`${prefix}-savings-rate`);
    
    if (rateEl) rateEl.textContent = rateValue;
    if (lightEl) lightEl.className = `health-light ${status.status}`;
    if (statusEl) statusEl.textContent = status.statusText;
    if (messageEl) messageEl.textContent = status.message;
  }
};

window.healthModule = healthModule;