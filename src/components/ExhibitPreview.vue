<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Asset, Stage } from '../lib/ugcApi'

const props = defineProps<{ item: Stage | Asset; kind: 'stage' | 'asset' }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const activeIndex = ref(0)
const failedMedia = ref(new Set<string>())
const stage = computed(() => props.kind === 'stage' ? props.item as Stage : null)
const asset = computed(() => props.kind === 'asset' ? props.item as Asset : null)
const kindLabel = computed(() => props.kind === 'stage' ? '奇域' : '资产')
const media = computed(() => {
  const images = [...new Set([props.item.coverUrl, ...props.item.images].filter(Boolean))]
  const items: { type: 'image' | 'video'; url: string; thumbnail: string; label: string }[] = images.map((url, index) => ({
    type: 'image', url, thumbnail: url, label: index === 0 && props.item.coverUrl ? '封面' : `截图 ${index + (props.item.coverUrl ? 0 : 1)}`,
  }))
  if (props.item.videoUrl) items.push({ type: 'video', url: props.item.videoUrl, thumbnail: props.item.videoPosterUrl || props.item.coverUrl, label: '预览视频' })
  return items
})
const activeMedia = computed(() => media.value[activeIndex.value])
const numberFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })
const number = (value?: number) => value === undefined ? '—' : numberFormatter.format(value)
let previousOverflow = ''
let returnFocus: HTMLElement | null = null
let pointerStartedOnBackdrop = false

function failMedia(url: string) { failedMedia.value = new Set([...failedMedia.value, url]) }
function selectMedia(index: number) {
  video.value?.pause()
  activeIndex.value = index
}
function stepMedia(offset: number) {
  selectMedia((activeIndex.value + offset + media.value.length) % media.value.length)
}
function close() {
  video.value?.pause()
  dialog.value?.close()
}
function isBackdrop(event: MouseEvent) {
  if (event.target !== dialog.value || !dialog.value) return false
  const bounds = dialog.value.getBoundingClientRect()
  return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom
}
function onBackdropClick(event: MouseEvent) {
  if (pointerStartedOnBackdrop && isBackdrop(event)) close()
  pointerStartedOnBackdrop = false
}
function onBackdropPointerDown(event: PointerEvent) { pointerStartedOnBackdrop = isBackdrop(event) }

onMounted(() => {
  previousOverflow = document.documentElement.style.overflow
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  dialog.value?.showModal()
  document.documentElement.style.overflow = 'hidden'
})
onBeforeUnmount(() => {
  video.value?.pause()
  dialog.value?.close()
  document.documentElement.style.overflow = previousOverflow
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
})
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="preview-dialog" aria-labelledby="preview-title" @close="emit('close')" @cancel.prevent="close" @pointerdown="onBackdropPointerDown" @click="onBackdropClick">
      <header class="preview-header">
        <div><p class="preview-kind">{{ kindLabel }}预览</p><h2 id="preview-title">{{ item.name }}</h2></div>
        <button class="close-button" type="button" autofocus aria-label="关闭预览" @click="close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
        </button>
      </header>
      <div class="preview-content">
        <div class="preview-media">
          <div v-if="!activeMedia || failedMedia.has(activeMedia.url)" class="media-unavailable" role="status">
            <span>{{ activeMedia ? '这份预览暂时无法加载' : '暂无预览图片' }}</span>
            <span v-if="media.length > 1">可以查看其他图片或视频</span>
          </div>
          <video v-else-if="activeMedia.type === 'video'" :key="activeMedia.url" ref="video" class="main-media" :src="activeMedia.url" :poster="item.videoPosterUrl || item.coverUrl" controls playsinline preload="metadata" :aria-label="`${item.name}的预览视频`" @error="failMedia(activeMedia.url)" />
          <img v-else :key="activeMedia.url" class="main-media" :src="activeMedia.url" :alt="`${item.name} · ${activeMedia.label}`" referrerpolicy="no-referrer" @error="failMedia(activeMedia.url)" />
        </div>
        <div v-if="media.length > 1" class="media-navigation">
          <button class="media-step" type="button" aria-label="上一份预览" @click="stepMedia(-1)">‹</button>
          <p aria-live="polite">{{ activeMedia?.label }} <span>{{ activeIndex + 1 }} / {{ media.length }}</span></p>
          <button class="media-step" type="button" aria-label="下一份预览" @click="stepMedia(1)">›</button>
        </div>
        <div v-if="media.length > 1" class="media-thumbnails" role="group" aria-label="选择预览内容">
          <button v-for="(entry, index) in media" :key="entry.url" class="media-thumbnail" type="button" :aria-pressed="index === activeIndex" :aria-label="`查看${entry.label}`" @click="selectMedia(index)">
            <img v-if="entry.thumbnail && !failedMedia.has(entry.thumbnail)" :src="entry.thumbnail" alt="" loading="lazy" referrerpolicy="no-referrer" @error="failMedia(entry.thumbnail)" />
            <span>{{ entry.type === 'video' ? '▷ ' : '' }}{{ entry.label }}</span>
          </button>
        </div>
        <div class="preview-tags"><span v-for="tag in item.tags" :key="tag">{{ tag }}</span></div>
        <dl v-if="stage" class="preview-metrics">
          <div><dt>游玩人数</dt><dd>{{ stage.playerCount ? `${stage.playerCount} 人` : '—' }}</dd></div>
          <div><dt>热度</dt><dd>{{ number(stage.hotScore) }}</dd></div>
          <div><dt>好评率</dt><dd>{{ stage.goodRate === undefined ? '—' : `${number(stage.goodRate)}%` }}</dd></div>
        </dl>
        <dl v-if="asset" class="preview-metrics">
          <div><dt>下载</dt><dd>{{ number(asset.downloads) }}</dd></div>
          <div><dt>点赞</dt><dd>{{ number(asset.likes) }}</dd></div>
          <div><dt>收藏</dt><dd>{{ number(asset.favorites) }}</dd></div>
        </dl>
        <section class="preview-description" aria-labelledby="preview-description-title"><h3 id="preview-description-title">{{ kindLabel }}介绍</h3><p>{{ item.description || '暂无介绍' }}</p></section>
        <footer class="preview-footer"><p>{{ kindLabel }} ID <span>{{ item.id }}</span></p><p v-if="asset?.fileName">文件：{{ asset.fileName }}<span v-if="asset.fileType"> · .{{ asset.fileType }}</span></p></footer>
      </div>
    </dialog>
  </Teleport>
