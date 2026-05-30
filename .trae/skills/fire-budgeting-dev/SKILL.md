---
name: "fire-budgeting-dev"
description: "钱多多FIRE理财应用开发技能。当用户询问项目架构、功能模块、计算公式、API接口，或需要开发/调试/维护此FIRE理财应用时调用。"
---

# 钱多多 FIRE 理财应用开发技能

## 项目概述

一款帮助用户实现财务独立、提前退休（FIRE）目标的家庭理财规划工具。

## 技术栈

- **前端**：HTML, CSS, JavaScript (单文件 `public/index.html`)
- **后端**：Node.js, Express, TypeScript
- **数据库**：SQLite (better-sqlite3)
- **运行环境**：Node.js 18+

## 核心功能模块

### 1. Dashboard 核心指标
| 卡片 | 数据来源 | 计算方式 |
|------|---------|---------|
| 资金总余额 | transactions表 | 本月资金余额（最新月份） |
| 年度理财总收益 | transactions表 | 本年所有月份理财收益之和 |
| 月度结余 | transactions表 | 本月余额 - 上月余额 |
| 年度结余 | transactions表 | 本年余额 - 去年余额 |

### 2. 健康状态监控
| 状态卡片 | 指标 | 阈值 |
|---------|------|------|
| 储蓄健康状态 | 储蓄率 | ≥50%绿色, >0%<50%黄色, ≤0%红色 |
| 理财健康状态 | 年化利率 | ≥3.5%绿色, >0%<3.5%黄色, ≤0%红色 |

### 3. FIRE 目标规划
- **FIRE目标** = 年支出 / 安全提取率
- **距离金额** = FIRE目标 - 当前资产
- **所需时间** = ln((F×r+S)/(A×r+S)) / ln(1+r)

### 4. 资金分布
- 数据来源：transactions表（type='income'）
- 只显示最近一个月的账户数据
- 按金额降序排列，大占比聚集显示

### 5. 收入记录管理
- CRUD操作：添加、编辑、删除收入记录
- 按月分组，每组显示资金总余额和理财总收益
- 月收益率 = 本月理财收益 / 上月资金余额

## 计算公式

### 年化利率
```
年化收益率 = (1+r₂) × (1+r₃) × ... × (1+rₙ)^(12/(n-1)) - 1
```
- n = 月份数量
- n-1 = 收益率数量（第2个月开始计算）
- 0-1个月数据：N/A
- 2-11个月：复合增长率
- 12个月及以上：真实年化

### 储蓄率
```
每月储蓄 = 本月余额变化 - 本月理财收益
年度储蓄率 = 年储蓄 / (年储蓄 + 年支出) × 100%
```
- 0-1个月：N/A
- 2-11个月：月均 × 12
- 12个月+：过去12个月真实储蓄

### FIRE所需时间
```
K = ln((F×r+S)/(A×r+S)) / ln(1+r)
```
- A=当前资产, S=年储蓄, r=年收益率, F=FIRE目标

## API 接口

### 资金账户 `/api/deposit-accounts`
- GET: 获取所有账户
- POST: 添加账户
- PUT /:id: 更新账户
- DELETE /:id: 删除账户

### 交易记录 `/api/transactions`
- GET: 获取所有交易
- POST: 添加交易
- PUT /:id: 更新交易
- DELETE /:id: 删除交易

### 数据汇总 `/api/summary`
- GET: 获取汇总数据

## 数据库模型

### deposit_accounts
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 账户名称 |
| type | TEXT | 账户类型 |
| repayment_day | INTEGER | 还款日 |

### transactions
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| type | TEXT | 类型(income/expense) |
| category | TEXT | 分类 |
| amount | REAL | 金额 |
| capital_balance | REAL | 资金余额 |
| investment_balance | REAL | 理财收益 |
| description | TEXT | 描述 |
| date | TEXT | 日期 |
| deposit_account_id | INTEGER | 账户ID |

## 用户数据存储

用户信息存储在浏览器 `localStorage` 中：
```javascript
{
  annualIncome: number,    // 年收入（元）
  annualExpense: number,  // 年支出（元）
  riskProfile: string     // 理财情况
}
```

## 安全提取率

| 类型 | 利率 | 适用场景 |
|------|------|---------|
| 保守 | 2.5% | 债券为主、低波动组合 |
| 中性 | 3.5% | 股债平衡、低费率全球指数基金 |
| 积极 | 4.5% | 偏股型组合、愿意承担较大波动 |

## 常用命令

```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 生产构建
npm run build

# 生产启动
npm start
```
