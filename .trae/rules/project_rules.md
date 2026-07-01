# FIRELY 财务独立目标管理应用开发规则

本文件总结项目开发过程中遇到的错误和最佳实践，用于规避类似问题再次发生。

## 0. 操作确认规则

**约束条件**: 在进行任何代码修改、文件编辑或配置变更之前，必须先向用户展示详细的修改方案，等待用户确认后再执行操作。

**适用场景**:
- 修改或删除已有文件
- 创建新文件
- 修改配置文件
- 重构代码逻辑
- 引入新依赖

**执行流程**:
1. 分析问题，制定修改方案
2. 向用户展示详细的修改方案（包括修改内容、影响范围、风险评估）
3. 等待用户确认（回复"确认"或"同意"等）
4. 用户确认后，再执行修改操作

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

### 9. HTML 结构完整性规范

**错误**: 页面脚本完全不执行，控制台无任何输出
- **问题**：HTML 文件缺少必要的结束标签（`</script>`、`</body>`、`</html>`），导致浏览器无法正确解析页面
- **规避方法**：
  - 确保 HTML 结构完整，所有标签正确闭合
  - 使用 IDE 的 HTML 验证功能检查结构

```html
<!-- 正确结构 -->
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  ...
  <script>...</script>
</body>
</html>
```

### 10. 脚本加载位置规范

**错误**: DOM 元素获取为 null，事件绑定失败
- **问题**：脚本在 DOM 元素加载之前执行，导致无法获取元素
- **规避方法**：
  - 将库脚本放在 `<head>` 中（使用 `defer`）
  - 将业务逻辑脚本放在 `</body>` 之前
  - 或者使用 `DOMContentLoaded` 事件

```html
<!-- 推荐方式 -->
<body>
  <!-- DOM 元素 -->
  <div id="app"></div>
  
  <!-- 脚本放在 body 末尾 -->
  <script src="./js/localStorageService.js"></script>
  <script src="./js/frontendService.js"></script>
  <script>
    // 业务逻辑
  </script>
</body>
```

### 11. 全局函数暴露规范

**错误**: HTML 中 `onclick` 调用的函数未定义
- **问题**：函数定义在脚本块内部，未暴露到全局作用域
- **规避方法**：
  - 将需要在 HTML `onclick` 中调用的函数绑定到 `window` 对象
  - 或者使用 `addEventListener` 方式绑定事件

