# 月下风格图片素材生成记录

补充素材 `png/bat-existing.png`：直接复制当前项目已有 `assets/entrance-bat-simple.png`，尺寸 2172 × 724。该图为此前用内置图像生成工具制作的透明蝙蝠剪影，未在本次重新生成或编辑；原始提示词保存在项目 `assets/entrance-bat-simple.prompt.md`。以下生成与透明度记录仅针对本次玫瑰和花瓣两张新图。

生成方式：内置 `image_gen` 工具（`image_gen__imagegen`），每个素材独立调用一次，未重试，未生成变体。

参考性质：参考图用于理解配色与动漫衣饰风格，最终生成以文字风格描述为输入；这是新绘制素材，不是从原海报精确抠取，也不是逐像素编辑。

## rose-red.png

- 尺寸：1254 × 1254 像素。
- 格式：PNG，RGBA（检查结果为 Format32bppArgb）。
- 完全透明像素：889,662，占 56.58%。
- 部分透明像素：681,620；完全不透明像素：1,234。
- 四角 alpha：0、0、0、0。
- 主体主要 alpha：253，接近完全不透明；保留工具原始输出。
- 视觉检查：单朵红玫瑰，完整无裁切，无叶无茎、无文字、无底色矩形。

最终精确 prompt：

```text
Use case: stylized-concept
Asset type: one reusable small homepage decoration, standalone transparent PNG cutout.
Primary request: A SINGLE deep red rose brooch, bloom only, viewed from the front with a slight natural tilt. Inspired by the dark crimson anime rose accessory on a gothic moonlit character costume: tidy folded petals arranged into a recognizable rose, thin near-black outlines, restrained cel shading and flat anime color shapes.
Composition/framing: square 1:1 canvas, one centered flower, entirely within the image, substantial transparent margin on every side. Small-scale readability, clean silhouette.
Color palette: #a51d32 crimson, #58121d dark red shadows, #e34243 selective lighter red edges.
Background: ACTUAL TRANSPARENT ALPHA BACKGROUND, empty pixels around the flower must be fully transparent. Deliver a genuine RGBA PNG, not a background illustration.
Constraints: one rose bloom only. No leaves, no stem, no ribbon, no brooch pin visible, no other objects, no text, no watermarks, no gradients outside the subject, no shadows outside the subject, no border. Do not draw a checkerboard or solid-color background. This is a newly drawn asset based on style description, not an edit.
```

## petal-red.png

- 尺寸：1254 × 1254 像素。
- 格式：PNG，RGBA（检查结果为 Format32bppArgb）。
- 完全透明像素：1,270,035，占 80.76%。
- 部分透明像素：302,061；完全不透明像素：420。
- 四角 alpha：0、0、0、0。
- 主体主要 alpha：253，接近完全不透明；保留工具原始输出。
- 视觉检查：单片弯曲红花瓣，完整无裁切，无文字、无底色矩形。

最终精确 prompt：

```text
Use case: stylized-concept
Asset type: one reusable small homepage floating decoration, standalone transparent PNG cutout.
Primary request: A SINGLE gently curved red rose petal drifting in the air, one complete petal only, deep crimson face folding softly toward a brighter scarlet edge, simple dark gothic anime illustration with clean outlined shape and restrained cel shading. Graceful asymmetrical teardrop-like petal, slight twist to show the fold.
Composition/framing: square 1:1 canvas, one centered diagonal petal, entirely within the image, substantial transparent margin on every side. Simple shape readable at very small size.
Color palette: #a51d32 crimson, #58121d dark red shadows, #e34243 a soft brighter edge.
Background: ACTUAL TRANSPARENT ALPHA BACKGROUND, empty pixels around the petal must be fully transparent. Deliver a genuine RGBA PNG, not a background illustration.
Constraints: a single petal only, no whole rose, no stem, no leaves, no extra particles, no glow cloud, no motion lines, no text, no watermark, no shadow, no rectangular backdrop, no border. Do not draw a checkerboard or solid-color background. This is a newly drawn asset based on style description, not an edit.
```
