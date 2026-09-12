<script setup lang="ts">
import SectionView from './SectionView.vue'
import nicknames from '../../assets/nickname.json'

defineProps<{ title: string; englishTitle: string }>()

</script>

<template>
  <SectionView :title="title" :english-title="englishTitle">
    <section class="nickname-section" aria-labelledby="nickname-title">
      <h2 id="nickname-title">昵称</h2>
      <section v-for="(nickname, index) in nicknames" :key="nickname.label" class="nickname-entry" :aria-labelledby="`nickname-${index}`">
        <h3 :id="`nickname-${index}`"><span class="nickname-label">{{ nickname.label }}：</span><span class="nickname-name">{{ nickname.name }}</span></h3>
        <p>{{ nickname.explanation }}</p>
      </section>
    </section>
  </SectionView>
</template>

<style scoped>
.nickname-section { position: relative; width: min(100%, 720px); margin-top: 28px; -webkit-user-select: text; user-select: text; }
.nickname-section h2 { margin: 0 0 8px; color: #ffe8c7; font-size: 1.75rem; font-weight: 400; line-height: 1.6; }
.nickname-entry { padding-block: 24px; }
.nickname-entry + .nickname-entry { border-top: 1px solid rgb(187 169 136 / 22%); }
.nickname-entry h3 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; margin: 0; font-size: 1.375rem; font-weight: 400; line-height: 1.7; }
.nickname-label { color: #cfb7a4; }
.nickname-name { color: #fff0d9; overflow-wrap: anywhere; text-shadow: var(--text-glow-medium); }
.nickname-entry p { margin: 12px 0 0; color: #fff1df; font-family: var(--font-page); font-size: 1.25rem; line-height: 2; letter-spacing: .03em; text-shadow: none; overflow-wrap: anywhere; white-space: pre-line; }
@media (max-width: 600px) {
  .nickname-section { margin-top: 20px; }
  .nickname-section h2 { font-size: 1.5rem; }
  .nickname-entry { padding-block: 20px; }
  .nickname-entry h3 { font-size: 1.25rem; gap: 4px 8px; }
}
</style>
