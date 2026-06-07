# 瑜伽工资助手

移动端优先的瑜伽老师工资记录 App。一个登录用户就是一位瑜伽老师，可以管理自己在多个瑜伽馆 / 工作地点的课程、业绩、课包、工资规则和月度工资快照。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui 风格基础组件
- Supabase Postgres
- Supabase Auth
- Supabase Row Level Security
- Supabase Storage 预留
- DeepSeek API 文本工资规则识别
- Zod
- Vitest
- PWA manifest 基础配置

## MVP 功能

- 邮箱密码注册、登录、退出
- 瑜伽馆 / 工作地点 CRUD
- 会员 CRUD
- 课包 CRUD，自动计算单节成交价
- 课程记录新增、编辑、删除
- 业绩记录新增、编辑、删除
- 从课包快速记录私教课
- 课包已上课时 / 剩余课时统计
- 未归属数据整理
- DeepSeek 文本识别工资规则
- 工资规则保存，支持通用规则和瑜伽馆专属规则
- 按瑜伽馆计算工资
- 保存月度工资快照
- 工资历史、结算状态、实际到账金额和差额展示

## 本地启动

```bash
npm install
npm run dev
```

验证：

```bash
npm run build
npm test
```

## Vercel 部署

项目可以直接部署到 Vercel：

1. 推送代码到 GitHub。
2. 在 Vercel 中导入该 GitHub 项目。
3. 在 Project Settings -> Environment Variables 配置：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DEEPSEEK_API_KEY`
4. Install Command 使用 `npm install`。
5. Build Command 使用 `npm run build`。
6. 部署完成后拿到 Vercel 生产域名，例如 `https://your-app.vercel.app`。
7. 回到 Supabase 配置 Auth 生产 URL。

部署检查：

- [next.config.mjs](/Users/b/Documents/yoga_app/next.config.mjs) 只开启 `reactStrictMode`，没有本地开发专属配置。
- `package.json` 包含 `build`、`start`、`test` scripts。
- 服务端不依赖本地文件系统持久化写入。
- 图片识别当前不保存文件，不需要 Supabase Storage。
- PWA manifest 路径是 `/manifest.webmanifest`。

## 环境变量

在项目根目录创建 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DEEPSEEK_API_KEY=
```

说明：

- `NEXT_PUBLIC_SUPABASE_URL` 可公开，用于浏览器 Supabase client。
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 使用 Supabase Publishable / anon key，可在浏览器使用，依赖 RLS 保护数据。
- `DEEPSEEK_API_KEY` 只能服务端使用，不能加 `NEXT_PUBLIC_`，不能在前端引用，不能打印。
- 不要配置 Supabase service role key。
- 不要配置 Supabase secret key。
- 不要配置任何 Supabase secret 前缀形式的 key。
- 不要把任何 secret key 写进代码或前端环境变量。

## Supabase 配置

新项目：

1. 打开 Supabase 项目。
2. 进入 SQL Editor。
3. 执行 [supabase/schema.sql](/Users/b/Documents/yoga_app/supabase/schema.sql)。
4. 在 Supabase Authentication 中开启 Email Auth。
5. 配置 `.env.local`。
6. 本地运行 `npm run dev`。

### Auth 登录方式

当前支持：

- 邮箱 + 密码注册 / 登录
- 手机号 + 密码注册 / 登录

邮箱注册：

- 如果 Supabase 开启了邮箱确认，注册成功后用户需要先打开邮箱，点击确认链接，再回来登录。
- 如果登录失败，先检查邮箱是否已经确认。

手机号 + 密码：

- 本阶段不支持短信验证码登录。
- 不需要 SMS OTP。
- 不生成 fake email。
- 不把手机号或密码存入业务表。
- 仍然使用 Supabase Auth 的 `user.id` 作为业务表 `user_id`。
- 如果 Supabase 控制台没有启用 Phone provider，页面会提示“当前手机号注册暂不可用，可以先使用邮箱注册～”。

如需启用手机号 + 密码，请在 Supabase Dashboard 中检查：

Authentication -> Providers -> Phone

根据 Supabase 项目能力启用 Phone provider。不同 Supabase 项目设置可能略有差异；如果暂时不启用，用户可以继续使用邮箱注册 / 登录。

当前完整 schema 包含：

- `teachers`，兼容保留
- `studios`
- `members`
- `packages`
- `classes`
- `performances`
- `salary_rules`
- `salary_calculations`

所有业务表都有 `user_id`，并启用了 RLS 以及 select / insert / update / delete policy。所有真实查询和写入都基于当前登录用户，不需要 service role。

### Supabase Auth 生产配置

部署到 Vercel 后，进入 Supabase Dashboard：

Authentication -> URL Configuration

配置：

1. Site URL 设置为 Vercel 生产域名，例如：

```text
https://your-app.vercel.app
```

2. Redirect URLs 添加：

```text
https://your-app.vercel.app/**
http://localhost:3000/**
```

3. 如果本地开发端口不是 3000，也可以添加：

```text
http://localhost:3001/**
```

4. Email Auth：

- 开启 Email provider。
- 开发阶段可以关闭邮箱确认，方便测试。
- 生产阶段建议根据需要开启邮箱确认。

5. Phone Auth：

- 如果要使用手机号 + 密码登录，请启用 Phone provider。
- 当前 App 不使用短信验证码，不需要配置 SMS OTP 流程。
- 如果 Phone provider 未启用，手机号注册 / 登录会显示友好提示，邮箱方式不受影响。

### 上线前数据库检查

- 已执行 `supabase/schema.sql`。
- 如果真实库是旧 schema，已执行本文档中的 ALTER TABLE 补丁。
- Table Editor 能看到：
  - `teachers`
  - `studios`
  - `members`
  - `packages`
  - `classes`
  - `performances`
  - `salary_rules`
  - `salary_calculations`
- 所有业务表 RLS 已开启。
- 每张业务表都有 select / insert / update / delete policy。
- 不需要 service role key。

## 旧 schema 迁移

如果你的 Supabase 项目已经执行过旧版 schema，可以在 SQL Editor 补充执行以下 SQL。

### studios 和 studio_id

```sql
create extension if not exists "pgcrypto";

