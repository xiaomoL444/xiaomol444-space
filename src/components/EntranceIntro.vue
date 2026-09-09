<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import batUrl from '../../assets/entrance-bat-simple.png'
import loadingUrl from '../../assets/background/Loading.png'
import { waitForResource } from '../composables/useEntranceLoading'
import { BatFlight } from '../lib/batFlight'

const BACKGROUND_FADE_MS = 600
const props = defineProps<{ progress: number; ready: boolean; unavailable: number }>()
const emit = defineEmits<{ reveal: []; entered: []; complete: [] }>()
const canvas = ref<HTMLCanvasElement | null>(null)
const loadingBackground = ref<HTMLImageElement | null>(null)
const backgroundVisible = ref(false)
const backgroundSettled = ref(false)
const backgroundController = new AbortController()
const flying = ref(false)
const revealed = ref(false)
const fading = ref(false)
const passing = ref(false)
const spriteReady = ref(false)
const spriteFailed = ref(false)
let image: HTMLImageElement
let flight: BatFlight | undefined
let motionPreference: MediaQueryList | undefined
let fadeTimer: ReturnType<typeof setTimeout> | undefined
let imageTimer: ReturnType<typeof setTimeout> | undefined
let backgroundFadeTimer: ReturnType<typeof setTimeout> | undefined
let backgroundFrame = 0
let disposed = false
let started = false
let completed = false
let revealSent = false
let originalOverflow = ''

function finishBackground() {
  clearTimeout(backgroundFadeTimer)
  if (!disposed) backgroundSettled.value = true
}

async function prepareBackground() {
  const background = loadingBackground.value
  if (!background) { finishBackground(); return }
  const result = await waitForResource(background, backgroundController.signal)
  if (disposed) return
  if (result !== 'ready') { finishBackground(); return }
  try {
    await background.decode()
  } catch {
    finishBackground()
    return
  }
  if (disposed) return
  if (motionPreference?.matches) {
    backgroundVisible.value = true
    finishBackground()
    return
  }
  // Paint the transparent image first, including when it came from cache.
  backgroundFrame = requestAnimationFrame(() => {
    backgroundFrame = requestAnimationFrame(() => {
      if (disposed) return
      backgroundVisible.value = true
      backgroundFadeTimer = setTimeout(finishBackground, BACKGROUND_FADE_MS + 100)
    })
  })
}

function onBackgroundTransitionEnd(event: TransitionEvent) {
  if (event.propertyName === 'opacity' && backgroundVisible.value) finishBackground()
}

function notifyReveal() {
  if (disposed || revealSent) return
  revealSent = true
  emit('reveal')
}

async function reveal() {
  if (disposed || revealed.value) return
  notifyReveal()
  await nextTick()
  if (!disposed) revealed.value = true
  await nextTick()
}

function complete() {
  if (disposed || completed) return
  completed = true
  enterHome()
  emit('complete')
}

function enterHome() {
  if (disposed || passing.value) return
  passing.value = true
  document.documentElement.style.overflow = originalOverflow
  emit('entered')
}

function gentleReveal() {
  if (disposed || completed) return
  flight?.stop()
  flying.value = true
  notifyReveal()
  fading.value = true
  clearTimeout(fadeTimer)
  fadeTimer = setTimeout(complete, 280)
}

function begin() {
  if (!props.ready || !backgroundSettled.value || started || disposed) return
  if (!spriteReady.value && !spriteFailed.value) return
  started = true
  if (motionPreference?.matches || spriteFailed.value || !canvas.value) {
    gentleReveal()
    return
  }
  try {
    flight = new BatFlight(canvas.value, image, reveal, enterHome, complete)
    flying.value = true
    flight.start()
  } catch {
    gentleReveal()
  }
}

function onMotionChange() {
  if (motionPreference?.matches && started) gentleReveal()
}

watch(() => props.ready, begin)
watch([spriteReady, spriteFailed, backgroundSettled], begin)

onMounted(() => {
  originalOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', onMotionChange)
  void prepareBackground()
  image = new Image()
  image.onload = () => {
    clearTimeout(imageTimer)
    if (!disposed) spriteReady.value = true
  }
  image.onerror = () => {
    clearTimeout(imageTimer)
    if (!disposed) spriteFailed.value = true
  }
  imageTimer = setTimeout(() => { spriteFailed.value = true }, 8500)
  image.src = batUrl
  begin()
})

