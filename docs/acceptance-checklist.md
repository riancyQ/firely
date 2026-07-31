# FIRELY 功能验收清单

> 版本：v2.0  
> 更新日期：2026-07-28  
> 验证人：_________

---

## 测试覆盖状态汇总

| 图标 | 类型 | 状态 |
|------|------|------|
| 🧪 | 单元测试（Logic） | ✅ 已完成 329 用例（全部通过） |
| 🟨 | 浏览器交互测试（UI） | **待进行** |
| 🟥 | 性能测试（Perf） | **待进行** |

**最近修复**（2026-07-31）：
1. **修复 setMonth 日期边界 bug**
   - 问题：当日期为月底时，`setMonth` 因日期溢出导致月份计算错误
   - 解决方案：在 `setMonth` 前先调用 `setDate(1)`，确保月份计算正确

2. **修复测试日期处理的环境依赖问题**
   - 问题：多个测试文件中 `lastMonthDate` 使用 `now.getMonth() === 1` 判断1月，但 JavaScript 中1月 `getMonth()` 返回0，导致1月时生成无效日期
   - 影响文件：8个测试文件
   - 解决方案：
     - 创建共享工具文件 `tests/helpers/dateHelper.js`，使用固定基准时间（2026-07-15）
     - 所有测试文件统一使用共享的日期工具函数
     - 确保测试结果在任何时间运行都稳定一致

---

## 一、Dashboard 核心指标

### 1.1 资金总余额
- [x] 显示本月资金总余额（单位：万元，保留2位小数）
  → 🧪 `tests/features/dashboard.test.js` → "格式化万元显示"
- [x] 无数据时显示 "¥ 0.00 万"
  → 🧪 `tests/features/dashboard.test.js` → "空数据显示"
- [x] 数据更新后自动刷新
  → 🧪 `tests/features/dashboard.test.js` → "数据更新后刷新"
- [x] 计算公式：Σ(本月所有账户的 capitalBalance)
  → 🧪 `tests/services/calculationService.test.js` → "getBalanceSummary 计算总资金"

### 1.2 年度理财总收益
- [x] 显示本年理财总收益
  → 🧪 `tests/services/calculationService.test.js` → "getInvestmentSummary 年度收益计算"
- [x] 计算公式：Σ(本年所有收入记录的 investmentBalance)
  → 🧪 `tests/services/calculationService.test.js` → "getInvestmentSummary 聚合逻辑"
- [x] 无数据时显示 "¥ 0.00 万"
  → 🧪 `tests/features/dashboard.test.js` → "空数据时理财收益为0"

### 1.3 月度结余
- [x] 显示本月与上月资金余额差额
  → 🧪 `tests/features/dashboard.test.js` → "月度结余计算"
- [x] 正数显示绿色，负数显示红色
  → 🧪 `tests/features/dashboard.test.js` → "结余正负判断"
- [x] 无上月数据时显示 N/A
  → 🧪 `tests/features/fire-target.test.js` → "0个月数据N/A处理"

### 1.4 年度结余
- [x] 显示本年与去年资金余额差额
  → 🧪 `tests/features/dashboard.test.js` → "年度结余计算"
- [x] 无去年数据时显示 N/A
  → 🧪 `tests/features/dashboard.test.js` → "无历史数据N/A"

---

## 二、健康状态监控

### 2.1 储蓄健康状态
- [x] 0-1个月数据：显示"数据不足"，灰色
  → 🧪 `tests/features/health-status.test.js` → "0个月状态为数据不足"
- [x] 储蓄率 ≥ 50%：显示"优秀"，绿色
  → 🧪 `tests/features/health-status.test.js` → "储蓄率50%以上优秀"
- [x] 0% < 储蓄率 < 50%：显示"注意"，黄色
  → 🧪 `tests/features/health-status.test.js` → "储蓄率0-50%注意"
- [x] 储蓄率 ≤ 0%：显示"危险"，红色
  → 🧪 `tests/features/health-status.test.js` → "储蓄率0%以下危险"
- [x] 计算公式符合 PRD 定义
  → 🧪 `tests/services/calculationService.test.js` → "calculateSavingsRate 储蓄率公式"

### 2.2 理财健康状态
- [x] 0-1个月数据：显示"数据不足"，灰色
  → 🧪 `tests/features/health-status.test.js` → "0个月理财状态不足"
- [x] 年化利率 ≥ 3.5%：显示"优秀"，绿色
  → 🧪 `tests/features/health-status.test.js` → "年化3.5%以上优秀"
