# 阿里云轻量服务器自托管部署

本方案用于 2 核 2G 阿里云轻量应用服务器部署 Next.js App。Supabase 继续使用 Supabase Cloud，DeepSeek API 仍只在服务端调用。

## 部署方式

- Next.js App：阿里云轻量服务器
- 数据库 / Auth：Supabase Cloud
- AI：DeepSeek API，服务端环境变量读取
- 进程管理：PM2
- 反向代理：Nginx
- 暂不自建 Supabase，2 核 2G 不建议承载数据库、Auth、Storage 全套服务

## 服务器准备

1. 创建阿里云轻量服务器，建议 Ubuntu 22.04。
2. 安全组开放：
   - `80`
   - `443`
   - `3000`，仅测试阶段可开，正式建议只通过 Nginx 暴露 80/443
3. 安装 Node.js 20：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
npm -v
```

4. 安装 PM2 和 Nginx：

```bash
sudo npm install -g pm2
sudo apt-get update
sudo apt-get install -y nginx
```

## 拉取和构建

```bash
git clone <your-github-repo-url> yoga_app
cd yoga_app
npm install
```

创建 `.env.production`：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DEEPSEEK_API_KEY=
```

不要填写 service role key、secret key 或任何 Supabase secret 类型的 key。

构建：

```bash
npm run build
```

项目已配置 `output: "standalone"`，构建后会生成 `.next/standalone`。

## PM2 启动

可以直接启动 standalone server：

```bash
cd .next/standalone
PORT=3000 NODE_ENV=production pm2 start server.js --name yoga-salary-app
pm2 save
pm2 startup
```

如果 `.next/standalone` 中缺少 `public` 或 `.next/static`，可从项目根目录复制：

```bash
cp -r public .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
```

## Nginx 反向代理

示例配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 域名和 HTTPS

如果服务器在中国大陆地域，正式绑定域名通常需要 ICP 备案。测试阶段可以先用：

```text
http://服务器公网IP:3000
```

正式访问建议绑定域名并配置 HTTPS。可以使用 Certbot：

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Supabase Auth 配置

部署后到 Supabase Dashboard：

Authentication → URL Configuration

- Site URL：`https://your-domain.com`
- Redirect URLs：
  - `https://your-domain.com/**`
  - `http://localhost:3000/**`

如果先用 IP 测试，也可以临时加入对应 IP URL。

## 常见排错

- 页面提示 Supabase 未配置：检查 `.env.production` 和 PM2 启动目录。
- 登录后跳不回来：检查 Supabase Auth Redirect URLs。
- 保存失败：确认已执行最新 `supabase/schema.sql`，并启用 RLS policy。
- DeepSeek 识别失败：检查 `DEEPSEEK_API_KEY` 是否只在服务端环境中配置，不能加 `NEXT_PUBLIC_`。
- 服务器内存紧张：关闭不必要服务，保持 Supabase 使用云端，不要在 2 核 2G 上自建数据库全家桶。
