<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, shallowRef } from 'vue'
import { RouterLink } from 'vue-router'
import ExhibitCover from '../components/ExhibitCover.vue'
import ExhibitDescription from '../components/ExhibitDescription.vue'
import ExhibitPreview from '../components/ExhibitPreview.vue'
import { fetchAssets, fetchStages, type Asset, type Stage, type UgcCollection } from '../lib/ugcApi'

type Exhibit = 'stages' | 'assets'
type CollectionState<T> = { data: UgcCollection<T> | null; loading: boolean; error: string; revision: number }
const stages = reactive<CollectionState<Stage>>({ data: null, loading: true, error: '', revision: 0 })
const displayedStages = computed(() => [...(stages.data?.items ?? [])].reverse())
const assets = reactive<CollectionState<Asset>>({ data: null, loading: true, error: '', revision: 0 })
const preview = shallowRef<{ kind: 'stage' | 'asset'; item: Stage | Asset } | null>(null)
const decorationUrl = `${import.meta.env.BASE_URL}yuexia-kit/`
const collections = [
  { id: 'stages', label: '我的奇域', english: 'WORLDS', state: stages },
  { id: 'assets', label: '资产中心', english: 'ASSETS', state: assets },
] as const
const controllers: Partial<Record<Exhibit, AbortController>> = {}
const numberFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })
const dateFormatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Shanghai' })

function formatNumber(value?: number) { return value === undefined ? '—' : numberFormatter.format(value) }
function formatDuration(value?: number) {
  if (value === undefined) return '—'
  const seconds = Math.floor(value)
  return seconds < 60 ? `${seconds}秒` : `${Math.floor(seconds / 60)}分${seconds % 60 ? `${seconds % 60}秒` : ''}`
}
function formatDate(value?: string) { return value ? dateFormatter.format(new Date(value)) : '—' }

function openCardPreview(event: MouseEvent, kind: 'stage' | 'asset', item: Stage | Asset) {
  if (event.target instanceof Element && event.target.closest('button, a, .exhibit-description')) return
  if (window.getSelection()?.toString()) return
  // Use the cover button as the return-focus target even for clicks on the card's text.
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.querySelector<HTMLButtonElement>('.preview-cover-button')?.focus({ preventScroll: true })
  preview.value = { kind, item }
}

async function loadCollection(kind: Exhibit) {
  controllers[kind]?.abort()
  const controller = new AbortController()
  controllers[kind] = controller
  const state = kind === 'stages' ? stages : assets
  state.loading = true
  state.error = ''
  try {
    if (kind === 'stages') {
      const data = await fetchStages(controller.signal)
      if (!controller.signal.aborted) { stages.data = data; stages.revision++ }
    } else {
      const data = await fetchAssets(controller.signal)
      if (!controller.signal.aborted) { assets.data = data; assets.revision++ }
    }
  } catch (error) {
    if (!controller.signal.aborted) state.error = error instanceof Error ? error.message : '暂时无法读取作品，请稍后重试。'
  } finally {
    if (controllers[kind] === controller) state.loading = false
  }
}

onMounted(() => { void loadCollection('stages'); void loadCollection('assets') })
onBeforeUnmount(() => { controllers.stages?.abort(); controllers.assets?.abort() })
</script>

