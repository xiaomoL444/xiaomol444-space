<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{ title: string; englishTitle: string }>()
const decorationUrl = `${import.meta.env.BASE_URL}yuexia-kit/`
</script>

<template>
  <div class="detail-page">
    <RouterLink to="/" class="back-link glass" data-glass draggable="false" @dragstart.prevent>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m10 5-7 7 7 7M3 12h18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>返回主页</span>
    </RouterLink>
    <section class="detail-panel glass" data-glass aria-labelledby="detail-title">
      <div class="profile-ornaments" aria-hidden="true">
        <span class="profile-inset" />
        <img class="profile-corner corner--tl" :src="`${decorationUrl}svg/corner-angular.svg`" alt="" draggable="false" />
        <img class="profile-corner corner--br" :src="`${decorationUrl}svg/corner-angular.svg`" alt="" draggable="false" />
      </div>
      <h1 id="detail-title" class="section-title detail-title" tabindex="-1" data-page-heading>
        <span class="section-title-chinese">{{ title }}</span>
        <span class="section-title-separator" aria-hidden="true" />
        <span class="section-title-english" lang="en">{{ englishTitle }}</span>
      </h1>
      <img class="detail-divider" :src="`${decorationUrl}svg/divider-diamond-chain.svg`" width="720" height="64" alt="" aria-hidden="true" />
    </section>
  </div>
</template>
