# 阶段 C：NovelAI 原始 PNG 本地读取参数

## 本阶段交付（等待用户验收）

- `nai-png-metadata.js`：纯浏览器本地 PNG 解析模块。支持 PNG tEXt、zTXt、iTXt 文本块，并尝试读取 `stealth_pngcomp` / `stealth_pnginfo` Alpha 通道隐写数据；未使用外部服务、Token 或网络请求。
- `index.html`：在阶段 B 的左侧参数栏最上方增加「读取 NovelAI PNG 参数」折叠区、拖拽与文件选择、本地解析结果展示、只查看与显式套用按钮。右侧预览与原有收藏、Vibe、人物和生图代码不改。
- `tests/verify-png.mjs`：合成 PNG 测试样例，覆盖 tEXt/zTXt/iTXt、没有元数据、非法 PNG、Alpha 隐写、UI ID 和生产密钥禁入检查。
- `STAGE_C_REPORT.md`：本报告。
- `README.md`：追加阶段 C 交付链接。

## 已支持的读取和展示

正面提示词、负面提示词、模型、尺寸、步数、引导强度、Seed；采样器、噪声计划及可读取的角色信息仅展示（当前界面没有对应可安全映射的控件）。未解析到的字段明确显示「未找到」。

## 套用限制

- 只有点击「套用已识别参数」才修改表单。点击「只查看 / 关闭」不修改已有输入。
- 正面提示词来自 PNG 的完整 prompt。套用时它放入「主提示词」，清空「画师串」和提示词模板，避免把旧内容重复叠加；这一影响在套用前展示。
- 当前不支持的尺寸仅展示，不改变尺寸选项；当前未支持的 sampler/noise_schedule 不修改生成请求。
- 本阶段不恢复角色站位与角色字段，留待阶段 D。
- PNG 上传入口只读取本地文件；不会将 PNG 作为图生图底图发送给 NovelAI。
- 失败或元数据丢失时提示，不编造参数。

## 技术边界

本地解析器为了避免内存占用过高，限制 PNG 文件最大 60 MB、像素数最多 1800 万，文本元数据最大 2 MB。Alpha 隐写仅支持无交错 8-bit RGBA PNG，其他格式如无法读到会显示没有可用元数据。压缩元数据需浏览器支持 `DecompressionStream`；Safari 兼容性仍需在实际设备验收。

## 验收步骤

1. 打开独立预览站点，点击生图。确认阶段 B 左右布局未变，左栏最上方出现「读取 NovelAI PNG 参数」折叠区。
2. 先填写一些现有提示词，拖入一张自己保存的 NovelAI 原始 PNG，确认先显示参数而**没有直接套用**。
3. 点击「只查看 / 关闭」，核实旧输入完全不变。
4. 再拖入同一图片，核对字段，点击「套用已识别参数」，核实主提示词、模型、步数、CFG、尺寸（若支持）、Seed 等识别结果正确回填。
5. 拖入普通 PNG、缺元数据 PNG、JPG、损坏文件，检查报错和缺字段提示。
6. 验证人物库、Vibe、自动收藏、Token 本机存储与测试版云同步禁用状态没有变化。

## 测试状态

已通过源码静态审查；提供了可由 Node.js 执行的合成 PNG 测试脚本 `node tests/verify-png.mjs`。当前未在真实浏览器上执行自动化点击测试，也没有获得用户的真实 NovelAI PNG 测试素材，因此实际图片兼容性仍需在验收时验证。

**未获用户验收前不进入阶段 D。**


## 用户审查整改（2026-10-24）

1. **Alpha 位流顺序**：按 NovelAI 官方 `NovelAI/novelai-image-metadata` 的 `nai_meta.py`（`alpha.T.reshape`）改为先列后行：`for x -> for y -> alpha[y*width+x]&1`。删除未调用的 `readBit` 辅助函数。
2. **正面提示词套用**：增加「保留当前画师串（默认）/ 清空画师串」显式选择。提示词模板始终保留，不再被代码清空。
3. **未知模型**：不在已知下拉模型选项的模型只展示，不调用 `setModel`，不会强制填入自定义模型。
4. **测试修复**：修复严格模式下 iTXt 测试样本的八进制转义错误；合成隐写 PNG 改为多行图片并按列嵌入；将折叠组数量断言从 5 改为 6。
5. **持续集成**：新增 `.github/workflows/verify-stage-c.yml`，只执行 `node tests/verify-preview.mjs` 和 `node tests/verify-png.mjs`，不部署、不使用密钥。

### GitHub Actions 实际执行结果

- 运行链接：https://github.com/kimbeley-cpu/artist-string-favorites-preview/actions/runs/40056546040
- 任务 `verify`：**success**
- `Stage A and B preview regression`：**success**
- `Stage C PNG metadata fixtures`：**success**

**限制：** 上述 PNG 测试由脚本合成（模拟 NovelAI 位流），不是从 NovelAI 服务真正生成并保存的原始 PNG。真实 NovelAI 隐写 PNG 的兼容性仍待用真实样本进行测试；不得将合成样本测试记为真实文件验证通过。

**范围不变：** 阶段 B 布局、阶段 A 隔离不改；未经用户批准不进入阶段 D。
