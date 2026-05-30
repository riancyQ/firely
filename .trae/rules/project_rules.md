# 钱多多 FIRE 理财应用开发规则

本文件总结项目开发过程中遇到的错误和最佳实践，用于规避类似问题再次发生。

## 一、前端开发规则

### 1. DOM 元素操作规范

**错误**: "cannot set properties of null"
- **问题**：获取 DOM 元素时使用错误的 ID，导致元素为 null
- **示例**：`document.getElementById('total-amount-input')` 应为 `document.getElementById('capital-balance-input')`
- **规避方法**：
  - 获取元素后立即进行空值检查
  - 使用一致的命名规范，避免拼写错误
  - 在 `DOMContentLoaded` 事件后再操作 DOM

```javascript
const element = document.getElementById('element-id');
if (element) {
  element.value = 'value';
} else {
  console.error('Element not found: element-id');
}
```

### 2. 动态内容事件绑定规范

**错误**: 动态生成的内容点击事件无响应
- **问题**：使用 `document.querySelector()` 绑定事件时，动态生成的内容无法触发
- **规避方法**：
  - 使用事件委托（Event Delegation）
  - 或者在动态内容生成后重新绑定事件

```javascript
// 错误示例
document.querySelector('.edit-btn').addEventListener('click', handler);

// 正确示例：事件委托
document.addEventListener('click', (event) => {
  if (event.target.closest('.transaction-item')) {
    // 处理点击
  }
});
```

### 3. 数据累加 vs 取最新值规范

**错误**: 同月份多条记录被错误累加
- **问题**：同一月份多条记录时，金额被累加而非取最新值
- **表现**：储蓄率计算出 69.8% 而非 N/A
- **规避方法**：
  - 按月份汇总时，应按账户分别取每个账户的最新记录
  - 而不是累加所有记录

```javascript
// 正确逻辑：每个账户只取最新记录
const latestByAccount = {};
transactions.forEach(t => {
  const key = `${t.month}-${t.depositAccountId}`;
  if (!latestByAccount[key] || new Date(t.date) > new Date(latestByAccount[key].date)) {
    latestByAccount[key] = t;
  }
});
```

### 4. 首个数据点计算规范

**错误**: 首个月份计算出错误的收益率
- **问题**：计算月收益率时，第一个月没有上月数据，但仍计算出错误的值（如 0.22%）
- **原因**：使用当月余额作为分母计算收益率
- **规避方法**：
  - 第一个月份（或没有上月数据的月份）应显示 N/A
  - 月收益率 = 本月理财总收益 / 上月资金总余额

```javascript
if (i === 0 || monthlyData[prevMonth].totalCapital === 0) {
  // 第一个月份，无法计算上月收益率
  continue;
}
const rate = monthlyData[currentMonth].totalInvestment / monthlyData[prevMonth].totalCapital;
```

### 5. 计算公式一致性规范

**错误**: 不同卡片使用不同计算逻辑
- **问题**：理财收益卡片和理财健康状态卡片的年化利率计算结果不一致（1.33% vs 1.14%）
- **原因**：除数使用了 `n` 而非 `n-1`
- **规避方法**：
  - 收益率数量 = 月份数量 - 1（因为从第2个月开始才有收益率）
  - 所有相关计算必须使用完全相同的公式

```javascript
// 正确的除数
const rateCount = sortedMonths.length - 1; // 收益率数量
const annualizedRate = Math.pow(totalProduct, 12 / rateCount) - 1;
```

### 6. 数据不足时的默认值规范

**错误**: 数据不足时仍显示计算值
- **问题**：只有 2 个月数据时，年度储蓄率应显示 N/A，但错误显示 69.8%
- **规避方法**：
  - 在计算前检查数据量是否满足要求
  - 明确不同数据量下的计算规则

```javascript
if (monthsAsc.length < 12) {
  savingsRate = 'N/A'; // 12个月以下无法计算真实年储蓄率
} else {
  // 使用真实12个月数据计算
}
```

### 7. 表单验证规范

**错误**: 表单验证逻辑与 UI 必填标记不一致
- **问题**：UI 标记为可选的字段，但验证逻辑要求必填
- **规避方法**：
  - 验证逻辑必须与 UI 的必填标记一致
  - 删除字段时同步删除相关验证代码

```javascript
// 如果 UI 标记为必填 (*)
if (!value) {
  alert('请输入必填字段');
  return;
}
```

### 8. 错误处理规范

**错误**: 保存用户信息后黑屏
- **问题**：缺少错误处理，异常导致页面崩溃
- **规避方法**：
  - 使用 try-catch 包裹可能出错的代码
  - 在关键操作后添加适当的错误提示

```javascript
async function saveUserInfoEdit() {
  try {
    // 保存逻辑
    closeUserInfoModal();
    await refreshFireInfo();
    alert('保存成功！');
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败: ' + error.message);
  }
}
```

## 二、计算公式规范

### 1. 年化利率计算公式

```
年化收益率 = (1+r₂) × (1+r₃) × ... × (1+rₙ)^(12/(n-1)) - 1
```

- `n` = 月份数量
- `n-1` = 实际可用的收益率数量（第2个月开始才有收益率）
- 0-1 个月数据：默认 N/A

### 2. 储蓄率计算公式

```
年储蓄 = 本月资金余额变化 - 本月理财收益
年度储蓄率 = 年储蓄 / (年储蓄 + 年支出) × 100%
```

- 0-1 个月数据：N/A
- 2-11 个月数据：月均储蓄 × 12
- 12 个月及以上：过去 12 个月真实储蓄之和

### 3. FIRE 所需时间计算公式

```
K = ln((F × r + S) / (A × r + S)) / ln(1 + r)
```

- A = 当前资产
- S = 年储蓄
- r = 年收益率
- F = FIRE 目标金额

## 三、调试建议

1. **添加日志输出**：在关键计算步骤添加 `console.log`
2. **分步验证**：将复杂计算分解为多个步骤，逐步验证每一步
3. **边界检查**：测试数据量不足、零值、负数等边界情况
4. **一致性检查**：相关联的计算必须使用完全相同的逻辑和公式
