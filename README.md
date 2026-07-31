# FIRELY - 财务独立目标管理应用

一款帮助用户实现财务独立、提前退休（FIRE）目标的家庭理财规划工具。

## 功能特性

### Dashboard 核心指标

- **资金总余额**：本月资金总余额
- **年度理财总收益**：本年理财总收益
- **月度结余**：本月与上月资金余额差额
- **年度结余**：本年与去年资金余额差额

### 健康状态监控

- **储蓄健康状态**：基于年度储蓄率（N/A灰色，≥50%绿色，>0%<50%黄色，≤0%红色）
- **理财健康状态**：基于年化利率（N/A灰色，≥3.5%绿色，>0%<3.5%黄色，≤0%红色）

### FIRE 目标规划

- **FIRE 目标金额** = 年支出 / 安全提取率
- **距离 FIRE 所需金额**：目标与当前资产差额
- **FIRE 所需时间**：基于年储蓄和年化利率计算

### 收入记录管理

- 支持添加、编辑、删除收入记录
- 按月分组展示，显示月度资金总余额和理财总收益
- 自动计算月收益率

### 资金分布

- 饼状图展示各资金账户占比
- 按金额排序，大占比账户聚集显示
- 虚线连接标签，清晰展示百分比

### 资金余额和理财收益趋势

- 展示资金余额变化趋势
- 展示理财收益变化趋势
- 展示月度和年度变化趋势

### 数据导入导出

- **数据导出**：将所有数据（交易记录、资金账户、用户信息）导出为 JSON 文件
- **数据导入**：从 JSON 文件恢复数据，支持跨终端数据迁移
- **版本兼容性**：新版本可导入旧版本数据，旧版本无法导入新版本数据
- **安全提示**：导入前会覆盖现有数据，需确认操作

## 技术栈

- **前端**：HTML, CSS, JavaScript
- **数据存储**：localStorage（浏览器本地存储）
- **静态服务器**：http-server
- **运行环境**：现代浏览器（Chrome、Firefox、Safari、Edge）

## 项目结构

```
firely/
├── src/                          # 源代码目录
│   ├── index.html               # 主页面（视图层）
│   ├── test.html                # 测试页面
│   ├── assets/                  # 静态资源
│   │   ├── icons/               # 图标文件
│   │   └── images/              # 图片文件
│   └── scripts/
│       ├── main.js              # 应用入口，负责初始化和事件绑定
│       ├── services/            # 服务层（核心业务逻辑）
│       │   ├── storageService.js  # 数据CRUD操作
│       │   └── calculationService.js # 财务计算逻辑
│       ├── modules/             # 功能模块（UI渲染）
│       │   ├── dashboard.js     # 看板渲染
│       │   ├── health.js        # 健康状态
│       │   ├── fireGoal.js      # FIRE目标规划
│       │   └── incomeRecords.js # 收入记录管理
│       └── utils/               # 通用工具函数
│           ├── formatters.js    # 数字、日期格式化
│           └── validators.js    # 输入验证
├── public/                      # 构建/部署目录（由工具生成）
├── tests/                       # 测试文件
│   ├── P0.test.js               # P0核心测试用例
│   ├── data-io.test.js          # 导入导出测试用例
│   └── setup.js                 # 测试环境配置
├── docs/                        # 项目文档
│   ├── product-spec.md          # 产品规格文档
│   ├── technical-design.md      # 技术设计文档
│   └── acceptance-checklist.md  # 功能验收清单
├── .trae/                       # Trae配置
│   ├── rules/
│   │   └── project_rules.md     # 开发规则
│   └── skills/
│       └── fire-budgeting-dev/
│           └── SKILL.md         # 项目技能
├── package.json
├── package-lock.json
├── jest.config.js
├── .gitignore
├── LICENSE
└── README.md
```

### 架构说明

采用分层架构设计：

| 层级 | 文件 | 职责 |
|------|------|------|
| **视图层** | index.html | UI渲染、事件处理、页面交互 |
| **入口层** | main.js | 应用初始化、全局事件绑定 |
| **服务层** | services/ | 核心业务逻辑（数据存储、财务计算） |
| **模块层** | modules/ | UI渲染模块（看板、健康、FIRE目标、记录） |
| **工具层** | utils/ | 通用工具函数（格式化、验证） |

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

打开浏览器访问 <http://localhost:3000>

### 4. 首次使用

首次打开会弹出欢迎窗口，请填写：

- 目前家庭年收入（万元）**必填**
- 目前家庭年支出（万元）**必填**
- 您的家庭理财情况**必填**

## 文档

- [产品规格 (PRD)](docs/product-spec.md) - 功能需求、计算公式、数据模型
- [技术设计](docs/technical-design.md) - 架构设计、模块划分、技术栈
- [功能验收清单](docs/acceptance-checklist.md) - 验收标准、测试清单

## 开发指南

请参考 `.trae/rules/project_rules.md` 了解开发规范和常见错误规避。

## License

MIT
