# 月下 · 黑色蕾丝追加

根据图 ⑥ 的黑蕾丝和原有月下的玫瑰、黑缎、尖拱结构，追加 **6 款透明 SVG + 4 组 CSS 用法**。这是参考风格衍生，默认颜色为近黑 `#100b0e`。

浏览 `index.html?collection=black-lace` 可只看这 10 项；`black-lace-contact-sheet.png` / `.svg` 是同款纹样在旧纸、灰玫瑰、酒红底上的比较总览。背景色只用于展示，6 个素材文件本身均为透明底。

## 六款纹样

| 文件 | 结构 | 用途 |
|---|---|---|
| `svg/black-lace-micro.svg` | 细密窄花边 | 导航底沿、细分隔、卡片边 |
| `svg/black-lace-rose.svg` | 玫瑰与卷叶花带 | 标题下沿、页眉、横幅 |
| `svg/black-lace-cathedral.svg` | 尖拱与网纱 | 章节边、信笺、档案卡 |
| `svg/black-lace-drop.svg` | 长短珠滴扇边 | 大幅封面下沿、寄语区 |
| `svg/black-lace-ribbon.svg` | 双边蕾丝与黑缎带 | 栏目标题、签名、分组 |
| `svg/black-lace-medallion.svg` | 圆形镂空蕾丝框 | 头像、徽记、小照片 |

前五款横向平铺；圆框保持正方形比例。每款原始尺寸及推荐显示尺寸见 `black-lace-manifest.json`。下载单个 SVG 即可直接作为透明图片使用。

## 可复制的用法

只使用本组组件时加载：

```html
<link rel="stylesheet" href="/yuexia-kit/black-lace.css">
```

默认配色不依赖 `--yx-lace-color`，所以载入旧金视频主题时仍保持黑色。与基础标题、手写文字组合时再加载 `yuexia.css`。

### 自适应宽度的花边

```html
<div class="yx-black-lace-band" aria-hidden="true"></div>
```

默认玫瑰纹，保持 72px 高横向重复。可改高度或换其他纹样：

```html
<div class="yx-black-lace-band"
  style="--yx-black-lace-height:80px;--yx-black-lace-image:url('/yuexia-kit/svg/black-lace-drop.svg')"
  aria-hidden="true"></div>
```

黑色使用 `--yx-black-lace-color:#100b0e`；需要纯黑可设为 `#000`。`mask` 保留纹样的透明孔隙，不会给花边添加底板。

### 旧纸信笺

```html
<section class="yx-black-lace-letter">
  <h2>月下的来信</h2>
  <p>把想念，写成一封信。</p>
</section>
```

上沿窄花边、下沿尖拱，内容高度自动适应。使用 `--yx-black-lace-surface:#ad828d` 可换成灰玫瑰底。

### 圆形头像

```html
<div class="yx-black-lace-avatar" style="--yx-avatar-size:240px">
  <img class="yx-black-lace-avatar__portrait" src="/your-avatar.jpg" alt="你的头像">
</div>
```

将图片地址换成自己的头像；照片占整体直径的 56%，居中裁成圆形，外圈由黑蕾丝覆盖。纯框 SVG 中央为透明孔。

### 黑缎标题

```html
<div class="yx-black-lace-ribbon"><span>月下私藏</span></div>
```

## 搭配与文件

- 旧纸 `#ecdbb9` 最能看清细线，适合信笺与个人介绍。
- 灰玫瑰 `#ad828d`、较亮酒红 `#864453` 适合头像卡与封面；页面外围仍可保持原来的近黑和深酒红。
- 蕾丝保留原始比例，以重复增加长度，避免把单朵纹样拉成整屏。
- `black-lace.css` 只作用于 `yx-black-lace-*`，装饰伪元素不拦截点击。
- `black-lace-manifest.json` 记录 6 个 SVG，`black-lace-samples.json` 记录 4 组可复制用法。
- 图片以 `img` 或 `url()` 引入时用 SVG 内默认色；需要随外层变量换色时可用本组 CSS mask 或内联 SVG。
