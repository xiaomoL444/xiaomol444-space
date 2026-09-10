# 视频截图新增：蕾丝与金属画框

来源为你追加的视频截图（图 ⑥）。视频部分新增 **16 个透明 SVG + 8 组可复用 CSS**；另按你追加的要求补充 **6 款黑色蕾丝 SVG + 4 组 CSS 用法**（见 `BLACK-LACE.md`），完整素材库现合计 **98 个元素**。

这些是按截图结构重绘、再适配黑红旧金配色的网页素材。中央游戏画面、人物、字幕与平台标识没有作为装饰资产纳入。团花、扇贝边、竖头像框是从截图语汇延展的版本，具体来源见 `video-manifest.json`。

## 16 个 SVG

| 文件 | 提取的结构 | 推荐用法 |
|---|---|---|
| `video-lace-top.svg` | 顶部卷叶花带、双道编织环眼、长短滴坠 | 页眉、横幅上沿，向下垂落 |
| `video-lace-bottom.svg` | 底部放射扇面、窄尖拱与交替尖塔 | 页脚、面板下沿，朝上生长 |
| `video-lace-scallop.svg` | 双层扇贝、眼孔与泪滴 | 标题下沿、信笺和简介卡 |
| `video-lace-corner.svg` | 双边扇贝与对角卷花组成的 L 形 | 四角旋转组合，建议宽 96–148 px |
| `video-lace-gold.svg` | 旧金细线与暗红编织、坠饰 | 黑底月下主页的直接搭配 |
| `video-pattern-damask.svg` | 对称卷叶团花 | 深酒红或灰粉色织物底纹 |
| `video-pattern-woven.svg` | 细十字与疏密经纬 | 低对比布纹叠层 |
| `video-pattern-diamond-pin.svg` | 侧栏细菱格、小菱点、八角花 | 两侧窄栏、竖向隔断 |
| `video-frame-stage.svg` | 三角山墙顶、台阶轮廓、厚金缘、圆铆钉 | 主视频、作品展示、相册封面 |
| `video-frame-step.svg` | 简洁横向台阶双层框 | 横向照片与作品卡 |
| `video-frame-portrait.svg` | 台阶框和宝石顶饰的竖向适配 | 头像、竖向个人档案 |
| `video-crest-ruby.svg` | 对称旧金扣饰与中央红宝石 | 顶部徽章、卡片顶饰 |
| `video-chain-vertical.svg` | 圆珠与细长梭形珠交替 | 悬挂卡片、纵向装饰链 |
| `video-chain-swag.svg` | 菱片和圆珠组成的弧垂链 | 画框山墙内沿、标题下方 |
| `video-stud-pearl.svg` | 圆形金属铆钉 | 边框固定点、时间轴节点 |
| `video-side-star.svg` | 八芒星、菱形与短斜线 | 页面两侧装饰 |

## 如何契合原本的月下主题

- **主方案**：近黑框板、深酒红织物、旧金蕾丝，红色集中在宝石和少量坠饰。
- **柔和方案**：黑蕾丝叠在旧玫瑰粉或奶油纸上，适合心愿、信笺和生活记录。
- 上下花边是两种结构，不用简单翻转同一条来代替。
- 蕾丝保持约 36–64 px 高，横向平铺；不要把一个花纹单元强行拉成整页宽度。
- 金属厚框适合一处主视觉；小卡片可使用简洁台阶版，避免每层内容都围上厚框。

## 快速使用

加载基础样式及本次扩展：

```html
<link rel="stylesheet" href="/yuexia-kit/yuexia.css">
<link rel="stylesheet" href="/yuexia-kit/video.css">
```

### 可直接换色的蕾丝

```html
<section class="yx-theme">
  <div class="yx-video-lace-top" style="--yx-lace-color:#bba988" aria-hidden="true"></div>
  <p>你的主页内容</p>
  <div class="yx-video-lace-bottom" style="--yx-lace-color:#bba988" aria-hidden="true"></div>
</section>
```

CSS 版本使用 `mask`，所以无需把 SVG 内联就能用 `--yx-lace-color` 改颜色。直接 `img` 或 `background-image` 引用 SVG 时仍使用文件内默认配色。

### 自动适应内容高度的背板

```html
<section class="yx-theme yx-video-lace-panel">
  <h2 class="yx-title-gold">月下的心愿</h2>
  <p class="yx-handwriting">和你一起，去看未曾见过的风景。</p>
</section>
```

### 在透明舞台框里放图片

```html
<div class="yx-theme yx-video-stage">
  <img class="yx-video-stage__window" src="/your-photo.jpg" alt="你的照片描述">
  <img class="yx-video-stage__frame" src="/yuexia-kit/svg/video-frame-stage.svg" alt="" aria-hidden="true">
</div>
```

这里 `/your-photo.jpg` 需要换成自己的资源。窗口也可以放视频，SVG 叠层设置了 `pointer-events:none`，不会挡住播放控件。

三款画框的 **windowRect** 坐标如下，均已验证整块窗口为透明：

| 框 | SVG 宽 × 高 | 窗口 x, y, width, height |
|---|---|---|
| stage | 1000 × 720 | 128, 220, 744, 418 |
| step | 1000 × 600 | 118, 83, 764, 434 |
| portrait | 520 × 730 | 114, 202, 292, 442 |

`yx-video-stage` 默认对应第一款。另两款的代码可直接在素材库卡片中复制，已自动计算窗口比例。固定画框请保持宽高比；需要长文本可改用 `yx-video-step-panel`。

### 织物底色

```html
<div class="yx-theme yx-video-textile" style="min-height:200px;--yx-fabric:#381723"></div>
```

默认是深酒红。想试截图中的柔和布面，可把 `--yx-fabric` 改为 `#ad828d`。布纹与团花为透明图案，仍能看见下层底色。

## 本次文件

- `video-manifest.json`：16 个 SVG 的来源、用途、平铺尺寸与镂空坐标。
- `video-samples.json`：8 组 CSS 示例。
- `video.css`：可换色蕾丝、内容面板、挂链、画框窗口、徽记标题。
- `video-contact-sheet.png` / `.svg`：本轮元素的静态总览。
- `index.html?collection=video`：只看本轮新增的筛选视图。