```javascript
// 方式1：绑定到 window 对象（适合 onclick）
window.saveUserInfo = function() {
  // 逻辑
};

// 方式2：使用 addEventListener（推荐）
document.getElementById('save-btn').addEventListener('click', function() {
  // 逻辑
});
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

## 三、数据导入导出规范

### 1. 导出格式规范

导出数据必须包含以下结构：

```javascript
{
  appVersion: '2.0',           // 应用版本号
  exportTime: '2026-06-30T10:00:00.000Z',  // 导出时间戳
  data: {
    transactions: [],          // 交易记录数组
    depositAccounts: [],       // 资金账户数组
    userInfo: {},              // 用户信息对象
    nextIds: {}                // 下一个ID计数器
  }
}
```

### 2. 版本兼容性规则

- 新版本可导入旧版本数据（向下兼容）
- 旧版本无法导入新版本数据（防止数据损坏）
- 版本检查逻辑：导入文件版本必须 ≤ 当前应用版本

```javascript
const appVersion = exportData.appVersion || '1.0';
if (appVersion > '2.0') {
  return { success: false, message: '文件版本过高，请升级应用后再导入' };
}
```

### 3. 数据覆盖确认机制

- 导入操作前必须显示确认提示
- 明确告知用户导入将覆盖现有数据
- 只有用户确认后才执行导入操作

## 四、调试建议

1. **添加日志输出**：在关键计算步骤添加 `console.log`
2. **分步验证**：将复杂计算分解为多个步骤，逐步验证每一步
3. **边界检查**：测试数据量不足、零值、负数等边界情况
4. **一致性检查**：相关联的计算必须使用完全相同的逻辑和公式

### 前端问题分层排查流程

遇到前端功能无响应时，按照以下顺序排查：

**第1层：HTML 结构检查**
- [ ] HTML 文件是否有完整的结束标签（`</script>`、`</body>`、`</html>`）
- [ ] DOM 元素是否存在且 ID 正确
- [ ] 浏览器控制台是否有语法错误

**第2层：脚本加载检查**
- [ ] 脚本文件是否成功加载（Network 面板）
- [ ] 脚本加载顺序是否正确（依赖关系）
- [ ] 脚本是否在 DOM 元素之后执行

**第3层：函数可访问性检查**
- [ ] 函数是否暴露到全局作用域（`window` 对象）
- [ ] 函数名是否与 HTML 中的调用一致
- [ ] 函数是否在脚本执行时已定义

**第4层：事件绑定检查**
- [ ] `onclick` 属性中的函数名是否正确
- [ ] `addEventListener` 是否正确绑定
- [ ] 事件委托是否正确实现

**第5层：业务逻辑检查**
- [ ] 函数内部逻辑是否有错误
- [ ] API 调用或数据处理是否异常
- [ ] 条件判断是否覆盖所有情况

### 常用调试命令

在浏览器控制台执行以下命令快速定位问题：

```javascript
// 检查元素是否存在
console.log('Element:', document.getElementById('element-id'));

// 检查函数是否在全局作用域
console.log('Function:', typeof window.functionName);

// 检查服务对象是否存在
console.log('Service:', window.frontendService);

// 清除 localStorage（重置测试状态）
localStorage.clear();
location.reload();
```

## 五、AI协作最佳实践

### 1. 实施的透明度

**规则**: 在进行任何代码修改、文件编辑或配置变更之前，必须先向用户展示详细的修改方案。

**执行流程**:
1. 分析问题，制定修改方案
2. 向用户展示详细的修改方案（包括修改内容、影响范围、风险评估）
3. 等待用户确认（回复"确认"或"同意"等）
4. 用户确认后，再执行修改操作

**分布执行策略**:
- 将复杂任务分解为多个小步骤
- 每完成一个步骤后进行验证
- 确保每一步都测试通过后再进行下一步

### 2. 确保代码质量

**规则**: 所有代码修改必须经过充分测试。

**测试层次**:
| 层次 | 描述 | 方式 |
|------|------|------|
| 自测 | AI 自行验证修改的正确性 | 检查代码逻辑、运行测试、手动验证 |
| 单元测试用例 | 针对核心功能的测试 | `npm run test:p0` |
| 完整测试用例 | 覆盖所有功能的测试 | `npm test` |

**验证标准**:
- 所有测试必须通过
- 无语法错误和逻辑错误
- 功能符合预期

### 3. 完整性检查

**规则**: 改造类任务完成后，必须提供检查清单供用户确认。

**检查清单内容**:
- [ ] 所有修改项已完成
- [ ] 相关文档已同步更新（README、SKILL、RULES）
- [ ] 测试全部通过
- [ ] 项目结构清晰，无冗余文件
- [ ] 功能正常运行

### 4. 节省时间

**规则**: 充分利用自动化工具提高效率。

**自动化测试**:
```bash
# 运行所有测试
npm test

# 监听模式 - 只运行修改文件相关的测试
npm run test:watch

# 监听模式 - 运行所有测试
npm run test:watchAll
```

**工作流建议**:
1. 在一个终端启动 `npm run test:watchAll`（自动监控运行测试）
2. 在另一个终端启动开发服务器 `npm run dev`
3. 修改代码后，测试会自动重新运行，实时验证修改

**效率提升**:
- 避免手动重复执行测试
- 实时发现代码问题
- 减少回归测试时间