- [x] 0% < 年化利率 < 3.5%：显示"注意"，黄色
  → 🧪 `tests/features/health-status.test.js` → "年化0-3.5%注意"
- [x] 年化利率 ≤ 0%：显示"危险"，红色
  → 🧪 `tests/features/health-status.test.js` → "年化0%以下危险"

---

## 三、FIRE 目标规划

### 3.1 目标金额计算
- [x] 计算公式：年支出 / 安全提取率(3.5%)
  → 🧪 `tests/features/fire-target.test.js` → "目标金额计算公式"
- [x] 用户未设置年支出时显示默认值
  → 🧪 `tests/features/fire-target.test.js` → "默认目标金额"

### 3.2 进度展示
- [x] 进度条百分比正确
  → 🧪 `tests/features/fire-target.test.js` → "进度百分比计算"
- [x] 已完成金额显示正确
  → 🧪 `tests/features/fire-target.test.js` → "已完成金额显示"
- [x] 剩余金额显示正确
  → 🧪 `tests/features/fire-target.test.js` → "剩余金额计算"

### 3.3 所需时间计算
- [x] 0-1个月数据：使用默认值计算
  → 🧪 `tests/features/fire-target.test.js` → "0个月使用默认值"
- [x] 2-11个月数据：使用实际平均值
  → 🧪 `tests/features/fire-target.test.js` → "2个月使用平均值"
- [x] 12个月及以上：使用最近12个月数据
  → 🧪 `tests/features/fire-target.test.js` → "12个月使用真实数据"
- [ ] **年化收益率 r < 0 时显示亏损提示**
  → 🧪 `tests/features/fire-target.test.js` → "年化收益率为负时显示亏损提示"
  → 预期显示：「⚠ 当前亏损中，建议优化投资组合」（红色）

---

## 四、收入记录管理

### 4.1 列表展示
- [x] 按月分组展示
  → 🧪 `tests/features/income-records.test.js` → "按月分组展示记录"
- [x] 每月显示资金总余额和理财总收益
  → 🧪 `tests/features/income-records.test.js` → "每月显示资金总余额和理财总收益"
- [x] 每条记录显示账户名、金额、余额、收益
  → 🧪 `tests/features/income-records.test.js` → "显示账户名称"
- [x] 修改/删除按钮正常工作
  → 🧪 `tests/features/income-records.test.js` → "状态管理逻辑"

### 4.2 新增记录
- [x] 表单验证（必填项、金额格式）
  → 🧪 `tests/utils/validators.test.js` → "交易验证必填项"
- [x] 保存后列表自动刷新
  → 🧪 `tests/features/income-records.test.js` → "保存后列表自动刷新"
- [x] 金额单位转换（万元↔元）
  → 🧪 `tests/features/income-records.test.js` → "金额万元转元"

### 4.3 编辑记录
- [x] 预填充原有数据
  → 🧪 `tests/features/income-records.test.js` → "成功更新记录"
- [x] 保存后列表自动刷新
  → 🧪 `tests/features/income-records.test.js` → "保存后列表自动刷新"
- [x] 不存在的ID返回false
  → 🧪 `tests/features/income-records.test.js` → "不存在的ID返回false"

### 4.4 删除记录
- [x] 删除后列表自动刷新
  → 🧪 `tests/features/income-records.test.js` → "删除后列表自动刷新"
- [x] 不存在的ID返回false
  → 🧪 `tests/features/income-records.test.js` → "不存在的ID返回false"
- [x] 删除确认状态管理
  → 🧪 `tests/features/income-records.test.js` → "删除确认逻辑"
- [ ] 点击删除按钮有确认提示（UI）
  → 🟨 需浏览器交互测试

---

## 五、资金分布（饼图）

### 5.1 基础展示
- [x] 各账户资金占比计算正确
  → 🧪 `tests/features/capital-distribution.test.js` → "各账户资金占比正确"
- [x] 百分比总和为100%
  → 🧪 `tests/features/capital-distribution.test.js` → "百分比总和为100%"
- [x] 按金额降序排列
  → 🧪 `tests/features/capital-distribution.test.js` → "按金额排序"
- [ ] 饼状图正确渲染（SVG）
  → 🟨 需浏览器交互测试
- [ ] 各账户颜色区分明显
  → 🟨 需浏览器交互测试
- [ ] 百分比标签显示正确
  → 🟨 需浏览器交互测试

### 5.2 交互功能
- [x] 状态切换逻辑（选中/取消）
  → 🧪 `tests/features/income-records.test.js` → "饼图选中状态切换"