onBeforeUnmount(() => {
  disposed = true
  flight?.stop()
  clearTimeout(fadeTimer)
  clearTimeout(imageTimer)
  clearTimeout(backgroundFadeTimer)
  cancelAnimationFrame(backgroundFrame)
  backgroundController.abort()
  image.onload = null
  image.onerror = null
  motionPreference?.removeEventListener('change', onMotionChange)
  document.documentElement.style.overflow = originalOverflow
})
</script>

<template>
  <div class="entrance" :class="{ 'is-flying': flying, 'is-revealed': revealed, 'is-fading': fading, 'is-passing': passing }" :aria-busy="!ready" :aria-hidden="passing || undefined">
    <div class="entrance-backdrop" aria-hidden="true">
      <img
        ref="loadingBackground"
        class="entrance-background-image"
        :class="{ 'is-visible': backgroundVisible }"
        :style="{ transitionDuration: `${BACKGROUND_FADE_MS}ms` }"
        :src="loadingUrl"
        alt=""
        width="2560"
        height="1440"
        fetchpriority="high"
        decoding="async"
        draggable="false"
        @transitionend.self="onBackgroundTransitionEnd"
      />
      <div class="entrance-background-shade" />
    </div>
    <div class="entrance-identity" aria-hidden="true">
      <img :src="batUrl" alt="" width="2172" height="724" draggable="false" />
      <span>xiaomol444<span class="entrance-dot">.</span></span>
    </div>
    <div class="entrance-loading">
      <div class="entrance-loading-meta">
        <span role="status">{{ ready ? unavailable ? '部分资源暂不可用' : '准备进入' : '正在加载' }}</span>
        <span class="entrance-percent" aria-hidden="true">{{ String(progress).padStart(2, '0') }}<small>%</small></span>
      </div>
      <div class="entrance-track" role="progressbar" aria-label="主页资源加载进度" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
        <div class="entrance-fill" :style="{ transform: `scaleX(${progress / 100})` }" />
      </div>
    </div>
    <canvas ref="canvas" class="entrance-flight" aria-hidden="true" @webglcontextlost.prevent="gentleReveal" />
  </div>
</template>

<style scoped>
.entrance { position: fixed; z-index: 100; inset: 0; overflow: hidden; color: #fff9ff; user-select: none; touch-action: manipulation; }
.entrance-backdrop { position: absolute; inset: 0; overflow: hidden; background: #1c1029; }
.entrance-background-image { position: absolute; inset: -36px; width: calc(100% + 72px); height: calc(100% + 72px); object-fit: cover; object-position: center; filter: blur(12px); opacity: 0; transition-property: opacity; transition-timing-function: ease-out; }
.entrance-background-image.is-visible { opacity: 1; }
.entrance-background-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgb(15 8 25 / 16%), rgb(24 9 30 / 12%) 42%, rgb(15 8 25 / 48%)); }
.entrance-identity { position: absolute; top: 44%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 22px; font-size: clamp(1.75rem, 5vw, 2.75rem); font-weight: 600; letter-spacing: -.045em; transition: opacity 250ms ease, translate 500ms ease; }
.entrance-identity img { display: block; width: clamp(150px, 22vw, 230px); height: auto; filter: brightness(0) invert(1); }
.entrance-dot { color: #efbce9; }
.entrance-loading { position: absolute; bottom: max(64px, env(safe-area-inset-bottom)); left: 50%; width: min(440px, calc(100% - 64px)); transform: translateX(-50%); transition: opacity 220ms ease; }
.entrance-loading-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; margin-bottom: 13px; font-size: .875rem; letter-spacing: .08em; }
.entrance-percent { font-size: 1.25rem; font-variant-numeric: tabular-nums; letter-spacing: -.025em; }
.entrance-percent small { margin-left: 4px; font-size: .75rem; }
.entrance-track { height: 3px; overflow: hidden; background: rgb(255 249 255 / 24%); }
.entrance-fill { width: 100%; height: 100%; background: #fff9ff; transform-origin: left; transition: transform 220ms ease; }
.entrance-flight { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.is-flying .entrance-identity { opacity: 0; translate: 0 -12px; }
.is-flying .entrance-loading { opacity: 0; }
.is-revealed .entrance-backdrop { visibility: hidden; }
.is-passing { pointer-events: none; }
.is-fading { opacity: 0; transition: opacity 250ms ease; }
@media (max-width: 600px) { .entrance-loading { bottom: max(44px, env(safe-area-inset-bottom)); } .entrance-background-image { object-position: 35% center; } }
@media (prefers-reduced-motion: reduce) { .entrance-identity, .entrance-loading, .entrance-fill, .entrance-background-image { transition: none; } }
</style>
