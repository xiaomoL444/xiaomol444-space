# 月下 · 个人主页装饰素材库

从你提供的 5 张海报和 1 张视频截图整理了 **98 个可直接复用的元素：46 个 SVG、49 组 CSS 效果、3 张透明 PNG**（玫瑰与花瓣参考重绘，蝙蝠复用项目已有素材）；另附 12 色主题和 6 种字体替代建议。`REFERENCE-INVENTORY.md` 记录首轮 86 项视觉观察；`VIDEO-REFERENCE.md` 记录视频截图新增的 16 个 SVG 与 8 组 CSS；`BLACK-LACE.md` 记录追加的 6 款黑蕾丝和 4 组用法。

2026-09-11 新增：上下蕾丝、扇贝边、蕾丝角、台阶金属画框、珠链、红宝石顶饰与织物底纹。打开 `/yuexia-kit/?collection=video` 可只看本轮新增。

同日追加黑色蕾丝：细密窄边、玫瑰花带、尖拱网纱、长短滴坠、双边缎带和圆形头像框。打开 `/yuexia-kit/?collection=black-lace` 查看追加的 10 项。

**这里的 SVG / CSS 是参考风格重绘与网页适配，玫瑰和花瓣 PNG 是图像生成工具参照风格重绘，蝙蝠为已有素材复用，不是原图精确抠取。色板是近似值；字体名称是经官方来源核实的替代建议，不代表识别出了原图字体。**

## 浏览与下载

- 本地开发服务中打开 `/yuexia-kit/`；也可双击本目录 `index.html`，无需联网即可浏览全部装饰。
- 分类与搜索可按名称、用途和参考图筛选；“浅底检视”方便观察透明边缘。
- 每张卡片支持查看代码、复制引用；SVG / PNG 可单独下载。顶部可下载完整 CSS，点击色板可复制色值。
- 字体页面给出官方仓库和对应许可证。素材库未打包字体文件，示例使用本机可用的候选字体和回退字体。

## 在当前 Vue 主页使用

素材库放在项目的 `public/yuexia-kit/`，Vite 构建时会原样复制到输出目录。没有修改现有主页或入场逻辑。

先在项目 `index.html` 的 `<head>` 中加入一次：

```html
<link rel="stylesheet" href="/yuexia-kit/yuexia.css">
<!-- 使用视频截图新增元素时，另加： -->
<link rel="stylesheet" href="/yuexia-kit/video.css">
<!-- 使用追加黑蕾丝组件时，另加： -->
<link rel="stylesheet" href="/yuexia-kit/black-lace.css">
```

再在任意 Vue 模板里放入需要的装饰，例如：

```html
<section class="yx-theme yx-frame-red">
  <h2 class="yx-title-gold">我的创作档案</h2>
  <img
    src="/yuexia-kit/svg/divider-central-star.svg"
    width="320"
    style="max-width:100%;height:auto"
    class="yx-decor"
    alt=""
    aria-hidden="true"
  >
  <ul class="yx-gem-list">
    <li>记录灵感</li>
    <li>收藏片刻</li>
  </ul>
</section>
```

所有 CSS 类和变量以 `yx-` / `--yx-` 开头，变量只定义在 `.yx-theme` 上，不会改动全局字体、按钮或现有玻璃卡片。可以只摘取 CSS 中需要的规则。

### 透明小图

```html
<img
  src="/yuexia-kit/png/rose-red.png"
  width="56"
  height="56"
  class="yx-decor"
  alt=""
  aria-hidden="true"
>
<img
  src="/yuexia-kit/png/petal-red.png"
  width="36"
  height="36"
  class="yx-decor yx-motion-drift"
  alt=""
  aria-hidden="true"
>
```

玫瑰和花瓣 PNG 均为 1254 × 1254，有真实 alpha 通道。图片保留生成结果的留白与透明边缘。另附 `bat-existing.png`，直接复制当前项目已有入场蝙蝠。生成方式与最终提示词见 `IMAGE-PROMPTS.md`。

### 四角装饰

```html
<section class="yx-theme" style="position:relative;padding:56px">
  <img class="yx-corner yx-corner--tl" src="/yuexia-kit/svg/corner-scroll.svg" alt="" aria-hidden="true">
  <img class="yx-corner yx-corner--tr" src="/yuexia-kit/svg/corner-scroll.svg" alt="" aria-hidden="true">
  <img class="yx-corner yx-corner--br" src="/yuexia-kit/svg/corner-scroll.svg" alt="" aria-hidden="true">
  <img class="yx-corner yx-corner--bl" src="/yuexia-kit/svg/corner-scroll.svg" alt="" aria-hidden="true">
  <p>愿你今晚得享安眠</p>
</section>
```

`corner-angular.svg`、`corner-scroll.svg` 默认面向左上角；辅助类已经处理四角旋转。

## 颜色、缩放与图层

