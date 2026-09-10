// Regenerate catalog.js / catalog.json after adding assets. No dependencies.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
const root = new URL('./', import.meta.url)
const vectorManifest = JSON.parse(readFileSync(new URL('svg-manifest.json', root), 'utf8'))
const videoManifest = JSON.parse(readFileSync(new URL('video-manifest.json', root), 'utf8'))
const blackLaceManifest = JSON.parse(readFileSync(new URL('black-lace-manifest.json', root), 'utf8'))
function vectorCode(a) {
 if (a.windowRect) {
  const [, , width, height] = a.viewBox.split(' ').map(Number)
  const r = a.windowRect
  const style = `--yx-stage-ratio:${width} / ${height};--yx-window-x:${r.x / width * 100}%;--yx-window-y:${r.y / height * 100}%;--yx-window-w:${r.width / width * 100}%;--yx-window-h:${r.height / height * 100}%`
  return `<div class="yx-video-stage" style="${style}">\n  <div class="yx-video-stage__window yx-bg-haze">把图片或视频放在这里</div>\n  <img class="yx-video-stage__frame" src="/yuexia-kit/svg/${a.file}" alt="" aria-hidden="true">\n</div>`
 }
 if (a.repeat) {
  const [tileWidth, tileHeight] = a.tileSize.split(' ')
  return `<div style="background-image:url('/yuexia-kit/svg/${a.file}');background-repeat:${a.repeat};background-size:${a.tileSize};height:${a.repeat === 'repeat-x' ? tileHeight : '120px'};${a.repeat === 'repeat-y' ? `width:${tileWidth};` : ''}" aria-hidden="true"></div>`
 }
 return `<img src="/yuexia-kit/svg/${a.file}" width="${a.viewBox.split(' ')[2]}" style="max-width:100%;height:auto" alt="" aria-hidden="true" class="yx-decor" />`
}
const vectors = [...vectorManifest.assets, ...videoManifest.assets.map(a => ({...a,collection:'video'})), ...blackLaceManifest.assets.map(a => ({...a,collection:'video',series:'black-lace'}))].map(a => ({ ...a, category: a.category === '角标' ? '角花' : a.category, kind: 'SVG', file: `svg/${a.file}`, note: a.note || '参考风格矢量重绘；透明底。', code:vectorCode(a) }))
const samples = [
 ['title-gold','浅金渐变标题','字体','②④ 标题的象牙金到暖橙渐变','站名、首屏短标题','<span class="yx-title-gold">月下相续</span>','建议配思源宋体 Heavy；原图标题可能是定制美术字。'],
 ['title-outline','奶油黑描边标题','字体','③ 心愿清单主标题；⑤说明标题','栏目名、档案标题','<span class="yx-title-outline">她的心愿</span>'],
 ['title-shadow','暗红错位字影','字体','③⑤ 粗宋体标题的暗色轮廓','醒目的短标题','<span class="yx-title-shadow">月下誓约</span>'],
 ['latin-caps','宽字距古典英文','字体','③⑤ 页脚大写英文署名','页脚、小型英文副标题','<span class="yx-latin-caps">Love Forever</span>','Cinzel Decorative 候选；未安装时使用系统衬线体。'],
 ['latin-gothic','哥特英文署名','字体','⑤ 右上角两行英文名','英文昵称、签名','<span class="yx-latin-gothic">Theresa<br>Apocalypse</span>','UnifrakturMaguntia 候选；未安装时使用系统衬线体。'],
 ['handwriting','手写信笺文字','字体','③ 心愿清单笔迹','心愿、签名、生活记录','<span class="yx-handwriting">和你一起，<br>去看未曾见过的风景。</span>','霞鹜文楷偏工整；自由短签名可试 Zhi Mang Xing。'],
 ['vertical-note','竖排侧边短句','字体','④ 右侧角色引言','首屏侧边、留白边缘','<span class="yx-vertical-note">愿你今晚<br>得享安眠</span>'],
 ['frame','内外双细框面板','边框','① 内容区金框；③ 信纸内外边线','自适应简介卡、文章摘录','<div class="yx-frame">一封月下的来信</div>'],
 ['frame-red','黑底红折角说明框','边框','⑤ 特写说明框右下红色折角','项目说明、卡片正文','<div class="yx-frame-red">把心愿，写在这里。</div>'],
 ['frame-cut','自适应切角面板','边框','⑤ 图片卡片内圈斜切线','作品卡片、介绍卡','<div class="yx-frame-cut">我的创作档案</div>','clip-path 会裁掉外部阴影；要阴影请加外层容器。'],
 ['frame-photo','四角金属相框','边框','⑤ 头纱与服装特写四角','头像、照片、作品封面','<div class="yx-frame-photo">PHOTOGRAPH</div>'],
 ['paper','旧纸暗边','纸张','③ 泛黄纸页及边缘暗污','信件、关于我','<div class="yx-paper">月下的信笺<br><small>一些想对你说的话。</small></div>','CSS 合成纸感；不是原图纸纹扫描。'],
 ['paper-ruled','横线手写纸','纸张','③ 心愿条目下方横线','愿望清单、日记','<div class="yx-paper-ruled">和你一起看海<br>和你一起等日出</div>'],
 ['paper-fold','十字折痕与卷角','纸张','③ 中央折痕与左下卷纸角','手写签名卡、留言','<div class="yx-paper-fold">珍藏的片刻<br>都写在折痕之间。</div>'],
 ['paper-torn','不规则撕边纸','纸张','③ 纸页不齐的磨损外缘','便签、收藏文字','<div class="yx-paper-torn">心愿清单 · 01</div>','边缘为可缩放几何模拟。'],
 ['label-ribbon','暗红斜切标题牌','标签','⑤ 各特写上方红色标题牌','作品标签、技能名','<span class="yx-label-ribbon">月下档案</span>'],
 ['label-archive','X 档案短红带','标签','③④⑤ 左上或左侧 X 档案','栏目编号、个人资料','<span class="yx-label-archive"><b>X</b> 档案</span>'],
 ['label-outline','细金线标签','标签','① 规则与话题的长条边框','按钮、状态、分类','<span class="yx-label-outline">PERSONAL SPACE</span>'],
 ['stamp','红墨双线印章','标签','③ 红笔涂写的色彩与手作感延展','日期、收藏、已完成状态','<span class="yx-stamp">珍藏 · FOREVER</span>','基于图③延展，并非原图中的现成印章。'],
 ['gem-list','红菱形项目符号','分隔线','⑤ 说明文字段首的小红菱形','个人信息列表、作品描述','<ul class="yx-gem-list"><li>记录灵感</li><li>收藏片刻</li></ul>'],
 ['dotted-spine','侧边珠点缝线','分隔线','③⑤ 画面最右侧连续圆点','页面侧边、时间轴','<div class="yx-dotted-spine">心愿<br>记忆<br>旅途</div>'],
 ['double-rule','双层细金横线','分隔线','③⑤ 页脚与纸张的长边线','页脚、正文间隔','<hr class="yx-double-rule" />'],
 ['line-caption','渐隐文字分隔线','分隔线','①④ 标题两侧延伸金线','区块标题、卡片签名','<div class="yx-line-caption">未完待续</div>'],
 ['quote','两侧细线引言','分隔线','④ 居中的分行文字及细线语汇','短诗、座右铭','<blockquote class="yx-quote">愿你今晚<br>得享安眠</blockquote>'],
 ['checklist','手写空心方框清单','纸张','③ 每条心愿前面的方形勾选框','愿望、待办、旅行清单','<ul class="yx-checklist"><li>去海边</li><li>看一场烟火</li></ul>','展示为静态列表；真实待办请使用 input type="checkbox"。'],
 ['heart-note','红笔圈注','纸张','③ 最后一行红笔圈重点','圈出名字、日期、关键词','<span class="yx-heart-note">再也没有离别 ♡</span>','线条与心形为 CSS／字符模拟。'],
 ['bg-moon','深红月轮光晕','背景','②⑤ 左上红月与暗色过渡','首屏角落、头像背景','<div class="yx-bg-moon" style="min-height:180px"></div>','CSS 光晕提炼，不含原画纹理。'],
 ['bg-haze','酒红暗雾','背景','①③⑤ 黑底暗红烟雾','卡片下层、页面底色','<div class="yx-bg-haze" style="min-height:180px"></div>'],
 ['bg-vignette','四周黑色暗角','背景','③⑤ 四周收暗的画面','内容背板、背景遮罩','<div class="yx-bg-vignette" style="min-height:180px"></div>'],
 ['bg-veil','半透明红纱斜纹','背景','②⑤ 半透明红纱与重叠线条','图片遮罩、章节背景','<div class="yx-bg-veil" style="min-height:180px"></div>','仅抽象线条层，不模拟整块原画头纱。'],
 ['bg-particles','稀疏红金微粒','背景','①② 空间里的火星与细光点','首屏留白、暗色底纹','<div class="yx-bg-particles" style="min-height:180px"></div>'],
 ['bg-mesh','低对比几何网','背景','①⑤ 背景斜交线','页面暗底、作品封面','<div class="yx-bg-mesh" style="min-height:180px"></div>'],
 ['bg-lace','菱格蕾丝饰带','背景','③⑤ 页脚菱格；⑤头纱纹路','页脚、横向边带','<div class="yx-bg-lace" style="min-height:180px"></div>'],
 ['avatar-halo','旧金头像光环','边框','②⑤ 宝石旧金镶边的视觉延展','圆头像、个人徽记','<div class="yx-avatar-halo">✦</div>','可替换内容为头像；这是适配圆头像的延展。'],
 ['hover-border','悬停金边微光','交互','①②⑤ 金色高光语汇的交互延展','作品卡片、按钮','<button type="button" class="yx-hover-border">触碰月光</button>','只提供悬停和键盘聚焦样式，不绑定业务动作。'],
 ['motion-breathe','尖星缓慢呼吸','交互','②⑤ 细长四芒星的动效延展','少量标题亮点','<img src="/yuexia-kit/svg/emblem-star-cluster.svg" class="yx-decor yx-motion-breathe" width="80" alt="" aria-hidden="true" />','4 秒周期；尊重系统减少动态效果设置。'],
 ['motion-drift','纹章轻微浮动','交互','① 花瓣漂浮感的动效延展','花瓣、悬浮小装饰','<img src="/yuexia-kit/svg/emblem-ruby.svg" class="yx-decor yx-motion-drift" width="45" alt="" aria-hidden="true" />','7 秒周期；尊重系统减少动态效果设置。'],
]
const css = samples.map(([id,name,category,source,use,code,note]) => ({ id:`css-${id}`,name,category,source,use,code,kind:'CSS',file:'yuexia.css',note:note || '使用时外层加 yx-theme；只影响 yx- 前缀类。' }))
const videoCss = JSON.parse(readFileSync(new URL('video-samples.json', root), 'utf8')).map(a => ({...a,id:`css-${a.id}`,kind:'CSS',file:'video.css',collection:'video'}))
const blackLaceCss = JSON.parse(readFileSync(new URL('black-lace-samples.json', root), 'utf8')).map(a => ({...a,id:`css-${a.id}`,kind:'CSS',file:'black-lace.css',collection:'video',series:'black-lace'}))
const bitmapDefs = [
 {id:'rose-red',name:'红玫瑰胸针',source:'②④⑤ 胸前红玫瑰装饰',use:'头像旁、标题旁、卡片角落',file:'png/rose-red.png'},
 {id:'petal-red',name:'单片红玫瑰花瓣',source:'① 前景漂浮红花瓣',use:'首屏边缘、滚动装饰',file:'png/petal-red.png'},
 {id:'bat-existing',name:'展翼蝙蝠剪影',source:'②③⑤ 蝙蝠意象；复用项目已有入场蝙蝠素材',use:'首屏边缘、标题侧边、页脚',file:'png/bat-existing.png',note:'直接复用项目已有 entrance-bat-simple.png；不是本次从参考图抠取或新生成。'},
]
const bitmaps = bitmapDefs.filter(a => existsSync(new URL(a.file,root))).map(a => ({...a,category:'花饰',kind:'PNG',note:a.note || '内置图像生成工具参照原图重绘；非逐像素抠取。',code:`<img src="/yuexia-kit/${a.file}" width="${a.id === 'bat-existing' ? '180' : '80'}" alt="" aria-hidden="true" class="yx-decor" />`}))
const catalog = { title:'月下 · 装饰素材库',version:2,generatedAt:'2026-09-11',description:'5 张海报与 1 张视频截图的视觉拆解；SVG 与 CSS 为风格重绘和适配，玫瑰与花瓣为参考重绘，蝙蝠复用项目已有素材。不是官方原始素材包，字体未从图片中提取。',colors:[['ink','近黑','#100b0e'],['panel','黑棕','#21171b'],['wine','暗酒红','#38101f'],['deep-red','深绯红','#58121d'],['red','玫瑰红','#a51d32'],['scarlet','亮猩红','#e34243'],['gold','旧金','#bba988'],['gold-light','香槟金','#f5d7a1'],['cream','象牙白','#f5e7ce'],['paper','旧纸','#ecdbb9'],['silver','银紫','#dfdce9'],['muted','灰玫瑰','#b5a4a1']].map(([id,name,hex])=>({id,name,hex})),assets:[...vectors,...css,...bitmaps,...videoCss] }
catalog.assets.push(...blackLaceCss)
writeFileSync(new URL('catalog.json',root),JSON.stringify(catalog,null,2)+'\n')
writeFileSync(new URL('catalog.js',root),'window.YUEXIA_CATALOG = '+JSON.stringify(catalog,null,2)+';\n')
console.log(`Catalog: ${vectors.length} SVG + ${css.length + videoCss.length + blackLaceCss.length} CSS + ${bitmaps.length} PNG + ${catalog.colors.length} colors; ${catalog.assets.filter(a=>a.collection==='video').length} video additions; ${catalog.assets.filter(a=>a.series==='black-lace').length} black lace additions`)