- [ ] 点击饼图区域可筛选明细
  → 🟨 需浏览器交互测试
- [ ] 再次点击取消筛选
  → 🟨 需浏览器交互测试
- [ ] 筛选状态下其他区域半透明
  → 🟨 需浏览器交互测试

### 5.3 小区域标签
- [ ] < 5% 区域显示引导线 + 百分比
  → 🟨 需浏览器交互测试
- [ ] ≥ 5% 区域显示内部百分比
  → 🟨 需浏览器交互测试
- [ ] 选中小区域时只显示该区域引导线
  → 🟨 需浏览器交互测试

---

## 六、资金余额趋势

### 6.1 图表展示
- [x] 月度数据计算正确
  → 🧪 `tests/features/capital-trend.test.js` → "月度数据计算"
- [x] 月度数据按账户聚合
  → 🧪 `tests/features/capital-trend.test.js` → "多账户月度聚合"
- [ ] 柱状图正确渲染（DOM）
  → 🟨 需浏览器交互测试
- [ ] X轴显示月份
  → 🟨 需浏览器交互测试
- [ ] Y轴显示金额（万元）
  → 🟨 需浏览器交互测试

### 6.2 数据标签
- [x] 月度增长率计算
  → 🧪 `tests/features/capital-trend.test.js` → "月度增长率计算"
- [x] 数据不足时显示 N/A
  → 🧪 `tests/features/capital-trend.test.js` → "N/A 数据处理"
- [x] 增长率正负判断
  → 🧪 `tests/features/capital-trend.test.js` → "正负增长率"
- [ ] 顶部显示增长率标签（UI）
  → 🟨 需浏览器交互测试

---

## 七、理财收益

### 7.1 图表展示
- [x] 月度收益率计算
  → 🧪 `tests/features/investment-returns.test.js` → "月度收益率计算"
- [x] 理财数据按账户聚合
  → 🧪 `tests/features/investment-returns.test.js` → "多账户理财聚合"
- [ ] 柱状图正确渲染
  → 🟨 需浏览器交互测试
- [ ] 显示本月收益率
  → 🟨 需浏览器交互测试

### 7.2 年度数据
- [x] 年化利率计算
  → 🧪 `tests/services/calculationService.test.js` → "calculateAnnualizedRate 年化利率"
- [x] 数据不足时显示 N/A
  → 🧪 `tests/features/investment-returns.test.js` → "数据不足N/A"
- [x] 风险偏好对收益率影响
  → 🧪 `tests/features/fire-target.test.js` → "风险偏好对收益率影响"

---

## 八、数据导入导出

### 8.1 导出功能
- [x] 导出格式正确（JSON）
  → 🧪 `tests/data-io.test.js` → "I/O-001: 导出空数据"
- [x] 包含所有数据：transactions, depositAccounts, userInfo
  → 🧪 `tests/data-io.test.js` → "I/O-002: 导出正常数据"
- [x] 包含版本号和导出时间
  → 🧪 `tests/data-io.test.js` → "导出时间戳为有效ISO格式"
- [x] nextIds 计数器保留
  → 🧪 `tests/data-io.test.js` → "nextIds 在导出中包含计数器"

### 8.2 导入功能
- [x] 版本兼容性检查（高版本拒绝）
  → 🧪 `tests/data-io.test.js` → "I/O-005: 导入版本过高文件"
- [x] 版本兼容性检查（低版本兼容）
  → 🧪 `tests/data-io.test.js` → "I/O-006: 导入版本过低文件"
- [x] 数据完整性校验
  → 🧪 `tests/data-io.test.js` → "I/O-004: 导入格式错误文件"
- [x] 导入前确认逻辑
  → 🧪 `tests/data-io.test.js` → "导入前确认逻辑"
- [x] 异常恢复（clearAll 失败）
  → 🧪 `tests/data-io.test.js` → "导入异常时返回错误信息"
- [x] 导入导出数据一致性
  → 🧪 `tests/data-io.test.js` → "I/O-007: 导出导入数据一致性"
- [ ] 选择文件后显示预览（UI）
  → 🟨 需浏览器交互测试
- [ ] 导入前有确认提示（UI）
  → 🟨 需浏览器交互测试
- [ ] 导入成功/失败有提示（UI）
  → 🟨 需浏览器交互测试

---

## 九、边界情况

### 9.1 空数据状态
- [x] 空数据返回空结构
  → 🧪 `tests/features/income-records.test.js` → "空数据返回空结构"
- [x] 空数据计算不崩溃
  → 🧪 `tests/services/calculationService.test.js` → "空数据边界处理"
