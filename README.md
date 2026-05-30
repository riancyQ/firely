# 钱多多 - 家庭理财 FIRE 规划应用

一款帮助用户实现财务独立、提前退休（FIRE）目标的家庭理财规划工具。

## 功能特性

### Dashboard 核心指标
- **资金总余额**：本月资金总余额
- **年度理财总收益**：本年理财总收益
- **月度结余**：本月与上月资金余额差额
- **年度结余**：本年与去年资金余额差额

### 健康状态监控
- **储蓄健康状态**：基于年度储蓄率（≥50%绿色，>0%<50%黄色，≤0%红色）
- **理财健康状态**：基于年化利率（≥3.5%绿色，>0%<3.5%黄色，≤0%红色）

### FIRE 目标规划
- **FIRE 目标金额** = 年支出 / 安全提取率
- **距离 FIRE 所需金额**：目标与当前资产差额
- **FIRE 所需时间**：基于年储蓄和年化利率计算

### 资金分布
- 饼状图展示各资金账户占比
- 按金额排序，大占比账户聚集显示
- 虚线连接标签，清晰展示百分比

### 收入记录管理
- 支持添加、编辑、删除收入记录
- 按月分组展示，显示月度资金总余额和理财总收益
- 自动计算月收益率

## 计算公式

### 年化利率
```
年化收益率 = (1+r₂) × (1+r₃) × ... × (1+rₙ)^(12/(n-1)) - 1
```
- n = 月份数量
- n-1 = 收益率数量（第2个月开始计算）
- 0-1个月数据：N/A

### 储蓄率
```
每月储蓄 = 本月资金余额变化 - 本月理财收益
年度储蓄率 = 年储蓄 / (年储蓄 + 年支出) × 100%
```
- 0-1个月数据：N/A
- 2-11个月数据：月均储蓄 × 12
- 12个月及以上：过去12个月真实储蓄之和

### FIRE 所需时间
```
K = ln((F × r + S) / (A × r + S)) / ln(1 + r)
```
- A = 当前资产
- S = 年储蓄
- r = 年收益率
- F = FIRE目标金额

## 技术栈

- **前端**：HTML, CSS, JavaScript
- **后端**：Node.js, Express, TypeScript
- **数据库**：SQLite (better-sqlite3)
- **运行环境**：Node.js 18+

## 项目结构

```
├── public/
│   └── index.html          # 前端页面
├── src/
│   ├── controllers/        # 控制器
│   │   ├── depositController.ts
│   │   ├── summaryController.ts
│   │   └── transactionController.ts
│   ├── db/
│   │   └── database.ts     # 数据库配置
│   ├── routes/
│   │   └── index.ts        # 路由配置
│   ├── services/
│   │   └── budgetService.ts # 业务逻辑
│   ├── types/
│   │   └── index.ts        # 类型定义
│   └── server.ts           # 服务入口
├── data/
│   └── budget.db           # SQLite数据库
├── .trae/
│   └── rules/
│       └── project_rules.md # 开发规则
├── package.json
└── tsconfig.json
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动服务
```bash
npm run dev
```

### 3. 访问应用
打开浏览器访问 http://localhost:3000

### 4. 首次使用
首次打开会弹出欢迎窗口，请填写：
- 目前家庭年收入（万元）**必填**
- 目前家庭年支出（万元）**必填**
- 您的家庭理财情况**必填**

## API 接口

### 资金账户
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/deposit-accounts | 获取所有账户 |
| POST | /api/deposit-accounts | 添加账户 |
| PUT | /api/deposit-accounts/:id | 更新账户 |
| DELETE | /api/deposit-accounts/:id | 删除账户 |

### 交易记录
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/transactions | 获取所有交易 |
| POST | /api/transactions | 添加交易 |
| PUT | /api/transactions/:id | 更新交易 |
| DELETE | /api/transactions/:id | 删除交易 |

### 数据汇总
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/summary | 获取汇总数据 |

## 数据库模型

### deposit_accounts（资金账户）
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 主键 |
| name | TEXT | 账户名称 |
| type | TEXT | 账户类型 |
| repayment_day | INTEGER | 还款日 |

### transactions（交易记录）
| 字段 | 类型 | 描述 |
|------|------|------|
| id | INTEGER | 主键 |
| type | TEXT | 类型（income/expense） |
| category | TEXT | 分类 |
| amount | REAL | 金额 |
| capital_balance | REAL | 资金余额 |
| investment_balance | REAL | 理财收益 |
| description | TEXT | 描述 |
| date | TEXT | 日期 |
| deposit_account_id | INTEGER | 账户ID |

## 安全提取率

| 理财情况 | 利率 | 适用场景 |
|---------|------|---------|
| 保守 | 2.5% | 债券为主、低波动组合 |
| 中性 | 3.5% | 股债平衡、低费率全球指数基金 |
| 积极 | 4.5% | 偏股型组合、愿意承担较大波动 |

## 开发指南

请参考 `.trae/rules/project_rules.md` 了解开发规范和常见错误规避。

## License

MIT
