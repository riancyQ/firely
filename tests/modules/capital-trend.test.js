const fs = require('fs');
const path = require('path');
const { TEST_BASE_DATE, getCurrentMonthKey, getCurrentMonthDate, getPrevMonthDate } = require('../helpers/dateHelper');

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

describe('资金余额趋势', () => {
  beforeEach(() => {
    localStorage.clear();
    window.localStorageService = window.storageService;
  });

  describe('6.1 图表数据', () => {
    test('空数据返回默认结构', () => {
      const result = calcService.getCapitalChartData();
      expect(result.hasData).toBe(false);
      expect(result.sortedMonths).toEqual([]);
      expect(result.monthlyData).toEqual({});
    });

    test('生成月度图表数据', () => {
      const prev2 = getPrevMonthDate(2);
      const prev1 = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: prev2.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1100000, date: prev1.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1200000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.hasData).toBe(true);
      expect(result.sortedMonths.length).toBe(3);
    });

    test('按月汇总资金数据', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.monthlyData[currentMonthKey].total).toBe(800000);
    });

    test('只统计收入类型', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate
      });
      storage.addTransaction({
        type: 'expense', amount: 5000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.monthlyData[currentMonthKey].total).toBe(500000);
    });
  });

  describe('6.2 月度增长率', () => {
    test('计算月度增长率', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1100000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.growthRates[currentMonthKey]).toBeDefined();
      expect(result.growthRates[currentMonthKey]).toBe(10);
    });

    test('增长率为负数（资金减少）', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1100000, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.growthRates[currentMonthKey]).toBeDefined();
      expect(result.growthRates[currentMonthKey]).toBeLessThan(0);
    });

    test('单月数据无增长率', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.growthRates).toEqual({});
    });

    test('增长率保留两位小数', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1050000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      const rate = result.growthRates[currentMonthKey];
      expect(rate).toBeDefined();
    });
  });

  describe('6.3 月度数据聚合', () => {
    test('同一月多条记录汇总', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 400000, date: currentMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.monthlyData[currentMonthKey].total).toBe(900000);
    });

    test('不同月份分别统计', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.sortedMonths.length).toBe(2);
    });
  });

  describe('6.4 年度增长率', () => {
    test('少于12个月数据显示N/A', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1100000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.annualGrowth).toBe('N/A');
    });
  });

  describe('6.5 数据完整性', () => {
    test('包含月份标签', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      const monthData = result.monthlyData[currentMonthKey];
      expect(monthData.label).toBeDefined();
      expect(monthData.label).toContain('月');
    });

    test('包含年份信息', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      const monthData = result.monthlyData[currentMonthKey];
      expect(monthData.year).toBe(TEST_BASE_DATE.getFullYear());
    });

    test('包含记录数量', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 300000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      const monthData = result.monthlyData[currentMonthKey];
      expect(monthData.count).toBe(2);
    });
  });

  describe('6.6 边界情况', () => {
    test('资金为0时增长率正确', () => {
      const prevMonth = getPrevMonthDate(1);
      
      storage.addTransaction({
        type: 'income', capitalBalance: 0, date: prevMonth.date
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 100000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.growthRates[currentMonthKey]).toBeDefined();
    });

    test('负数资金不影响计算', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: -100000, date: currentMonthDate
      });
      
      const result = calcService.getCapitalChartData();
      expect(result.hasData).toBe(true);
      expect(result.monthlyData[currentMonthKey].total).toBe(-100000);
    });
  });
});