<template>
  <div class="detail-page wonderland-page">
    <RouterLink to="/" class="back-link glass" data-glass draggable="false" @dragstart.prevent>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m10 5-7 7 7 7M3 12h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>返回主页</span>
    </RouterLink>

    <header class="exhibition-header">
      <div class="exhibition-heading">
        <div>
          <p class="exhibition-eyebrow" lang="en">XIAOMOL444 · COLLECTION</p>
          <h1 class="section-title" tabindex="-1" data-page-heading>
            <span class="section-title-chinese">千星奇域</span>
            <span class="section-title-separator" aria-hidden="true" />
            <span class="section-title-english" lang="en">Miliastra World</span>
          </h1>
        </div>
        <span class="exhibition-caption">我的奇域与创作资产</span>
      </div>
    </header>

    <template v-for="(collection, index) in collections" :key="collection.id">
      <img v-if="index > 0" class="collection-divider" :src="`${decorationUrl}svg/divider-scrollwork.svg`" width="720" height="88" alt="" aria-hidden="true" />
      <section :id="`exhibit-${collection.id}`" :aria-labelledby="`collection-title-${collection.id}`" class="collection-panel"
        :style="{ '--collection-frame': `url(${decorationUrl}svg/frame-cut-double.svg)` }">
      <header class="collection-toolbar">
        <div class="collection-heading">
          <h2 :id="`collection-title-${collection.id}`">{{ collection.label }}</h2>
          <span class="collection-count">{{ collection.state.data?.total ?? '—' }}</span>
          <span class="collection-english" lang="en">{{ collection.english }}</span>
        </div>
        <div class="collection-controls">
          <p class="collection-updated" aria-live="polite">{{ collection.state.loading ? '正在读取…' : collection.state.data?.updatedAt ? `数据更新于 ${formatDate(collection.state.data.updatedAt)}` : '' }}</p>
        </div>
      </header>
      <div v-if="collection.state.error" class="collection-message error-message glass" role="alert">
        <div><h3>{{ collection.label }}暂时未能更新</h3><p>{{ collection.state.error }}</p></div>
        <button type="button" class="text-button" :disabled="collection.state.loading" @click="loadCollection(collection.id)">重新加载</button>
      </div>

      <div v-if="collection.state.loading && !collection.state.data" class="exhibit-grid" aria-hidden="true">
        <div v-for="index in 4" :key="index" class="skeleton-card glass"><div class="skeleton-cover" /><div class="skeleton-copy"><i /><i /><i /></div></div>
      </div>

      <div v-else-if="collection.state.data?.items.length === 0" class="collection-message empty-message glass">
        <span class="empty-diamond" aria-hidden="true">◇</span>
        <h3>还没有可展示的{{ collection.id === 'stages' ? '奇域' : '资产' }}</h3>
        <p>作品发布后会出现在这里。</p>
      </div>

      <div v-if="collection.id === 'stages' && stages.data?.items.length" class="exhibit-grid" :aria-busy="stages.loading">
        <article v-for="stage in displayedStages" :key="stage.id" class="exhibit-card glass" :aria-labelledby="`stage-${stage.id}`" @click="openCardPreview($event, 'stage', stage)">
          <button class="preview-cover-button" type="button" :aria-label="`预览奇域：${stage.name}`" aria-haspopup="dialog" @click="preview = { kind: 'stage', item: stage }">
          <ExhibitCover :key="stages.revision" :src="stage.coverUrl" :name="stage.name">
            <span v-if="stage.playerCount" class="cover-badge">{{ stage.playerCount }} 人游玩</span>
            <span class="preview-hint">查看预览</span>
          </ExhibitCover>
          </button>
          <div class="card-content">
            <div v-if="stage.tags.length" class="exhibit-tags"><span v-for="tag in stage.tags" :key="tag">{{ tag }}</span></div>
            <h3 :id="`stage-${stage.id}`">{{ stage.name }}</h3>
            <ExhibitDescription :text="stage.description" />
            <dl class="card-metrics">
              <div><dt>热度</dt><dd>{{ formatNumber(stage.hotScore) }}</dd></div>
              <div><dt>好评率</dt><dd>{{ stage.goodRate === undefined ? '—' : `${formatNumber(stage.goodRate)}%` }}</dd></div>
              <div><dt>平均游玩</dt><dd>{{ formatDuration(stage.averagePlaySeconds) }}</dd></div>
            </dl>
            <div class="card-footnote"><span>奇域 ID <span class="exhibit-id">{{ stage.id }}</span></span><time v-if="stage.updatedAt" :datetime="stage.updatedAt">{{ formatDate(stage.updatedAt) }} 更新</time></div>
          </div>
        </article>
      </div>

      <div v-if="collection.id === 'assets' && assets.data?.items.length" class="exhibit-grid" :aria-busy="assets.loading">
        <article v-for="asset in assets.data.items" :key="asset.id" class="exhibit-card glass" :aria-labelledby="`asset-${asset.id}`" @click="openCardPreview($event, 'asset', asset)">
          <button class="preview-cover-button" type="button" :aria-label="`预览资产：${asset.name}`" aria-haspopup="dialog" @click="preview = { kind: 'asset', item: asset }">
          <ExhibitCover :key="assets.revision" :src="asset.coverUrl" :name="asset.name"><span v-if="asset.fileType" class="cover-badge file-badge">.{{ asset.fileType }}</span></ExhibitCover>
          <span class="preview-hint">查看预览</span>
          </button>
          <div class="card-content">
            <div v-if="asset.tags.length" class="exhibit-tags"><span v-for="tag in asset.tags" :key="tag">{{ tag }}</span></div>
            <h3 :id="`asset-${asset.id}`">{{ asset.name }}</h3>
            <ExhibitDescription :text="asset.description" />
            <dl class="card-metrics">
              <div><dt>下载</dt><dd>{{ formatNumber(asset.downloads) }}</dd></div>
              <div><dt>点赞</dt><dd>{{ formatNumber(asset.likes) }}</dd></div>
              <div><dt>收藏</dt><dd>{{ formatNumber(asset.favorites) }}</dd></div>
            </dl>
            <div class="card-footnote"><span>资产 ID <span class="exhibit-id">{{ asset.id }}</span></span><time v-if="asset.updatedAt" :datetime="asset.updatedAt">{{ formatDate(asset.updatedAt) }} 更新</time></div>
          </div>
        </article>
      </div>
      </section>
    </template>
    <ExhibitPreview v-if="preview" :item="preview.item" :kind="preview.kind" @close="preview = null" />
  </div>
