const fs = require('fs');
const path = require('path');
const { getCurrentMonthKey, getCurrentMonthDate, getPrevMonthDate } = require('../helpers/dateHelper');

const storageServiceCode = fs.readFileSync(
  path.join(__dirname, '../../src/scripts/services/storageService.js'),
  'utf8'
);
const calculationServiceCode = fs.readFileSync(
  path.join(__dirname, '../../src/scripts/services/calculationService.js'),
  'utf8'
);
const formattersCode = fs.readFileSync(
  path.join(__dirname, '../../src/scripts/utils/formatters.js'),
  'utf8'
);

eval(storageServiceCode);
eval(formattersCode);
eval(calculationServiceCode);

const storage = window.storageService;
const calcService = window.calculationService;

const currentMonthKey = getCurrentMonthKey();
const currentMonthDate = getCurrentMonthDate();

describe('理财收益', () => {
  beforeEach(() => {
    localStorage.clear();
    window.localStorageService = window.storageService;
  });

  describe('7.1 投资图表数据', () => {
    test('空数据返回默认结构', () => {
      const result = calcService.getInvestmentChartData();
      expect(result.hasData).toBe(false);
      expect(result.sortedMonths).toEqual([]);
    });

    test('计算投资收益率', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 5000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentChartData();
      expect(result.hasData).toBe(true);
      expect(result.sortedMonths.length).toBe(2);
      expect(result.monthlyData[currentMonthKey].rate).toBe('0.5');
    });

    test('首月收益率为N/A', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentChartData();
      expect(result.monthlyData[currentMonthKey].rate).toBe('N/A');
    });

    test('收益率保留一位小数', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 1234, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentChartData();
      const rate = result.monthlyData[currentMonthKey].rate;
      expect(rate).toMatch(/^\d+\.\d$/);
    });
  });

  describe('7.2 月度收益率计算', () => {
    test('收益率 = 本月理财收益 / 上月资金余额', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1005000, investmentBalance: 5000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentChartData();
      expect(result.monthlyData[currentMonthKey].rate).toBe('0.5');
    });

    test('上月资金为0时显示0.0', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 0, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 5000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentChartData();
      expect(result.monthlyData[currentMonthKey].rate).toBe('0.0');
    });

    test('理财收益为0时收益率为0.0', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentChartData();
      expect(result.monthlyData[currentMonthKey].rate).toBe('0.0');
    });

    test('高收益率计算正确', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 100000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 105000, investmentBalance: 5000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentChartData();
      expect(result.monthlyData[currentMonthKey].rate).toBe('5.0');
    });
  });

  describe('7.3 年化利率', () => {
    test('0个月数据返回N/A', () => {
      const result = calcService.getAnnualRate();
      expect(result.rate).toBe('N/A');
      expect(result.value).toBeNull();
    });

    test('1个月数据返回N/A', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: currentMonthDate
      });
      
      const result = calcService.getAnnualRate();
      expect(result.rate).toBe('N/A');
      expect(result.value).toBeNull();
    });

    test('2个月数据计算年化收益率', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1006000, investmentBalance: 6000, date: currentMonthDate
      });
      
      const result = calcService.getAnnualRate();
      expect(result.rate).not.toBe('N/A');
      expect(result.value).toBeGreaterThan(0);
    });

    test('年化利率保留一位小数', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1004000, investmentBalance: 4000, date: currentMonthDate
      });
      
      const result = calcService.getAnnualRate();
      expect(result.rate).toMatch(/^\d+\.\d%$/);
    });

    test('年化利率为0', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: currentMonthDate
      });
      
      const result = calcService.getAnnualRate();
      expect(parseFloat(result.rate)).toBe(0);
    });
  });

  describe('7.4 年化利率公式', () => {
    test('使用复利公式计算', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 10000, date: currentMonthDate
      });
      
      const result = calcService.getAnnualRate();
      const monthlyRate = 10000 / 1000000;
      const expectedAnnual = Math.pow(1 + monthlyRate, 12 / 1) - 1;
      expect(result.value).toBeCloseTo(expectedAnnual, 4);
    });

    test('n-1为收益率数量', () => {
      const prevMonth1 = getPrevMonthDate(2);
      const prevMonth2 = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth1.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 5000, date: prevMonth2.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 5000, date: currentMonthDate
      });
      
      const result = calcService.getAnnualRate();
      expect(result.value).toBeDefined();
      expect(result.value).toBeGreaterThan(0);
    });
  });

  describe('7.5 年度总收益', () => {
    test('累计本年各月理财收益', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 3000, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1005000, investmentBalance: 5000, date: currentMonthDate
      });
      
      const summary = calcService.getMonthlySummary();
      expect(summary.annualInvestment).toBe(8000);
    });

    test('无理财收益时显示0', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: currentMonthDate
      });
      
      const summary = calcService.getMonthlySummary();
      expect(summary.annualInvestment).toBe(0);
    });

    test('理财收益格式化', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 50000, date: currentMonthDate
      });
      
      const summary = calcService.getMonthlySummary();
      expect(summary.annualInvestmentFormatted).toContain('万');
    });
  });

  describe('7.6 投资健康状态', () => {
    test('0个月数据显示未知', () => {
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('unknown');
      expect(result.color).toBe('#6b7280');
    });

    test('1个月数据显示未知', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('unknown');
    });

    test('年化≥3.5%显示优秀', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1004000, investmentBalance: 4000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('healthy');
    });

    test('0%<年化<3.5%显示注意', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1002000, investmentBalance: 2000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('warning');
    });

    test('年化≤0%显示危险', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentHealthStatus();
      expect(result.status).toBe('danger');
    });
  });

  describe('7.7 边界情况', () => {
    test('理财收益为负数', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 995000, investmentBalance: -5000, date: currentMonthDate
      });
      
      const result = calcService.getAnnualRate();
      expect(result.value).toBeDefined();
    });

    test('上月资金为0避免除零错误', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 0, investmentBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 5000, date: currentMonthDate
      });
      
      const result = calcService.getInvestmentChartData();
      expect(result.monthlyData[currentMonthKey].rate).toBe('0.0');
    });
  });
});
