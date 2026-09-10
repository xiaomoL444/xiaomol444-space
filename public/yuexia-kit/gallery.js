'use strict';
(() => {
  const data = window.YUEXIA_CATALOG;
  const gallery = document.querySelector('#gallery');
  const search = document.querySelector('#search');
  const dialog = document.querySelector('#code-dialog');
  const codeOutput = document.querySelector('#code-output');
  const categories = ['全部','黑色蕾丝','视频新增','蕾丝','链饰','花饰','字体','边框','分隔线','角花','纹章','纹理','纸张','手写小物','标签','背景','交互'];
  const collection = new URLSearchParams(location.search).get('collection');
  let selected = collection === 'black-lace' ? '黑色蕾丝' : collection === 'video' ? '视频新增' : '全部';
  let toastTimer;
  let activeCode = '';
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function toast(message) {
    const element = document.querySelector('#toast');
    element.textContent = message;
    element.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove('visible'), 2300);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('已复制'); }
    catch {
      // This fallback also works when the gallery is opened directly with file://.
      const area = document.createElement('textarea');
      area.value = text;
      area.style.cssText = 'position:fixed;left:-9999px;top:0';
      (dialog.open ? dialog : document.body).append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      toast(ok ? '已复制' : '自动复制不可用，请在代码面板手动选择复制');
    }
  }
  function showCode(asset) {
    activeCode = asset.code;
    document.querySelector('#code-title').textContent = asset.name;
    document.querySelector('#code-note').textContent = asset.note + (asset.kind === 'SVG' ? ' SVG 以 img 引用时使用文件内默认颜色；内联 SVG 才能继承外层主题变量。' : '') + (asset.series === 'black-lace' && asset.kind === 'CSS' ? ' 需加载 /yuexia-kit/black-lace.css。' : asset.collection === 'video' && asset.series !== 'black-lace' ? ' 视频扩展还需加载 /yuexia-kit/video.css。' : '');
    codeOutput.textContent = activeCode;
    dialog.showModal();
  }
  document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
  document.querySelector('#copy-code').addEventListener('click', () => copy(activeCode));
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  document.querySelector('#total-count').textContent = data.assets.length;
  for (const color of data.colors) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'swatch';
    button.setAttribute('aria-label', `复制${color.name}色值 ${color.hex}`);
    button.innerHTML = `<span class="swatch-color" style="background:${color.hex}"></span><span class="swatch-name">${escapeHtml(color.name)}</span><span class="swatch-hex">${color.hex}</span>`;
    button.addEventListener('click', () => copy(color.hex));
    document.querySelector('#palette').append(button);
  }
  for (const category of categories) {
    if (!['全部','视频新增','黑色蕾丝'].includes(category) && !data.assets.some(a => a.category === category)) continue;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'filter'; button.textContent = category;
    button.setAttribute('aria-pressed', String(category === selected));
    button.addEventListener('click', () => { selected = category; document.querySelectorAll('.filter').forEach(b => b.setAttribute('aria-pressed',String(b === button))); render(); });
    document.querySelector('#filters').append(button);
  }
  function preview(asset) {
    if (asset.kind === 'SVG') {
      if (asset.repeat) {
        const [tileWidth,tileHeight] = asset.tileSize.split(' ');
        const rose = asset.category === '蕾丝' && asset.id !== 'video-lace-gold';
        return {className:`svg-pattern${rose ? ' rose-surface' : ''}`, html:`<div style="background-image:url('${asset.file}');background-repeat:${asset.repeat};background-size:${asset.tileSize};${asset.repeat === 'repeat-y' ? `width:${tileWidth};` : ''}${asset.repeat === 'repeat-x' ? `height:${tileHeight};` : ''}" aria-hidden="true"></div>`};
      }
      const className = asset.category === '分隔线' ? 'svg-line' : asset.category === '边框' ? 'svg-frame' : 'svg-small';
      return {className:className + (asset.id === 'video-lace-corner' || asset.series === 'black-lace' ? ' rose-surface' : ''),html:`<img src="${asset.file}" alt="${escapeHtml(asset.name)}" loading="lazy">`};
    }
    if (asset.kind === 'PNG') return {className:'png',html:`<img src="${asset.file}" alt="${escapeHtml(asset.name)}" loading="lazy">`};
    return {className:'css-sample' + (asset.series === 'black-lace' ? ' rose-surface' : ''),html:asset.code.replaceAll('/yuexia-kit/','./')};
  }
  function normalize(value) { return value.toLowerCase().replace(/图\s*/g,'').replace(/①/g,'1').replace(/②/g,'2').replace(/③/g,'3').replace(/④/g,'4').replace(/⑤/g,'5').replace(/⑥/g,'6').replace(/\s+/g,''); }
  function render() {
    const query = normalize(search.value.trim());
    const assets = data.assets.filter(a => (selected === '全部' || selected === a.category || (selected === '视频新增' && a.collection === 'video') || (selected === '黑色蕾丝' && a.series === 'black-lace')) && (!query || normalize([a.name,a.category,a.source,a.use,a.kind,a.id].join(' ')).includes(query)));
    gallery.replaceChildren();
    for (const asset of assets) {
      const card = document.createElement('article'); card.className = 'asset';
      const sample = preview(asset);
      card.innerHTML = `<div class="sample ${sample.className}${document.querySelector('#light-surface').checked ? ' light' : ''}">${sample.html}</div><div class="asset-info"><div class="asset-top"><h3>${escapeHtml(asset.name)}</h3><span class="asset-kind">${asset.kind}</span></div><p class="asset-use">${escapeHtml(asset.use)}</p><p class="asset-source">参考 ${escapeHtml(asset.source)}</p><div class="asset-actions"><button type="button" data-action="code">查看代码</button><button type="button" data-action="copy">复制引用</button>${asset.kind !== 'CSS' ? `<a href="${asset.file}" download>下载 ${asset.kind} ↓</a>` : ''}</div></div>`;
      card.querySelector('[data-action="code"]').addEventListener('click', () => showCode(asset));
      card.querySelector('[data-action="copy"]').addEventListener('click', () => copy(asset.code));
      gallery.append(card);
    }
    document.querySelector('#result-count').textContent = `显示 ${assets.length} / ${data.assets.length} 项 · 查看代码可获取具体用法与注意事项`;
    document.querySelector('#empty').hidden = assets.length !== 0;
  }
  search.addEventListener('input',render);
  document.querySelector('#light-surface').addEventListener('change',event => document.querySelectorAll('.sample').forEach(sample => sample.classList.toggle('light',event.target.checked)));
  const fonts = [
    ['思源宋体 · Source Han Serif','高反差宋体。Heavy / Black 用作标题，Regular 用作正文。','https://github.com/adobe-fonts/source-han-serif','https://github.com/adobe-fonts/source-han-serif/blob/master/LICENSE.txt'],
    ['霞鹜文楷 · LXGW WenKai','适合心愿纸、信笺正文；比参考图笔迹更规整、更容易阅读。','https://github.com/lxgw/LxgwWenKai','https://github.com/lxgw/LxgwWenKai/blob/main/OFL.txt'],
    ['Ma Shan Zheng','毛笔感短标题备选；与原图尖锋美术字并非同款。','https://github.com/google/fonts/tree/main/ofl/mashanzheng','https://github.com/google/fonts/blob/main/ofl/mashanzheng/OFL.txt'],
    ['Zhi Mang Xing','更随性的行草签名，适合短句和昵称。','https://github.com/google/fonts/tree/main/ofl/zhimangxing','https://github.com/google/fonts/blob/main/ofl/zhimangxing/OFL.txt'],
    ['Cinzel Decorative','古典英文大写、罗马数字、页脚署名。','https://github.com/google/fonts/tree/main/ofl/cinzeldecorative','https://github.com/google/fonts/blob/main/ofl/cinzeldecorative/OFL.txt'],
    ['UnifrakturMaguntia','对应图⑤右上黑字母体署名的哥特风格，仅适合英文短词。','https://github.com/google/fonts/tree/main/ofl/unifrakturmaguntia','https://github.com/google/fonts/blob/main/ofl/unifrakturmaguntia/OFL.txt']
  ];
  for (const [name,description,url,license] of fonts) {
    const card = document.createElement('article'); card.className = 'font-item';
    card.innerHTML = `<span class="license">SIL OPEN FONT LICENSE 1.1</span><h3>${name}</h3><p>${description}</p><a href="${url}" target="_blank" rel="noreferrer">官方字体来源 ↗</a><a href="${license}" target="_blank" rel="noreferrer">许可证</a>`;
    document.querySelector('#font-grid').append(card);
  }
  render();
})();