</template>

<style scoped>
:global(html:has(.wonderland-page)), :global(body:has(.wonderland-page)) { scrollbar-width: none; }
:global(html:has(.wonderland-page)::-webkit-scrollbar), :global(body:has(.wonderland-page)::-webkit-scrollbar) { display: none; }
.wonderland-page { --exhibit-font: 'PingFang SC', 'Microsoft YaHei', sans-serif; max-width: 1440px; width: min(100%, 1440px); gap: 20px; padding: 32px 0 48px; }
.exhibition-header { padding: 4px 12px 8px; }
.exhibition-heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.exhibition-eyebrow { margin: 0 0 8px; color: #c4ae93; font: .75rem/1.6 var(--exhibit-font); letter-spacing: .16em; }
.exhibition-heading .section-title { font-size: clamp(1.5rem, 2.4vw, 2rem); }
.exhibition-caption { color: var(--text-muted); font-size: 1rem; line-height: 1.8; }
.collection-panel { position: relative; isolation: isolate; min-width: 0; padding: 30px; }
/* Nine-slice the original frame so its cut corners and double lines stay the same size. */
.collection-panel::before { content: ''; position: absolute; inset: 0; z-index: -1; border: 40px solid transparent; border-image: var(--collection-frame) 40 / 40px / 0 stretch; pointer-events: none; }
.collection-panel::after { content: ''; position: absolute; inset: 6px; z-index: -2; background: linear-gradient(145deg, rgb(44 21 31 / 80%), rgb(20 12 22 / 84%)); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); clip-path: polygon(21px 0, 100% 0, 100% calc(100% - 21px), calc(100% - 21px) 100%, 0 100%, 0 21px); pointer-events: none; }
.collection-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 20px; margin-bottom: 18px; }
.collection-heading { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; min-width: 0; }
.collection-heading h2 { margin: 0; color: #ffe8c7; font-size: 1.5rem; font-weight: 400; line-height: 1.6; }
.collection-count { min-width: 25px; padding: 2px 6px; border: 1px solid rgb(187 169 136 / 28%); border-radius: 2px; color: var(--gold-light); background: rgb(91 42 53 / 35%); font: .8125rem/1.4 var(--exhibit-font); text-align: center; }
.collection-english { margin-left: 4px; color: #b9a399; font: .75rem/1.5 var(--exhibit-font); letter-spacing: .14em; }
.collection-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; font-family: var(--exhibit-font); }
.collection-updated { margin: 0; color: #c0ada9; font-size: .75rem; line-height: 1.7; }
button:disabled { cursor: wait; opacity: .6; }
.collection-divider { display: block; width: min(100%, 720px); height: auto; margin: -6px auto; flex-shrink: 0; opacity: .9; }
.exhibit-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
.exhibit-card { display: flex; flex-direction: column; min-width: 0; overflow: hidden; border-radius: 3px; background: linear-gradient(145deg, rgb(42 22 31 / 87%), rgb(23 14 23 / 86%)); box-shadow: 0 10px 24px -18px rgb(8 2 10 / 60%); text-shadow: none; transition: border-color 200ms ease; }
.exhibit-card { cursor: pointer; }
.exhibit-card:hover { border-color: #c2a489; }
.preview-cover-button { position: relative; display: block; width: 100%; flex-shrink: 0; padding: 0; border: 0; color: inherit; background: transparent; text-align: left; cursor: pointer; }
.preview-cover-button:focus-visible { outline-offset: -3px; }
.preview-hint { position: absolute; top: 8px; left: 8px; padding: 4px 8px; border: 1px solid rgb(226 206 173 / 35%); border-radius: 2px; color: #f7e5cb; background: rgb(22 13 21 / 86%); font: .75rem/1.5 var(--exhibit-font); opacity: 0; transition: opacity 160ms ease; }
.exhibit-card:hover .preview-hint, .preview-cover-button:focus-visible .preview-hint { opacity: 1; }
.card-content :deep(.exhibit-description) { cursor: auto; }
@media (hover: none) { .preview-hint { opacity: 1; } }
.cover-badge { position: absolute; bottom: 8px; right: 8px; padding: 3px 7px; border: 1px solid rgb(226 206 173 / 35%); border-radius: 2px; background: rgb(22 13 21 / 85%); color: #f7e5cb; font: .75rem/1.5 var(--exhibit-font); backdrop-filter: blur(8px); }
.file-badge { font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.card-content { display: flex; flex: 1; flex-direction: column; gap: 10px; min-width: 0; padding: 14px; font-family: var(--exhibit-font); user-select: text; }
.card-content h3 { margin: 0; color: #ffebce; font-family: var(--font-page); font-size: 1.125rem; font-weight: 400; line-height: 1.6; overflow-wrap: anywhere; text-shadow: var(--text-glow-soft); }
.exhibit-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.exhibit-tags span { padding: 2px 5px; border: 1px solid rgb(187 169 136 / 18%); border-radius: 2px; color: #d6bda1; font-size: .75rem; line-height: 1.5; }
.exhibit-tags span:first-child { color: #f0c2bd; border-color: rgb(200 109 119 / 30%); background: rgb(139 49 65 / 13%); }
.card-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin: auto 0 0; padding-top: 12px; border-top: 1px solid rgb(187 169 136 / 18%); }
.card-metrics div { min-width: 0; }
.card-metrics dt { color: #bfaeaa; font-size: .75rem; line-height: 1.6; }
.card-metrics dd { margin: 3px 0 0; color: #f2debf; font-size: .9375rem; line-height: 1.5; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.card-footnote { display: flex; flex-wrap: wrap; gap: 2px 10px; color: #b6a29e; font-size: .75rem; line-height: 1.7; }
.exhibit-id { overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
.collection-message { padding: 24px; border-radius: 3px; font-family: var(--exhibit-font); }
.collection-message h3 { margin: 0; color: #f5dfc6; font-size: 1rem; font-weight: 500; line-height: 1.7; }
.collection-message p { margin: 8px 0 0; color: var(--text-muted); font-size: .875rem; line-height: 1.8; }
.error-message { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 18px; border-color: #aa596a; }
.text-button { flex-shrink: 0; min-height: 40px; padding: 7px 12px; border: 1px solid var(--gold); border-radius: 2px; background: transparent; color: var(--gold-light); cursor: pointer; }
.empty-message { display: grid; justify-items: center; padding-block: 48px; text-align: center; }
.empty-diamond { margin-bottom: 12px; color: var(--gold); font-size: 2.25rem; }
.skeleton-card { overflow: hidden; border-radius: 3px; }
.skeleton-cover { aspect-ratio: 16 / 9; background: rgb(165 121 121 / 10%); animation: breathe 1.6s ease-in-out infinite alternate; }
.skeleton-copy { display: grid; gap: 12px; padding: 16px; }
.skeleton-copy i { height: 12px; width: 92%; background: rgb(187 169 136 / 13%); border-radius: 2px; }
.skeleton-copy i:first-child { width: 65%; height: 18px; }
.skeleton-copy i:last-child { width: 75%; }
@keyframes breathe { to { opacity: .35; } }
@media (max-width: 1100px) {
  .exhibit-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .exhibition-caption { display: none; }
}
@media (max-width: 850px) {
  .exhibit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .collection-panel { padding: 28px; }
  .collection-english { display: none; }
}
@media (max-width: 560px) {
  .wonderland-page { gap: 14px; padding-block: 26px 40px; }
  .exhibit-grid { grid-template-columns: minmax(0, 1fr); }
  .exhibition-header { padding-inline: 6px; }
  .exhibition-heading .section-title { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .exhibition-heading .section-title-separator { display: none; }
  .exhibition-heading .section-title-english { font-size: 1.25rem; }
  .exhibition-eyebrow { letter-spacing: .1em; }
  .collection-panel { padding: 26px 24px; }
  .collection-heading h2 { font-size: 1.25rem; }
  .collection-controls { width: 100%; justify-content: space-between; }
  .collection-divider { margin-block: 0; }
  .error-message { align-items: start; flex-direction: column; padding: 18px; gap: 12px; }
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .collection-panel::after { background: #20131d; }
}
</style>
