# 部署后排错

## 1. 登录失败

优先检查 Supabase Auth 配置：

- Authentication -> URL Configuration -> Site URL 是否是 Vercel 生产域名。
- Redirect URLs 是否包含 `https://your-app.vercel.app/**`。
- 本地开发是否包含 `http://localhost:3000/**`。
- Vercel 环境变量是否配置了 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
- Email provider 是否开启。

## 2. 页面提示 Supabase 未配置

- 检查 Vercel Project Settings -> Environment Variables。
- 确认变量名完全一致：
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 修改环境变量后需要重新部署。

## 3. 保存失败

可能原因：

- 还没有登录。
- `supabase/schema.sql` 没有完整执行。
- RLS policy 缺失。
- 真实数据库缺少新字段，例如 `studio_id` 或工资快照结算字段。

处理方式：

- 先确认当前页面已登录。
- 到 Supabase SQL Editor 执行最新 `supabase/schema.sql`，或 README 中的 ALTER TABLE 补丁。
- 检查 Table Editor 中业务表是否启用 RLS。
- 检查每张业务表是否有 select / insert / update / delete policy。

## 4. DeepSeek 识别失败

- 检查 Vercel 是否配置 `DEEPSEEK_API_KEY`。
- 确认变量名不要加 `NEXT_PUBLIC_`。
- 确认 Key 没有复制空格。
- 识别失败时可以先手动编辑 JSON 并校验。
- 不要在浏览器端调用 DeepSeek。

## 5. 某列不存在

如果出现类似 `column studio_id does not exist` 或工资快照字段不存在，说明 Supabase schema 不是最新。

处理方式：

- 执行 README 中 “旧 schema 迁移” 部分的 ALTER TABLE SQL。
- 确认包含：
  - `studios` 表
  - `packages.studio_id`
  - `classes.studio_id`
  - `performances.studio_id`
  - `salary_rules.studio_id`
  - `salary_calculations.studio_id`
  - `salary_calculations.status`
  - `salary_calculations.actual_paid_amount`
  - `salary_calculations.settled_at`
  - `salary_calculations.note`
  - `salary_calculations.updated_at`

## 6. 数据看起来串号

这个不应该发生。请检查：

- 是否关闭了 RLS。
- 是否误用了 service role key。
- 是否在 Vercel 中配置了不该使用的 secret key。

当前 App 只需要 Publishable / anon key，不需要 service role key。