- CSS 配色：在 `.yx-theme` 或具体元素上覆盖 `--yx-gold`、`--yx-red` 等变量。
- **`img src="…svg"` 与 CSS `url()` 里的 SVG 无法继承宿主 CSS 变量。** 若要跟随主题，将 SVG 内联到模板；若只用一种固定色，修改 SVG 文件内 `var(--yx-gold,#bba988)` 的默认值即可。
- SVG 都有 `viewBox`，透明背景，适合缩放。细线边框用在过小尺寸时会变淡；卡片宽度变化很大时，优先使用 `yx-frame*` CSS 面板，避免把完整边框图拉伸变形。
- 装饰图层使用 `yx-decor` 并标注 `alt=""`、`aria-hidden="true"`；不要遮挡按钮。包裹真实内容的卡片不要加 `aria-hidden`。
- 动画是从静态视觉推演的扩展效果；已适配 `prefers-reduced-motion`。建议同屏仅放 1–3 个缓慢运动的小物。
- 子路径部署（例如 `/space/`）需给示例的 `/yuexia-kit/` URL 加上正确前缀。相对路径的预览页与 CSS 本身可随目录移动。

## 平铺纹理

| 文件 | 平铺方式 | 建议尺寸 |
|---|---|---|
| `pattern-fine-diamonds.svg` | repeat | 96 × 64 px |
| `pattern-bead-rail.svg` | repeat-y | 24 × 48 px |
| `pattern-diamond-lace.svg` | repeat | 120 × 80 px |
| `pattern-geometric-web.svg` | repeat | 240 × 240 px |

需要低透明度底纹时，把纹理放在独立的绝对定位层上调整 opacity，不要降低整个内容容器的 opacity。

## 字体建议与来源

| 字体 | 适合用途 | 官方来源与许可证 |
|---|---|---|
| 思源宋体 Source Han Serif | Heavy / Black 中文标题，Regular 正文 | [Adobe 仓库](https://github.com/adobe-fonts/source-han-serif) · [OFL](https://github.com/adobe-fonts/source-han-serif/blob/master/LICENSE.txt) |
| 霞鹜文楷 LXGW WenKai | 易读的手写信笺正文 | [作者仓库](https://github.com/lxgw/LxgwWenKai) · [OFL](https://github.com/lxgw/LxgwWenKai/blob/main/OFL.txt) |
| Ma Shan Zheng | 毛笔短标题备选 | [Google Fonts 仓库](https://github.com/google/fonts/tree/main/ofl/mashanzheng) · [OFL](https://github.com/google/fonts/blob/main/ofl/mashanzheng/OFL.txt) |
| Zhi Mang Xing | 自由行草签名、短句 | [Google Fonts 仓库](https://github.com/google/fonts/tree/main/ofl/zhimangxing) · [OFL](https://github.com/google/fonts/blob/main/ofl/zhimangxing/OFL.txt) |
| Cinzel Decorative | 古典英文大写、罗马数字 | [Google Fonts 仓库](https://github.com/google/fonts/tree/main/ofl/cinzeldecorative) · [OFL](https://github.com/google/fonts/blob/main/ofl/cinzeldecorative/OFL.txt) |
| UnifrakturMaguntia | 哥特英文署名 | [Google Fonts 仓库](https://github.com/google/fonts/tree/main/ofl/unifrakturmaguntia) · [OFL](https://github.com/google/fonts/blob/main/ofl/unifrakturmaguntia/OFL.txt) |

以上均为 SIL OFL 1.1。若下载并分发字体文件，随附其版权与许可文件。建议实际主页只引入一款宋体、一款手写体和一款英文装饰字体，避免同时加载六款字体。

## 优先搭配你的现有主页

1. **现有头像卡**：中央尖星分隔线 + 两个折线角花 + 一枚红宝石，旧金颜色可调淡以融入原有紫色玻璃背景。
2. **未来作品区**：切角双框 + 暗红斜切标题牌 + 红菱形项目符号。
3. **关于我 / 心愿**：旧纸 + 霞鹜文楷 + 卷草四角 + 一处红笔圈注。
4. **首屏与页脚**：现有蝙蝠资源、少量花瓣、菱格底纹和卷草分隔；把留白保留给人物背景与文字。

## 文件索引

- `index.html` / `preview.css` / `gallery.js`：独立素材预览器，无运行时依赖，无外部图片或字体请求。
- `yuexia.css`：37 组基础效果、12 色变量与装饰辅助类；`video.css`：8 组视频截图扩展效果；`black-lace.css`：4 组黑蕾丝用法。
- `svg/`：46 个独立矢量文件，含 6 个手写小图、16 个视频新增素材与 6 款追加黑蕾丝；`png/`：3 个透明图。
- `catalog.json`：每个元素的名称、来源、用途、代码、文件路径；`catalog.js` 是同一数据的离线加载版。
- `svg-manifest.json`：SVG 细节及平铺信息。
- `video-manifest.json` / `video-samples.json`：视频扩展的来源、窗口坐标与代码。
- `VIDEO-REFERENCE.md`：视频截图元素与组合方法；`video-contact-sheet.png` / `.svg`：新增总览。
- `BLACK-LACE.md`：黑蕾丝搭配与使用；`black-lace-manifest.json` / `black-lace-samples.json`：独立素材和样例数据；`black-lace-contact-sheet.png` / `.svg`：六款黑蕾丝总览。
- `REFERENCE-INVENTORY.md`：完整 86 项视觉观察。
- `IMAGE-PROMPTS.md`：PNG 来源、工具与最终提示词。
- `build-catalog.mjs`：修改清单后用 `node public/yuexia-kit/build-catalog.mjs` 重新生成 catalog 文件。
