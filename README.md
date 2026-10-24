# 画师串收藏夹 · 独立测试版（阶段 A）

这是与正式网站隔离的预览仓库。**云同步已禁用**，数据只在这个网站的浏览器来源内保存。本仓库不是正式版，禁止直接替换正式站点。

阶段 A 隔离说明见 [STAGE_A_REPORT.md](./STAGE_A_REPORT.md)。

**阶段 B 生图界面布局已在测试分支实施，待用户验收。** 文件与检查清单见 [STAGE_B_REPORT.md](./STAGE_B_REPORT.md)。

## 启用临时预览地址（暂不绑定自定义域名）

在**本预览仓库** Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/(root)` → Save。

预期临时地址：`https://kimbeley-cpu.github.io/artist-string-favorites-preview/`。必须以实际可访问为准。Cloudflare DNS 由仓库所有者在之后自行配置。

校验方式：`node tests/verify-preview.mjs`。至少完成浏览器联网隔离检查后才可验收阶段 A。