- [ ] 页面显示友好提示（UI）
  → 🟨 需浏览器交互测试

### 9.2 数据不足
- [x] 0个月数据：显示默认值或N/A
  → 🧪 `tests/features/fire-target.test.js` → "0个月数据N/A处理"
- [x] 1个月数据：部分功能显示N/A
  → 🧪 `tests/features/capital-trend.test.js` → "N/A 数据处理"
- [x] 计算不崩溃
  → 🧪 `tests/services/calculationService.test.js` → "空数据边界处理"

### 9.3 异常处理
- [x] JSON 解析失败
  → 🧪 `tests/data-io.test.js` → "JSON 解析异常处理"
- [x] localStorage 读写异常
  → 🧪 `tests/services/storageService.test.js` → "存储异常处理"
- [x] 无效日期输入
  → 🧪 `tests/utils/formatters.test.js` → "无效日期字符串"
- [x] 负数/零值边界
  → 🧪 `tests/utils/formatters.test.js` → "负数格式化"

### 9.4 数字格式一致性
- [x] 欢迎界面输入：年收入/年支出支持2位小数（step=0.01，万元单位）
  → 🧪 `tests/utils/formatters.test.js` → "formatMoney 2位小数格式化"
- [x] 编辑用户信息回显：年收入/年支出显示2位小数（万元单位）
  → 🧪 `tests/utils/formatters.test.js` → "formatMoney 2位小数格式化"
- [x] 交易记录表单：资金余额/理财收益以「元」为单位输入，`type="number" step="0.01"`
  → 🧪 `tests/utils/formatters.test.js` → "formatMoney 万元转换"
- [x] 交易记录表单：输入元值直接存储（元），展示时通过 formatMoney 转换为万元
  → 示例：输入 `42301.00` → 存储 `42301` → 显示 `¥ 4.23 万`
- [x] 交易记录表单：资金余额 `min="0"` 禁止负数
  → 🧪 `tests/features/income-records.test.js` → "负数余额被拒绝"
- [x] 交易记录表单：理财收益允许负数（表示亏损）
  → 🧪 `tests/features/income-records.test.js` → "理财收益可输入负数"
- [x] Dashboard 显示：所有金额统一2位小数，万元单位
  → 🧪 `tests/utils/formatters.test.js` → "formatMoney 2位小数格式化"
- [x] 存储层：所有金额以「元」为单位（整数），展示层：以「万元」为单位
  → 🧪 `tests/utils/formatters.test.js` → "formatMoney 万元转换"

### 9.5 百分比格式一致性
- [x] 储蓄率：统一保留 1 位小数
  → 🧪 `tests/features/health-status.test.js` → "储蓄率格式化"
- [x] 年化利率：统一保留 1 位小数
  → 🧪 `tests/features/investment-returns.test.js` → "年化利率格式化"
- [x] 月度/年度增长率：统一保留 1 位小数
  → 🧪 `tests/features/capital-trend.test.js` → "增长率格式化"
- [x] 月度收益率：统一保留 1 位小数
  → 🧪 `tests/features/investment-returns.test.js` → "收益率格式化"
- [x] FIRE 进度：统一保留 1 位小数
  → 🧪 `tests/features/fire-target.test.js` → "FIRE进度格式化"
- [x] 饼图占比：统一保留 1 位小数
  → 🧪 `tests/features/capital-distribution.test.js` → "饼图占比格式化"

---

## 十、性能要求

- [ ] 首屏加载时间 < 2秒
  → 🟥 需性能测试
- [ ] 标签页切换流畅（< 300ms）
  → 🟥 需性能测试
- [ ] 添加/修改/删除后即时刷新
  → 🟥 需性能测试
- [ ] 大数据量（>100条记录）正常显示
  → 🟥 需性能测试

---

## 待完成任务

### 🟨 浏览器交互测试（预计 1 周）
- [ ] 饼图 SVG 渲染验证
- [ ] 饼图点击筛选/取消筛选交互
- [ ] 小区域引导线显示验证
- [ ] 柱状图 DOM 元素检查
- [ ] 删除确认弹窗 UI 验证
- [ ] 数据导入预览/确认 UI 验证
- [ ] 空数据友好提示验证
- [ ] Console 错误检查

### 🟥 性能测试（预计 3 天）
- [ ] 首屏加载时间 < 2 秒
- [ ] 标签页切换 < 300ms
- [ ] 新增/修改/删除操作即时刷新
- [ ] 大数据量（>100 条记录）渲染性能