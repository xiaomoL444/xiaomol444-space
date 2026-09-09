<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import avatarUrl from '../assets/avatar.jpg'
import backgroundUrl from '../assets/background/home-background.mp4'
import posterUrl from '../assets/background/home-poster.jpg'

const background = ref<HTMLVideoElement | null>(null)
const isPlaying = ref(false)
const videoFailed = ref(false)
const year = new Date().getFullYear()
let motionPreference: MediaQueryList | undefined

async function playBackground() {
  if (!background.value || videoFailed.value) return
  try {
    await background.value.play()
  } catch {
    isPlaying.value = false
  }
}

function toggleBackground() {
  if (isPlaying.value) background.value?.pause()
  else void playBackground()
}

function respectMotionPreference() {
  if (motionPreference?.matches) background.value?.pause()
}

onMounted(() => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', respectMotionPreference)
  if (!motionPreference.matches) void playBackground()
})

onBeforeUnmount(() => {
  motionPreference?.removeEventListener('change', respectMotionPreference)
})
</script>

<template>
  <div class="home">
    <div class="backdrop" aria-hidden="true">
      <img class="backdrop-media" :src="posterUrl" alt="" />
      <video
        v-show="!videoFailed"
        ref="background"
        class="backdrop-media"
        :src="backgroundUrl"
        :poster="posterUrl"
        muted
        loop
        playsinline
        preload="metadata"
        disablepictureinpicture
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @error="videoFailed = true; isPlaying = false"
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
      <section class="profile glass" aria-labelledby="profile-name">
        <div class="profile-shine" aria-hidden="true" />
        <div class="avatar-shell">
          <img class="avatar" :src="avatarUrl" alt="xiaomol444 的头像" width="128" height="128" fetchpriority="high" />
          <span class="avatar-sparkle" aria-hidden="true">✦</span>
        </div>
        <p class="eyebrow">HELLO, I'M</p>
        <h1 id="profile-name">xiaomol444<span>.</span></h1>
        <p class="welcome">欢迎来到我的小小世界</p>
        <div class="profile-detail" aria-hidden="true"><span />✧<span /></div>
      </section>
    </main>

    <footer class="site-footer">
      <span class="copyright">© {{ year }} xiaomol444</span>
      <button
        class="background-control glass"
        type="button"
        :disabled="videoFailed"
        :aria-label="videoFailed ? '背景视频暂时不可用' : isPlaying ? '暂停背景视频' : '播放背景视频'"
        @click="toggleBackground"
      >
        <svg v-if="isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 5v14M15 5v14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m8 5 11 7-11 7V5Z" fill="currentColor" />
        </svg>
        <span>{{ videoFailed ? '静态背景' : isPlaying ? '暂停背景' : '播放背景' }}</span>
      </button>
    </footer>
  </div>
</template>

<style>
@import './style.css';
</style>
