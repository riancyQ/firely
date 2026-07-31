const fs = require('fs');
const path = require('path');
const { getCurrentMonthDate, getLastMonthDate } = require('../helpers/dateHelper');

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

const currentMonthDate = getCurrentMonthDate();
const lastMonthDate = getLastMonthDate();

describe('FIRE 目标规划', () => {
  beforeEach(() => {
    localStorage.clear();
    window.localStorageService = window.storageService;
  });

  describe('3.1 目标金额计算', () => {
    test('用户未设置年支出时目标金额为0', () => {
      const result = calcService.getFireProgressInfo();
      expect(result.fireTarget).toBe(0);
    });

    test('目标金额 = 年支出 / 安全提取率(3.5%)', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      const result = calcService.getFireProgressInfo();
      const expectedTarget = 350000 / 0.035;
      expect(result.fireTarget).toBeCloseTo(expectedTarget, 0);
    });

    test('目标金额以万元为单位显示', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      const result = calcService.getFireProgressInfo();
      expect(result.fireTargetInWan).toBeDefined();
      expect(typeof result.fireTargetInWan).toBe('string');
    });
  });

  describe('3.2 进度展示', () => {
    test('无数据时进度为0%', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      const result = calcService.getFireProgressInfo();
      expect(result.progressPercentage).toBe('0.0');
    });

    test('有资金时进度百分比正确', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      
      const result = calcService.getFireProgressInfo();
      const expectedPercentage = (1000000 / (350000 / 0.035) * 100).toFixed(1);
      expect(result.progressPercentage).toBe(expectedPercentage);
    });

    test('进度不超过100%', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 100000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 10000000, date: currentMonthDate
      });
      
      const result = calcService.getFireProgressInfo();
      expect(parseFloat(result.progressPercentage)).toBeLessThanOrEqual(100);
    });

    test('剩余金额计算正确', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      
      const result = calcService.getFireProgressInfo();
      const expectedRemaining = (350000 / 0.035) - 1000000;
      expect(result.remainingAmount).toBeCloseTo(expectedRemaining, 0);
    });

    test('剩余金额以万元为单位显示', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, date: currentMonthDate
      });
      
      const result = calcService.getFireProgressInfo();
      expect(result.remainingInWan).toBeDefined();
      expect(typeof result.remainingInWan).toBe('string');
    });
  });

  describe('3.3 所需时间计算', () => {
    test('0个月数据使用默认值计算', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      const result = calcService.getFireProgressInfo();
      expect(result.yearsToFire).toBeDefined();
      expect(result.annualSavings).toBe(250000);
    });

    test('2个月数据使用实际计算值', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1200000, investmentBalance: 5000, date: currentMonthDate
      });
      
      const result = calcService.getFireProgressInfo();
      expect(result.annualSavings).toBeGreaterThan(0);
      expect(result.annualRate).toBeDefined();
    });

    test('储蓄为0时所需时间显示"--"', () => {
      storage.saveUserInfo({ annualIncome: 350000, annualExpense: 350000 });
      const result = calcService.getFireProgressInfo();
      expect(result.yearsToFire).toBe('--');
    });

    test('年化收益率为负时返回"loss"标记', () => {
      storage.saveUserInfo({ annualIncome: 600000, annualExpense: 350000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 1030000, investmentBalance: -20000, date: currentMonthDate
      });
      
      const result = calcService.getFireProgressInfo();
      expect(result.annualRate).toBeLessThan(0);
      expect(result.annualSavings).toBeGreaterThan(0);
      expect(result.yearsToFire).toBe('loss');
    });

    test('年化收益率为负但储蓄为0时不触发loss标记', () => {
      storage.saveUserInfo({ annualIncome: 350000, annualExpense: 350000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 1000000, investmentBalance: 0, date: lastMonthDate
      });
      storage.addTransaction({
        type: 'income', capitalBalance: 950000, investmentBalance: -20000, date: currentMonthDate
      });
      
      const result = calcService.getFireProgressInfo();
      expect(result.annualSavings).toBeLessThanOrEqual(0);
      expect(result.yearsToFire).toBe('--');
    });
  });

  describe('3.4 风险偏好对收益率的影响', () => {
    test('保守型(conservative)使用2.5%收益率', () => {
      storage.saveUserInfo({ 
        annualIncome: 600000, 
        annualExpense: 350000,
        riskProfile: 'conservative'
      });
      const result = calcService.getFireProgressInfo();
      expect(calcService.getReturnRate()).toBe(0.025);
    });

    test('平衡型(moderate)使用3.5%收益率', () => {
      storage.saveUserInfo({ 
        annualIncome: 600000, 
        annualExpense: 350000,
        riskProfile: 'moderate'
      });
      const result = calcService.getFireProgressInfo();
      expect(calcService.getReturnRate()).toBe(0.035);
    });

    test('进取型(aggressive)使用4.5%收益率', () => {
      storage.saveUserInfo({ 
        annualIncome: 600000, 
        annualExpense: 350000,
        riskProfile: 'aggressive'
      });
      const result = calcService.getFireProgressInfo();
      expect(calcService.getReturnRate()).toBe(0.045);
    });
  });

  describe('3.5 边界情况', () => {
    test('无用户信息时所有值为初始状态', () => {
      const result = calcService.getFireProgressInfo();
      expect(result.currentCapital).toBe(0);
      expect(result.fireTarget).toBe(0);
      expect(result.remainingAmount).toBe(0);
      expect(result.progressPercentage).toBe(0);
    });

    test('有资产但无用户信息', () => {
      storage.addTransaction({
        type: 'income', capitalBalance: 500000, date: currentMonthDate
      });
      const result = calcService.getFireProgressInfo();
      expect(result.currentCapital).toBe(500000);
      expect(result.fireTarget).toBe(0);
    });

    test('当前资产已超过目标', () => {
      storage.saveUserInfo({ annualIncome: 1000000, annualExpense: 100000 });
      storage.addTransaction({
        type: 'income', capitalBalance: 10000000, date: currentMonthDate
      });
      
      const result = calcService.getFireProgressInfo();
      expect(parseFloat(result.progressPercentage)).toBe(100);
    });
  });
});