create table if not exists public.studios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  phone text,
  address text,
  contact_name text,
  note text,
  created_at timestamptz default now()
);

alter table public.packages
  add column if not exists studio_id uuid references public.studios(id);

alter table public.classes
  add column if not exists studio_id uuid references public.studios(id);

alter table public.performances
  add column if not exists studio_id uuid references public.studios(id);

alter table public.salary_rules
  add column if not exists studio_id uuid references public.studios(id);

alter table public.salary_calculations
  add column if not exists studio_id uuid references public.studios(id);

alter table public.studios enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'studios' and policyname = 'studios_select_own') then
    create policy "studios_select_own" on public.studios for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'studios' and policyname = 'studios_insert_own') then
    create policy "studios_insert_own" on public.studios for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'studios' and policyname = 'studios_update_own') then
    create policy "studios_update_own" on public.studios for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'studios' and policyname = 'studios_delete_own') then
    create policy "studios_delete_own" on public.studios for delete using (auth.uid() = user_id);
  end if;
end $$;
```

### salary_calculations 结算字段

```sql
alter table public.salary_calculations
  add column if not exists status text not null default 'unsettled',
  add column if not exists actual_paid_amount numeric,
  add column if not exists settled_at date,
  add column if not exists note text,
  add column if not exists updated_at timestamptz default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'salary_calculations_status_valid'
  ) then
    alter table public.salary_calculations
      add constraint salary_calculations_status_valid
      check (status in ('unsettled', 'settled'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'salary_calculations_actual_paid_amount_nonnegative'
  ) then
    alter table public.salary_calculations
      add constraint salary_calculations_actual_paid_amount_nonnegative
      check (actual_paid_amount is null or actual_paid_amount >= 0);
  end if;
end $$;
```

当前版本不会删除旧的 `teachers` 表，也不会删除 `teacher_id` 字段；它们仍用于兼容旧数据。后续业务优先使用 `studio_id` 区分瑜伽馆 / 工作地点。

## DeepSeek 工资规则识别

文本工资规则识别通过服务端 Route Handler 调用 DeepSeek，浏览器端不会直接读取或使用 `DEEPSEEK_API_KEY`。

当前默认使用 OpenAI-compatible 调用方式：

- `baseURL`: `https://api.deepseek.com`
- `model`: `deepseek-v4-flash`

如果本地暂时没有配置 `DEEPSEEK_API_KEY`，开发环境会使用示例识别 fallback；生产环境会返回友好提示，不会让构建失败。

图片识别工资规则的入口已经预留：支持选择 JPG、PNG、WEBP，最大 5MB。当前 Vision/OCR Provider 未启用时，会提示先复制图片中的文字进行文本识别。后续可以替换为 DeepSeek Vision、OCR 服务、OpenAI Vision、Claude Vision 或其他 Provider。

## PWA 基础说明

项目包含 [public/manifest.webmanifest](/Users/b/Documents/yoga_app/public/manifest.webmanifest)：

- App 名称：瑜伽工资助手
- `display`: `standalone`
- `orientation`: `portrait`
- 柔和浅色 `theme_color` / `background_color`
- SVG 占位 icon

当前没有实现复杂离线缓存或 service worker。

## 真实手机验收和冒烟测试

- [真实手机端验收清单](/Users/b/Documents/yoga_app/docs/mobile-qa-checklist.md)
- [最小冒烟测试](/Users/b/Documents/yoga_app/docs/smoke-test.md)
- [部署后排错](/Users/b/Documents/yoga_app/docs/deployment-troubleshooting.md)

## 工资快照逻辑

工资快照会保存当时的计算结果。后续如果修改课程、业绩、课包或工资规则，已保存快照不会自动变化；可以回到工资页重新计算并更新当月快照。

删除工资快照只删除 `salary_calculations` 中的快照，不会删除原始课程、业绩、课包或规则。

## 安全注意事项

- 不使用 Supabase service role key。
- 不把 secret key 放到前端。
- `DEEPSEEK_API_KEY` 只在服务端使用。
- Supabase RLS 已启用。
- insert 时 `user_id` 来自当前登录用户，不从表单自由传入。
- 不自建密码存储。
- 不存储明文密码。
- 不把密码存到业务表。
- 不在代码中打印用户课程、业绩、工资规则、图片内容或 API Key。

## 当前暂未实现

- 图片真实 OCR / Vision 识别
- 导出 PDF / 图片
- 多用户组织权限
- 老板端 / 审批流
- 支付
- 复杂离线缓存
