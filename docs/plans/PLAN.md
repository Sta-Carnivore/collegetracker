ApplyTracker-美本申请智能规划网站

定位：帮助 中国及国际学生提高美国本科申请效率的 AI 辅助平台。双语界面（中文/英文）Freemium 商业模式。

核心功能MVP（Phase 1: 1&2 / Phase 2: Premium 3）：
大学申请界面可切换样式（excel表格形式/每个大学为一个的模块形式）：每个学校有申请截止日期，申请进度（未提交灰，提交在等待为篮，拒绝为红，waitlist黄，defer旁边加小钟表标志，录取为绿），supplemental essay进度（同步官网题目和数量），申请专业，申请ed/ea/rea/rd/rolling，通知书时间，sat/act中位数，录取率
AI 简历：提供上传简历通道，了解学生专业、活动、标化、竞赛/奖项 然后用我们后续更新的完整模版重新呈现，然后根据学生申请的的专业和学校进行针对性推荐策略，怎么去进步和改动
订阅用户使用：ai生产高端及美观的个人profile网站帮助大学申请丰富自我的履历，后续会有细节描述，大概思路：
Step 1: 数据无缝注入 (External Data Integration) 用户无需二次输入。系统直接继承模块二解析出的简历数据，并提供 API 授权入口。后台调用 Github API 或 Notion Public API，自动拉取用户的代码库 README 或学术项目笔记，由 AI 自动浓缩为项目展示文案。
Step 2: 风格发散与定调 (Diverge -> Compare -> Converge) 根据用户的申请方向（例如理工科背景），AI 引擎并行生成 3 套带有高端暗黑玻璃拟态（Glass-morphism）和开场动画的预览版（如：极客科技风、稳重学术风、前卫混合风）。用户在屏幕上进行直观的横向对比，选中一款作为基础底座。
Step 3: 极速自然语言微调 (Rapid Iteration Loops) 在预览界面旁提供对话框。用户通过简单的指令（“色彩更具侵略性一点”、“把 AIME 晋级的模块高亮放大”、“设计太平庸了，换个极其大胆的排版”）对页面进行局部手术刀式的微调（Incremental refinement），所见即所得。
Step 4: 无压回退机制 (Undo Without Fear) 提供绝对安全的“时光机”按钮。如果某次提示词导致页面布局崩溃，用户直接点击“撤销至上三个版本”，避免尝试修复烂代码，保持创作心流。
后台架构支撑：并发子代理 (Parallel Sub-agents) 当用户点击“生成网站”的瞬间，ApplyTracker 后台会同时唤醒多个专门的 AI 代理：代理 A 负责编写多个子页面的 HTML/CSS；代理 B 负责在后台抓取和压缩外部图片；代理 C 负责作为“设计总监”评估代码是否达到了高级审美标准（Skill invocation）。

页面呈现：可以兼容很多人使用，但是每个人要注册账号使用，freemium模式，然后简约界面，可以给用户发送邮件（注册，推广，deadline题醒）

project理想进程时间线：
完成完整website所有功能都在理想情况下可以工作
给5-10个朋友和同学进行深度内测然后收集意见、反馈 （奖励：终身高级会员： 承诺前 10 位认真填写反馈问卷的同学，直接赋予数据库层面的“永久免费 Premium 权限”。）
第一次优化，收集数据 记录
第二次内测再给同学再次反馈
第二次优化，收集数据 记录
通过社交媒体传播，先给同学使用，然后慢慢扩大到隔壁学校，和小红书还有朋友圈
进行意见收集再次更新优化

需要再列出的：
技术选型 大概思路：
	 层级		技术 / 工具 
 框架		Next.js 15 (App Router) 
 数据库	Supabase (PostgreSQL) 
 认证		Supabase Auth (邮箱 + Google OAuth) 
 AI		Claude claude-sonnet-4-6 API（后续可扩展 GPT-4o）
 支付 		Stripe (订阅管理) 
 邮件		Resend 
 部署		Vercel 
 样式		Tailwind CSS + shadcn/ui
ai调用思路
AI 接口调用成本和延迟是 Freemium 模式的生死线，必须严格设计。
流式输出 (Streaming Response)： 在“AI 简历润色”和“生成自然语言微调”时，必须使用 Server-Sent Events (SSE)。让用户看到字一个个蹦出来，掩盖大模型几秒甚至十几秒的等待时间。
Prompt 隔离： 绝对不能在前端代码中拼接 Prompt。所有的系统提示词（如“你是一个顶尖美本申请顾问...”）必须写在后端的环境变量或单独的配置文件中，防止被用户“套话”窃取你的核心竞争力。
结构化输出 (JSON Mode)： 当 AI 需要提取简历中的 GPA、活动列表时，强制使用 Claude/GPT 的 JSON Schema 功能，确保返回的是可以存入数据库的代码格式，而不是一段废话文本。

大框架什么样：前端，后端，数据库
前端 (Frontend / Client-side)： 使用 Next.js 15 的 React Server Components (RSC)。UI 呈现主要在服务端渲染，客户端只负责强交互（如拖拽、点击切换视图）。样式依赖 Tailwind CSS 结合 shadcn/ui，确保玻璃拟态（Glassmorphism）和暗黑模式的高级感。
后端 (Backend / Server-side)： 不编写独立的后端服务，直接使用 Next.js 的 Route Handlers (API 路由) 和 Server Actions。这里负责处理 AI 简历解析请求、抓取Github/Notion 数据以及对接 Stripe 支付状态。
数据库与鉴权 (Database & Auth)： 完全依托 Supabase。使用 PostgreSQL 存储结构化数据（用户表、大学数据表、申请进度表）。鉴权使用 Supabase Auth，支持邮箱密码和 Google OAuth 一键登录。

安全要求！！！
这是重中之重，尤其是涉及到学生的个人履历、成绩等高度敏感的隐私数据。
行级安全防护 (Row Level Security - RLS)： 这是使用 Supabase 必须开启的设置。必须在数据库写死规则：auth.uid() = user_id。确保即使用户知道了数据库接口，也绝对无法通过 API 查到其他同学的 GPA 或文书进度。
API 密钥隐身： Claude API Key、Stripe Secret Key、Resend API Key 只能存放在 Vercel 的服务端 Environment Variables 中，绝对不能加上 NEXT_PUBLIC_ 前缀，防止暴露在浏览器网络请求中。
接口防刷机制 (Rate Limiting)： 免费用户点击“生成 AI 建议”必须有频率限制（例如每小时 5 次）。防止恶意脚本疯狂调用你的接口，导致你的 Claude 账户被刷欠费。
文件上传安全： 用户上传的 PDF 简历存入 Supabase Storage 时，限制文件类型只能是 PDF/DOCX，且大小不超过 5MB，防止恶意文件注入。


