const fireGoalModule = {
  async refreshFireInfo() {
    const fireInfo = window.calculationService.getFireProgressInfo();
    
    const targetEl = document.getElementById('fire-target');
    if (targetEl) targetEl.textContent = fireInfo.fireTargetInWan + '万';
    
    const progressEl = document.getElementById('fire-progress');
    if (progressEl) progressEl.style.width = fireInfo.progressPercentage + '%';
    
    const percentageEl = document.getElementById('fire-percentage');
    if (percentageEl) percentageEl.textContent = fireInfo.progressPercentage + '%';
    
    const remainingEl = document.getElementById('fire-remaining');
    if (remainingEl) {
      remainingEl.textContent = `距离 FIRE 还需（万元）: ${fireInfo.remainingInWan}万`;
    }
    
    const yearsEl = document.getElementById('fire-years');
    if (yearsEl) {
      if (fireInfo.yearsToFire === 'loss') {
        yearsEl.innerHTML = `<span style="color: #ef4444; font-size: 1.2rem;">⚠ 当前亏损中，建议优化投资组合</span>`;
      } else {
        yearsEl.innerHTML = `还需 <span style="font-size: 1.4rem;">${fireInfo.yearsToFire}</span> 年实现 FIRE`;
      }
    }
  }
};

window.fireGoalModule = fireGoalModule;