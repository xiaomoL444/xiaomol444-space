<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import avatarUrl from '../assets/avatar.jpg'
import avatarFrameUrl from '../assets/avatarFrame.png'
import backgroundUrl from '../assets/background/home-background.mp4'
import posterUrl from '../assets/background/home-poster.jpg'
import loadingUrl from '../assets/background/Loading.png'
import musicUrl from '../assets/music/theme.mp3'
import batUrl from '../assets/entrance-bat-simple.png'
import EntranceIntro from './components/EntranceIntro.vue'
import { useEntranceLoading } from './composables/useEntranceLoading'
import { useGlassGlow } from './composables/useGlassGlow'

const home = ref<HTMLElement | null>(null)
const background = ref<HTMLVideoElement | null>(null)
const music = ref<HTMLAudioElement | null>(null)
const introVisible = ref(true)
const homeRevealed = ref(false)
const homeInteractive = ref(false)
const isMusicPlaying = ref(false)
const musicRequested = ref(true)
const musicAwaitingInteraction = ref(false)
const musicFailed = ref(false)
const videoFailed = ref(false)
const year = new Date().getFullYear()
const decorationUrl = `${import.meta.env.BASE_URL}yuexia-kit/`
const homeSections = [
  { id: 'my-lover', title: '我的爱人', englishTitle: 'My Lover' },
  { id: 'about-me', title: '关于我', englishTitle: 'About Me' },
  { id: 'miliastra-wonderland', title: '千星奇域', englishTitle: 'miliastra world' },
  { id: 'wish', title: '愿望', englishTitle: 'Wish' },
]
let motionPreference: MediaQueryList | undefined
let musicRequest = 0
let musicAutoplayEnabled = false

useGlassGlow(home)
const { progress: loadingProgress, ready: assetsReady, unavailable: unavailableAssets } = useEntranceLoading(
  [avatarUrl, avatarFrameUrl, posterUrl, batUrl, loadingUrl],
  () => [background.value, music.value],
)

function revealHome() {
  homeRevealed.value = true
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#160d15')
}

async function playBackground() {
  if (!background.value || videoFailed.value) return
  try {
    await background.value.play()
  } catch {
    // Keep the poster visible when automatic video playback is unavailable.
  }
}

async function playMusic() {
  const audio = music.value
  if (!audio || musicFailed.value) return
  const request = ++musicRequest
  musicRequested.value = true
  musicAwaitingInteraction.value = false
  try {
    await audio.play()
    if (request !== musicRequest) return
    isMusicPlaying.value = !audio.paused
    if (isMusicPlaying.value) stopMusicAutoplay()
  } catch (error) {
    if (request !== musicRequest) return
    musicRequested.value = false
    isMusicPlaying.value = false
    if (error instanceof Error && error.name === 'NotAllowedError') {
      musicAwaitingInteraction.value = true
      enableMusicAutoplay()
    } else {
      stopMusicAutoplay()
    }
  }
}

function resumeMusicOnInteraction(event: Event) {
  if (!musicAutoplayEnabled || musicFailed.value || isMusicPlaying.value) return
  // Let the music button handle its own click, including keyboard activation.
  if (event.target instanceof Element && event.target.closest('.music-control')) return
  if (event instanceof KeyboardEvent && (event.repeat || event.key === 'Escape' || event.ctrlKey || event.altKey || event.metaKey)) return
  void playMusic()
}

function enableMusicAutoplay() {
  musicAutoplayEnabled = true
  document.addEventListener('click', resumeMusicOnInteraction)
  document.addEventListener('keydown', resumeMusicOnInteraction)
}

function stopMusicAutoplay() {
  musicAutoplayEnabled = false
  musicAwaitingInteraction.value = false
  document.removeEventListener('click', resumeMusicOnInteraction)
  document.removeEventListener('keydown', resumeMusicOnInteraction)
}

function pauseMusic() {
  musicRequest++
  stopMusicAutoplay()
  musicRequested.value = false
  if (music.value) {
    music.value.autoplay = false
    music.value.pause()
  }
  isMusicPlaying.value = false
}

function toggleMusic() {
  if (musicRequested.value || isMusicPlaying.value) pauseMusic()
  else void playMusic()
}

function syncMusicState() {
  isMusicPlaying.value = !!music.value && !music.value.paused
  musicRequested.value = isMusicPlaying.value
  if (isMusicPlaying.value) stopMusicAutoplay()
}

function onMusicError() {
  pauseMusic()
  musicFailed.value = true
}

function respectMotionPreference() {
  if (motionPreference?.matches) background.value?.pause()
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', respectMotionPreference)
  if (!motionPreference.matches) void playBackground()
  if (music.value) music.value.volume = 0.35
  enableMusicAutoplay()
  void playMusic()
})

onBeforeUnmount(() => {
  pauseMusic()
  background.value?.pause()
  motionPreference?.removeEventListener('change', respectMotionPreference)
})
</script>

