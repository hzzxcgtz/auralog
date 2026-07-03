# 产品需求文档 (PRD)：纸间流光（AuraLog） - 初中生假期学习记录平台
## 1. 产品概述
### 1.1 产品背景与定位
为初中生（核心受众为初中女生）提供一款部署在公网的寒暑假学习记录与管理系统。系统通过“计划-执行-记录-评价-奖励-总结”的完整业务闭环，帮助学生养成自律习惯。系统注重亲子互动、阅读积累与学习成果可视化，并为未来接入 AI 辅导预留扩展空间。
---
## 2. 技术架构选型
*   **核心框架**：Next.js (App Router) + React
*   **样式与组件**：Tailwind CSS + shadcn/ui
*   **数据库与 ORM**：SQLite + Prisma (开启 WAL 模式应对并发)
*   **身份验证**：NextAuth.js (Credentials Provider + JWT 策略)
*   **安全防护**：`bcryptjs` (密码哈希)、`svg-captcha` (图形验证码)
*   **状态与数据交互**：Zustand (计时器状态)、React Query/SWR (服务端数据缓存与重验证)
*   **实时通讯**：Pusher 或自建 WebSocket 服务 (用于任务状态实时同步)
*   **文件存储**：本地文件系统 (开发环境) / 对象存储服务如 AWS S3/阿里云 OSS (生产环境)
*   **图表与动画**：Recharts (数据可视化)、Framer Motion (微交互与转场动画)
---
## 3. 系统功能详细说明
### 3.1 系统基础与安全模块
#### 3.1.1 系统初始化
*   **触发条件**：系统部署后首次被访问，检测到 `User` 表为空时触发。
*   **操作流程**：强制重定向至 `/setup` 页面。家长需填写：注册用户名（仅限字母数字下划线）、显示昵称、登录密码。
*   **数据流转**：密码经 `bcryptjs` 加密存入数据库，角色标记为 `PARENT`。完成后自动登录并跳转至后台 `/admin`。
#### 3.1.2 账号管理（仅家长可操作）
*   **学生账号创建**：家长在后台 `设置 -> 账号管理` 中创建学生账号，设定学生用户名和初始密码。
*   **密码重置**：家长可随时重置学生密码，旧密码失效。
#### 3.1.3 强安全登录机制
*   **登录入口**：统一的 `/login` 页面。
*   **表单要素**：用户名输入框、密码输入框（带明暗文切换小眼睛）、图形验证码输入框、验证码图片（点击图片可刷新）。
*   **安全逻辑**：
    *   验证码由服务端生成，有效期为 5 分钟。
    *   同一 IP 地址若连续 3 次输错密码，系统锁定该 IP 5 分钟，并强制要求拖动滑块验证码。
*   **路由守卫 (Middleware)**：
    *   无 JWT Token 访问任何页面 -> 重定向 `/login`。
    *   Token 解析角色为 `STUDENT` 访问 `/admin/*` -> 拦截并返回 403 页面。
    *   Token 解析角色为 `PARENT` 访问学生端页面 -> 自动重定向至 `/admin`。
### 3.2 管理后台（家长端）功能详述
#### 3.2.1 假期与计划制定模块
*   **假期建档**：设定假期名称（如“2024初一寒假”）、起始日期、结束日期。系统据此生成日历视图。
*   **每日任务制定（细粒度）**：
    *   **操作路径**：后台日历页 -> 点击某一天 -> 右侧弹出“任务编辑抽屉”。
    *   **任务属性**：任务名称（一句话描述，限制 50 字）、任务分类（校内作业/新课预习/旧课复习/教辅练习）、预估完成时间（分钟，下拉选择 15/30/45/60/90 等）。
    *   **快捷复制引擎**：
        *   *场景A（单日复制）*：将当天所有任务一键复制到指定的另一天。
        *   *场景B（批量按星期复制）*：勾选当前任务，选择“每周一、三、五”，系统自动将任务批量插入到假期范围内符合星期要求的所有日期中。若目标日期已有任务，提示“追加”或“覆盖”。
    *   **全局任务制定**：
        *   设定贯穿假期的任务（如：写习作 5 篇）。
        *   属性：任务名称、目标总数、当前进度（家长可手动修改，或授权学生端自增）。
