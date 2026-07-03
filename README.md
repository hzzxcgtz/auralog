# 纸间流光 AuraLog

初中生假期学习记录平台 — 记录光阴，见证成长。

## 技术栈

- **框架**: Next.js 16 (App Router) + React 19
- **样式**: Tailwind CSS v4 + shadcn/ui
- **数据库**: SQLite + Prisma 5 (WAL 模式)
- **认证**: NextAuth v5 (Credentials + JWT)
- **状态管理**: Zustand (计时器持久化)
- **数据获取**: @tanstack/react-query
- **动画**: Framer Motion
- **图表**: Recharts
- **字体**: Noto Sans SC + Noto Serif SC

## 快速开始

```bash
npm install
npx prisma db push
npm run dev
```

首次访问自动跳转至 `/setup` 页面创建管理员账号。

## 项目结构

```
src/
├── app/
│   ├── (auth)/           # 认证页 (login, setup)
│   ├── (student)/        # 学生端 (首页, 阅读, 商城, 战报)
│   ├── admin/            # 家长端 (看板, 计划, 书单, 奖池, 报表, 账号)
│   ├── api/              # API 路由
│   └── forbidden/        # 403 越权页
├── components/
│   ├── ui/               # shadcn 组件
│   ├── auth/             # 认证组件
│   └── shared/           # 共享组件
├── hooks/                # 自定义 hooks
├── lib/                  # 工具库
├── stores/               # Zustand 状态
├── types/                # TypeScript 类型
└── middleware.ts         # 路由守卫
```

## 功能概览

### 已实现
- ✅ 系统初始化 / 登录（SVG 验证码）
- ✅ 路由鉴权（学生/家长角色分离）
- ✅ 手账风格 UI（纸张纹理、纸胶带装饰）
- ✅ 月历视图 / 今日概览
- ✅ 五态任务卡片（TODO→IN_PROGRESS→DONE→PENDING_REVIEW→GRADED）
- ✅ 计时器（Zustand 持久化，刷新恢复）
- ✅ 阅读手账墙（瀑布流布局）
- ✅ 积分商城（可兑换/不足/已兑）
- ✅ 管理后台（看板+待审核）
- ✅ 任务 API / 仪表盘 API / 读书 API / 奖池 API
- ✅ 积分账本逻辑
- ✅ AI 陪伴者悬浮球（预留位）

### 已完善
- ✅ 日历计划制定（快捷复制引擎 + 假期管理）
- ✅ WebSocket 实时同步
- ✅ 照片上传与查看
- ✅ 报表图表生成（Recharts + 阶段战报）
- ✅ 账号管理页面（创建/重置密码/删除）
- ✅ 管理后台全量（工作台评分 / 计划 / 书单 / 奖池 / 报表 / 账号）
- ✅ 阅读手账墙（瀑布流 + API 对接 + 生词花篮）
- ✅ 积分商城（API 对接 + 兑换审核流）
- ✅ 成长战报（API 对接 + 阶段总结）

## 设计主题

- **暖白基调**: #FFF9F0 背景，奶油白卡片 #FEFDFB
- **焦糖主色**: #D97706（按钮、强调色）
- **鼠尾草绿**: #84CC16（完成状态、进度）
- **深棕咖啡**: #78350F（标题文字）
- **装饰**: 纸张噪点、纸胶带、黑胶唱片动画、呼吸光点
