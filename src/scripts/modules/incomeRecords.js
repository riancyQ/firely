const incomeRecordsModule = {
  selectedAccount: null,

  async refreshTransactions(filter) {
    const headerElement = document.getElementById('transaction-header');
    if (headerElement) {
      if (filter === 'capital' || filter === 'investment' || filter === 'distribution') {
        headerElement.style.display = 'none';
      } else {
        headerElement.style.display = 'flex';
      }
    }
    
    this.displayTransactions([], filter);
  },

  displayTransactions(transactions, filter) {
    const container = document.getElementById('transaction-list');
    
    if (!container) {
      return;
    }

    if (filter === 'distribution') {
      this.displayDistribution(container);
    } else if (filter === 'investment') {
      this.displayInvestmentChart(container);
    } else if (filter === 'capital') {
      this.displayCapitalChart(container);
    } else {
      this.displayTransactionList(container);
    }
  },

  displayDistribution(container) {
    const distribution = window.calculationService.getCapitalDistribution();
    const { accountList, totalCapital, displayMonth, hasData } = distribution;
    
    if (!hasData) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>暂无资金记录</p>
          <p style="font-size: 0.85rem;">请在"全部收入"标签页添加资金记录</p>
        </div>
      `;
      return;
    }
    
    const colors = [
      '#667eea', '#764ba2', '#f093fb', '#f5576c', 
      '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
      '#fa709a', '#fee140', '#fdb99b', '#e0c3fc'
    ];
    
    const chartSize = 380;
    const centerX = chartSize / 2;
    const centerY = chartSize / 2;
    const radius = 120;
    const padding = 55;
    
    let html = `<div class="chart-section" style="text-align: center; padding: 20px;">`;
    html += `<h3 style="margin-bottom: 20px; font-size: 1.25rem; color: #333;">资金余额分布 <span style="font-size: 0.8rem; font-weight: 400; color: #999;">(${displayMonth})</span></h3>`;
    
    html += `<div class="pie-chart-container" style="display: inline-block;"><svg viewBox="0 0 ${chartSize} ${chartSize}" class="pie-chart" style="width: ${chartSize}px; height: ${chartSize}px;">`;
    
    let currentAngle = 0;
    let colorIndex = 0;
    const usedLabelPositions = [];
    
    accountList.forEach(item => {
      const accountName = item.name;
      const amount = item.amount;
      const percentage = totalCapital > 0 ? (amount / totalCapital * 100).toFixed(1) : '0';
      const percentageValue = parseFloat(percentage);
      const angle = (amount / totalCapital) * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      const color = colors[colorIndex % colors.length];
      const isSelected = accountName === this.selectedAccount;
      const sliceStroke = isSelected ? '#333' : '#fff';
      const sliceStrokeWidth = isSelected ? '3' : '2';
      const sliceOpacity = (!this.selectedAccount || isSelected) ? '1' : '0.4';
      
      html += `<path d="${pathD}" fill="${color}" stroke="${sliceStroke}" stroke-width="${sliceStrokeWidth}" class="pie-slice" style="cursor: pointer; opacity: ${sliceOpacity};" onclick="handlePieClick('${accountName}')" />`;
      
      const midAngle = (startAngle + endAngle) / 2;
      const midRad = (midAngle - 90) * (Math.PI / 180);
      const showLabels = !this.selectedAccount || isSelected;
      
      if (percentageValue < 5 && percentageValue > 0) {
        const lineEndX = centerX + (radius + 15) * Math.cos(midRad);
        const lineEndY = centerY + (radius + 15) * Math.sin(midRad);
        
        let labelX, labelY;
        const labelOffset = radius + 85;
        let normalizedAngle = midAngle % 360;
        if (normalizedAngle < 0) normalizedAngle += 360;
        
        if (normalizedAngle >= 30 && normalizedAngle < 150) {
          labelX = chartSize - padding - 15;
          labelY = centerY + (normalizedAngle - 90) * 0.4;
        } else if (normalizedAngle >= 150 && normalizedAngle < 330) {
          labelX = padding + 15;
          labelY = centerY + (normalizedAngle - 180) * 0.3;
        } else {
          labelX = centerX + (normalizedAngle < 180 ? 1 : -1) * labelOffset * 0.8;
          labelY = normalizedAngle < 30 ? padding + 25 : chartSize - padding - 25;
        }
        
        labelX = Math.max(padding + 20, Math.min(chartSize - padding - 20, labelX));
        labelY = Math.max(padding + 25, Math.min(chartSize - padding - 25, labelY));
        
        if (showLabels) {
          let offsetY = 0;
          const minDistance = 30;
          for (const pos of usedLabelPositions) {
            const dist = Math.sqrt(Math.pow(labelX - pos.x, 2) + Math.pow(labelY + offsetY - pos.y, 2));
            if (dist < minDistance) {
              offsetY += 20;
            }
          }
          const finalLabelY = labelY + offsetY;
          usedLabelPositions.push({ x: labelX, y: finalLabelY });
          
          const isLeft = midRad > Math.PI/2 || midRad < -Math.PI/2;
          const textAnchor = isLeft ? 'end' : 'start';
          
          html += `<line x1="${(x1 + x2) / 2}" y1="${(y1 + y2) / 2}" x2="${lineEndX}" y2="${lineEndY}" stroke="#999" stroke-width="1" stroke-dasharray="3,2" />`;
          html += `<line x1="${lineEndX}" y1="${lineEndY}" x2="${labelX}" y2="${finalLabelY}" stroke="#999" stroke-width="1" stroke-dasharray="3,2" />`;
          html += `<text x="${labelX}" y="${finalLabelY}" text-anchor="${textAnchor}" font-size="12" font-weight="600" fill="#333">${percentage}%</text>`;
        }
      } else if (percentageValue >= 5) {
        if (showLabels) {
          const innerRadius = radius * 0.65;
          const innerX = centerX + innerRadius * Math.cos(midRad);
          const innerY = centerY + innerRadius * Math.sin(midRad);
          html += `<text x="${innerX}" y="${innerY}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="600" fill="white">${percentage}%</text>`;
        }
      }
      
      currentAngle = endAngle;
      colorIndex++;
    });
    
    html += `</svg></div>`;
    
    html += `<div style="margin-top: 20px; text-align: left; max-width: 300px; margin-left: auto; margin-right: auto;">`;
    
    if (this.selectedAccount) {
      html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">`;
      html += `<div style="font-size: 14px; font-weight: 600; color: #333;">资金明细 <span style="color: #667eea; font-weight: 400;">(筛选: ${this.selectedAccount})</span></div>`;
      html += `<button onclick="clearPieSelection()" style="font-size: 12px; color: #667eea; background: none; border: 1px solid #667eea; border-radius: 4px; padding: 4px 10px; cursor: pointer;">显示全部</button>`;
      html += `</div>`;
    } else {
      html += `<div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">资金明细 <span style="font-weight: 400; color: #999; font-size: 12px;">(点击饼图筛选)</span></div>`;
    }
    
    colorIndex = 0;
    let filteredList = this.selectedAccount 
      ? accountList.filter(item => item.name === this.selectedAccount)
      : accountList;
    let filteredTotal = this.selectedAccount 
      ? filteredList.reduce((sum, item) => sum + item.amount, 0)
      : totalCapital;
    
    filteredList.forEach(item => {
      const accountName = item.name;
      const amount = item.amount;
      const percentage = totalCapital > 0 ? (item.amount / totalCapital * 100).toFixed(1) : '0';
      const color = colors[colorIndex % colors.length];
      
      const isSelected = accountName === this.selectedAccount;
      const bgColor = isSelected ? '#f0f4ff' : 'transparent';
      
      html += `<div style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #f5f5f5; background-color: ${bgColor};" data-account="${accountName}">`;
      html += `<div style="width: 16px; height: 16px; border-radius: 3px; background-color: ${color}; margin-right: 12px; flex-shrink: 0;"></div>`;
      html += `<div style="flex: 1; min-width: 0;">`;
      html += `<div style="font-size: 14px; font-weight: 500; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${accountName}${isSelected ? ' ✓' : ''}</div>`;
      html += `<div style="font-size: 12px; color: #999;">占比 ${percentage}%</div>`;
      html += `</div>`;
      html += `<div style="font-size: 14px; font-weight: 600; color: #667eea; margin-left: 12px;">${window.calculationService.formatMoney(amount)}</div>`;
      html += `</div>`;
      
      colorIndex++;
    });
    
    html += `<div style="margin-top: 12px; padding-top: 12px; border-top: 2px solid #eee;">`;
    html += `<div style="display: flex; justify-content: space-between; align-items: center;">`;
    html += `<span style="font-size: 14px; font-weight: 600; color: #333;">${this.selectedAccount ? '筛选金额' : '资金总余额'}</span>`;
    html += `<span style="font-size: 16px; font-weight: 700; color: #667eea;">${window.calculationService.formatMoney(filteredTotal)}</span>`;
    html += `</div>`;
    html += `</div>`;
    
    html += `</div></div>`;
    
    container.innerHTML = html;
  },

  displayInvestmentChart(container) {
    const investmentData = window.calculationService.getInvestmentChartData();
    const { monthlyData, sortedMonths, estimatedAnnualRate, hasData } = investmentData;
    
    if (!hasData) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>暂无趋势数据</p>
        </div>
      `;
      return;
    }

    const chartHeight = 280;
    const chartWidth = 500;
    const padding = { top: 50, right: 70, bottom: 55, left: 70 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    
    // 计算 Y 轴范围，同时考虑正负数
    const allInvestments = Object.values(monthlyData).map(d => d.totalInvestment);
    const maxInvestment = Math.max(...allInvestments, 0);
    const minInvestment = Math.min(...allInvestments, 0);
    // 计算合适的刻度步长，确保 0 落在刻度线上
    const targetTicks = 5;
    const rawRange = Math.max(maxInvestment - minInvestment, 10000);
    const baseStep = rawRange / targetTicks;
    const magnitude = Math.pow(10, Math.floor(Math.log10(baseStep)));
    const normalized = baseStep / magnitude;
    const niceStep = magnitude * (normalized > 5 ? 10 : normalized > 2 ? 5 : 2);
    // 让 max/min 都是 step 的整数倍，确保刻度包含 0
    const maxInvestmentCeil = Math.ceil(maxInvestment / niceStep) * niceStep;
    const minInvestmentFloor = Math.floor(minInvestment / niceStep) * niceStep;
    const yRange = maxInvestmentCeil - minInvestmentFloor;
    // 实际刻度数 = yRange / niceStep（保证刻度间隔为 niceStep，0 必在刻度上）
    const yAxisTicks = Math.round(yRange / niceStep);
    // 零线位置（投资收益为 0 的水平线）
    const zeroY = padding.top + (maxInvestmentCeil / yRange) * innerHeight;
    
    const latestMonth = sortedMonths[sortedMonths.length - 1];
    const latestRate = monthlyData[latestMonth]?.rate;
    let latestRateDisplay = 'N/A';
    let latestRateColor = '#9ca3af';
    if (latestRate && latestRate !== 'N/A') {
      const rateValue = parseFloat(latestRate);
      latestRateDisplay = rateValue >= 0 ? '+' + latestRate + '%' : latestRate + '%';
      latestRateColor = rateValue >= 0 ? '#10b981' : '#ef4444';
    }
    
    let html = `<div class="chart-section" style="padding: 20px; text-align: center;">`;
    html += `<div class="chart-header">`;
    html += `<h3>理财收益趋势</h3>`;
    html += `<div class="growth-summary">`;
    html += `<div class="growth-item"><span class="growth-label">本月收益率</span><span class="growth-value" style="color: ${latestRateColor};">${latestRateDisplay}</span></div>`;
    html += `<div class="growth-item"><span class="growth-label">年化收益率</span><span class="growth-value" style="color: #667eea;">${estimatedAnnualRate}</span></div>`;
    html += `</div>`;
    html += `</div>`;
    
    html += `<svg viewBox="0 0 ${chartWidth} ${chartHeight}" style="width: ${chartWidth}px; height: ${chartHeight}px; max-width: 100%;">`;
    
    html += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${chartHeight - padding.bottom}" stroke="#eee" stroke-width="1" />`;
    html += `<line x1="${padding.left}" y1="${chartHeight - padding.bottom}" x2="${chartWidth - padding.right}" y2="${chartHeight - padding.bottom}" stroke="#eee" stroke-width="1" />`;
    
    // 零线（当有负数时显示）
    if (minInvestmentFloor < 0) {
      html += `<line x1="${padding.left}" y1="${zeroY}" x2="${chartWidth - padding.right}" y2="${zeroY}" stroke="#999" stroke-width="1" stroke-dasharray="4,4" />`;
    }
    
    // 根据刻度步长决定小数位数，避免四舍五入导致刻度重复
    const tickDecimals = niceStep < 10000 ? 1 : 0;
    for (let i = 0; i <= yAxisTicks; i++) {
      const y = padding.top + (innerHeight / yAxisTicks) * i;
      const value = maxInvestmentCeil - (yRange / yAxisTicks) * i;
      html += `<line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#999" stroke-width="1" />`;
      html += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#999">${(value / 10000).toFixed(tickDecimals)}万</text>`;
    }
    
    const barWidth = Math.min(30, innerWidth / sortedMonths.length * 0.6);
    const gap = innerWidth / sortedMonths.length;
    
    sortedMonths.forEach((monthKey, index) => {
      const data = monthlyData[monthKey];
      const x = padding.left + gap * index + (gap - barWidth) / 2;
      
      const isPositive = data.totalInvestment >= 0;
      const barHeight = (Math.abs(data.totalInvestment) / yRange) * innerHeight;
      const minBarHeight = 15;
      const actualBarHeight = Math.max(barHeight, minBarHeight);
      // 正数从零线向上，负数从零线向下
      const y = isPositive ? zeroY - actualBarHeight : zeroY;
      const barColor = isPositive ? '#10b981' : '#ef4444';
      
      const rate = data.rate;
      
      html += `<rect x="${x}" y="${y}" width="${barWidth}" height="${actualBarHeight}" rx="4" ry="4" fill="${barColor}" 
        onmouseenter="showInvestTooltip(event, '${data.year}-${data.label}', '${rate}', '${window.calculationService.formatMoney(data.totalInvestment)}')" 
        onmouseleave="hideInvestTooltip()" style="cursor: pointer;" />`;
      
      html += `<text x="${x + barWidth / 2}" y="${chartHeight - padding.bottom + 25}" text-anchor="middle" font-size="11" fill="#999">${data.label}</text>`;
    });
    
    html += `</svg>`;
    
    html += `<div class="chart-legend">`;
    html += `<div class="legend-item"><div class="legend-color" style="background-color: #10b981;"></div><span class="legend-text">正收益</span></div>`;
    if (minInvestmentFloor < 0) {
      html += `<div class="legend-item"><div class="legend-color" style="background-color: #ef4444;"></div><span class="legend-text">亏损</span></div>`;
    }
    html += `</div>`;
    
    html += `</div>`;
    
    container.innerHTML = html;
  },

  displayCapitalChart(container) {
    const capitalData = window.calculationService.getCapitalChartData();
    const { monthlyData, sortedMonths, growthRates, annualGrowth, hasData } = capitalData;
    
    if (!hasData) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>暂无趋势数据</p>
        </div>
      `;
      return;
    }

    const chartHeight = 280;
    const chartWidth = 500;
    const padding = { top: 50, right: 70, bottom: 55, left: 70 };
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    
    const maxCapital = Math.max(...Object.values(monthlyData).map(d => d.total), 1);
    const maxCapitalCeil = Math.ceil(maxCapital / 10000) * 10000;
    
    const latestMonth = sortedMonths[sortedMonths.length - 1];
    const latestGrowthRate = growthRates[latestMonth];
    let latestGrowthDisplay = 'N/A';
    let latestGrowthColor = '#9ca3af';
    if (latestGrowthRate !== undefined) {
      latestGrowthDisplay = latestGrowthRate >= 0 ? '+' + latestGrowthRate + '%' : latestGrowthRate + '%';
      latestGrowthColor = latestGrowthRate >= 0 ? '#10b981' : '#ef4444';
    }
    
    let html = `<div class="chart-section" style="padding: 20px; text-align: center;">`;
    html += `<div class="chart-header">`;
    html += `<h3>资金余额趋势</h3>`;
    html += `<div class="growth-summary">`;
    html += `<div class="growth-item"><span class="growth-label">月度增长率</span><span class="growth-value" style="color: ${latestGrowthColor};">${latestGrowthDisplay}</span></div>`;
    html += `<div class="growth-item"><span class="growth-label">年度增长率</span><span class="growth-value ${annualGrowth !== 'N/A' && annualGrowth.startsWith('+') ? 'positive' : 'negative'}">${annualGrowth}</span></div>`;
    html += `</div>`;
    html += `</div>`;
    
    html += `<svg viewBox="0 0 ${chartWidth} ${chartHeight}" style="width: ${chartWidth}px; height: ${chartHeight}px; max-width: 100%;">`;
    
    html += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${chartHeight - padding.bottom}" stroke="#eee" stroke-width="1" />`;
    html += `<line x1="${padding.left}" y1="${chartHeight - padding.bottom}" x2="${chartWidth - padding.right}" y2="${chartHeight - padding.bottom}" stroke="#eee" stroke-width="1" />`;
    
    const yAxisTicks = 5;
    for (let i = 0; i <= yAxisTicks; i++) {
      const y = padding.top + (innerHeight / yAxisTicks) * i;
      const value = maxCapitalCeil - (maxCapitalCeil / yAxisTicks) * i;
      html += `<line x1="${padding.left - 5}" y1="${y}" x2="${padding.left}" y2="${y}" stroke="#999" stroke-width="1" />`;
      html += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#999">${(value / 10000).toFixed(0)}万</text>`;
    }
    
    const barWidth = Math.min(30, innerWidth / sortedMonths.length * 0.6);
    const gap = innerWidth / sortedMonths.length;
    
    sortedMonths.forEach((monthKey, index) => {
      const data = monthlyData[monthKey];
      const x = padding.left + gap * index + (gap - barWidth) / 2;
      const barHeight = (data.total / maxCapitalCeil) * innerHeight;
      const y = chartHeight - padding.bottom - barHeight;
      
      const growthRate = growthRates[monthKey];
      let growthDisplay = 'N/A';
      if (growthRate !== undefined) {
        growthDisplay = growthRate >= 0 ? '+' + growthRate + '%' : growthRate + '%';
      }
      
      const minBarHeight = 15;
      const actualBarHeight = Math.max(barHeight, minBarHeight);
      
      html += `<rect x="${x}" y="${y}" width="${barWidth}" height="${actualBarHeight}" rx="4" ry="4" fill="#667eea" 
        onmouseenter="showCapitalBarTooltip(event, '${data.year}-${data.label}', '${growthDisplay}', '${window.calculationService.formatMoney(data.total)}')" 
        onmouseleave="hideCapitalBarTooltip()" style="cursor: pointer;" />`;
      
      html += `<text x="${x + barWidth / 2}" y="${chartHeight - padding.bottom + 25}" text-anchor="middle" font-size="11" fill="#999">${data.label}</text>`;
    });
    
    html += `</svg>`;
    
    html += `<div class="chart-legend">`;
    html += `<div class="legend-item"><div class="legend-color" style="background-color: #667eea;"></div><span class="legend-text">资金余额</span></div>`;
    html += `</div>`;
    
    html += `</div>`;
    
    container.innerHTML = html;
  },

  displayTransactionList(container) {
    const groupedData = window.calculationService.getTransactionsGroupedByMonth();
    const { groupedByMonth, sortedMonths, hasData } = groupedData;
    
    if (!hasData) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <p>暂无记录</p>
          <p style="font-size: 0.85rem;">点击添加开始记录</p>
        </div>
      `;
      return;
    }
    
    let html = '';
    
    sortedMonths.forEach(monthKey => {
      const monthData = groupedByMonth[monthKey];
      html += `<div class="month-section">`;
      html += `<div class="month-header" style="display: flex; align-items: center; gap: 16px;">`;
      html += `<span style="font-weight: 600;">${monthData.label}</span>`;
      html += `<span style="font-size: 0.85rem; display: flex; gap: 16px; align-items: center;">`;
      html += `<span style="color: #667eea;">资金总余额 ${window.calculationService.formatMoney(monthData.totalCapital)}</span>`;
      html += `<span style="color: ${monthData.totalInvestment >= 0 ? '#10b981' : '#ef4444'};">理财总收益 ${monthData.totalInvestment >= 0 ? '+' : ''}${window.calculationService.formatMoney(monthData.totalInvestment)}</span>`;
      html += `</span>`;
      html += `</div>`;
      
      monthData.transactions.forEach(transaction => {
        html += `<div class="transaction-item">`;
        html += `<div class="transaction-info" style="flex: 1;">`;
        html += `<div class="transaction-category">资金存放地：${transaction.accountName}</div>`;
        html += `<div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.9rem;">`;
        html += `<div style="display: flex; flex-direction: column; gap: 4px;">`;
        html += `<span>💰 资金余额：${window.calculationService.formatMoney(transaction.capitalBalance)}</span>`;
        if (transaction.investmentBalance !== 0) {
          const investColor = transaction.investmentBalance >= 0 ? '#10b981' : '#ef4444';
          html += `<span style="color: ${investColor};">📈 理财收益：${transaction.investmentBalance >= 0 ? '+' : ''}${window.calculationService.formatMoney(transaction.investmentBalance)}</span>`;
        }
        html += `</div>`;
        html += `<div style="display: flex; gap: 8px; align-items: center;">`;
        html += `<button style="background: none; border: none; cursor: pointer; color: #667eea; font-size: 0.85rem; display: flex; align-items: center; gap: 2px;" onclick="openEditModal(${transaction.id})">✏️ 修改</button>`;
        html += `<span style="color: #ccc;">|</span>`;
        html += `<button style="background: none; border: none; cursor: pointer; color: #ef4444; font-size: 0.85rem; display: flex; align-items: center; gap: 2px;" onclick="deleteTransaction(${transaction.id})">🗑️ 删除</button>`;
        html += `</div>`;
        html += `</div>`;
        html += `<div class="transaction-date">${window.calculationService.formatDate(transaction.date)}</div>`;
        html += `</div>`;
        html += `</div>`;
      });
      
      html += `</div>`;
    });
    
    container.innerHTML = html;
  }
};

