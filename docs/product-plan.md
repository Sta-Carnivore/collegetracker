# ApplyTracker 完整产品计划

> 版本：2026-05-29 | 用途：发给 Claude 继续执行和拆分开发任务

ApplyTracker 是一个面向中国及国际学生的美本申请智能规划网站。它用可视化表格帮学生管理学校和 deadline，用 AI Resume 理解学生背景，用 Bio Website 展示学生亮点，再用 Planner 告诉学生下一步最该做什么。

---

## 1. 产品定位

- **目标用户**：中国及国际学生，尤其是正在准备或即将准备美本申请的学生。
- **核心价值**：帮助学生把申请学校、进度、材料、履历、deadline 和个人展示统一管理起来。
- **产品风格**：简洁、现代、轻量、高级感，支持中文/英文双语。
- **产品边界**：不做 essay 代写，不做录取概率预测，不做学生排名。

---

## 2. 商业模式与定价

> 定价原则：当前价格是早期结构，不是最终死价。之后需要根据真实 AI token 成本微调，尤其是 Bio 网站生成成本。

| 套餐 | 价格 | 包含内容 |
|------|------|---------|
| Free | $0 | 基础申请 tracker、list/icon 视图、导出表格、基础 AI Resume 解析、基础 deadline 提醒。 |
| Pro Monthly | $20/月 | 完整 tracker、更多 AI Resume 次数、Resume 优化建议、Bio 网站生成、Planner、邮件提醒、版本保存。 |
| Pro 3-Month | $50/3个月 | 适合申请季集中使用，权益等同 Pro Monthly。 |
| Bio One-Time | $15/个网站 | 适合不想订阅 Pro、但只想生成一个个人网站的用户。 |

- 必须记录每次 AI 调用成本，后续用真实数据判断价格是否需要调整。
- Free 用户必须有 AI 次数限制，防止成本失控。
- Bio 生成成本确认前，不要承诺无限生成。

---

## 3. MVP 核心功能

1. **Visualizable Application Tracker**：可视化大学申请表格。
2. **AI Resume**：上传简历，解析并生成结构化 profile。
3. **Bio Website Generator**：根据学生 profile 生成个人展示网站。
4. **Deadline / Task Planner**：根据 deadline 和完成度生成优先级提醒。

> 当前决定：暂时不做 Essay 写作功能，先把申请管理、resume、bio 和 planner 做稳。

---

## 4. 用户整体流程

1. 用户注册/登录。
2. 进入 onboarding，填写或跳过基础问题。
3. 进入 dashboard，添加学校。
4. 上传 resume，系统生成结构化 profile。
5. 用户用 tracker 管理申请表格。
6. Pro 或单次购买用户生成 Bio 网站。
7. Planner 根据 deadline 给任务提醒。
8. 邮件系统发送简单、明确的 deadline 和进度提醒。

---

## 5. Onboarding

- 新用户第一次进入网站时显示 onboarding。
- 每一步都可以 Skip，不强迫用户一次填完。
- 跳过的问题之后可以在 Profile 页面补充。

**Onboarding 问题：**
- 姓名
- 毕业年份
- 目标专业
- 目标学校数量
- 是否已有 school list
- 是否想上传 resume

**需要数据库字段：**
`onboarding_completed`, `full_name`, `graduation_year`, `intended_majors`, `school_list_started`, `resume_uploaded`

---

## 6. Core 1: Application Tracker

这是网站主功能，也是用户最常打开的页面。支持两种视图：**as List** 和 **as Icons**，类似 Notion 的切换方式。

**主页面固定显示字段：**
- 学校名
- 轮次
- 截止日期
- 通知日期
- 状态
- Essay 剩余

**交互规则：**
- 学校名本身就是超链接。
- 点击学校名直接打开对应学校 portal/application link。

**点进学校后显示的详细信息：**
- SAT/ACT 中位数
- 录取率
- 申请专业
- Supplemental essay 题目
- 材料 checklist
- 备注
- 官网链接
- Portal 链接

**状态颜色：**