#### 3.2.2 课外阅读书单管理
*   **书单设定**：添加书籍，属性包括：书名、作者、必读/选读标识、总页数或总章节数（用于计算进度百分比）。
#### 3.2.3 日常审核与评价模块（核心交互）
*   **待办工作台与实时监控**：
    *   后台首页默认展示“待审核任务列表”。系统将学生提交状态为 `DONE`（已完成待评价）的任务和阅读记录聚合，按时间倒序排列。带有红点数字提示。
    *   **新增**：实时监控学生任务执行状态。当学生端任务状态发生变更（如 `TODO` -> `IN_PROGRESS` -> `DONE`），家长端通过 WebSocket 接收实时通知，并在工作台显著位置（或独立“实时动态”模块）展示最新状态更新，例如：“学生[任务名称] 已开始计时” 或 “学生[任务名称] 已完成并提交”。
*   **作业审核详情页**：
    *   上半部分：展示任务名称、预估时间、学生实际耗时（如 32min）、学生提交的“学习心得体会”文本。
    *   **新增**：展示学生上传的任务照片缩略图区域。若有多张照片，显示“共 N 张照片”及第一张缩略图。点击该区域，弹出照片查看器，展示所有上传照片的大图，支持左右滑动切换。
    *   下半部分（家长操作区）：
        *   积分输入框（默认推荐 10 分，可调 1-50 分）。
        *   评语输入框（限制 200 字，支持快捷输入常用评语如“字迹工整，继续保持”）。
    *   **提交逻辑**：点击“确认评价”，系统将积分累加至学生总额，状态变更为 `GRADED`。
*   **阅读审核详情页**：
    *   展示：书籍名、今日进度（如 P15-P28）、摘录的好词好句、读后感体会。
    *   家长操作：同上，可针对摘录写评语并发放积分。
#### 3.2.4 奖池与积分商城管理
*   **上架奖励**：设定奖励名称（如“周末看电影”）、所需积分、库存数量。
*   **兑换审核**：当学生发起兑换请求，后台收到通知。家长点击“同意发放”，系统扣除学生对应积分；若点击“拒绝”，积分原路退回。
#### 3.2.5 阶段回顾与假期总结模块
*   **触发机制**：
    *   阶段报表：当假期进行到第 15 天、第 30 天时，后台自动生成数据快照。
    *   总结报表：假期结束日到达后自动生成。
*   **家长端操作**：家长进入“报表管理”页面，查看系统聚合的数据图表（包含：总任务完成率、各科耗时饼图、阅读字数统计）。家长在输入框撰写“阶段寄语”或“假期总结评语”，在总结报表中可选择颁发一枚成就徽章（如：自律之星、阅读达人）。
### 3.3 学生端（前台）功能详述
#### 3.3.1 顶部：美学月历组件
*   **视图展示**：横向滑动或网格展示当月日期。日期格内以小数字（如 `3/8`）展示当日完成进度。
*   **状态高亮**：
    *   当天所有任务状态均为 `GRADED`（已评价），日期数字背景变为蜜桃粉实心圆圈，右上角带✨图标。
    *   当到达阶段节点或假期结束，对应日期出现小喇叭图标，点击可查看战报。
*   **交互**：点击任意日期，下方任务列表区平滑切换至该日数据。
#### 3.3.2 每日任务执行与计时模块（状态机驱动）
*   **任务卡片状态流转**：
    1.  `TODO (未开始)`：展示任务名、预估时间。显示“开始计时”按钮（▶️）。
    2.  `IN_PROGRESS (进行中)`：点击开始后触发。卡片背景轻微呼吸灯效果，按钮变为“停止计时”（⏹️）。
        *   *防误触机制*：若用户刷新页面或误退出，前端通过 `Zustand` 持久化记录当前计时任务 ID 和开始时间戳，重新进入后恢复计时状态。
        *   **实时同步**：任务状态变更为 `IN_PROGRESS` 时，通过 WebSocket 将事件推送到家长端。
    3.  `DONE (已完成待提交)`：点击停止后触发。卡片展示“预计 30min / 实际 32min”。此时展开“心得记录便利贴”输入框。
        *   **新增**：在心得输入框下方，提供“上传照片”按钮。点击后调用系统相机或文件选择器，允许学生选择并上传一张或多张与任务完成情况相关的照片（如完成的作业页、读书笔记、实验过程等）。上传成功后，在卡片内显示缩略图预览和照片数量（如“3张照片”）。点击预览区域，可展开查看所有照片大图。
    4.  `PENDING_REVIEW (待评价)`：学生写完心得、上传照片（可选）后点击“提交给家长”后触发。卡片置灰，展示“等待妈妈评价中...”。
        *   **实时同步**：任务状态变更为 `PENDING_REVIEW` 时，通过 WebSocket 将事件推送到家长端，通知有新任务待审核。
    5.  `GRADED (已评价)`：家长评价后触发。卡片展开，以粉色气泡展示家长评语及获得积分（如 +15积分）。若上传过照片，仍可点击查看。
