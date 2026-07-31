const fs = require('fs');
const path = require('path');

const validatorsCode = fs.readFileSync(
  path.join(__dirname, '../../src/scripts/utils/validators.js'),
  'utf8'
);

eval(validatorsCode);

describe('validators', () => {
  describe('isNotEmpty', () => {
    test('有效值返回true', () => {
      expect(validators.isNotEmpty('hello')).toBe(true);
      expect(validators.isNotEmpty(0)).toBe(true);
      expect(validators.isNotEmpty(false)).toBe(true);
    });

    test('空值返回false', () => {
      expect(validators.isNotEmpty('')).toBe(false);
      expect(validators.isNotEmpty(null)).toBe(false);
      expect(validators.isNotEmpty(undefined)).toBe(false);
    });
  });

  describe('isNumber', () => {
    test('数字返回true', () => {
      expect(validators.isNumber(42)).toBe(true);
      expect(validators.isNumber(3.14)).toBe(true);
      expect(validators.isNumber(0)).toBe(true);
      expect(validators.isNumber(-1)).toBe(true);
    });

    test('非数字返回false', () => {
      expect(validators.isNumber('42')).toBe(false);
      expect(validators.isNumber(null)).toBe(false);
      expect(validators.isNumber(undefined)).toBe(false);
      expect(validators.isNumber(NaN)).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    test('正数返回true', () => {
      expect(validators.isPositiveNumber(1)).toBe(true);
      expect(validators.isPositiveNumber(3.14)).toBe(true);
    });

    test('非正数返回false', () => {
      expect(validators.isPositiveNumber(0)).toBe(false);
      expect(validators.isPositiveNumber(-1)).toBe(false);
      expect(validators.isPositiveNumber('1')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    test('有效日期返回true', () => {
      expect(validators.isValidDate('2026-06-30')).toBe(true);
      expect(validators.isValidDate('2026-01-01')).toBe(true);
    });

    test('无效日期返回false', () => {
      expect(validators.isValidDate('invalid')).toBe(false);
      expect(validators.isValidDate('')).toBe(false);
      expect(validators.isValidDate(null)).toBe(false);
    });
  });

  describe('validateTransaction', () => {
    test('有效交易通过验证', () => {
      const transaction = {
        type: 'income',
        amount: 10000,
        date: '2026-06-30',
        depositAccountId: 1
      };
      const result = validators.validateTransaction(transaction);
      expect(result.valid).toBe(true);
    });

    test('无效类型返回错误', () => {
      const transaction = {
        type: 'invalid',
        amount: 10000,
        date: '2026-06-30',
        depositAccountId: 1
      };
      const result = validators.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('交易类型无效');
    });

    test('金额非正数返回错误', () => {
      const transaction = {
        type: 'income',
        amount: -100,
        date: '2026-06-30',
        depositAccountId: 1
      };
      const result = validators.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('金额必须为正数');
    });

    test('无效日期返回错误', () => {
      const transaction = {
        type: 'income',
        amount: 10000,
        date: 'invalid',
        depositAccountId: 1
      };
      const result = validators.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('日期格式无效');
    });

    test('缺少账户ID返回错误', () => {
      const transaction = {
        type: 'income',
        amount: 10000,
        date: '2026-06-30'
      };
      const result = validators.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('请选择资金账户');
    });

    test('多个错误同时返回', () => {
      const transaction = {
        type: 'invalid',
        amount: -100,
        date: 'invalid'
      };
      const result = validators.validateTransaction(transaction);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('validateDepositAccount', () => {
    test('有效账户通过验证', () => {
      const account = { name: '招商银行', type: 'bank' };
      const result = validators.validateDepositAccount(account);
      expect(result.valid).toBe(true);
    });

    test('空名称返回错误', () => {
      const account = { name: '', type: 'bank' };
      const result = validators.validateDepositAccount(account);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('账户名称不能为空');
    });

    test('无效类型返回错误', () => {
      const account = { name: 'test', type: 'invalid' };
      const result = validators.validateDepositAccount(account);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('账户类型无效');
    });

    test('所有类型都有效', () => {
      const validTypes = ['bank', 'other', 'alipay', 'jd', 'wechat', 'securities'];
      validTypes.forEach(type => {
        const account = { name: 'test', type };
        const result = validators.validateDepositAccount(account);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('validateUserInfo', () => {
    test('有效信息通过验证', () => {
      const userInfo = {
        annualIncome: 600000,
        annualExpense: 350000,
        riskProfile: 'moderate'
      };
      const result = validators.validateUserInfo(userInfo);
      expect(result.valid).toBe(true);
    });

    test('年收入非正数返回错误', () => {
      const userInfo = {
        annualIncome: 0,
        annualExpense: 350000,
        riskProfile: 'moderate'
      };
      const result = validators.validateUserInfo(userInfo);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('年收入必须为正数');
    });

    test('年支出非正数返回错误', () => {
      const userInfo = {
        annualIncome: 600000,
        annualExpense: 0,
        riskProfile: 'moderate'
      };
      const result = validators.validateUserInfo(userInfo);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('年支出必须为正数');
    });

    test('无效风险偏好返回错误', () => {
      const userInfo = {
        annualIncome: 600000,
        annualExpense: 350000,
        riskProfile: 'invalid'
      };
      const result = validators.validateUserInfo(userInfo);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('风险偏好无效');
    });

    test('所有风险偏好都有效', () => {
      const validProfiles = ['conservative', 'moderate', 'aggressive'];
      validProfiles.forEach(profile => {
        const userInfo = {
          annualIncome: 600000,
          annualExpense: 350000,
          riskProfile: profile
        };
        const result = validators.validateUserInfo(userInfo);
        expect(result.valid).toBe(true);
      });
    });
  });
});