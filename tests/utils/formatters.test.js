const fs = require('fs');
const path = require('path');

const formattersCode = fs.readFileSync(
  path.join(__dirname, '../../src/scripts/utils/formatters.js'),
  'utf8'
);

eval(formattersCode);

describe('formatters', () => {
  describe('formatMoney', () => {
    test('格式化万元', () => {
      expect(formatters.formatMoney(10000)).toBe('¥ 1.00 万');
      expect(formatters.formatMoney(100000)).toBe('¥ 10.00 万');
      expect(formatters.formatMoney(1000000)).toBe('¥ 100.00 万');
    });

    test('格式化零值', () => {
      expect(formatters.formatMoney(0)).toBe('¥ 0.00 万');
    });

    test('格式化小数', () => {
      expect(formatters.formatMoney(5000)).toBe('¥ 0.50 万');
      expect(formatters.formatMoney(15000)).toBe('¥ 1.50 万');
    });

    test('格式化负数', () => {
      expect(formatters.formatMoney(-10000)).toBe('¥ -1.00 万');
    });

    test('统一保留2位小数', () => {
      expect(formatters.formatMoney(10000)).toBe('¥ 1.00 万');
      expect(formatters.formatMoney(5000)).toBe('¥ 0.50 万');
      expect(formatters.formatMoney(500)).toBe('¥ 0.05 万');
      expect(formatters.formatMoney(50)).toBe('¥ 0.01 万');
    });

    test('万元转换精确性（元→万元→元）', () => {
      const originalInYuan = 305000;
      const formatted = formatters.formatMoney(originalInYuan);
      expect(formatted).toBe('¥ 30.50 万');
    });
  });

  describe('formatDate', () => {
    test('格式化日期', () => {
      expect(formatters.formatDate('2026-06-30')).toBe('6月30日');
      expect(formatters.formatDate('2026-01-15')).toBe('1月15日');
    });

    test('格式化单月单日', () => {
      expect(formatters.formatDate('2026-03-05')).toBe('3月5日');
    });
  });

  describe('formatMonth', () => {
    test('格式化月份', () => {
      expect(formatters.formatMonth('2026-06')).toBe('2026年06月');
      expect(formatters.formatMonth('2025-12')).toBe('2025年12月');
    });

    test('空值返回空字符串', () => {
      expect(formatters.formatMonth('')).toBe('');
      expect(formatters.formatMonth(null)).toBe('');
    });
  });

  describe('getDepositTypeLabel', () => {
    test('已知类型返回对应标签', () => {
      expect(formatters.getDepositTypeLabel('bank')).toBe('🏦 还款账户');
      expect(formatters.getDepositTypeLabel('other')).toBe('💼 普通账户');
      expect(formatters.getDepositTypeLabel('alipay')).toBe('📱 支付宝');
      expect(formatters.getDepositTypeLabel('jd')).toBe('🛒 京东金融');
      expect(formatters.getDepositTypeLabel('wechat')).toBe('💬 微信余额');
      expect(formatters.getDepositTypeLabel('securities')).toBe('📈 证券公司');
    });

    test('未知类型返回原值', () => {
      expect(formatters.getDepositTypeLabel('unknown')).toBe('unknown');
    });
  });

  describe('getReturnRate', () => {
    test('保守型返回2.5%', () => {
      expect(formatters.getReturnRate('conservative')).toBe(0.025);
    });

    test('平衡型返回3.5%', () => {
      expect(formatters.getReturnRate('moderate')).toBe(0.035);
    });

    test('进取型返回4.5%', () => {
      expect(formatters.getReturnRate('aggressive')).toBe(0.045);
    });

    test('未知类型默认返回3.5%', () => {
      expect(formatters.getReturnRate('unknown')).toBe(0.035);
    });
  });

  describe('边界值处理', () => {
    describe('formatMoney 边界', () => {
      test('null 值处理', () => {
        const result = formatters.formatMoney(null);
        expect(result).toBeDefined();
        expect(result).toContain('0.00');
      });

      test('undefined 值处理', () => {
        const result = formatters.formatMoney(undefined);
        expect(result).toBeDefined();
      });

      test('超大数值格式化', () => {
        const result = formatters.formatMoney(100000000);
        expect(result).toContain('10,000.00');
      });

      test('负数格式化', () => {
        const result = formatters.formatMoney(-50000);
        expect(result).toContain('-5.00');
      });

      test('极小数值格式化', () => {
        const result = formatters.formatMoney(1);
        expect(result).toContain('0.00');
      });
    });

    describe('formatDate 边界', () => {
      test('无效日期字符串', () => {
        const result = formatters.formatDate('invalid-date');
        expect(result).toBeDefined();
      });

      test('闰日日期', () => {
        const result = formatters.formatDate('2024-02-29');
        expect(result).toContain('2月29日');
      });

      test('年末日期', () => {
        const result = formatters.formatDate('2026-12-31');
        expect(result).toBe('12月31日');
      });
    });

    describe('formatMonth 边界', () => {
      test('null 返回空字符串', () => {
        expect(formatters.formatMonth(null)).toBe('');
      });

      test('undefined 返回空字符串', () => {
        expect(formatters.formatMonth(undefined)).toBe('');
      });
    });

    describe('getDepositTypeLabel 边界', () => {
      test('未知类型返回原值', () => {
        expect(formatters.getDepositTypeLabel('unknown_type')).toBe('unknown_type');
      });

      test('空字符串返回空', () => {
        expect(formatters.getDepositTypeLabel('')).toBe('');
      });
    });
  });
});