#### 3.3.3 课外阅读记录与跟踪模块
*   **我的书架**：侧边栏或专属页签展示。以书籍封面卡片形式排列，下方带进度条（如 45%）。
*   **阅读打卡流程**：
    *   点击某本书的“记录今日阅读”按钮，弹出 `ReadingLogForm` 表单。
    *   填写进度：输入起止页码或章节（必填）。
    *   好词好句摘录：多行文本框，支持换行（必填）。
    *   心得体会：多行文本框，记录所思所想（选填）。
    *   提交后，生成一条 `ReadingLog` 记录，状态为待评价。
*   **阅读手账墙**：展示历次阅读的摘录内容，以“纸胶带便利贴”样式瀑布流排列，点击可展开查看家长评语。
#### 3.3.4 积分商城与兑换模块
*   **积分存钱罐**：页面右上角或侧边栏顶部，以小猪存钱罐动画展示当前总积分。
*   **奖励兑换**：展示家长上架的奖励列表。若当前积分 >= 奖励所需积分，按钮亮起“兑换”；否则置灰。
*   **兑换动作**：点击兑换 -> 弹窗确认 -> 扣除积分 -> 状态变为“等待家长兑现”。伴随星星掉落动画。
#### 3.3.5 学习成果展示（成长手账）
*   **战报查看入口**：首页悬浮提示或月历小喇叭图标。
*   **战报页面渲染**：
    *   采用 Framer Motion 实现滑动卡片入场动画。
    *   展示数据：本期完成任务总数、总学习时长、各学科耗时占比饼图（Recharts）、阅读进度概览。
    *   寄语展示：底部展示家长手写的阶段寄语气泡。
