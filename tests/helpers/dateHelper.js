/**
 * 测试日期辅助工具
 * 提供稳定的日期生成函数，避免测试结果依赖运行时间
 */

// 固定测试基准时间（2026年7月15日）
const TEST_BASE_DATE = new Date('2026-07-15T12:00:00');

/**
 * 获取当前月份 key（格式：YYYY-MM）
 * @returns {string} 例如 "2026-07"
 */
function getCurrentMonthKey() {
  const year = TEST_BASE_DATE.getFullYear();
  const month = String(TEST_BASE_DATE.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 获取当前月份日期（格式：YYYY-MM-30）
 * @returns {string} 例如 "2026-07-30"
 */
function getCurrentMonthDate() {
  return `${getCurrentMonthKey()}-30`;
}

/**
 * 获取上月日期（格式：YYYY-MM-28）
 * @returns {string} 例如 "2026-06-28"
 */
function getLastMonthDate() {
  return getPrevMonthDate(1).date;
}

/**
 * 获取N个月前的日期
 * @param {number} monthsAgo - 往前推几个月
 * @returns {{ key: string, date: string }} 
 */
function getPrevMonthDate(monthsAgo) {
  const date = new Date(TEST_BASE_DATE);
  // 先设置为月初，避免 setMonth 时因日期溢出导致月份错误
  date.setDate(1);
  date.setMonth(date.getMonth() - monthsAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return { key: `${year}-${month}`, date: `${year}-${month}-28` };
}

/**
 * 获取测试基准时间
 * @returns {Date}
 */
function getTestBaseDate() {
  return new Date(TEST_BASE_DATE);
}

module.exports = {
  TEST_BASE_DATE,
  getCurrentMonthKey,
  getCurrentMonthDate,
  getLastMonthDate,
  getPrevMonthDate,
  getTestBaseDate
};