<template>
  <EntranceIntro
    v-if="introVisible"
    :progress="loadingProgress"
    :ready="assetsReady"
    :unavailable="unavailableAssets"
    @reveal="revealHome"
    @entered="homeInteractive = true"
    @complete="introVisible = false"
  />
  <div ref="home" class="home" :class="{ 'home--waiting': !homeRevealed, 'home--intro-active': introVisible }" :inert="!homeInteractive" :aria-hidden="!homeInteractive || undefined">
    <audio
      ref="music"
      :src="musicUrl"
      autoplay
      loop
      preload="auto"
      @play="syncMusicState"
      @pause="syncMusicState"
      @ended="syncMusicState"
      @error="onMusicError"
    />
    <div class="backdrop" aria-hidden="true" @dragstart.prevent @contextmenu.prevent>
      <img class="backdrop-media" :src="posterUrl" alt="" draggable="false" />
      <video
        v-show="!videoFailed"
        ref="background"
        class="backdrop-media"
        :src="backgroundUrl"
        :poster="posterUrl"
        draggable="false"
        muted
        loop
        playsinline
        preload="auto"
        disablepictureinpicture
        @error="videoFailed = true"
      />
      <div class="backdrop-shade" />
    </div>

    <div class="page-ornaments" aria-hidden="true">
      <span class="page-outline" />
      <img v-for="corner in ['tl', 'tr', 'bl', 'br']" :key="corner" :class="['page-corner', `corner--${corner}`]" :src="`${decorationUrl}svg/corner-angular.svg`" alt="" draggable="false" />
      <img class="petal petal--one" :src="`${decorationUrl}png/petal-red.png`" alt="" draggable="false" />
      <img class="petal petal--two" :src="`${decorationUrl}png/petal-red.png`" alt="" draggable="false" />
    </div>

    <header class="site-header">
      <div class="wordmark">
        <img class="wordmark-gem" :src="`${decorationUrl}svg/emblem-ruby.svg`" width="20" height="28" alt="" aria-hidden="true" />
        <span>xiaomol444<span class="wordmark-dot">.</span></span>
      </div>
      <span class="header-caption">PERSONAL SPACE</span>
    </header>

    <main class="main-content">
      <section class="profile glass" data-glass aria-labelledby="profile-name">
        <div class="profile-shine" aria-hidden="true" />
        <div class="profile-ornaments" aria-hidden="true">
          <span class="profile-inset" />
          <img class="profile-corner corner--tl" :src="`${decorationUrl}svg/corner-angular.svg`" alt="" draggable="false" />
          <img class="profile-corner corner--br" :src="`${decorationUrl}svg/corner-angular.svg`" alt="" draggable="false" />
          <img class="profile-crest" :src="`${decorationUrl}svg/emblem-ruby.svg`" width="26" height="36" alt="" draggable="false" />
        </div>
        <div class="avatar-shell" @dragstart.prevent @contextmenu.prevent>
          <img class="avatar" :src="avatarUrl" alt="xiaomol444 的头像" width="128" height="128" fetchpriority="high" draggable="false" />
          <img class="avatar-frame" :src="avatarFrameUrl" alt="" aria-hidden="true" width="163" height="150" draggable="false" />
        </div>
        <h1 id="profile-name">xiaomol444<span>.</span></h1>
        <p class="welcome">愿你今晚得享安眠</p>
        <img class="profile-detail" :src="`${decorationUrl}svg/divider-central-star.svg`" width="280" height="28" alt="" aria-hidden="true" />
      </section>

      <div class="home-sections">
        <template v-for="(section, index) in homeSections" :key="section.id">
          <section class="section-card glass" data-glass :aria-labelledby="`${section.id}-title`">
            <div class="section-ornaments" aria-hidden="true">
              <span class="section-inset" />
              <span class="section-pattern" :style="{ backgroundImage: `url(${decorationUrl}svg/pattern-fine-diamonds.svg)` }" />
              <img class="section-corner corner--tl" :src="`${decorationUrl}svg/corner-scroll.svg`" width="38" height="38" alt="" draggable="false" />
              <img class="section-corner corner--br" :src="`${decorationUrl}svg/corner-scroll.svg`" width="38" height="38" alt="" draggable="false" />
              <img class="section-gem" :src="`${decorationUrl}svg/emblem-ruby.svg`" width="20" height="28" alt="" draggable="false" />
            </div>
            <h2 :id="`${section.id}-title`" class="section-title">
              <span class="section-title-chinese">{{ section.title }}</span>
              <span class="section-title-separator" aria-hidden="true" />
              <span class="section-title-english" lang="en">{{ section.englishTitle }}</span>
            </h2>
          </section>
          <div v-if="index < homeSections.length - 1" class="section-divider" aria-hidden="true">
            <img :src="`${decorationUrl}svg/divider-diamond-chain.svg`" width="720" height="64" alt="" draggable="false" />
          </div>
        </template>
      </div>
    </main>

    <footer class="site-footer">
      <span class="copyright">© {{ year }} xiaomol444</span>
      <button
        class="music-control glass"
        data-glass
        type="button"
        :class="{ 'is-playing': isMusicPlaying }"
        :disabled="musicFailed"
        :aria-label="musicFailed ? '背景音乐暂时不可用' : musicRequested ? '暂停背景音乐' : '播放背景音乐'"
        :aria-pressed="isMusicPlaying"
        @click="toggleMusic"
      >
        <span class="music-bars" aria-hidden="true"><i /><i /><i /><i /></span>
        <span class="music-label">{{ musicFailed ? '音乐暂不可用' : isMusicPlaying ? '正在播放' : musicRequested ? '音乐加载中' : musicAwaitingInteraction ? '点击开启音乐' : '播放音乐' }}</span>
        <span class="music-separator" aria-hidden="true" />
        <svg v-if="musicRequested" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5v14M15 5v14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m8 5 11 7-11 7V5Z" fill="currentColor" />
        </svg>
      </button>
    </footer>
  </div>
</template>