*   **终期总结与徽章**：假期结束报告页，顶部展示家长颁发的发光成就徽章，长按可保存为图片分享。
#### 3.3.6 AI 学习智能体预留区
*   **UI 表现**：页面右下角固定一个“AI 学习助手”悬浮球（带呼吸光效）。
*   **当前逻辑**：点击后弹出全屏/半屏抽屉，显示“AI 助手正在努力唤醒中...”。
*   **代码预留**：抽屉内部预留 `<div id="ai-agent-root"></div>` 挂载点，后续接入 Web SDK 时直接渲染聊天对话框，不破坏现有布局。
---
## 4. 数据库模型设计
*注：基于 SQLite + Prisma，下划线标出本次细化的重要字段。*
```prisma
model User {
  id           Int      @id @default(autoincrement())
  role         String   // PARENT / STUDENT
  username     String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
}
model Vacation {
  id        Int      @id @default(autoincrement())
  name      String
  startDate DateTime
  endDate   DateTime
}
model DailyTask {
  id             Int           @id @default(autoincrement())
  vacationId     Int
  date           DateTime
  title          String
  category       String        // SCHOOLWORK, PREVIEW, REVIEW, EXERCISE
  estimatedTime  Int           // 预估时间(分钟)
  status         String        // TODO, IN_PROGRESS, DONE, PENDING_REVIEW, GRADED
  spentTime      Int           // 实际耗时(秒)
  studentNote    String?       // 学生心得
  parentComment  String?       // 家长评语
  points         Int?          // 获得积分
  photos         TaskPhoto[]   // 关联照片
}
model TaskPhoto { // 新增模型
  id        Int      @id @default(autoincrement())
  taskId    Int
  url       String   // 照片存储URL
  createdAt DateTime @default(now())
  
  @@relation(fields: [taskId], references: [id], onDelete: Cascade)
}
model GlobalTask {
  id           Int @id @default(autoincrement())
  title        String
  targetCount  Int
  currentCount Int
}
model Book {
  id            Int     @id @default(autoincrement())
  title         String
  author        String?
  isRequired    Boolean
  totalChapters Int?
}
model ReadingLog {
  id             Int      @id @default(autoincrement())
  bookId         Int
  date           DateTime
  progressRead   String   // 阅读进度
  excerpts       String?  // 好词好句
  thoughts       String?  // 读后感
  parentComment  String?
  points         Int?
  status         String   @default("PENDING_REVIEW")
}
model Reward {
  id         Int      @id @default(autoincrement())
  title      String
  cost       Int
  stock      Int
  isRedeemed Boolean  @default(false)
}
model ReviewReport {
  id            Int      @id @default(autoincrement())
  type          String   // STAGE / FINAL
  stageNumber   Int?
  startDate     DateTime
  endDate       DateTime
  dataSnapshot  String   // JSON: { totalTasks, completionRate, timeSpentByCategory... }
  parentComment String?
  badgeAwarded  String?
  createdAt     DateTime @default(now())
}
```
---
## 5. 核心业务状态机与流转图（开发参考）
### 5.1 每日任务状态机
```text
[TODO] --(学生点击"开始")--> [IN_PROGRESS]
[IN_PROGRESS] --(学生点击"停止")--> [DONE]
[DONE] --(学生填写心得、(可选)上传照片并提交)--> [PENDING_REVIEW]
[PENDING_REVIEW] --(家长打分评价)--> [GRADED] (终态)
```
*注：状态变更事件（TODO -> IN_PROGRESS, DONE -> PENDING_REVIEW）均需通过 WebSocket 推送给家长端。*
### 5.2 积分流转账本逻辑
1.  **入账**：家长在审核 `PENDING_REVIEW` 的任务/阅读记录时输入积分 `X`。系统将记录状态改为 `GRADED`，同时将 `X` 累加到学生的“积分存钱罐”总余额中。
2.  **出账**：学生在商城点击兑换某个需消耗 `Y` 积分的奖励。系统校验当前余额是否 >= `Y`。若是，则余额扣除 `Y`，生成一条兑换记录 `isRedeemed: true`，推送给家长审核。若家长拒绝，余额回滚 `Y`。
---
## 6. 关键页面结构与路由 (Next.js App Router)
```text
src/
├── app/
│   ├── (auth)/
│   │   ├── setup/page.tsx          # 初始化部署页
│   │   └── login/page.tsx          # 登录页（验证码+账密）
│   ├── (student)/                  # 学生端路由组
│   │   ├── layout.tsx              # 布局：顶部月历+侧边栏
│   │   ├── page.tsx                # 首页：每日任务与阅读打卡
│   │   ├── reading/page.tsx        # 阅读手账墙
│   │   ├── store/page.tsx          # 积分商城页
│   │   └── reports/[id]/page.tsx   # 成长战报详情页
│   ├── admin/                      # 家长端路由组
│   │   ├── layout.tsx              # 布局：左侧管理菜单
│   │   ├── page.tsx                # 首页：待审核工作台 + 实时任务动态
│   │   ├── planner/page.tsx        # 日历与任务计划制定页
│   │   ├── books/page.tsx          # 书单管理
│   │   ├── rewards/page.tsx        # 奖池管理
│   │   ├── reports/page.tsx        # 报表生成与寄语页
│   │   └── settings/page.tsx       # 账号管理
├── components/
│   ├── auth/ (LoginForm, CaptchaImage)
│   ├── student/ (CalendarView, TaskCard, TaskTimer, StudentNoteInput, PhotoUploader, PhotoViewer, BookShelf, ReadingLogForm, ExcerptStickyNote, PointsStore, ReportCard, AIAgentPlaceholder)
│   └── admin/ (AdminTaskReviewer, AdminReadingReviewer, AdminTaskPlanner, ReportGenerator, DataDashboard, RealTimeTaskMonitor)
├── middleware.ts                   # 路由级鉴权拦截
└── lib/ (prisma.ts, auth.ts, reportEngine.ts, websocket.ts)
```