</template>

<style scoped>
.preview-dialog { width: min(920px, calc(100% - 40px)); max-width: none; max-height: 90dvh; margin: auto; padding: 0; overflow: auto; overscroll-behavior: contain; scrollbar-width: none; border: 1px solid var(--gold); border-radius: 4px; color: #f5e7d6; background: #21141e; box-shadow: 0 24px 100px #0009, inset 0 0 0 5px #bba98812; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.preview-dialog::-webkit-scrollbar, .media-thumbnails::-webkit-scrollbar { display: none; }
.preview-dialog::backdrop { background: rgb(10 5 12 / 78%); backdrop-filter: blur(8px); }
.preview-header { position: sticky; top: 0; z-index: 2; display: flex; align-items: start; justify-content: space-between; gap: 18px; padding: 20px 24px; border-bottom: 1px solid #bba98830; background: #21141ef5; }
.preview-kind { margin: 0 0 6px; color: #c6ad99; font-size: .8125rem; line-height: 1.5; }
.preview-header h2 { margin: 0; color: #ffe8c7; font-family: var(--font-page); font-size: 1.5rem; font-weight: 400; line-height: 1.6; overflow-wrap: anywhere; }
.close-button, .media-step { display: grid; place-items: center; flex-shrink: 0; width: 40px; height: 40px; padding: 0; border: 1px solid #bba98855; border-radius: 3px; background: #38202b; color: var(--gold-light); cursor: pointer; }
.close-button:hover, .media-step:hover { background: #5a293b; }
.preview-content { padding: 20px 24px 24px; }
.preview-media { display: grid; place-items: center; aspect-ratio: 16 / 9; max-height: 52dvh; overflow: hidden; background: #100c13; border: 1px solid #bba98825; }
.main-media { display: block; width: 100%; height: 100%; min-height: 0; max-height: 52dvh; object-fit: contain; }
.media-unavailable { display: grid; gap: 10px; padding: 24px; text-align: center; color: #c9b6ac; font-size: .875rem; }
.media-navigation { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; }
.media-navigation p { margin: 0; color: var(--gold-light); font-size: .875rem; }
.media-navigation p span { margin-left: 12px; color: #bfaeaa; font-variant-numeric: tabular-nums; }
.media-step { width: 36px; height: 36px; font-family: sans-serif; font-size: 1.75rem; }
.media-thumbnails { display: flex; gap: 10px; margin-top: 12px; padding: 4px; overflow-x: auto; scrollbar-width: none; }
.media-thumbnail { position: relative; flex: 0 0 108px; height: 72px; overflow: hidden; padding: 0; border: 1px solid #bba98850; border-radius: 2px; background: #38202b; cursor: pointer; }
.media-thumbnail[aria-pressed='true'] { border-color: #f2d5a9; box-shadow: 0 0 0 1px #f2d5a9; }
.media-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
.media-thumbnail span { position: absolute; inset: auto 0 0; padding: 3px; color: #f4dfc6; background: #160d15cc; font-size: .75rem; line-height: 1.5; }
.preview-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 22px; }
.preview-tags span { padding: 3px 8px; border: 1px solid #bba98840; color: #dbc5a9; font-size: .8125rem; line-height: 1.5; }
.preview-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 18px 0; padding: 16px 0; border-block: 1px solid #bba98830; }
.preview-metrics dt { color: #bfaeaa; font-size: .8125rem; }
.preview-metrics dd { margin: 8px 0 0; color: var(--gold-light); font-size: 1.125rem; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.preview-description h3 { margin: 0 0 10px; color: var(--gold-light); font-size: 1rem; font-weight: 500; }
.preview-description p { margin: 0; color: #d5c6c3; font-size: 1rem; line-height: 1.9; white-space: pre-line; overflow-wrap: anywhere; }
.preview-footer { margin-top: 22px; padding-top: 14px; border-top: 1px solid #bba98830; color: #bfaeaa; font-size: .8125rem; line-height: 1.8; overflow-wrap: anywhere; }
.preview-footer p { margin: 3px 0; }
.preview-footer span { font-variant-numeric: tabular-nums; }
@media (max-width: 600px) {
  .preview-dialog { width: calc(100% - 24px); max-height: 94dvh; }
  .preview-header { padding: 14px; gap: 12px; }
  .preview-header h2 { font-size: 1.25rem; }
  .preview-content { padding: 14px; }
  .media-thumbnail { flex-basis: 88px; height: 60px; }
  .preview-metrics dd { font-size: 1rem; }
}
</style>
