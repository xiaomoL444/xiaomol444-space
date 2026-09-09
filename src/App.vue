<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import avatarUrl from '../assets/avatar.jpg'
import avatarFrameUrl from '../assets/avatarFrame.png'
import backgroundUrl from '../assets/background/home-background.mp4'
import posterUrl from '../assets/background/home-poster.jpg'
import musicUrl from '../assets/music/theme.mp3'
import { useGlassGlow } from './composables/useGlassGlow'

const home = ref<HTMLElement | null>(null)
const background = ref<HTMLVideoElement | null>(null)
const music = ref<HTMLAudioElement | null>(null)
const isMusicPlaying = ref(false)
const musicRequested = ref(true)
const musicAwaitingInteraction = ref(false)
const musicFailed = ref(false)
const videoFailed = ref(false)
const year = new Date().getFullYear()
let motionPreference: MediaQueryList | undefined
let musicRequest = 0
let musicAutoplayEnabled = false

useGlassGlow(home)

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
  <div ref="home" class="home">
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
        preload="metadata"
        disablepictureinpicture
        @error="videoFailed = true"
      />
      <div class="backdrop-shade" />
    </div>

    <header class="site-header">
      <div class="wordmark">
        <svg class="sparkle" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2c.8 6.5 3.5 9.2 10 10-6.5.8-9.2 3.5-10 10C11.2 15.5 8.5 12.8 2 12c6.5-.8 9.2-3.5 10-10Z" fill="currentColor" />
        </svg>
        <span>xiaomol444<span class="wordmark-dot">.</span></span>
      </div>
      <span class="header-caption">PERSONAL SPACE</span>
    </header>

    <main class="main-content">
      <section class="profile glass" data-glass aria-labelledby="profile-name">
        <div class="profile-shine" aria-hidden="true" />
        <div class="avatar-shell" @dragstart.prevent @contextmenu.prevent>
          <img class="avatar" :src="avatarUrl" alt="xiaomol444 的头像" width="128" height="128" fetchpriority="high" draggable="false" />
          <img class="avatar-frame" :src="avatarFrameUrl" alt="" aria-hidden="true" width="163" height="150" draggable="false" />
        </div>
        <p class="eyebrow">HELLO, I'M</p>
        <h1 id="profile-name">xiaomol444<span>.</span></h1>
        <p class="welcome">愿你今晚得享安眠</p>
        <div class="profile-detail" aria-hidden="true"><span />✧<span /></div>
      </section>
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
