# 阶段 A（测试环境隔离）交付记录

基础来源：`kimbeley-cpu/artist-string-favorites`，`index.html` 文件 SHA `56935f1735853249af68cfed6919601b5a0ee7c1`。

## 更改与作用

- `index.html`：独立 IndexedDB 名称 `artist-box-web-preview`；独立 localStorage 前缀 `artist-box-preview:`；移除云同步弹窗和全部 Supabase 通信代码；「云同步」入口禁用；原云同步触发函数用空实现替代；通过 fetch/XHR 封锁 `*.supabase.co` 和 `*.supabase.in` 的网络请求；保留原收藏、人物、提示词、Vibe、NovelAI 生成和本机 Token 保存逻辑。
- `sw.js`：服务工作线程缓存改为 `asf-preview-shell-v1`。
- `manifest.webmanifest`：测试版 PWA 名称与正式版区分。
- `icon-192.png`、`icon-512.png`、`icon-maskable-512.png`：从正式版复制，原封不动。
- `.nojekyll`：让预览仓库可按静态文件直接发布。
- `tests/verify-preview.mjs`：无依赖的静态校验脚本；在仓库根目录执行 `node tests/verify-preview.mjs`。

## 阶段 A 验收

1. 通过静态检查和 JavaScript 语法检查。
2. GitHub Pages 仅在**本测试仓库**启用 `main / (root)`；未设自定义域名时，预期项目路径为 `https://kimbeley-cpu.github.io/artist-string-favorites-preview/`。
3. 打开预览站点，确认「云同步（测试版关闭）」为禁用状态。
4. 浏览器开发者工具 → Application → IndexedDB，确认数据库为 `artist-box-web-preview`，不存在测试版写入的 `artist-box-web`；Local Storage 检查 `artist-box-preview:` 前缀。
5. 浏览器 Network 检查页面初始化不请求 Supabase；生成测试时 Token 只发往 NovelAI 官方接口。
6. 预览版录入一条临时收藏并刷新后仍存在；正式网站数据应保持不变。
7. 运行基本生图及收藏测试（会消耗 NovelAI Anlas，仅获得用户同意后执行）。

## 尚不包含

- 阶段 B 的生图工作台排版。
- PNG 参数解析和多角色 5×5 站位（后续分别验收）。
- Cloudflare DNS 修改、自定义域名绑定、正式仓库任何变更。

## 发布前安全约束

静态站点内的网络拦截是误配置保护，不是防恶意代码的绝对安全边界。正式 Supabase URL/Key 和通信流程已从测试版构建中移除，不加载第三方云同步脚本。

测试版不自动迁移浏览器 Token。若你要试生图，只在测试站点本机自行输入 Token，切勿分享。
