# 阶段 F：NovelAI 图生图（Image to Image）· 待验收

## 改动文件
- `index.html`：原有「读取 NovelAI PNG 参数」**后面**添加「图生图（Image to Image）」折叠区；底图可拖入、点击选择、粘贴或选已有卡片图片；本机实时预览及目标尺寸提示，清除底图后返回文生图；重绘强度默认 0.5、噪声默认 0.1。原有普通生图和模型组生图均复用同一图生图适配逻辑，组合设置不暗中删除 Vibe / 角色坐标。
- `novelai-img2img.js`：增加纯函数 `containRect`（等比缩放、完整保留底图、居中留白、不裁切）与 `apply`（`action: img2img`、`parameters.image` PNG Base64、`strength`、`noise`）。
- `tests/verify-img2img.mjs`：校验 API 请求字段、数值范围、尺寸不裁切、Vibe 和多角色原字段保留以及 DOM 导入入口。
- `tests/verify-preview.mjs`：折叠区由九个更新为十个，位置固定在 PNG 参数读取之后。
- `.github/workflows/verify-stage-c.yml`：追加阶段 F 自动测试。
- `STAGE_F_REPORT.md`：本说明。
- `FUTURE_REQUIREMENTS.md`：增加生产同步与未来回收站清理注意事项。

## 官方说明、兼容性界限
NovelAI 官方图生图文档：https://docs.novelai.net/en/image/controltools/ 和 https://docs.novelai.net/en/image/strengthnoise/ 。`Strength` 越高变化越大；`Noise` 可增加细节，但过高可能带来伪影。0.5 / 0.1 是本项目自行选择的保守初始值，不冒称官方默认。

官方明确指出 Vibe Transfer **不兼容 Precise Reference**：https://docs.novelai.net/en/image/precisereference/ 。本项目尚未提供 Precise Reference。官方未明确说明 Img2Img 与 Vibe 或多角色坐标不可共用，故未强制互斥，但真实组合生成仍需用户测试。

## 尺寸
目标尺寸沿用模型参数栏设置。底图尺寸与目标不一致时，页面在生成前明确提示：浏览器在目标画布上等比缩放并用白色留边，不裁切。若宽高比相同则仅缩放，目标一致则无需缩放。转换过程完全本地进行。

## 隐私
底图仅从 File / Clipboard / 当前站点本机收藏读入浏览器内存；本机 Canvas 转换为 PNG Base64，只有实际点击生成才将 `parameters.image` 发送到既有 NovelAI 官方 `https://image.novelai.net/ai/generate-image`。不上传其他地方，不把底图 Base64 写入生图配置、生产 Supabase 或备份。生成图片存储仍沿用已有收藏机制。

## 自动测试
https://github.com/kimbeley-cpu/artist-string-favorites-preview/actions/runs/40062347406
- Stage A and B preview regression — success
- Stage C PNG metadata fixtures — success
- Stage D character positions — success
- Stage E image recycle safety — success
- Stage F image-to-image — success

## 用户验收
1. 浏览器打开预览网址，核对图生图位于 PNG 参数读取后，左右布局不变。
2. 分别拖入、点击选择、Ctrl+V 粘贴 PNG/JPG/WebP；清除后恢复普通文生图。
3. 从本机已保存卡片中选择底图，查看预览与尺寸提示。
4. 上传横图选竖版生成尺寸，确认明确提示等比缩放和白色留边，无裁切。
5. 改变 Strength/Noise，检查 0~1 范围验证；自愿消耗 Anlas 测试一个真实 img2img 请求。
6. 分别测试和已选 Vibe、独立角色站位一起生成，反馈官方 API 实际是否接受组合；自动测试并不能验证远端兼容性。
7. 测试本机图片回收站、PNG 解析和 Token 存储未受影响。

**未经过用户实际验收不合并正式版。**
