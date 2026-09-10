<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BrokenSpearDivider from '../components/BrokenSpearDivider.vue'
import avatarUrl from '../../assets/avatar.jpg'
import avatarFrameUrl from '../../assets/avatarFrame.png'
import { homeSections } from '../data/sections'

const decorationUrl = `${import.meta.env.BASE_URL}yuexia-kit/`
</script>

<template>
  <div class="main-content">
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
      <h1 id="profile-name" tabindex="-1" data-page-heading>xiaomol444<span>.</span></h1>
      <p class="welcome">愿你今晚得享安眠</p>
      <img class="profile-detail" :src="`${decorationUrl}svg/divider-central-star.svg`" width="280" height="28" alt="" aria-hidden="true" />
    </section>

    <div class="home-sections">
      <template v-for="(section, index) in homeSections" :key="section.id">
        <RouterLink class="section-card glass" :to="section.path" data-glass :aria-labelledby="`${section.id}-title`">
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
        </RouterLink>
        <BrokenSpearDivider v-if="index < homeSections.length - 1" class="section-divider" />
      </template>
    </div>
  </div>
</template>
