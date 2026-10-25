# NutriInsight Pro

AI 驱动的多用户营养管理应用：注册/登录 → 完善个人信息 → 文字输入或拍照记录餐食（吃的/喝的） → AI 识别营养 → 本餐还差什么 + 补充建议 → 全天缺口、评分与趋势。

## 功能
- 账号：邮箱注册、登录（JWT，令牌存 localStorage `token`）、退出登录
- 首次引导：注册后必须填写身高/体重/年龄/性别/活动水平/目标（`onboarded` 标记），完成后才能进入主应用
- 记录一餐（LogMealDialog）：「文字输入」（分别填写吃了什么、喝了什么，带快捷标签）或「拍照上传」（照片随记录保存，营养由 AI 根据文字描述估算）；识别后可修正名称/份量
- 本餐营养缺口（MealAdvicePanel）：按餐次占比（早 25% / 午 35% / 晚 30% / 加餐 10%）对照个人目标，展示热量/蛋白质/碳水/脂肪/纤维是否不足，食物类别搭配（蔬菜、水果、奶类、饮品等），并给出具体补充食物与克数（自动避开过敏原、素食偏好，按年龄段追加提示）
- 年龄段界面：`AppLayout` 读取资料年龄，在 `<html data-age-group>` 写入 teen(<18) / adult / senior(≥60)；`index.css` 末尾用 CSS 变量覆盖主题色、圆角、字号；首页问候语随年龄段变化（`lib/nutrition.ts` 的 `AGE_COPY`）
- 今日概览、饮食记录、趋势分析（7/30 天，PDF 导出为浏览器打印）、个人中心
- 所有营养数据按用户隔离：`nutri_profiles.id` = `Users.id`，`nutri_meals.profile_id` = `Users.id`

## 结构
- `frontend/` React + Vite + Tailwind v4 + shadcn/ui（HashRouter）
  - `src/App.tsx` 路由：`/login` `/signup` `/onboarding` 以及受保护的 `/` `/meals` `/trends` `/profile`
  - `src/contexts/AuthContext.tsx` 登录状态
  - `src/components/custom/` Login、Signup、RequireOnboarded、ProfileForm、AppLayout、LogMealDialog、MealAdvicePanel、MealRow、TrendCard 等
  - `src/pages/` Index、Meals、Trends、Profile、Onboarding、NotFound
  - `src/lib/api.ts` 营养 API 客户端（自动携带 Bearer 令牌，401 时跳回登录）
- `backend/` Express + Drizzle（PostgreSQL）
  - `routes/auth.ts` 注册/登录/me（模板，勿改）
  - `routes/nutrition.ts` 全部经 `authenticateJWT` 保护，按 `req.user.id` 读写；`POST /meals/analyze`（AI 识别）、`POST /meals/advice`（本餐缺口与建议）
  - `repositories/nutritionRepository.ts` 按 userId 查询的资料与餐食仓储
  - `services/` `nutritionService`（目标/评分/全天缺口）、`mealAnalysisService`（AI 识别食物与饮品）、`mealAdviceService`（单餐缺口与补充建议，规则计算）
- `shared/` 前后端共享类型（`types/nutrition.ts`）

## 后续计划
食物库搜索、真正的照片视觉识别、营养师分享报告、微量营养素详细分析、用户角色与管理。