| 状态 | 视觉表达 |
|------|---------|
| 未开始 | 灰色 |
| 进行中 | 蓝色 |
| 已提交 | 紫蓝色 |
| 录取 | 绿色 |
| 拒绝 | 红色 |
| Waitlist | 黄色 |
| Deferred | 小钟表图标 |

**Tracker 其他功能：**
- 按 deadline 排序
- 按申请轮次筛选
- 按状态筛选
- 搜索学校
- 添加自定义学校
- 导出 CSV/Excel

---

## 7. Core 2: AI Resume

AI Resume 的目标是把学生的 resume 变成结构化 profile。Resume 主要是信息提取、分类和整理，小模型即可胜任。

**用户流程：**
1. 上传 PDF/DOCX。
2. 系统读取文本。
3. 小模型解析 resume。
4. 生成结构化结果。
5. 用户可以手动修改。
6. 保存到 profile。

**文件限制：**
- 只支持 PDF/DOCX。
- 最大 5MB。
- 原始 resume 不公开，只存到用户私有路径。

**AI 固定输出模板：**
- 基本信息
- 教育背景
- 目标专业
- 活动列表
- 奖项列表
- 项目经历
- 技能
- 个人亮点
- 薄弱部分
- 可以强化的方向
- 适合在申请中突出的主题

**Free/Pro 区别：**
- Free：基础解析、结构化展示、每月有限次数。
- Pro：更多解析次数、更详细的活动排序、针对目标专业的优化建议、针对申请方向的 profile 建议。

---

## 8. Core 3: Bio Website Generator

Bio 网站生成器是 Pro 功能，也可以单独购买。目标是根据学生 resume/profile 生成一个漂亮、现代、有个人特色的申请展示网站。

第一版不让 AI 自由生成整站代码，而是使用**固定模板 + AI 内容 + AI 风格配置**。

**三种固定模板：**

| 模板 | 适合用户 |
|------|---------|
| Academic / Research | 科研、竞赛、学术型学生 |
| Builder / Project | 工程、CS、创业、项目型学生 |
| Creative / Hybrid | 艺术、人文、跨学科、综合型学生 |

**生成前提问：**
- 你希望别人第一眼记住你什么？
- 你最想突出哪类经历？
- 你的目标专业是什么？
- 你喜欢更正式还是更大胆的风格？
- 有没有必须展示的项目或奖项？
- 每个问题都可以跳过。

**Bio AI 系统：2-3 个 Agent**

| Agent | 建议模型 | 任务 |
|-------|---------|------|
| Agent 1: Profile Organizer | 便宜小模型 | 读取 resume/profile，整理经历，去重，提取重点，判断内容权重。 |
| Agent 2: Website Writer | Claude Sonnet 系列或 GPT 高质量模型 | 根据模板生成 headline、about、activities summary、projects copy、awards highlights 和 section order。 |
| Agent 3: Micro Editor | 便宜小模型 | 理解用户微调指令，判断是改颜色、顺序、强调重点，还是需要重写文案。 |

**Bio 内容权重系统（待定是否加入）：**
- 竞赛强：Awards 权重更高。
- 项目强：Projects 权重更高。
- 科研强：Research 权重更高。
- 领导力强：Activities 权重更高。
- 跨学科强：Story/Identity 权重更高。

**版本保存：**
- 每次微调保存一个版本。
- 用户可以查看历史版本。
- 用户可以回退到旧版本。
- 用户可以重新发布。

---

## 9. Core 4: Deadline / Task Planner

Planner 的目标是告诉用户今天最该做什么、这周最紧急的事情是什么、哪些学校有 deadline 风险。

**Planner 输入数据：**
- 截止日期
- 通知日期
- Essay 剩余数量
- 材料 checklist 完成度
- 学校申请轮次
- 用户设置的重要程度

**Planner 输出内容：**
- Today's Priority
- This Week
- High Risk Deadlines
- Completed Tasks

**风险等级：** Low / Medium / High / Critical

> 不把公式展示给用户，只在后台根据 deadline、essay 剩余、材料完成度和学校重要程度计算优先级。

