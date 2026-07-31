# FIRELY - 财务独立目标管理应用 - 技术设计文档

一款帮助用户实现财务独立、提前退休（FIRE）目标的家庭理财规划工具。

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
│   └── technical-design.md      # 技术设计文档
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

### 模块职责说明

| 模块 | 文件 | 职责 |
|------|------|------|
| **Dashboard** | dashboard.js | 主模块，协调其他子模块的刷新 |
| **Health** | health.js | 储蓄健康状态和理财健康状态渲染 |
| **FIRE Goal** | fireGoal.js | FIRE目标进度和所需时间渲染 |
| **Income Records** | incomeRecords.js | 交易记录列表和图表渲染 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务

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

## 构建部署

### 构建命令

```bash
npm run build
```

该命令会将 `src/` 目录下的所有文件复制到 `public/` 目录，用于部署。

### 部署方式

应用为纯静态前端应用，可部署到任何静态网站托管服务：

- GitHub Pages
- Vercel
- Netlify
- IGA Pages

## 开发指南

请参考 `.trae/rules/project_rules.md` 了解开发规范和常见错误规避。

## License

MIT