window.incomeRecordsModule = incomeRecordsModule;

window.showCapitalBarTooltip = function(event, month, growthRate, amount) {
  let tooltip = document.getElementById('capital-bar-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'capital-bar-tooltip';
    tooltip.style.cssText = 'position: fixed; background: rgba(0,0,0,0.85); color: white; padding: 12px; border-radius: 8px; font-size: 13px; z-index: 9999; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    document.body.appendChild(tooltip);
  }
  const growthColor = growthRate.startsWith('+') ? '#86efac' : growthRate === 'N/A' ? '#9ca3af' : '#fca5a5';
  tooltip.innerHTML = `<div style="font-weight: 600; margin-bottom: 6px;">${month}</div><div style="opacity: 0.9; margin-bottom: 4px;">增长率: <span style="color: ${growthColor};">${growthRate}</span></div><div style="opacity: 0.9;">金额: ${amount}</div>`;
  tooltip.style.display = 'block';
  
  let left = event.clientX + 15;
  let top = event.clientY - 60;
  
  if (left + tooltip.offsetWidth > window.innerWidth) {
    left = event.clientX - tooltip.offsetWidth - 15;
  }
  if (top < 10) {
    top = event.clientY + 15;
  }
  
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
};

window.hideCapitalBarTooltip = function() {
  const tooltip = document.getElementById('capital-bar-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
};

window.showInvestTooltip = function(event, month, rate, amount) {
  let tooltip = document.getElementById('invest-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'invest-tooltip';
    tooltip.style.cssText = 'position: fixed; background: rgba(0,0,0,0.85); color: white; padding: 12px; border-radius: 8px; font-size: 13px; z-index: 9999; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
    document.body.appendChild(tooltip);
  }
  let rateColor;
  if (rate === 'N/A') {
    rateColor = '#9ca3af';
  } else {
    const rateValue = parseFloat(rate);
    rateColor = rateValue >= 0 ? '#86efac' : '#fca5a5';
  }
  const displayRate = rate !== 'N/A' && parseFloat(rate) >= 0 ? '+' + rate + '%' : rate === 'N/A' ? 'N/A' : rate + '%';
  tooltip.innerHTML = `<div style="font-weight: 600; margin-bottom: 6px;">${month}</div><div style="opacity: 0.9; margin-bottom: 4px;">收益率: <span style="color: ${rateColor};">${displayRate}</span></div><div style="opacity: 0.9;">收益金额: ${amount}</div>`;
  tooltip.style.display = 'block';
  
  let left = event.clientX + 15;
  let top = event.clientY - 60;
  
  if (left + tooltip.offsetWidth > window.innerWidth) {
    left = event.clientX - tooltip.offsetWidth - 15;
  }
  if (top < 10) {
    top = event.clientY + 15;
  }
  
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
};

window.hideInvestTooltip = function() {
  const tooltip = document.getElementById('invest-tooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
};