---

## 10. Email Reminder

邮件要简单明了，不写长篇营销文案。

**第一版邮件类型：**
- 注册欢迎邮件
- deadline 前 7 天提醒
- deadline 前 24 小时提醒
- 每周申请进度总结
- Pro 到期提醒
- Beta 反馈邀请

**邮件示例：**
```
Subject: NYU deadline is in 7 days

You still have 2 essays unfinished for NYU.
Deadline: Jan 1.
Recommended next step: finish Essay 1 draft today.
```

---

## 11. 技术选型

| 层级 | 技术/工具 |
|------|---------|
| Framework | Next.js 15 App Router |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| AI | Claude / OpenAI APIs |
| Payment | Stripe |
| Email | Resend |
| Deployment | Vercel |
| Styling | Tailwind CSS + shadcn/ui |
| Storage | Supabase Storage |

---

## 12. 数据库核心表

`users`, `profiles`, `schools`, `applications`, `resume_profiles`, `bio_sites`, `bio_site_versions`, `tasks`, `email_reminders`, `ai_requests`, `subscriptions`, `feedback`

**`ai_requests` 表必须记录：**
`user_id`, `feature`, `model`, `input_tokens`, `output_tokens`, `estimated_cost`, `status`, `created_at`

> 用途：用这张表判断 Free 用户是否烧太多钱、Bio 每次生成的真实成本、Pro 定价是否合理，以及是否需要调整次数限制。

---

## 13. 安全要求

- **Supabase RLS**：所有用户数据必须开启 Row Level Security。规则核心：`auth.uid() = user_id`。
- **API Key**：Claude API Key、OpenAI API Key、Stripe Secret Key、Resend API Key、Supabase Service Role Key 只能存在服务端环境变量。不能使用 `NEXT_PUBLIC_` 前缀。
- **文件上传安全**：只允许 PDF/DOCX，最大 5MB，上传到用户私有路径，不允许公开访问原始 resume。
- **Rate Limit**：Free 用户每月有限次数，Pro 用户更高次数，Bio 生成每月限制，防止恶意刷接口。

---

## 14. MVP 开发顺序

| 阶段 | 目标 |
|------|------|
| Phase 1: Onboarding | 注册后引导、每步可 skip、保存用户基础 profile。 |
| Phase 2: Tracker | 完善 List/Icon 视图切换、学校名超链接、详情页/抽屉、状态颜色、Excel/CSV 导出。 |
| Phase 3: AI Resume | 固定输出模板、小模型解析、结构化 profile、用户可编辑、Free/Pro 次数限制。 |
| Phase 4: UI/UX 美化 | 整体前端变简单漂亮、主 dashboard 更干净、暗色/亮色模式、移动端适配。 |
| Phase 5: Bio Website Generator V1 | 3 个固定模板、生成前问题、2-3 agent 流程、AI 内容生成、自然语言简单微调、版本保存、发布页面。 |
| Phase 6: Planner + Email | deadline 风险等级、today priority、weekly tasks、7 天/24 小时邮件提醒、每周总结邮件。 |
| Phase 7: Beta Test | 找 5-10 个同学深度内测，给明确任务，收集反馈，前 10 位认真反馈用户给永久免费 Premium。 |

---

## 15. 暂时不做的功能

- Essay 写作/代写功能。
- 录取概率预测。
- 学生之间排名。
- AI 自由生成整站代码。
- 过多 Bio 模板。
- 复杂社交功能。

> 原因：这些功能要么早期不稳定，要么会增加维护成本，要么容易伤害用户信任。

---

## 16. 下一步讨论建议

1. 先把 Tracker 的 list/icon 两种视图具体画清楚。
2. 写 AI Resume 的万能解析 prompt 和 JSON 输出 schema。
3. 确定 Bio 三种模板的视觉方向和每个模板需要的数据字段。
4. 定义 Planner 的优先级公式和风险等级规则。
5. 把这份 plan 拆成 Claude 可以执行的开发任务。
